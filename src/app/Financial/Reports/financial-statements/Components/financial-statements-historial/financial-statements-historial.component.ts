import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { FinancialStatementsService } from '../../Services/financial-statements.service';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { FinancialStatementsSchedulingComponent } from '../financial-statements-scheduling/financial-statements-scheduling.component';
import { ExportFinancialStatementComponent } from '../export-financial-statement/export-financial-statement.component';
import { ColumnDefinition } from '../report-preview/report-preview.component';

@Component({
  selector: 'app-financial-statements-historial',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    RippleModule,
    DialogModule,
  ],
  providers: [MessageService, ConfirmationService, DialogService],
  templateUrl: './financial-statements-historial.component.html',
  styleUrl: './financial-statements-historial.component.css',
})
export class FinancialStatementsHistorialComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  refDialog: DynamicDialogRef | undefined;

  history: any[] = [];
  isLoading = false;
  isDownloading = false;

  selectedHistoryItem: any | null = null;

  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchValue = '';

  constructor(
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly enterpriseService: EnterpriseService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    protected readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.ensureEnterpriseAndLoadHistory();
  }

  loadHistory(event?: any): void {
    this.isLoading = true;

    if (event) {
      this.first = event.first;
      this.rows = event.rows;
      this.sortField = event.sortField || this.sortField;
      this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      this.history = [];
      this.totalRecords = 0;
      this.isLoading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Debe seleccionar una empresa para consultar historial.',
      });
      return;
    }

    const pageable = {
      page: this.first / this.rows,
      size: this.rows,
      sort: `${this.sortField},${this.sortOrder}`,
    };

    this.financialStatementsService
      .getHistoryByEnterprise(enterpriseId, pageable, this.searchValue)
      .subscribe({
        next: (response) => {
          const content = response?.data?.content;

          if (!Array.isArray(content)) {
            this.history = [];
            this.totalRecords = 0;
            this.messageService.add({
              severity: 'warn',
              summary: 'Atencion',
              detail: 'La respuesta del servidor no tuvo el formato esperado.',
            });
            this.isLoading = false;
            return;
          }

          this.history = content.map((item: any) => this.mapHistoryItem(item));
          this.totalRecords = Number(
            response?.data?.totalElements ?? this.history.length
          );
          this.isLoading = false;
        },
        error: (err) => {
          const statusCode = err?.status ? ` (${err.status})` : '';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo cargar el historial${statusCode}. Intente de nuevo.`,
          });
          this.history = [];
          this.totalRecords = 0;
          this.isLoading = false;
        },
      });
  }

  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.first = 0;
    this.dt.first = 0;
    this.loadHistory();
  }

  onPageChange(event: any): void {
    this.loadHistory(event);
  }

  onSort(event: any): void {
    this.loadHistory(event);
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const normalizedStatus = this.normalizeStatus(status);

    if (
      this.isCompletedStatus(normalizedStatus) ||
      normalizedStatus === 'SCHEDULED_EMAIL_SENT' ||
      (normalizedStatus.includes('EMAIL') && normalizedStatus.includes('SENT'))
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('GENERAT') ||
      normalizedStatus.includes('GENERAND') ||
      normalizedStatus.includes('SCHEDULED')
    ) {
      return 'info';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'danger';
    }

    return 'warning';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = this.normalizeStatus(status);

    if (normalizedStatus === 'GENERATED') {
      return 'Generado';
    }

    if (normalizedStatus === 'EXPORTED_DOWNLOAD') {
      return 'Exportado (Descarga)';
    }

    if (normalizedStatus === 'EXPORTED_EMAIL') {
      return 'Exportado (Correo)';
    }

    if (normalizedStatus === 'SCHEDULED_EMAIL_SENT') {
      return 'Correo programado enviado';
    }

    if (normalizedStatus === 'EMAIL_SCHEDULED') {
      return 'Correo programado';
    }

    if (normalizedStatus === 'COMPLETED') {
      return 'Completado';
    }

    if (
      normalizedStatus.includes('GENERAT') ||
      normalizedStatus.includes('GENERAND')
    ) {
      return 'Generando';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'Error';
    }

    if (normalizedStatus.includes('PEND')) {
      return 'Pendiente';
    }

    if (normalizedStatus.includes('SCHEDULED')) {
      return 'Programado';
    }

    return status || 'Desconocido';
  }

  showDetails(item: any): void {
    this.router.navigate([
      '/financial/reports/financial-statements/historial/details',
      item.publicId,
    ]);
  }

  showSchedulingDialog(item: any): void {
    this.selectedHistoryItem = item;

    this.refDialog = this.dialogService.open(
      FinancialStatementsSchedulingComponent,
      {
        data: this.selectedHistoryItem,
      }
    );
  }

  downloadReport(item: any): void {
    if (!this.isCompletedStatus(item?.status)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atencion',
        detail:
          'El estado sigue en generacion. Se abrira la vista previa para revisar la informacion.',
      });
    }

    if (!item?.reportId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontro reportId para descargar el reporte.',
      });
      return;
    }

    if (this.isDownloading) {
      return;
    }

    this.isDownloading = true;
    this.financialStatementsService.getFinancialStatementReport(item.reportId).subscribe({
      next: (reportResponse) => {
        this.isDownloading = false;
        this.openExportPreviewDialog(item, reportResponse);
      },
      error: (err) => {
        this.isDownloading = false;
        const statusCode = err?.status ? ` (${err.status})` : '';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo cargar el reporte para la vista previa${statusCode}.`,
        });
      },
    });
  }

  private mapHistoryItem(item: any): any {
    const report = item?.financialStatement ?? {};
    const eventDate = item?.createdAt ?? report?.createdAt;

    return {
      id: Number(item?.id ?? 0),
      reportId: report.reportId,
      publicId: report.publicId,
      type: report.type,
      bookName: this.formatStatementType(report.type),
      reportPeriodLabel: this.buildReportPeriodLabel(report.type, report.criteria),
      generationDate: eventDate ? new Date(eventDate) : null,
      user: report.userId,
      status: item?.state ?? report.state,
    };
  }

  private formatStatementType(type: string): string {
    const map: Record<string, string> = {
      STATEMENT_FINANCIAL_POSITION: 'Estado de Situacion Financiera',
      INCOME_STATEMENT: 'Estado de Resultados',
      STATEMENT_CHANGES_EQUITY: 'Estado de Cambios en el Patrimonio',
    };

    return map[type] || type || 'Estado Financiero';
  }

  private buildReportPeriodLabel(statementType: string, criteria: any): string {
    const safeCriteria = criteria || {};

    const startDate = this.resolveCriteriaDateLabel(safeCriteria.startDate);
    const endDate = this.resolveCriteriaDateLabel(safeCriteria.endDate);
    const previousStartDate = this.resolveCriteriaDateLabel(
      safeCriteria.previousStartDate
    );
    const previousEndDate = this.resolveCriteriaDateLabel(
      safeCriteria.previousEndDate
    );

    if (previousStartDate || previousEndDate) {
      const currentPeriod = this.buildDateRangeLabel(
        'Periodo actual',
        startDate,
        endDate
      );
      const previousPeriod = this.buildDateRangeLabel(
        'Periodo anterior',
        previousStartDate,
        previousEndDate
      );
      return `${currentPeriod} | ${previousPeriod}`;
    }

    const isCutoffReport = [
      'STATEMENT_FINANCIAL_POSITION',
      'STATEMENT_CHANGES_EQUITY',
    ].includes(String(statementType || '').toUpperCase());

    if (isCutoffReport && endDate) {
      const labels = [
        startDate ? `Corte anterior: ${startDate}` : '',
        `Corte actual: ${endDate}`,
      ].filter(Boolean);
      return labels.join(' | ');
    }

    if (startDate && endDate) {
      return `Periodo: ${startDate} - ${endDate}`;
    }

    if (endDate) {
      return `Corte: ${endDate}`;
    }

    if (startDate) {
      return `Desde: ${startDate}`;
    }

    return 'Sin fechas de criterio';
  }

  private buildDateRangeLabel(
    label: string,
    startDate: string | null,
    endDate: string | null
  ): string {
    if (startDate && endDate) {
      return `${label}: ${startDate} - ${endDate}`;
    }

    if (startDate || endDate) {
      return `${label}: ${startDate || endDate}`;
    }

    return `${label}: Sin datos`;
  }

  private resolveCriteriaDateLabel(value: unknown): string | null {
    const parsedDate = this.parseDateValue(value);
    if (!parsedDate) {
      return null;
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private parseDateValue(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private resolveEnterpriseId(): string | null {
    const selectedEnterprise = this.enterpriseService.getSelectedEnterprise();
    const selectedEnterpriseId = selectedEnterprise?.id;

    return selectedEnterpriseId ? String(selectedEnterpriseId) : null;
  }

  private ensureEnterpriseAndLoadHistory(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (enterpriseId) {
      this.loadHistory();
      return;
    }

    this.history = [];
    this.totalRecords = 0;
    this.messageService.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Debe seleccionar una empresa para consultar historial.',
    });
  }

  private normalizeStatus(status: string): string {
    return status?.trim().toUpperCase() || '';
  }

  private openExportPreviewDialog(item: any, reportResponse: any): void {
    const enterprise = this.enterpriseService.getSelectedEnterprise();
    const financialStatement = this.resolveFinancialStatementFromResponse(
      item,
      reportResponse
    );
    const financialStatementData =
      this.resolveFinancialStatementDataFromResponse(reportResponse);
    const statementType = String(financialStatement?.type || item?.type || '')
      .trim()
      .toUpperCase();

    this.refDialog = this.dialogService.open(ExportFinancialStatementComponent, {
      data: {
        reportTitle: this.formatStatementType(statementType),
        statementType,
        financialStatement,
        dataTable: financialStatementData,
        headerConfig: this.buildHistoryPreviewHeaderConfig(
          statementType,
          financialStatementData
        ),
        enterpriseData: enterprise,
        generationDate: this.resolvePreviewGenerationDate(
          financialStatement,
          item
        ),
        totals: {},
      },
    });
  }

  private resolveFinancialStatementFromResponse(item: any, reportResponse: any): any {
    return (
      reportResponse?.financialStatement ??
      reportResponse?.report ??
      reportResponse ?? {
        reportId: item?.reportId,
        publicId: item?.publicId,
        type: item?.type,
      }
    );
  }

  private resolveFinancialStatementDataFromResponse(reportResponse: any): any[] {
    const possibleDataCollections = [
      reportResponse?.financialStatementData,
      reportResponse?.reportData,
      reportResponse?.data,
      reportResponse?.content,
    ];

    const financialStatementData = possibleDataCollections.find((collection) =>
      Array.isArray(collection)
    );

    return Array.isArray(financialStatementData) ? financialStatementData : [];
  }

  private resolvePreviewGenerationDate(financialStatement: any, item: any): Date {
    const rawValue =
      financialStatement?.createdAt ?? item?.generationDate ?? item?.createdAt;

    const parsedDate = rawValue ? new Date(rawValue) : new Date();
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  private buildHistoryPreviewHeaderConfig(
    statementType: string,
    rows: any[]
  ): ColumnDefinition[][] {return this.buildComparativeHeaderConfig(rows);
  }

  private buildComparativeHeaderConfig(rows: any[]): ColumnDefinition[][] {
    const currentPercentageField = this.resolvePercentageField(
      rows,
      'currentPercentage',
      'currentPercentageLabel'
    );
    const previousPercentageField = this.resolvePercentageField(
      rows,
      'previousPercentage',
      'previousPercentageLabel'
    );
    const variationPercentageField = this.resolvePercentageField(
      rows,
      'variationPercentage',
      'variationPercentageLabel'
    );

    const currentPercentageType: 'text' | 'percentage' =
      currentPercentageField.endsWith('Label') ? 'text' : 'percentage';
    const previousPercentageType: 'text' | 'percentage' =
      previousPercentageField.endsWith('Label') ? 'text' : 'percentage';
    const variationPercentageType: 'text' | 'percentage' =
      variationPercentageField.endsWith('Label') ? 'text' : 'percentage';

    return [
      [
        { header: 'Cuenta', field: 'lineDescription', rowspan: 2 },
        {
          header: 'Periodo Actual',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'currentAmount', type: 'number' },
            {
              header: 'Porcentaje',
              field: currentPercentageField,
              type: currentPercentageType,
            },
          ],
        },
        {
          header: 'Periodo Anterior',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'previousAmount', type: 'number' },
            {
              header: 'Porcentaje',
              field: previousPercentageField,
              type: previousPercentageType,
            },
          ],
        },
        {
          header: 'Variacion',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'variation', type: 'number' },
            {
              header: 'Porcentaje',
              field: variationPercentageField,
              type: variationPercentageType,
            },
          ],
        },
      ],
      [
        { header: 'Valor', field: 'currentAmount', type: 'number' },
        {
          header: 'Porcentaje',
          field: currentPercentageField,
          type: currentPercentageType,
        },
        { header: 'Valor', field: 'previousAmount', type: 'number' },
        {
          header: 'Porcentaje',
          field: previousPercentageField,
          type: previousPercentageType,
        },
        { header: 'Valor', field: 'variation', type: 'number' },
        {
          header: 'Porcentaje',
          field: variationPercentageField,
          type: variationPercentageType,
        },
      ],
    ];
  }

  private resolvePercentageField(
    rows: any[],
    numericField: string,
    labelField: string
  ): string {
    const hasLabelField = (rows || []).some((row) => {
      const value = row?.[labelField];
      return value !== undefined && value !== null && value !== '';
    });

    return hasLabelField ? labelField : numericField;
  }

  isCompletedStatus(status: string): boolean {
    const normalizedStatus = this.normalizeStatus(status);
    return (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS') ||
      normalizedStatus === 'GENERATED' ||
      normalizedStatus.includes('EXPORTED')
    );
  }
}

