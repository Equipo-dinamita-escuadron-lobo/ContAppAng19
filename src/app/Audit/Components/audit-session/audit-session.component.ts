import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { Location } from '@angular/common';
import { SessionAudit } from '../../Models/sessions/SessionAudit';
import { Option } from '../../Models/common/Option';
import { SessionAuditFilters } from '../../Models/sessions/SessionAuditFilters';
import { AuditSessionServiceService } from '../../Services/audit-session-service.service';
import { MessageService } from 'primeng/api';
import { PageResponse } from '../../Models/common/PageResponse';
import { ExportModalConfig } from '../../Models/export/ExportModalConfig';
import { ExportModalComponent } from '../export-modal/export-modal.component';


@Component({
  standalone: true,
  selector: 'app-audit-session',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    TagModule,
    ToggleSwitchModule,
    TooltipModule,
    ToastModule,
    InputIconModule,
    InputTextModule,
    IconFieldModule,
    DatePickerModule,
    DropdownModule,
    ExportModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './audit-session.component.html',
  styleUrl: './audit-session.component.css'
})
export class AuditSessionComponent {

  constructor(
    private location: Location,
    private auditService: AuditSessionServiceService,
    private messageService: MessageService
  ) {}

  filtro: {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    userRole: string;
    userName: string;
  } = {
    fechaInicio: null,
    fechaFin: null,
    userRole: '',
    userName: ''
  }; 

  sessions: SessionAudit[] = [];

  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  loading = false;
  hasSearched = false;
  firstLoad = true;
  sortField: string = '';
  sortOrder: number = 0;

  today = new Date();

  @ViewChild(ExportModalComponent) exportModal!: ExportModalComponent;

  readonly exportConfig: ExportModalConfig = {
    type: 'SESSION',
    title: 'Exportar auditoría de sesiones',
    infoMessage: 'Se exportarán las sesiones según los filtros aplicados actualmente.',
    allowedFormats: ['EXCEL', 'PDF'],
    showExtraFilters: false,
    currentFilters: () => ({
      dateFrom: this.formatDateToISO(this.filtro.fechaInicio!),
      dateTo: this.formatDateToISO(this.filtro.fechaFin!, true),
      userName: this.filtro.userName || undefined,
      userRole: this.filtro.userRole || undefined
    }),
    initiateExport: (format, filters) =>
      this.auditService.initiateExport({ ...filters, exportFormat: format })
  };

  onExportModalClosed(): void { }
  
  openExportModal(): void {
    if (!this.isValidFilters()) {
      return;
    }
    this.exportModal.open();
  }

  applyFilters(page: number = 0): void {
    if (!this.isValidFilters()) {
      return;
    }
    this.loading = true;
    this.hasSearched = true;
    this.currentPage = page;

    const fechaInicio = this.filtro.fechaInicio!;
    const fechaFin = this.filtro.fechaFin!;

    const filters: SessionAuditFilters = {
      dateFrom: this.formatDateToISO(fechaInicio),
      dateTo: this.formatDateToISO(fechaFin, true),
      page: this.currentPage,
      size: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortOrder === 1 ? 'ASC' : 'DESC'
    };
    const userName = this.sanitizeInput(this.filtro.userName || '');
    if (userName) {
      filters.userName = userName;
    }

    if (this.filtro.userRole) {
      filters.userRole = this.filtro.userRole;
    }

    this.auditService.getSessions(filters).subscribe({
      next: (response: PageResponse<SessionAudit>) => {
        this.sessions = response.data;
        this.totalRecords = response.totalElements;
        this.loading = false;

        if (response.data.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin resultados',
            detail: 'No se encontraron sesiones con los filtros aplicados'
          });
        }
      },
      error: (error) => {
        console.error('Error al obtener sesiones de auditoría:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sesiones de auditoría'
        });
      }
    })

  }

  onLazyLoad(event: any) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return; 
    }
    this.pageSize = event.rows;
    this.currentPage = event.first / event.rows;

    if (event.sortField) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;
    }

    this.applyFilters(this.currentPage);
  }

  goBack() {
    this.location.back();
  }

  onInputChange(event: any, field: 'userName' | 'userRole') {
    const value = event.target.value;
    this.filtro[field] = this.sanitizeInput(value);
  }

  private isValidFilters(): boolean {
    // Fechas vacias
    if (!this.filtro.fechaInicio || !this.filtro.fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un rango de fechas'
      });
      return false;
    }
    // Rango maximo 1 año
    const diff = this.filtro.fechaFin.getTime() - this.filtro.fechaInicio.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 365) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango muy grande',
        detail: 'El rango máximo permitido es de 1 año'
      });
      return false;
    }
    // Fechas futuras
    const now = new Date();
    if (this.filtro.fechaInicio > now || this.filtro.fechaFin > now) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha inválida',
        detail: 'No se pueden seleccionar fechas futuras'
      });
      return false;
    }
    //Usuario muy corto
    if (this.filtro.userName && this.filtro.userName.trim().length < 3) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Usuario muy corto',
        detail: 'Debe ingresar mínimo 3 caracteres'
      });
      return false;
    }
    // Usuario muy largo
    if (this.filtro.userName && this.filtro.userName.length > 50) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Texto muy largo', 
        detail: 'El nombre de usuario no puede exceder 50 caracteres'
    });
      return false;
    }

    if (this.containsInvalidCharacters(this.filtro.userName)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Caracteres inválidos',
        detail: `El campo de nomre deusuario contiene caracteres no permitidos`
      });

      return false;
    }

    return true;
  }

  private containsInvalidCharacters(value: string): boolean {
    return /[<>;"']/g.test(value);
  }


  private sanitizeInput(value: string): string {
    if (!value) return '';
    return value
      .replace(/[%_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  //Se formatea la fecha para enviar al tipo del backend
  private formatDateToISO(date: Date, endOfDay = false): string {
    if (!date) return '';

    const d = new Date(date);

    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (endOfDay) {
      if (isToday) {
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      } else {
        d.setHours(23, 59, 59, 999);
      }
    } else {
      d.setHours(0, 0, 0, 0);
    }

    return d.toISOString();
  }

  //Se formatea la fecha para mostrar en la tabla
  formatDateTime(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);

    return date.toLocaleString(navigator.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

}
