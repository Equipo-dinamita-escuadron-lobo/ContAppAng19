import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { CalendarGeneratorService } from './calendar-generator.service';
import { CalendarOperationsService } from './calendar-operations.service';
import { CalendarDataService } from './calendar-data.service';
import { CalendarMonth, CalendarDay, MonthStatus } from '../models/accounting-calendar.model';

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
 * Servicio principal para gestionar el estado del calendario contable
 * Responsabilidad: Coordinación entre servicios especializados y gestión del estado
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

  constructor(
    private calendarService: AccountingCalendarService,
    private calendarGenerator: CalendarGeneratorService,
    private calendarOperations: CalendarOperationsService,
    private calendarData: CalendarDataService
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
    this.calendarData.clearActiveEntries();
    
    this.updateState({
      ...this.currentState,
      selectedYear: year
    });
    
    this.generateCalendar();
    
    // Cargar datos existentes si hay enterpriseId
    if (this.currentState.enterpriseId) {
      this.loadExistingCalendarDataOnly();
    }
  }

  /**
   * Genera el calendario para el año seleccionado
   */
  private generateCalendar(): void {
    const { selectedYear } = this.currentState;
    const calendarMonths = this.calendarGenerator.generateYearCalendar(selectedYear);
    
    this.updateState({
      ...this.currentState,
      calendarMonths
    });
  }

  /**
   * Carga solo los datos existentes del calendario (sin crear fechas automáticamente)
   */
  private loadExistingCalendarDataOnly(): void {
    const { enterpriseId } = this.currentState;
    
    if (!enterpriseId) {
      return;
    }

    this.calendarService.findActiveByEnterpriseAndYear(enterpriseId, this.currentState.selectedYear)
      .pipe(takeUntil(this.destroy$))
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
          }
        }
      });
  }

  /**
   * Actualiza el calendario con los datos recibidos
   * @param calendarData Datos del calendario
   */
  private updateCalendarWithData(calendarData: any[]): void {
    const { calendarMonths } = this.currentState;
    const updatedMonths = this.calendarData.updateCalendarWithData(calendarMonths, calendarData);
    
    this.updateState({
      ...this.currentState,
      calendarMonths: updatedMonths,
      error: null
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
   * Toggle de una fecha específica
   * @param day Día a toggle
   */
  toggleDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    const { enterpriseId, selectedYear } = this.currentState;
    if (!enterpriseId) return;
    
    // Validar que sea una interacción de usuario
    if (!this.isUserInteraction) {
      return;
    }

    // ACTUALIZACIÓN OPTIMISTA: Cambiar inmediatamente el estado en el frontend
    const updatedMonths = this.currentState.calendarMonths.map(month => {
      if (month.month === day.date.getMonth() && month.year === day.date.getFullYear()) {
        const updatedMonth = { ...month };
        updatedMonth.days = month.days.map(d => {
          if (d.date.getTime() === day.date.getTime()) {
            return { ...d, isClosed: !d.isClosed };
          }
          return d;
        });
        
        // Recalcular estado del mes
        this.calendarData.updateMonthStatus(updatedMonth);
        return updatedMonth;
      }
      return month;
    });

    // Aplicar cambio inmediato en la UI
    this.updateState({
      ...this.currentState,
      calendarMonths: updatedMonths,
      error: null
    });

    const activeEntriesMap = this.calendarData.getActiveEntriesMap();
    
    // Operación en el backend
    this.calendarOperations.toggleDate(day, enterpriseId, selectedYear, activeEntriesMap)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const calendarData = response?.content || [];
          // Sincronizar con el backend
          this.updateCalendarWithData(calendarData);
        },
        error: (error) => {
          // REVERTIR CAMBIO OPTIMISTA en caso de error
          this.updateState({
            ...this.currentState,
            error: 'Error al cambiar el estado de la fecha'
          });
          
          // Recargar datos del backend para revertir cambios
          this.loadExistingCalendarDataOnly();
        }
      });
  }

  /**
   * Cambia el estado de un mes completo
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

    // ACTUALIZACIÓN OPTIMISTA: Cambiar inmediatamente el estado en el frontend
    const updatedMonths = this.currentState.calendarMonths.map(m => {
      if (m.month === month.month && m.year === month.year) {
        const updatedMonth = { ...m };
        const shouldOpen = month.status === MonthStatus.FULLY_CLOSED;
        
        // Cambiar estado de todos los días del mes
        updatedMonth.days = m.days.map(day => {
          if (day.isCurrentMonth) {
            return { ...day, isClosed: !shouldOpen };
          }
          return day;
        });
        
        // Cambiar estado del mes
        updatedMonth.status = shouldOpen ? MonthStatus.FULLY_OPEN : MonthStatus.FULLY_CLOSED;
        return updatedMonth;
      }
      return m;
    });

    // Aplicar cambio inmediato en la UI
    this.updateState({
      ...this.currentState,
      calendarMonths: updatedMonths,
      error: null
    });

    // Operación en el backend
    this.calendarOperations.changeMonthState(month, enterpriseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const calendarData = response?.content || [];
          // Sincronizar con el backend
          this.updateCalendarWithData(calendarData);
        },
        error: (error) => {
          // REVERTIR CAMBIO OPTIMISTA en caso de error
          this.updateState({
            ...this.currentState,
            error: 'Error al cambiar el estado del mes'
          });
          
          // Recargar datos del backend para revertir cambios
          this.loadExistingCalendarDataOnly();
        }
      });
  }

  /**
   * Cambia el estado de todos los periodos
   * @param openAll Si es true, abre todos los periodos; si es false, los cierra
   */
  changeAllPeriodsState(openAll: boolean): void {
    const { enterpriseId, calendarMonths, selectedYear } = this.currentState;
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
    this.calendarOperations.changeAllPeriodsState(openAll, enterpriseId, selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const calendarData = response?.content || [];
          this.updateCalendarWithData(calendarData);
        },
        error: () => {
          this.updateState({
            ...this.currentState,
            error: 'Error al cambiar el estado de todos los periodos'
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
    return this.calendarData.areAllMonthsClosed(calendarMonths);
  }

  /**
   * Determina si todos los meses están abiertos
   * @returns true si todos los meses están abiertos
   */
  areAllMonthsOpen(): boolean {
    const { calendarMonths } = this.currentState;
    return this.calendarData.areAllMonthsOpen(calendarMonths);
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
    this.calendarData.clearCache();
  }
}