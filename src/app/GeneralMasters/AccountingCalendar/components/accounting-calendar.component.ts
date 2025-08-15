import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AccountingCalendarService } from '../services/accounting-calendar.service';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { AccountingCalendar } from '../models/accounting-calendar.model';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isClosed: boolean;
  isToday: boolean;
}

interface CalendarMonth {
  name: string;
  year: number;
  month: number;
  days: CalendarDay[];
  isFullyClosed: boolean;
  isFullyOpen: boolean;
}

@Component({
  selector: 'app-accounting-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './accounting-calendar.component.html',
  styleUrl: './accounting-calendar.component.css'
})
export class AccountingCalendarComponent implements OnInit {
  private readonly service = inject(AccountingCalendarService);
  private readonly localStorageMethods = new LocalStorageMethods();

  // Estado del componente
  selectedYear: number = new Date().getFullYear();
  availableYears: { label: string; value: number }[] = [];
  calendarMonths: CalendarMonth[] = [];
  loading: boolean = false;
  enterpriseId: string = '';
  private loaderTimer: any = null;

  // Nombres de meses en español
  monthNames: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de días de la semana (Lunes a Domingo)
  dayNames: string[] = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    // Generar años disponibles (desde 2020 hasta 2030)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      this.availableYears.push({ label: year.toString(), value: year });
    }
  }

  ngOnInit(): void {
    // Asegurar que siempre haya un año válido seleccionado
    this.selectedYear = new Date().getFullYear();
    
    this.enterpriseId = this.localStorageMethods.loadEnterpriseData()?.id || '';
    if (this.enterpriseId) {
      this.generateCalendar();
      this.loadCalendarData();
    } else {
      // Para pruebas, generar calendario sin enterpriseId
      this.generateCalendar();
      this.loadTestData();
    }
  }

  onYearChange(): void {
    this.generateCalendar();
    if (this.enterpriseId) {
      this.loadCalendarData();
    } else {
      this.loadTestData();
    }
  }

  private generateCalendar(): void {
    this.calendarMonths = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = this.createMonthCalendar(month, this.selectedYear);
      this.calendarMonths.push(monthData);
    }
  }

  private createMonthCalendar(month: number, year: number): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Obtener el día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convertir a que la semana empiece en Lunes (1 = Lunes, 0 = Domingo)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days: CalendarDay[] = [];
    
    // Agregar días del mes anterior para completar la primera semana
    if (firstDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        days.push({
          date: new Date(prevYear, prevMonth, day),
          day,
          isCurrentMonth: false,
          isClosed: false,
          isToday: false
        });
      }
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = this.isToday(date);
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isClosed: false, // Se actualizará cuando se carguen los datos
        isToday
      });
    }
    
    // Completar la última semana para que siempre tenga 6 semanas (42 días)
    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(nextYear, nextMonth, day),
        day,
        isCurrentMonth: false,
        isClosed: false,
        isToday: false
      });
    }
    
    return {
      name: this.monthNames[month],
      year,
      month,
      days,
      isFullyClosed: false,
      isFullyOpen: false
    };
  }

  private loadCalendarData(): void {
    if (!this.enterpriseId) return;

    // Mostrar spinner solo si la petición tarda (>150ms)
    if (this.loaderTimer) {
      clearTimeout(this.loaderTimer);
    }
    this.loaderTimer = setTimeout(() => (this.loading = true), 150);

    this.service.findByYear(this.enterpriseId, this.selectedYear).subscribe({
      next: (response) => {
        this.updateCalendarWithData(response.content || []);
        if (this.loaderTimer) {
          clearTimeout(this.loaderTimer);
          this.loaderTimer = null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendar data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el calendario contable'
        });
        if (this.loaderTimer) {
          clearTimeout(this.loaderTimer);
          this.loaderTimer = null;
        }
        this.loading = false;
      }
    });
  }

  private updateCalendarWithData(calendarData: AccountingCalendar[]): void {
    // Actualizar el estado de cada día basado en los datos del backend
    this.calendarMonths.forEach(month => {
      month.days.forEach(day => {
        if (day.isCurrentMonth) {
          day.isClosed = this.isDateClosed(day.date, calendarData);
        }
      });
      
      // Recalcular estado del mes
      this.updateMonthStatus(month);
    });
  }

  private isDateClosed(date: Date, calendarData: AccountingCalendar[]): boolean {
    return calendarData.some(period => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      return date >= startDate && date <= endDate && !period.status;
    });
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private updateMonthStatus(month: CalendarMonth): void {
    const currentMonthDays = month.days.filter(d => d.isCurrentMonth);
    month.isFullyClosed = currentMonthDays.every(d => d.isClosed);
    month.isFullyOpen = currentMonthDays.every(d => !d.isClosed);
  }

  onDateClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    const action = day.isClosed ? 'abrir' : 'cerrar';
    const dateStr = day.date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    this.confirmationService.confirm({
      header: 'Confirmar Cambio de Estado',
      message: `¿Desea ${action} el periodo contable para el ${dateStr}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => this.changeDateState(day)
    });
  }

  private changeDateState(day: CalendarDay): void {
    if (!this.enterpriseId) return;
    
    const newStatus = !day.isClosed;
    const payload = {
      idEnterprise: this.enterpriseId,
      date: day.date.toISOString().split('T')[0],
      status: newStatus
    };
    
    this.service.changeDateState(payload).subscribe({
      next: () => {
        // Actualizar el estado local
        day.isClosed = !newStatus;
        
        // Recalcular estado del mes
        this.updateMonthStatus(this.calendarMonths[day.date.getMonth()]);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Estado Cambiado',
          detail: `Periodo ${newStatus ? 'abierto' : 'cerrado'} para el ${day.date.toLocaleDateString('es-ES')}`
        });
      },
      error: (error) => {
        console.error('Error changing date state:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del periodo'
        });
      }
    });
  }

  closeAllPeriods(): void {
    this.confirmationService.confirm({
      header: 'Confirmar Cierre Masivo',
      message: '¿Desea cerrar todos los periodos contables del año seleccionado? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar todos',
      rejectLabel: 'Cancelar',
      accept: () => this.executeCloseAll()
    });
  }

  private executeCloseAll(): void {
    if (!this.enterpriseId) return;
    
    this.loading = true;
    this.service.changeStateAll(this.enterpriseId, false).subscribe({
      next: () => {
        // Recargar datos
        this.loadCalendarData();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Cierre Masivo Exitoso',
          detail: 'Todos los periodos contables han sido cerrados'
        });
      },
      error: (error) => {
        console.error('Error closing all periods:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cerrar todos los periodos'
        });
        this.loading = false;
      }
    });
  }

  getMonthGridClass(month: CalendarMonth): string {
    if (month.isFullyClosed) return 'month-fully-closed';
    if (month.isFullyOpen) return 'month-fully-open';
    return 'month-mixed';
  }

  getDayClass(day: CalendarDay): string {
    let classes = 'calendar-day';
    
    if (!day.isCurrentMonth) {
      classes += ' other-month';
    } else {
      if (day.isClosed) {
        classes += ' closed';
      } else {
        classes += ' open';
      }
      
      if (day.isToday) {
        classes += ' today';
      }
    }
    
    return classes;
  }

  trackByDay(index: number, day: CalendarDay): string {
    return `${day.date.getTime()}-${day.isCurrentMonth}`;
  }

  private loadTestData(): void {
    // Datos de prueba para mostrar el calendario funcionando
    const testData: AccountingCalendar[] = [
      {
        id: 1,
        idEnterprise: 'test',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        status: false // Cerrado
      },
      {
        id: 2,
        idEnterprise: 'test',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        status: false // Cerrado
      },
      {
        id: 3,
        idEnterprise: 'test',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        status: false // Cerrado
      },
      {
        id: 4,
        idEnterprise: 'test',
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        status: false // Cerrado
      },
      {
        id: 5,
        idEnterprise: 'test',
        startDate: '2025-05-01',
        endDate: '2025-05-25',
        status: false // Cerrado
      },
      {
        id: 6,
        idEnterprise: 'test',
        startDate: '2025-06-01',
        endDate: '2025-06-29',
        status: false // Cerrado
      },
      {
        id: 7,
        idEnterprise: 'test',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        status: false // Cerrado
      },
      {
        id: 8,
        idEnterprise: 'test',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: true // Abierto
      },
      {
        id: 9,
        idEnterprise: 'test',
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        status: true // Abierto
      },
      {
        id: 10,
        idEnterprise: 'test',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        status: true // Abierto
      },
      {
        id: 11,
        idEnterprise: 'test',
        startDate: '2025-11-01',
        endDate: '2025-11-30',
        status: true // Abierto
      },
      {
        id: 12,
        idEnterprise: 'test',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        status: true // Abierto
      }
    ];
    
    this.updateCalendarWithData(testData);
  }
}
