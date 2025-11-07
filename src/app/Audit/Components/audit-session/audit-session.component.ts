import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { SessionAudit } from '../../Models/sessions/SessionAudit';
import { UserRole } from '../../Models/enums/UserRole';
import { RoleOption } from '../../Models/sessions/RoleOption';
import { SessionAuditFilters } from '../../Models/sessions/SessionAuditFilters';
import { SessionsPage } from '../../Models/sessions/SessionsPage';
import { AuditSessionServiceService } from '../../Services/audit-session-service.service';
import { MessageService } from 'primeng/api';


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
  ],
  templateUrl: './audit-session.component.html',
  styleUrl: './audit-session.component.css'
})
export class AuditSessionComponent {

  private readonly auditService = inject(AuditSessionServiceService);
  private readonly messageService = inject(MessageService);

  filtro = {
    fechaInicio: null,
    fechaFin: null,
    rol: null as UserRole | null,
    usuario: ''
  };

  roles : RoleOption[] = [
    { label: 'Todos', value: null },
    { label: 'Admin', value: UserRole.ADMIN },
    { label: 'Profesor', value: UserRole.PROFESOR },
    { label: 'Estudiante', value: UserRole.ESTUDIANTE }
  ];

  sessions: SessionAudit[] = [];

  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  loading = false;
  hasSearched = false;

  applyFilters(page: number = 0): void {
    console.log('applyFilters ejecutado');
    if (!this.filtro.fechaInicio || !this.filtro.fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un rango de fechas'
      });
      return;
    }
    this.loading = true;
    this.hasSearched = true;
    this.currentPage = page;

    const filters: SessionAuditFilters = {
      dateFrom: this.formatDateToISO(this.filtro.fechaInicio),
      dateTo: this.formatDateToISO(this.filtro.fechaFin, true),
      page: this.currentPage,
      size: this.pageSize,
      sortField: 'actionAt',
      sortDirection: 'DESC'
    };

    if (this.filtro.usuario && this.filtro.usuario.trim()) {
      filters.userName = this.filtro.usuario.trim();
    }

    if (this.filtro.rol) {
      filters.userRole = this.filtro.rol;
    }

    this.auditService.getSessions(filters).subscribe({
      next: (response: SessionsPage) => {
        this.sessions = response.sessions;
        this.totalRecords = response.totalElements;
        this.loading = false;

        if (response.sessions.length === 0) {
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

  //Cambio de pagina
  onPageChange(event: any): void {
    this.pageSize = event.rows;
    this.applyFilters(event.page);
  }

  //Exportar a PDF
  exportPdf(): void {
    if (!this.filtro.fechaInicio || !this.filtro.fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un rango de fechas'
      });
      return;
    }

    const filters: SessionAuditFilters = {
      dateFrom: this.formatDateToISO(this.filtro.fechaInicio),
      dateTo: this.formatDateToISO(this.filtro.fechaFin, true),
      userName: this.filtro.usuario || undefined,
      userRole: this.filtro.rol || undefined
    };

    this.auditService.exportToPdf(filters).subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'sesiones-audit.pdf');
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'PDF descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al exportar PDF:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo exportar el PDF'
        });
      }
    });
  }

  
  //Exportar a Excel
  exportExcel(): void {
    if (!this.filtro.fechaInicio || !this.filtro.fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un rango de fechas'
      });
      return;
    }

    const filters: SessionAuditFilters = {
      dateFrom: this.formatDateToISO(this.filtro.fechaInicio),
      dateTo: this.formatDateToISO(this.filtro.fechaFin, true),
      userName: this.filtro.usuario || undefined,
      userRole: this.filtro.rol || undefined
    };

    this.auditService.exportToExcel(filters).subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'sesiones-audit.xlsx');
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Excel descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al exportar Excel:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo exportar el Excel'
        });
      }
    });
  }

  //Se formatea la fecha para enviar al tipo del backend
  private formatDateToISO(date: Date, endOfDay: boolean = false): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (endOfDay) {
      return `${year}-${month}-${day}T23:59:59-05:00`;
    }
    return `${year}-${month}-${day}T00:00:00-05:00`;
  }

  //Para descargar archivo
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  //Se formatea la fecha para mostrar en la tabla
  formatDateTime(dateString: string | null): string {
    if (!dateString) {
      return 'Sesión activa';
    }
    
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

}
