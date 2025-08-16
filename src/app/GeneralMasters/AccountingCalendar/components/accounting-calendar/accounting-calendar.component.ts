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
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { CalendarStateService } from '../../services/calendar-state.service';
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
  private readonly localStorageMethods = new LocalStorageMethods();
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  // Estado local derivado del servicio de estado
  selectedYear: number = new Date().getFullYear();
  calendarMonths: CalendarMonth[] = [];
  loading: boolean = false;
  
  // Años disponibles para el selector
  availableYears: AvailableYear[] = [];
  
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
        this.loading = state.loading;
        
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
    
    // Mostrar mensaje de éxito
    const newStatus = !day.isClosed;
    this.messageService.add({
      severity: 'success',
      summary: MESSAGE_CONSTANTS.SUCCESS.DATE_STATE_CHANGED,
      detail: newStatus 
        ? MESSAGE_CONSTANTS.SUCCESS.DATE_OPENED 
        : MESSAGE_CONSTANTS.SUCCESS.DATE_CLOSED
    });
  }
  
  /**
   * Maneja el clic en el botón de estado del mes
   * @param month Mes seleccionado
   */
  onMonthStatusClick(month: CalendarMonth): void {
    // Prevenir ejecución durante carga
    if (this.loading) return;
    
    let action: string;
    let message: string;
    
    if (month.status === MonthStatus.FULLY_CLOSED) {
      action = 'abrir';
      message = `¿Desea abrir todos los periodos contables del mes de ${month.name}?`;
    } else {
      // Si no está completamente cerrado, está abierto
      action = 'cerrar';
      message = `¿Desea cerrar todos los periodos contables del mes de ${month.name}?`;
    }
    
    this.confirmationService.confirm({
      header: MESSAGE_CONSTANTS.CONFIRMATION.MONTH_STATE_CHANGE,
      message: message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
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
      ? MESSAGE_CONSTANTS.CONFIRMATION.MASS_OPEN 
      : MESSAGE_CONSTANTS.CONFIRMATION.MASS_CLOSE;
      
    const acceptLabel = openAll 
      ? 'Sí, abrir todos' 
      : 'Sí, cerrar todos';
    
    this.confirmationService.confirm({
      header: confirmationHeader,
      message: confirmationMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: acceptLabel,
      rejectLabel: 'Cancelar',
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
          detail: `Todos los periodos contables han sido ${openAll ? 'abiertos' : 'cerrados'}`
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
   * Limpia las suscripciones al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateService.destroy();
  }
}