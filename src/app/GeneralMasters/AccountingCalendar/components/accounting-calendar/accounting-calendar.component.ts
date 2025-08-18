import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  ChangeDetectorRef, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PanelModule } from 'primeng/panel';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { CalendarStateService } from '../../services/calendar-state.service';
import { AccountingCalendarService } from '../../services/accounting-calendar.service';
import { CalendarMonth, CalendarDay, MonthStatus } from '../../models/accounting-calendar.model';
import { CALENDAR_CONSTANTS, MESSAGE_CONSTANTS } from '../../constants/calendar.constants';
import { AvailableYear } from '../../types/calendar.types';

// Componentes
import { MonthCalendarComponent } from '../month-calendar/month-calendar.component';

/**
 * Componente principal del calendario contable
 * Coordina los subcomponentes y maneja la lógica de negocio a través del servicio de estado
 */
@Component({
  selector: 'app-accounting-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PanelModule,
    MonthCalendarComponent
  ],
  providers: [MessageService, ConfirmationService, CalendarStateService],
  templateUrl: './accounting-calendar.component.html',
  styleUrls: ['./accounting-calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingCalendarComponent implements OnInit, OnDestroy {
  // Servicios
  private readonly stateService = inject(CalendarStateService);
  private readonly calendarService = inject(AccountingCalendarService);
  private readonly localStorageMethods = new LocalStorageMethods();
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  // Estado local derivado del servicio de estado
  selectedYear: number = new Date().getFullYear();
  calendarMonths: CalendarMonth[] = [];
  
  // Años disponibles para el selector
  availableYears: AvailableYear[] = [];
  
  // Años con periodos abiertos (para mostrar indicadores)
  yearsWithOpenPeriods: Set<number> = new Set();
  
  // Subject para gestionar la cancelación de suscripciones
  private destroy$ = new Subject<void>();
  
    ngOnInit(): void {
    // Inicializar años disponibles
    this.initializeAvailableYears();
    
    // Obtener ID de la empresa desde localStorage
    const enterpriseId = this.localStorageMethods.loadEnterpriseData()?.id || '';
    
    // Inicializar el servicio de estado
    this.stateService.initialize(enterpriseId);
    
    // Suscribirse a los cambios de estado
    this.stateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.selectedYear = state.selectedYear;
        this.calendarMonths = state.calendarMonths;
        
        // Si hay un error, mostrar mensaje
        if (state.error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: state.error
          });
        }
        
        // Marcar para detección de cambios
        this.cdr.markForCheck();
        
        // Verificar años con periodos abiertos después de la carga inicial
        this.checkYearsWithOpenPeriods();
        
        // Cargar el estado de todos los años
        this.loadAllYearsStateFromBackend();
        
      });
  }
  
  /**
   * Inicializa la lista de años disponibles
   */
  private initializeAvailableYears(): void {
    for (let year = CALENDAR_CONSTANTS.MIN_YEAR; year <= CALENDAR_CONSTANTS.MAX_YEAR; year++) {
      this.availableYears.push({ label: year.toString(), value: year });
    }
  }
  
  /**
   * Maneja el cambio de año
   */
  onYearChange(): void {
    this.stateService.changeYear(this.selectedYear);
    // Verificar años con periodos abiertos después de cambiar de año
    setTimeout(() => this.checkYearsWithOpenPeriods(), 100);

  }
  
  /**
   * Maneja el clic en un día
   * @param day Día seleccionado
   */
  onDateClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    // Marcar como interacción de usuario y cambiar estado
    this.stateService.markUserInteractionStart();
    this.stateService.toggleDate(day);
    this.stateService.markUserInteractionEnd();
    
    const wasClosed = day.isClosed;
    
    // Formatear la fecha para mostrar en el mensaje
    const formattedDate = this.formatDateForDisplay(day.date);
    
    this.messageService.add({
      severity: 'success',
      summary: MESSAGE_CONSTANTS.SUCCESS.DATE_STATE_CHANGED,
      detail: wasClosed 
        ? `${MESSAGE_CONSTANTS.SUCCESS.DATE_OPENED}: ${formattedDate}`    // Estaba cerrada, ahora está abierta
        : `${MESSAGE_CONSTANTS.SUCCESS.DATE_CLOSED}: ${formattedDate}`   // Estaba abierta, ahora está cerrada
    });
  }
  
  /**
   * Maneja el clic en el botón de estado del mes
   * @param month Mes seleccionado
   */
  onMonthStatusClick(month: CalendarMonth): void {
    let action: string;
    let message: string;
    let acceptLabel: string;
    
    if (month.status === MonthStatus.FULLY_CLOSED) {
      action = 'abrir';
      message = `¿Desea abrir todos los periodos contables del mes de ${month.name}?`;
      acceptLabel = MESSAGE_CONSTANTS.LABELS.YES_OPEN_MONTH;
    } else {
      // Si no está completamente cerrado, está abierto
      action = 'cerrar';
      message = `¿Desea cerrar todos los periodos contables del mes de ${month.name}?`;
      acceptLabel = MESSAGE_CONSTANTS.LABELS.YES_CLOSE_MONTH;
    }
    
    this.confirmationService.confirm({
      message: message,
      header: MESSAGE_CONSTANTS.CONFIRMATION.MONTH_STATE_CHANGE,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: acceptLabel,
      rejectLabel: MESSAGE_CONSTANTS.LABELS.CANCEL,
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        // Marcar como interacción de usuario
        this.stateService.markUserInteractionStart();
        this.stateService.changeMonthState(month);
        this.stateService.markUserInteractionEnd();
        
        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: MESSAGE_CONSTANTS.SUCCESS.MONTH_STATE_CHANGED,
          detail: `Todos los periodos del mes de ${month.name} han sido ${action === 'abrir' ? 'abiertos' : 'cerrados'}`
        });
      }
    });
  }
  
  /**
   * Maneja el toggle de todos los periodos
   */
  onToggleAll(): void {
    const openAll = this.areAllMonthsClosed();
    const confirmationHeader = openAll 
      ? 'Confirmar Apertura Masiva' 
      : 'Confirmar Cierre Masivo';
      
    const confirmationMessage = openAll 
      ? `¿Desea abrir todos los periodos contables del año ${this.selectedYear}?`
      : `¿Desea cerrar todos los periodos contables del año ${this.selectedYear}?`;
      
    const acceptLabel = openAll 
      ? MESSAGE_CONSTANTS.LABELS.YES_OPEN_ALL 
      : MESSAGE_CONSTANTS.LABELS.YES_CLOSE_ALL;
    
    this.confirmationService.confirm({
      message: confirmationMessage,
      header: confirmationHeader,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: acceptLabel,
      rejectLabel: MESSAGE_CONSTANTS.LABELS.CANCEL,
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        // Marcar como interacción de usuario
        this.stateService.markUserInteractionStart();
        this.stateService.changeAllPeriodsState(openAll);
        this.stateService.markUserInteractionEnd();
        
        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: openAll 
            ? MESSAGE_CONSTANTS.SUCCESS.MASS_OPEN_SUCCESS 
            : MESSAGE_CONSTANTS.SUCCESS.MASS_CLOSE_SUCCESS,
          detail: `Todos los periodos contables del año ${this.selectedYear} han sido ${openAll ? 'abiertos' : 'cerrados'}`
        });
      }
    });
  }
  
  /**
   * Determina si todos los meses están cerrados
   */
  areAllMonthsClosed(): boolean {
    return this.stateService.areAllMonthsClosed();
  }
  
  /**
   * Verifica qué años tienen periodos abiertos
   * Se ejecuta cuando se cambia de año para mantener un registro
   */
  checkYearsWithOpenPeriods(): void {
    if (!this.availableYears.length) return;    
    
    // Agregar el año actual si tiene periodos abiertos
    if (!this.areAllMonthsClosed()) {
      this.yearsWithOpenPeriods.add(this.selectedYear);
    } else {
      // Si el año actual está completamente cerrado, removerlo del registro
      this.yearsWithOpenPeriods.delete(this.selectedYear);
    }
    
    // Marcar para detección de cambios
    this.cdr.markForCheck();
  }
  
  /**
   * Carga el estado de todos los años
   * Se ejecuta al inicializar el componente para obtener información persistente
   */
  loadAllYearsStateFromBackend(): void {
    if (!this.availableYears.length) return;
    
    const enterpriseId = this.localStorageMethods.loadEnterpriseData()?.id;
    if (!enterpriseId) return;
    
    // Obtener todos los años disponibles
    const allYears = this.availableYears.map(y => y.value);
    
    // Llamar al servicio para verificar qué años tienen periodos abiertos
    this.calendarService.getYearsWithOpenPeriods(enterpriseId, allYears).subscribe({
      next: (yearsWithOpenPeriods) => {
        // Limpiar el registro anterior y cargar desde el backend
        this.yearsWithOpenPeriods.clear();
        yearsWithOpenPeriods.forEach(year => this.yearsWithOpenPeriods.add(year));
        
        // Marcar para detección de cambios
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar el estado de años desde el backend:', error);
        // En caso de error, mantener el comportamiento anterior
        this.checkYearsWithOpenPeriods();
      }
    });
  }
  

  
  /**
   * Obtiene el indicador visual para un año
   */
  getYearIndicator(year: number): { hasOpenPeriods: boolean; tooltip: string } {
    const hasOpenPeriods = this.yearsWithOpenPeriods.has(year);
    return {
      hasOpenPeriods,
      tooltip: hasOpenPeriods 
        ? `El año ${year} tiene periodos contables abiertos` 
        : `El año ${year} está completamente cerrado`
    };
  }
  
  /**
   * Obtiene información global del calendario
   */
  getCalendarGlobalInfo(): {
    totalYears: number;
    openYears: number;
    closedYears: number;
    openYearsList: number[];
    closedYearsList: number[];
  } {
    const totalYears = this.availableYears.length;
    const openYears = this.yearsWithOpenPeriods.size;
    const closedYears = totalYears - openYears;
    
    // Obtener lista de años cerrados (los que no están en años abiertos)
    const closedYearsList = this.availableYears
      .map(y => y.value)
      .filter(year => !this.yearsWithOpenPeriods.has(year));
    
    return {
      totalYears,
      openYears,
      closedYears,
      openYearsList: Array.from(this.yearsWithOpenPeriods),
      closedYearsList
    };
  }

  /**
   * Navega al año especificado
   * @param year Año al que navegar
   */
  navigateToYear(year: number): void {
    // Solo navegar si es un año diferente al actual
    if (year !== this.selectedYear) {
      // Usar la misma lógica que el selector de años
      this.selectedYear = year;
      this.stateService.changeYear(year);
      
      // Verificar años con periodos abiertos después del cambio
      setTimeout(() => this.checkYearsWithOpenPeriods(), 100);
    }
  }
  
  /**
   * Formatea una fecha para mostrar en mensajes de usuario
   * @param date Fecha a formatear
   * @returns Fecha formateada en formato legible
   */
  private formatDateForDisplay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('es-ES', options);
  }
  
  /**
   * Limpia las suscripciones al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateService.destroy();
  }
}