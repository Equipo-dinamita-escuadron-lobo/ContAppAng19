import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { takeUntil, finalize, switchMap, map, catchError } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { CalendarRangeManagerService } from './calendar-range-manager.service';
import { 
  AccountingCalendar, 
  CalendarMonth, 
  CalendarDay,
  MonthStatus,
  AccountingCalendarRangeState
} from '../models/accounting-calendar.model';
import { TIME_CONSTANTS } from '../constants/calendar.constants';
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
  loading: boolean;
  error: string | null;
}

/**
 * Servicio para gestionar el estado del calendario contable
 * Implementa el patrón de estado centralizado para mejorar la gestión de datos
 * y reducir la complejidad del componente principal
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  // Stream de estado principal
  private state = new BehaviorSubject<CalendarState>({
    enterpriseId: '',
    selectedYear: new Date().getFullYear(),
    calendarMonths: [],
    loading: false,
    error: null
  });

  // Streams específicos para partes del estado (derivados del estado principal)
  private loadingState = new BehaviorSubject<boolean>(false);
  private yearState = new BehaviorSubject<number>(new Date().getFullYear());
  
  // Subject para gestionar la cancelación de suscripciones
  private destroy$ = new Subject<void>();
  
  // Temporizador para el loader
  private loaderTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Flag para detectar interacciones de usuario vs automáticas
  private isUserInteraction = false;

  constructor(
    private calendarService: AccountingCalendarService,
    private rangeManager: CalendarRangeManagerService
  ) {}

  // Getters públicos para el estado
  get state$(): Observable<CalendarState> {
    return this.state.asObservable();
  }

  get loading$(): Observable<boolean> {
    return this.loadingState.asObservable();
  }

  get selectedYear$(): Observable<number> {
    return this.yearState.asObservable();
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

    this.yearState.next(currentYear);
    
    if (enterpriseId) {
      this.generateCalendar();
      this.initializeAndLoadCalendarData();
    } else {
      this.generateCalendar();
    }
  }

  /**
   * Cambia el año seleccionado y recarga los datos
   * @param year Nuevo año seleccionado
   */
  changeYear(year: number): void {
    this.updateState({
      ...this.currentState,
      selectedYear: year
    });
    
    this.yearState.next(year);
    this.generateCalendar();
    
    if (this.currentState.enterpriseId) {
      this.initializeAndLoadCalendarData();
    }
  }

  /**
   * Genera el calendario para el año seleccionado
   */
  private generateCalendar(): void {
    const { selectedYear } = this.currentState;
    const calendarMonths: CalendarMonth[] = [];
    
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
   * Crea el calendario para un mes específico
   * @param month Mes (0-11)
   * @param year Año
   * @returns Datos del mes
   */
  private createMonthCalendar(month: number, year: number): CalendarMonth {
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
          isClosed: false,
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
      
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isClosed: true, // Por defecto cerrado
        isToday: isCurrentDay
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
          isClosed: false,
          isToday: false
        });
      }
    }
    
    // Obtener nombre del mes desde una constante o utilidad
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return {
      name: monthNames[month],
      year,
      month,
      days,
      status: MonthStatus.FULLY_CLOSED // Por defecto cerrado
    };
  }

  /**
   * Inicializa el año si no existe y carga los datos del calendario
   */
  private initializeAndLoadCalendarData(): void {
    const { enterpriseId, selectedYear } = this.currentState;
    
    if (!enterpriseId) {
      return;
    }

    this.showLoaderAfterDelay();
    
    // Inicializar el año si no existe y luego cargar datos
    this.rangeManager.initializeYearIfNotExists(enterpriseId, selectedYear)
      .pipe(
        switchMap((initResult) => {
          return this.loadExistingCalendarData();
        }),
        takeUntil(this.destroy$),
        finalize(() => {
          this.clearLoaderTimer();
          this.setLoading(false);
        })
      )
      .subscribe({
        next: (calendarData) => {
          this.updateCalendarWithData(calendarData);
        },
        error: (error) => {
          console.error('Error al cargar el calendario:', error);
          // No mostrar error si es simplemente que no hay datos
          if (error.status !== 404) {
            this.updateState({
              ...this.currentState,
              error: 'No se pudo cargar el calendario contable'
            });
          } else {
            // Si es 404, generar un calendario vacío
            this.generateCalendar();
          }
        }
      });
  }

  /**
   * Carga datos existentes del calendario
   */
  private loadExistingCalendarData(): Observable<AccountingCalendar[]> {
    const { enterpriseId, selectedYear } = this.currentState;
    
    return this.calendarService.findByYear(enterpriseId, selectedYear).pipe(
      map((response: any) => {
        // Si no hay contenido, devolver un array vacío sin lanzar error
        return response?.content || [];
      }),
      catchError((error: any) => {
        // Si es un error 404 (no encontrado), devolver array vacío
        if (error?.status === 404) {
          return of([]);
        }
        // Para otros errores, propagar el error
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza el calendario con los datos recibidos
   * @param calendarData Datos del calendario
   */
  private updateCalendarWithData(calendarData: AccountingCalendar[]): void {
    const { calendarMonths } = this.currentState;
    const updatedMonths = [...calendarMonths];
    
    if (!calendarData || calendarData.length === 0) {
      // Si no hay datos, generar un calendario nuevo
      this.generateCalendar();
      return;
    }
    
    // Actualizar los meses con los datos recibidos
    updatedMonths.forEach(month => {
      const updatedMonth = { ...month };
      updatedMonth.days = month.days.map(day => {
        if (day.isCurrentMonth) {
          return { 
            ...day, 
            isClosed: this.isDateClosed(day.date, calendarData) 
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
   * Determina si una fecha está cerrada según los datos del backend
   * @param date Fecha a verificar
   * @param calendarData Datos del calendario
   * @returns true si la fecha está cerrada
   */
  private isDateClosed(date: Date, calendarData: AccountingCalendar[]): boolean {
    // Si no hay datos, por defecto está cerrado
    if (!calendarData || calendarData.length === 0) {
      return true;
    }

    // Buscar un período que incluya esta fecha
    const matchingPeriod = calendarData.find(period => {
      try {
        const startDate = parseDateFromBackend(period.startDate);
        const endDate = parseDateFromBackend(period.endDate);
        return isDateInRange(date, startDate, endDate);
      } catch (e) {
        console.error('Error al analizar la fecha:', e);
        return false;
      }
    });

    // Si no hay un período coincidente, por defecto está cerrado
    if (!matchingPeriod) {
      return true;
    }

    // Retornar el inverso del estado, ya que status=true significa abierto
    return !matchingPeriod.status;
  }

  /**
   * Actualiza el estado de un mes según sus días
   * @param month Mes a actualizar
   */
  private updateMonthStatus(month: CalendarMonth): void {
    const currentMonthDays = month.days.filter(d => d.isCurrentMonth);
    
    if (currentMonthDays.length === 0) {
      month.status = MonthStatus.MIXED;
      return;
    }
    
    const closedDays = currentMonthDays.filter(d => d.isClosed);
    
    if (closedDays.length === currentMonthDays.length) {
      month.status = MonthStatus.FULLY_CLOSED;
    } else if (closedDays.length === 0) {
      month.status = MonthStatus.FULLY_OPEN;
    } else {
      month.status = MonthStatus.MIXED;
    }
  }

  /**
   * Cambia el estado de una fecha usando el gestor de rangos
   * @param day Día a cambiar
   */
  toggleDateState(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    const { enterpriseId } = this.currentState;
    if (!enterpriseId) return;
    
    // Validar que sea una interacción de usuario
    if (!this.isUserInteraction) {
      return;
    }
    
    const newStatus = !day.isClosed;
    this.setLoading(true);
    
    // Usar el gestor de rangos para optimizar la operación
    const operation = newStatus 
      ? this.rangeManager.openDateRange(enterpriseId, day.date, day.date)
      : this.rangeManager.closeDateRange(enterpriseId, day.date, day.date);
    
    operation.pipe(
      switchMap(() => this.loadExistingCalendarData()),
      takeUntil(this.destroy$),
      finalize(() => this.setLoading(false))
    )
    .subscribe({
      next: (calendarData) => {
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
   * Cambia el estado de un mes completo usando el gestor de rangos
   * @param month Mes a cambiar
   */
  changeMonthState(month: CalendarMonth): void {
    const { enterpriseId, loading } = this.currentState;
    
    // Validaciones de seguridad
    if (!enterpriseId || loading) {
      return;
    }
    
    // Prevenir ejecución automática no deseada
    if (!this.isUserInteraction) {
      return;
    }
    
    // Verificar estado válido
    if (!Object.values(MonthStatus).includes(month.status)) {
      console.warn('Estado de mes no válido:', month.status);
      return;
    }
    
    // Determinar nuevo estado
    let newStatus: boolean;
    if (month.status === MonthStatus.FULLY_CLOSED) {
      newStatus = true; // Abrir mes
    } else {
      newStatus = false; // Cerrar mes
    }
    
    // Obtener primer y último día del mes
    const startDate = getFirstDayOfMonth(month.year, month.month);
    const endDate = getLastDayOfMonth(month.year, month.month);
    
    this.setLoading(true);
    
    // Usar el gestor de rangos para la operación
    const operation = newStatus 
      ? this.rangeManager.openDateRange(enterpriseId, startDate, endDate)
      : this.rangeManager.closeDateRange(enterpriseId, startDate, endDate);
    
    // Ejecutar operación y actualizar estado
    operation.pipe(
      switchMap(() => this.loadExistingCalendarData()),
      takeUntil(this.destroy$),
      finalize(() => this.setLoading(false))
    )
    .subscribe({
      next: (calendarData) => {
        this.updateCalendarWithData(calendarData);
      },
      error: () => {
        this.updateState({
          ...this.currentState,
          error: 'Error al cambiar el estado del mes'
        });
      }
    });
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

    this.setLoading(true);
    
    // Proceder con la llamada al backend
    this.calendarService.changeStateAll(enterpriseId, openAll).pipe(
      switchMap(() => this.loadExistingCalendarData()),
      takeUntil(this.destroy$),
      finalize(() => this.setLoading(false))
    )
    .subscribe({
      next: (calendarData) => {
        this.updateCalendarWithData(calendarData);
        
        // Optimizar rangos después de un breve retraso
        const currentYear = this.currentState.selectedYear;
        setTimeout(() => {
          this.rangeManager.optimizeRanges(enterpriseId, currentYear).subscribe();
        }, TIME_CONSTANTS.BACKEND_PROCESSING_DELAY_MS);
      },
      error: () => {
        this.updateState({
          ...this.currentState,
          error: openAll ? 'Error al abrir todos los periodos' : 'Error al cerrar todos los periodos'
        });
      }
    });
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
   * Muestra el loader después de un retraso
   */
  private showLoaderAfterDelay(): void {
    this.clearLoaderTimer();
    this.loaderTimer = setTimeout(() => this.setLoading(true), TIME_CONSTANTS.LOADER_DELAY_MS);
  }

  /**
   * Limpia el temporizador del loader
   */
  private clearLoaderTimer(): void {
    if (this.loaderTimer) {
      clearTimeout(this.loaderTimer);
      this.loaderTimer = null;
    }
  }

  /**
   * Actualiza el estado completo
   * @param newState Nuevo estado
   */
  private updateState(newState: CalendarState): void {
    this.state.next(newState);
  }

  /**
   * Actualiza el estado de carga
   * @param loading Nuevo estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingState.next(loading);
    this.updateState({
      ...this.currentState,
      loading
    });
  }

  /**
   * Limpia las suscripciones al destruir el servicio
   */
  destroy(): void {
    this.clearLoaderTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}