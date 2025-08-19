import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { ColombianHolidaysService } from './colombian-holidays.service';
import { 
  AccountingCalendar, 
  CalendarMonth, 
  CalendarDay,
  MonthStatus,
  AccountingCalendarCreateMonthReq,
  AccountingCalendarDeleteMonthReq,
  AccountingCalendarCreateYearReq,
  AccountingCalendarDeleteYearReq
} from '../models/accounting-calendar.model';
import { NAME_CONSTANTS } from '../constants/calendar.constants';
import { 
  formatDateForBackend, 
  parseDateFromBackend, 
  isDateInRange, 
  getFirstDayOfMonth, 
  getLastDayOfMonth 
} from '../utils/date.utils';

/**
 * Interfaz para el estado del calendario
 */
export interface CalendarState {
  enterpriseId: string;
  selectedYear: number;
  calendarMonths: CalendarMonth[];
  error: string | null;
}

/**
 * Servicio para gestionar el estado del calendario contable
 * Implementa el patrón de estado centralizado para mejorar la gestión de datos
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  // Stream de estado principal consolidado
  private state = new BehaviorSubject<CalendarState>({
    enterpriseId: '',
    selectedYear: new Date().getFullYear(),
    calendarMonths: [],
    error: null
  });
  
  // Subject para gestionar la cancelación de suscripciones
  private destroy$ = new Subject<void>();
  
  // Flag para detectar interacciones de usuario vs automáticas
  private isUserInteraction = false;
  
  // Mapa de entradas activas por fecha (YYYY-MM-DD) para eliminar por ID cuando el día esté activo
  private activeEntriesByDate: Map<string, AccountingCalendar> = new Map();

  // Cache para memoización de calendarios de meses
  private monthCalendarCache = new Map<string, CalendarMonth>();

  constructor(
    private calendarService: AccountingCalendarService,
    private holidaysService: ColombianHolidaysService
  ) {}

  // Getters públicos para el estado consolidado
  get state$(): Observable<CalendarState> {
    return this.state.asObservable();
  }

  get selectedYear$(): Observable<number> {
    return this.state$.pipe(map(state => state.selectedYear));
  }

  get currentState(): CalendarState {
    return this.state.getValue();
  }

  /**
   * Inicializa el estado del calendario
   * @param enterpriseId ID de la empresa
   */
  initialize(enterpriseId: string): void {
    const currentYear = new Date().getFullYear();
    
    this.updateState({
      ...this.currentState,
      enterpriseId,
      selectedYear: currentYear
    });

    
    if (enterpriseId) {
      this.generateCalendar();
      // Solo cargar datos existentes, NO inicializar fechas automáticamente
      this.loadExistingCalendarDataOnly();
    } else {
      this.generateCalendar();
    }
  }

  /**
   * Cambia el año seleccionado y recarga los datos
   * @param year Nuevo año seleccionado
   */
  changeYear(year: number): void {
    // Limpiar cache del año anterior
    this.clearYearCache();
    
    this.updateState({
      ...this.currentState,
      selectedYear: year
    });
    
    this.generateCalendar();
    
    // cargar datos existentes si hay enterpriseId
    if (this.currentState.enterpriseId) {
      this.loadExistingCalendarDataOnly();
    }
  }

  /**
   * Genera el calendario para el año seleccionado con optimización de cache
   */
  private generateCalendar(): void {
    const { selectedYear } = this.currentState;
    const calendarMonths: CalendarMonth[] = [];
    
    // Generar solo los meses que no estén en cache
    for (let month = 0; month < 12; month++) {
      const monthData = this.createMonthCalendar(month, selectedYear);
      calendarMonths.push(monthData);
    }
    
    this.updateState({
      ...this.currentState,
      calendarMonths
    });
  }

  /**
   * Crea el calendario para un mes específico con memoización
   * @param month Mes (0-11)
   * @param year Año
   * @returns Datos del mes
   */
  private createMonthCalendar(month: number, year: number): CalendarMonth {
    // Clave única para el cache
    const cacheKey = `${year}-${month}`;
    
    // Verificar si ya existe en cache
    if (this.monthCalendarCache.has(cacheKey)) {
      return this.monthCalendarCache.get(cacheKey)!;
    }
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    if (firstDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        days.push({
          date: new Date(prevYear, prevMonth, day),
          dayOfMonth: day,
          isCurrentMonth: false,
          isClosed: true, // Días de otros meses siempre cerrados
          isToday: false
        });
      }
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isCurrentDay = date.getDate() === today.getDate() && 
                          date.getMonth() === today.getMonth() && 
                          date.getFullYear() === today.getFullYear();
      
      // Verificar si es festivo
      const isHoliday = this.holidaysService.isHoliday(date);
      const holiday = this.holidaysService.getHolidayForDate(date);
      
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isClosed: true, // Por defecto cerrado
        isToday: isCurrentDay,
        isHoliday,
        holidayName: holiday?.name
      });
    }
    
    // Completar con días del mes siguiente
    const totalDays = 42; // 6 semanas * 7 días
    const remainingDays = totalDays - days.length;
    
    if (remainingDays > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          date: new Date(nextYear, nextMonth, day),
          dayOfMonth: day,
          isCurrentMonth: false,
          isClosed: true, // Días de otros meses siempre cerrados
          isToday: false
        });
      }
    }
    
    // Obtener nombre del mes desde una constante o utilidad
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const monthCalendar: CalendarMonth = {
      name: monthNames[month],
      year,
      month,
      days,
      status: MonthStatus.FULLY_CLOSED // Por defecto cerrado (rojo)
    };
    
    // Guardar en cache
    this.monthCalendarCache.set(cacheKey, monthCalendar);
    
    return monthCalendar;
  }



  /**
   * Carga solo los datos existentes del calendario (sin crear fechas automáticamente)
   */
  private loadExistingCalendarDataOnly(): void {
    const { enterpriseId } = this.currentState;
    
    if (!enterpriseId) {
      return;
    }

    // Mostrar loading inmediatamente al iniciar la carga
    
    // Solo cargar datos existentes, NO crear fechas automáticamente
    this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, this.currentState.selectedYear)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          const calendarData = response?.content || [];
          this.updateCalendarWithData(calendarData);
        },
        error: (error: any) => {
          if (error.status !== 404) {
            this.updateState({
              ...this.currentState,
              error: 'No se pudo cargar el calendario contable'
            });
          } else {
            // Si es 404, mantener el calendario vacío (rojo) sin crear fechas
            // El calendario ya está generado visualmente en generateCalendar()
          }
        }
      });
  }

  /**
   * Actualiza el calendario con los datos recibidos
   * @param calendarData Datos del calendario
   */
  private updateCalendarWithData(calendarData: AccountingCalendar[]): void {
    const { calendarMonths } = this.currentState;
    const updatedMonths = [...calendarMonths];
    
    if (!calendarData || calendarData.length === 0) {
      // Si no hay datos, el calendario se mantiene rojo (cerrado)
      this.generateCalendar();
      // Limpiar mapa de entradas activas
      this.activeEntriesByDate.clear();
      return;
    }
    
    // Reconstruir mapa de entradas activas por fecha para eliminar por ID
    this.activeEntriesByDate.clear();
    for (const entry of calendarData) {
      const key = this.toDateKey(entry.date);
      if (key) {
        this.activeEntriesByDate.set(key, entry);
      }
    }

    // Actualizar los meses con los datos recibidos
    updatedMonths.forEach(month => {
      const updatedMonth = { ...month };
      updatedMonth.days = month.days.map(day => {
        if (day.isCurrentMonth) {
          return { 
            ...day, 
            isClosed: !this.isDateSelected(day.date, calendarData) // false = seleccionada (verde), true = no seleccionada (rojo)
          };
        }
        return { ...day };
      });
      
      // Recalcular estado del mes
      this.updateMonthStatus(updatedMonth);
      
      // Actualizar el mes en el arreglo
      const monthIndex = updatedMonths.findIndex(m => 
        m.month === updatedMonth.month && m.year === updatedMonth.year
      );
      if (monthIndex !== -1) {
        updatedMonths[monthIndex] = updatedMonth;
      }
    });
    
    this.updateState({
      ...this.currentState,
      calendarMonths: updatedMonths,
      error: null
    });
  }

  /**
   * Determina si una fecha está seleccionada
   * @param date Fecha a verificar
   * @param calendarData Datos del calendario
   * @returns true si la fecha está seleccionada
   */
  private isDateSelected(date: Date, calendarData: AccountingCalendar[]): boolean {
    // Si no hay datos, por defecto no está seleccionada (rojo)
    if (!calendarData || calendarData.length === 0) {
      return false;
    }

    // Buscar una fecha que coincida exactamente
    const matchingDate = calendarData.find(period => {
      try {
        const periodDate = parseDateFromBackend(period.date);
        return periodDate.getDate() === date.getDate() && 
               periodDate.getMonth() === date.getMonth() && 
               periodDate.getFullYear() === date.getFullYear();
      } catch (e) {
        return false;
      }
    });

    // Si no hay una fecha coincidente, no está seleccionada
    if (!matchingDate) {
      return false;
    }

    // Retornar el estado (true = seleccionada, false = no seleccionada)
    return matchingDate.status;
  }

  /**
   * Actualiza el estado de un mes según sus días
   * @param month Mes a actualizar
   */
  private updateMonthStatus(month: CalendarMonth): void {
    const currentMonthDays = month.days.filter(d => d.isCurrentMonth);
    
    if (currentMonthDays.length === 0) {
      month.status = MonthStatus.FULLY_CLOSED; // Por defecto cerrado si no hay días
      return;
    }
    
    const selectedDays = currentMonthDays.filter(d => !d.isClosed); // !isClosed = seleccionada
    
    if (selectedDays.length === currentMonthDays.length) {
      month.status = MonthStatus.FULLY_OPEN; // Todo abierto
    } else {
      month.status = MonthStatus.FULLY_CLOSED; // Todo cerrado
    }
  }

  /**
   * Marca el inicio de una interacción de usuario
   */
  markUserInteractionStart(): void {
    this.isUserInteraction = true;
  }

  /**
   * Marca el final de una interacción de usuario
   */
  markUserInteractionEnd(): void {
    this.isUserInteraction = false;
  }

  /**
   * Toggle de una fecha específica
   * @param day Día a toggle
   */
  toggleDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    const { enterpriseId } = this.currentState;
    if (!enterpriseId) return;
    
    // Validar que sea una interacción de usuario
    if (!this.isUserInteraction) {
      return;
    }
    
    
    const dateKey = this.toDateKey(day.date);

    // Si (!isClosed) -> eliminar por ID; si (isClosed) -> crear
    const action$: Observable<any> = !day.isClosed
      ? this.deleteByDateKey(enterpriseId, dateKey)
      : this.createByDateKey(enterpriseId, dateKey);

    action$
      .pipe(
        switchMap(() => this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, this.currentState.selectedYear)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          const calendarData = response?.content || [];
          this.updateCalendarWithData(calendarData);
        },
        error: () => {
          this.updateState({
            ...this.currentState,
            error: 'Error al cambiar el estado de la fecha'
          });
        }
      });
  }

  // Helpers
  private toDateKey(input: string | Date): string {
    try {
      if (input instanceof Date) {
        return input.toISOString().split('T')[0];
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
      }
      const d = new Date(input);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private createByDateKey(enterpriseId: string, dateKey: string) {
    const payload = { idEnterprise: enterpriseId, date: dateKey, status: true };
    return this.calendarService.create(payload);
  }

  private deleteByDateKey(enterpriseId: string, dateKey: string) {
    const entry = this.activeEntriesByDate.get(dateKey);
    if (entry?.id) {
      return this.calendarService.delete(entry.id, enterpriseId);
    }
    // Fallback: si por alguna razón no está en el mapa, recuperar activos y buscar ID
    return this.calendarService
      .findActiveByEnterpriseAndYear(enterpriseId, this.currentState.selectedYear)
      .pipe(
        map(res => (res?.content || []).find((e: AccountingCalendar) => this.toDateKey(e.date) === dateKey)),
        switchMap((found?: AccountingCalendar) => {
          if (found?.id) {
            return this.calendarService.delete(found.id, enterpriseId);
          }
          return throwError(() => new Error('No se encontró el ID de la fecha a eliminar'));
        })
      );
  }

  /**
   * Cambia el estado de un mes completo usando el nuevo endpoint
   * @param month Mes a cambiar
   */
  changeMonthState(month: CalendarMonth): void {
    const { enterpriseId } = this.currentState;
    
    // Validaciones de seguridad
    if (!enterpriseId) {
      return;
    }
    
    // Prevenir ejecución automática no deseada
    if (!this.isUserInteraction) {
      return;
    }
    
    // Determinar si abrir o cerrar el mes
    const shouldOpen = month.status === MonthStatus.FULLY_CLOSED;
    
    
    if (shouldOpen) {
      // Abrir mes completo
      const request: AccountingCalendarCreateMonthReq = {
        idEnterprise: enterpriseId,
        year: month.year,
        month: month.month + 1, // usa 1-12, no 0-11
        status: true
      };
      
      this.calendarService.openMonth(request)
        .pipe(
          switchMap(() => this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, month.year)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            const calendarData = response?.content || [];
            this.updateCalendarWithData(calendarData);
          },
          error: () => {
            this.updateState({
              ...this.currentState,
              error: 'Error al abrir el mes'
            });
          }
        });
    } else {
      // Cerrar mes completo
      const request: AccountingCalendarDeleteMonthReq = {
        idEnterprise: enterpriseId,
        year: month.year,
        month: month.month + 1 
      };
      
      this.calendarService.deleteByMonth(request)
        .pipe(
          switchMap(() => this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, month.year)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            const calendarData = response?.content || [];
            this.updateCalendarWithData(calendarData);
          },
          error: () => {
            this.updateState({
              ...this.currentState,
              error: 'Error al cerrar el mes'
            });
          }
        });
    }
  }

  /**
   * Cambia el estado de todos los periodos
   * @param openAll Si es true, abre todos los periodos; si es false, los cierra
   */
  changeAllPeriodsState(openAll: boolean): void {
    const { enterpriseId, calendarMonths } = this.currentState;
    if (!enterpriseId) return;
    
    // Validar que sea una interacción de usuario
    if (!this.isUserInteraction) {
      return;
    }
    
    // Actualización de la interfaz de usuario
    const updatedMonths = calendarMonths.map(month => {
      const updatedMonth = { ...month };
      updatedMonth.days = month.days.map(day => {
        if (day.isCurrentMonth) {
          return { ...day, isClosed: !openAll };
        }
        return { ...day };
      });
      updatedMonth.status = openAll ? MonthStatus.FULLY_OPEN : MonthStatus.FULLY_CLOSED;
      return updatedMonth;
    });

    this.updateState({
      ...this.currentState,
      calendarMonths: updatedMonths
    });

    
    // Proceder con la llamada al backend
    const year = this.currentState.selectedYear;
    
    if (openAll) {
      // Abrir año completo
      const request: AccountingCalendarCreateYearReq = {
        idEnterprise: enterpriseId,
        year: year,
        status: true
      };
      
      this.calendarService.openYear(request)
        .pipe(
          switchMap(() => this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, year)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            const calendarData = response?.content || [];
            this.updateCalendarWithData(calendarData);
          },
          error: () => {
            this.updateState({
              ...this.currentState,
              error: 'Error al abrir todos los periodos'
            });
          }
        });
    } else {
      // Cerrar año completo
      const request: AccountingCalendarDeleteYearReq = {
        idEnterprise: enterpriseId,
        year: year
      };
      
      this.calendarService.deleteByYear(request)
        .pipe(
          switchMap(() => this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, year)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            const calendarData = response?.content || [];
            this.updateCalendarWithData(calendarData);
          },
          error: () => {
            this.updateState({
              ...this.currentState,
              error: 'Error al cerrar todos los periodos'
            });
          }
        });
    }
  }

  /**
   * Determina si todos los meses están cerrados
   * @returns true si todos los meses están cerrados
   */
  areAllMonthsClosed(): boolean {
    const { calendarMonths } = this.currentState;
    return calendarMonths.every(month => month.status === MonthStatus.FULLY_CLOSED);
  }

  /**
   * Determina si todos los meses están abiertos
   * @returns true si todos los meses están abiertos
   */
  areAllMonthsOpen(): boolean {
    const { calendarMonths } = this.currentState;
    return calendarMonths.every(month => month.status === MonthStatus.FULLY_OPEN);
  }

  /**
   * Actualiza el estado completo
   * @param newState Nuevo estado
   */
  private updateState(newState: CalendarState): void {
    this.state.next(newState);
  }

  /**
   * Limpia las suscripciones al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar cache para liberar memoria
    this.clearCache();
  }

  /**
   * Limpia el cache de calendarios para liberar memoria
   */
  private clearCache(): void {
    this.monthCalendarCache.clear();
    this.activeEntriesByDate.clear();
  }

  /**
   * Limpia el cache cuando cambia el año para evitar datos obsoletos
   */
  private clearYearCache(): void {
    this.monthCalendarCache.clear();
  }
}