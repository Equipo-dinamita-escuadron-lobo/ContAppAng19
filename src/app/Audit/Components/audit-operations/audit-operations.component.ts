import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { Location } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { AuditOperationServiceService } from '../../Services/audit-operation-service.service';
import { MessageService } from 'primeng/api';
import { OperationType } from '../../Models/enums/OperationType';
import { Option } from '../../Models/common/Option';
import { OperationAudit } from '../../Models/operations/OperationAudit';
import { OperationAuditFilters } from '../../Models/operations/OperationAuditFilters';
import { PageResponse } from '../../Models/common/PageResponse';
import { OperationDetailModalComponent } from '../operation-detail-modal/operation-detail-modal.component';
import { MODULE_LABELS, TABLE_LABELS } from '../../Models/config/entity-field-config';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportModalConfig } from '../../Models/export/ExportModalConfig';
import { ExportModalComponent } from '../export-modal/export-modal.component';

@Component({
  standalone: true,
  selector: 'app-audit-operations',
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
    DropdownModule,
    DatePickerModule,
    OperationDetailModalComponent,
    ExportModalComponent,
  ],
  templateUrl: './audit-operations.component.html',
  styleUrl: './audit-operations.component.css'
})
export class AuditOperationsComponent {

  private readonly operationService = inject(AuditOperationServiceService);
  private readonly messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private router = inject(Router);

  private firstLoad = true;

  filtro: {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    moduleName: string | null;
    affectedTable: string | null;
    userName: string;
    userRole: string;
    operationType: OperationType | null;
    registerId: string;
  } = {
    fechaInicio: null,
    fechaFin: null,
    moduleName: null,
    affectedTable: null,
    userName: '',
    userRole: '',
    operationType: null,
    registerId: ''
  };

  operationsOptions: Option<OperationType>[] = [
    { label: 'Todos', value: null },
    { label: 'Creación', value: OperationType.CREATE },
    { label: 'Modificación', value: OperationType.UPDATE },
    { label: 'Eliminación', value: OperationType.DELETE },
    { label: 'Inactivación', value: OperationType.INACTIVATE },
    { label: 'Activación', value: OperationType.ACTIVATE }
  ];

  operationTypeLabels: Record<string, string> = {
    [OperationType.CREATE]: 'Creación',
    [OperationType.UPDATE]: 'Modificación',
    [OperationType.DELETE]: 'Eliminación',
    [OperationType.INACTIVATE]: 'Inactivación',
    [OperationType.ACTIVATE]: 'Activación'
  };

  operations: OperationAudit[] = [];
  moduleOptions: Option<string>[] = [];
  tableOptions: Option<string>[] = [];       
  allTablesByModule: Record<string, string[]> = {};

  totalRecords = 0;
  currentPage = 0;
  pageSize = 20;

  loading = false;
  hasSearched = false;
  sortField: string = '';
  sortOrder: number = 0;

  today = new Date();

  selectedOperation: OperationAudit | null = null;
  modalVisible = false;

  auditType: 'operations' | 'system' = 'operations';

  readonly moduleLabels = MODULE_LABELS;
  readonly tableLabels  = TABLE_LABELS;

  @ViewChild(ExportModalComponent) exportModal!: ExportModalComponent;

  readonly exportConfig: ExportModalConfig = {
    type: 'OPERATION',
    title: 'Exportar auditoría de operaciones',
    infoMessage: 'Se exportarán las operaciones según los filtros aplicados actualmente.',
    allowedFormats: ['EXCEL'],
    showExtraFilters: false,
    currentFilters: () => ({
      dateFrom: this.formatDateToISO(this.filtro.fechaInicio!),
      dateTo: this.formatDateToISO(this.filtro.fechaFin!, true),
      moduleName: this.filtro.moduleName || undefined,
      affectedTable: this.filtro.affectedTable || undefined,
      userName: this.filtro.userName || undefined,
      userRole: this.filtro.userRole || undefined,
      operationType: this.filtro.operationType || undefined,
    }),
    initiateExport: (format, filters) =>
      this.operationService.initiateExport({ ...filters, exportFormat: format }, this.auditType)
  };

  onExportModalClosed(): void { }
  
  openExportModal(): void {
    if (!this.isValidFilters()) {
      return;
    }
    this.exportModal.open();
  }

  ngOnInit(): void {
    this.auditType = this.route.snapshot.data['auditType'] ?? 'operations';
    this.loadModulesAndTables();
  }

  openDetail(operation: OperationAudit): void {
    this.selectedOperation = { ...operation };
    this.modalVisible = true;
  }

  goBack() {
    this.location.back();
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

    const filters: OperationAuditFilters = {
      dateFrom: this.formatDateToISO(fechaInicio),
      dateTo: this.formatDateToISO(fechaFin, true),
      moduleName: this.filtro.moduleName || undefined,
      affectedTable: this.filtro.affectedTable || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortOrder === 1 ? 'ASC' : 'DESC'
    }
    const userName = this.sanitizeInput(this.filtro.userName || '');
    if (userName) {
      filters.userName = userName;
    }
    if (this.filtro.userRole) {
      filters.userRole = this.filtro.userRole;
    }
    if (this.filtro.operationType) {
      filters.operationType = this.filtro.operationType;
    }

    this.operationService.getOperations(filters, this.auditType).subscribe({
      next: (response: PageResponse<OperationAudit>) => {
        this.operations = response.data;
        this.totalRecords = response.totalElements;
        this.loading = false;
        if (response.data.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin resultados',
            detail: 'No se encontraron operaciones con los filtros aplicados'
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las operaciones de auditoría'
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

  onInputChange(event: any, field: 'userName' | 'userRole') {
    const value = event.target.value;
    this.filtro[field] = this.sanitizeInput(value);
  }

  private sanitizeInput(value: string): string {
    if (!value) return '';
    return value
      .replace(/[%_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
    // Rango maximo 2 años
    const diff = this.filtro.fechaFin.getTime() - this.filtro.fechaInicio.getTime();
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
    if (this.filtro.fechaInicio > now || this.filtro.fechaFin > now) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha inválida',
        detail: 'No se pueden seleccionar fechas futuras'
      });
      return false;
    }
    // Validar usuario
    if (!this.validateTextField(this.filtro.userName, "Usuario", 3, 50)) {
      return false;
    }
    return true;
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


  private loadModulesAndTables(): void {
    this.operationService.getModulesAndTables(this.auditType).subscribe({
      next: (data) => {
        this.allTablesByModule = data.reduce((acc, item) => {
          if (!acc[item.moduleName]) acc[item.moduleName] = [];
          acc[item.moduleName].push(item.affectedTable);
          return acc;
        }, {} as Record<string, string[]>);

        this.moduleOptions = [
          { label: 'Todos', value: null },
          ...Object.keys(this.allTablesByModule).map(m => ({
            label: MODULE_LABELS[m] ?? m,   
            value: m                         
          }))
        ];

        this.tableOptions = [{ label: 'Todas', value: null }];
      }
    });
  }

  onModuleChange(): void {
    this.filtro.affectedTable = null;

    if (!this.filtro.moduleName) {
      this.tableOptions = [{ label: 'Todas', value: null }];
      return;
    }

    const tables = this.allTablesByModule[this.filtro.moduleName] ?? [];
    this.tableOptions = [
      { label: 'Todas', value: null },
      ...tables.map(t => ({
        label: TABLE_LABELS[t] ?? t,   
        value: t
      }))
    ];
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

  formatData(operation: OperationAudit): string {
    const data = operation.dataObject;
    if (!data) return '';

    switch (operation.operationType) {
      case OperationType.UPDATE:
        return this.formatUpdate(data);

      case OperationType.CREATE:
        return this.formatEntity("Datos creados", data.entity);

      case OperationType.DELETE:
        return this.formatEntity("Datos eliminados", data.entity);

      case OperationType.INACTIVATE:
        return this.formatEntity("Registro inactivado", data.entity); 

      default:
        return JSON.stringify(data);
    }
  }

  private formatUpdate(data: any): string {
    if (!data.changes || Object.keys(data.changes).length === 0) {
      return "Sin cambios";
    }

    const changes = Object.entries(data.changes)
      .map(([key, value]: any) =>
        `• ${key}: ${value.before} → ${value.after}`
      )
      .join('<br>');

    return `Cambios:<br>${changes}`;
  }

  private formatEntity(title: string, entity: any): string {
    if (!entity || Object.keys(entity).length === 0) {
      return `${title}: (sin datos)`;
    }

    const entries = Object.entries(entity)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('<br>');

    return `${title}:<br>${entries}`;
  }

}
