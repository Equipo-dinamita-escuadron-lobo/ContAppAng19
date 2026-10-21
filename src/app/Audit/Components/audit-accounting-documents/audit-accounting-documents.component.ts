import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { Location } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SkeletonModule } from 'primeng/skeleton';
import { AuditDocumentEventServiceService } from '../../Services/audit-document-event-service.service';
import { MessageService } from 'primeng/api';
import { DocumentEventAudit } from '../../Models/documents/DocumentEventAudit';
import { AuditDateType } from '../../Models/enums/AuditDateType';
import { DocumentEventFilters } from '../../Models/documents/DocumentEventFilters';
import { PageResponse } from '../../Models/common/PageResponse';
import { ExportModalComponent } from '../export-modal/export-modal.component';
import { ExportModalConfig } from '../../Models/export/ExportModalConfig';
import { ExportAppliedFilter } from '../../Models/export/ExportAppliedFilter';

@Component({
  standalone: true,
  selector: 'app-audit-accounting-documents',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ToggleSwitchModule,
    TooltipModule,
    DropdownModule,
    DatePickerModule,
    RadioButtonModule,
    SkeletonModule,
    ExportModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './audit-accounting-documents.component.html',
  styleUrl: './audit-accounting-documents.component.css'
})
export class AuditAccountingDocumentsComponent implements OnInit {

  constructor(
    private router: Router,
    private auditService: AuditDocumentEventServiceService,
    private location: Location,
    private messageService: MessageService
  ) {}

  //Manejo de estado
  documents: DocumentEventAudit[] = [];
  loading = false;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  sortField: string = '';
  sortOrder: number = 0;

  hasSearched = false;
  private lastAppliedFilters: DocumentEventFilters | null = null;
  private firstLoad = true;
  today = new Date();

  //Filtros
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  dateType: AuditDateType = AuditDateType.OPERATION_DATE;
  documentType = '';
  documentCode = '';
  createdBy = '';
  thirdPartyName = '';

  readonly AuditDateType = AuditDateType;

  readonly documentTypeOptions = [
    { label: 'Todos', value: '' },
    { label: 'Factura de venta', value: 'SALE' },
    { label: 'Factura de compra', value: 'PURCHASE' },
    { label: 'Devolución en venta', value: 'RETURN_ON_SALE' },
    { label: 'Devolución en compra', value: 'RETURN_ON_PURCHASE' },
    { label: 'Entrada no comercial', value: 'NON_COMMERCIAL_ENTRY' },
    { label: 'Salida no comercial', value: 'NON_COMMERCIAL_EXIT' },
    { label: 'Recibo de caja directo', value: 'RECEIPT_DIRECT_INCOME' },
    { label: 'Recibo de caja abono', value: 'RECEIPT_INVOICE_PAYMENT' },
    { label: 'Castigo cartera', value: 'WRITE_OFF' },
  ];

  documentTypeLabels: Record<string, string> = {
    SALE: 'Factura de Venta',
    PURCHASE: 'Factura de Compra',
    RETURN_ON_SALE: 'Dev. Venta',
    RETURN_ON_PURCHASE: 'Dev. Compra',
    NON_COMMERCIAL_ENTRY: 'Entrada No Comercial',
    NON_COMMERCIAL_EXIT: 'Salida No Comercial',
    RECEIPT_DIRECT_INCOME: 'Recibo de caja directo',
    RECEIPT_INVOICE_PAYMENT: 'Recibo de caja abono',
    WRITE_OFF: 'Castigo cartera',
  };

  readonly dateTypeLabels: Record<string, string> = {
    OPERATION_DATE: 'Fecha de operación',
    DOCUMENT_DATE: 'Fecha de documento',
    CREATION_DATE:  'Fecha de creación',
  };

  @ViewChild(ExportModalComponent) exportModal!: ExportModalComponent;

  readonly exportConfig: ExportModalConfig = {
    type: 'DOCUMENT',
    title: 'Exportar auditoría de documentos',
    infoMessage:
      'Se exportará el detalle completo de cada operación registrada, ' +
      'no el resumen consolidado que se muestra en pantalla. ' +
      'Cada fila del archivo corresponderá a una operación individual: ' +
      'creaciones, modificaciones, eliminaciones, etc.',
    allowedFormats: ['EXCEL'],
    showExtraFilters: true,
    currentFilters: () => ({
      dateFrom: this.formatDateToISO(this.dateFrom!),
      dateTo: this.formatDateToISO(this.dateTo!, true),
      dateType: this.dateType,
      documentCode: this.documentCode || undefined,
      documentType: this.documentType || undefined,
      thirdPartyName: this.thirdPartyName || undefined,
      username: this.createdBy || undefined,
    }),
    appliedFilters: () => this.buildAppliedFilters(),
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

  ngOnInit(): void {
    const state = this.auditService.getAuditDocumentsState();
    if (!state) {
      return;
    }
    this.documents = state.documents;
    this.totalElements = state.totalElements;
    this.totalPages = state.totalPages;
    this.currentPage = state.currentPage;
    this.pageSize = state.pageSize;
    this.sortField = state.sortField;
    this.sortOrder = state.sortOrder;
    this.lastAppliedFilters = state.lastAppliedFilters;
    this.hasSearched = state.hasSearched;
    if (this.lastAppliedFilters) {
      this.dateFrom = this.lastAppliedFilters.dateFrom
        ? new Date(this.lastAppliedFilters.dateFrom)
        : null;
      this.dateTo = this.lastAppliedFilters.dateTo
        ? new Date(this.lastAppliedFilters.dateTo)
        : null;
      this.dateType = this.lastAppliedFilters.dateType ?? AuditDateType.OPERATION_DATE;
      this.documentType = this.lastAppliedFilters.documentType ?? '';
      this.documentCode = this.lastAppliedFilters.documentCode ?? '';
      this.createdBy = this.lastAppliedFilters.createdBy ?? '';
      this.thirdPartyName = this.lastAppliedFilters.thirdPartyName ?? '';
    }
    Object.assign(this, state);
    this.firstLoad = false;
    this.auditService.clearAuditDocumentsState();
  }

  goBack() {
    this.location.back();
  }

  applyFilters(page = 0): void {
    if (!this.isValidFilters()) {
      return;
    }

    this.hasSearched = true;
    this.loading = true;
    this.currentPage = page;

    const filters: DocumentEventFilters = {
      dateFrom: this.formatDateToISO(this.dateFrom!),
      dateTo: this.formatDateToISO(this.dateTo!, true),
      dateType: this.dateType,
      documentType: this.documentType || undefined,
      documentCode: this.documentCode || undefined,
      createdBy: this.createdBy || undefined,
      thirdPartyName: this.thirdPartyName || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortOrder === 1 ? 'ASC' : 'DESC'
    };
    this.lastAppliedFilters = structuredClone(filters);

    this.auditService.getDocumentsEvents(filters).subscribe({
      next: (response: PageResponse<DocumentEventAudit>) => {
        this.documents = response.data;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
        if (response.data.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin resultados',
            detail: 'No se encontraron registros de auditoría para los filtros aplicados'
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los registros de auditoría para documentos contables.',
        });
        this.loading = false;
      },
    });
  }

  private sanitizeInput(value: string): string {
    if (!value) return '';
    return value
      .replace(/[%_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  onInputChange(event: any, field: 'createdBy' | 'thirdPartyName'
  ): void {
    const value = event.target.value;
    this[field] = this.sanitizeInput(value);
  }

  private isValidFilters(): boolean {
    // Fechas vacias
    if (!this.dateFrom || !this.dateTo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un rango de fechas'
      });
      return false;
    }
    // Rango maximo 2 años
    const diff = this.dateTo.getTime() - this.dateFrom.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 730) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango muy grande',
        detail: 'El rango máximo permitido es de 2 años'
      });
      return false;
    }
    // Fechas futuras
    const now = new Date();
    if (this.dateFrom > now || this.dateTo > now) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha inválida',
        detail: 'No se pueden seleccionar fechas futuras'
      });
      return false;
    }
    this.documentCode = this.sanitizeInput(this.documentCode);
    this.createdBy = this.sanitizeInput(this.createdBy);
    this.thirdPartyName = this.sanitizeInput(this.thirdPartyName);
    if ( 
      !this.validateTextField(this.createdBy, 'Usuario', 3, 100) ||
      !this.validateTextField(this.thirdPartyName, 'Tercero', 3, 150)
    ) {
      return false;
    }
    return true;
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
 
  viewDetails(row: DocumentEventAudit): void {
    this.auditService.setAuditDocumentsState({
      documents: this.documents,
      totalElements: this.totalElements,
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      lastAppliedFilters: this.lastAppliedFilters,
      hasSearched: this.hasSearched
    });
    this.router.navigate(['/audit/documents/details', row.documentCode]);
  }

  private validateTextField(
    value: string | null | undefined,
    fieldLabel: string,
    min: number,
    max: number
  ): boolean {
    if (!value || !value.trim()) {
      return true;
    }

    const trimmed = value.trim();

    if (this.containsInvalidCharacters(trimmed)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Caracteres inválidos',
        detail: `El campo ${fieldLabel} contiene caracteres no permitidos`
      });

      return false;
    }

    if (trimmed.length < min) {
      this.messageService.add({
        severity: 'warn',
        summary: `${fieldLabel} muy corto`,
        detail: `Debe ingresar mínimo ${min} caracteres`
      });
      return false;
    }

    if (trimmed.length > max) {
      this.messageService.add({
        severity: 'warn',
        summary: `${fieldLabel} muy largo`,
        detail: `No puede exceder ${max} caracteres`
      });
      return false;
    }

    return true;
  }

  private containsInvalidCharacters(value: string): boolean {
    return /[<>;"']/g.test(value);
  }

  private buildAppliedFilters(): ExportAppliedFilter[] {
    const filters: ExportAppliedFilter[] = [];

    // Rango de fechas (obligatorio para exportar, siempre estará)
    if (this.dateFrom && this.dateTo) {
      filters.push({
        label: 'Rango de fechas',
        value: `${this.formatDateDisplay(this.dateFrom)} – ${this.formatDateDisplay(this.dateTo)}`,
      });
    }
    // Tipo de fecha
    filters.push({
      label: 'Tipo de fecha',
      value: this.dateTypeLabels[this.dateType] ?? this.dateType,
    });
    // Tipo de documento
    if (this.documentType) {
      filters.push({
        label: 'Tipo de documento',
        value: this.documentTypeLabels[this.documentType] ?? this.documentType,
      });
    }
    // Código de documento
    if (this.documentCode) {
      filters.push({
        label: 'Código de documento',
        value: this.documentCode,
      });
    }
    // Tercero
    if (this.thirdPartyName) {
      filters.push({
        label: 'Tercero',
        value: this.thirdPartyName,
      });
    }
    // usuario
    if (this.createdBy) {
      filters.push({
        label: 'Usuario operación',
        value: this.createdBy,
      });
    }
    return filters;
  }

  private formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    });
  }

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
