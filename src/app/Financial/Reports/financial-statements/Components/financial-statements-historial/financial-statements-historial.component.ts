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
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { FinancialStatementsService } from '../../Services/financial-statements.service';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuthService } from '../../../../../Core/auth/services/auth.service';
import { ExportFinancialStatementComponent } from '../export-financial-statement/export-financial-statement.component';
import { ColumnDefinition } from '../report-preview/report-preview.component';
import { Criteria } from '../../Models/Criteria';
import { FinancialStatementHistoryItemResponse } from '../../Models/Responses/FinancialStatementHistoryItemResponse';
import { FinancialStatementRecordResponse } from '../../Models/Responses/FinancialStatementRecordResponse';
import { FinancialStatementMetadataResponse } from '../../Models/Responses/FinancialStatementMetadataResponse';
import { FinancialStatementRowResponse } from '../../Models/Responses/FinancialStatementRowResponse';
import {
  extractApiErrorMessage,
  formatFinancialStatementType,
  getFinancialStatementStatusLabel,
  getFinancialStatementStatusSeverity,
  isFinancialStatementCompleted,
  resolveFinancialStatementMetadata,
  resolveFinancialStatementRows,
} from '../../Utils/financial-statements.utils';

interface FinancialStatementHistoryViewModel {
  reportId: string;
  type: string;
  entId: string;
  user: string;
  criteria: Criteria | null;
  bookName: string;
  reportPeriodLabel: string;
  generationDate: Date | null;
  reportCreatedAt: Date | null;
  deliveryWay: string;
  downloadUrl?: string | null;
  status: string;
}

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
    TooltipModule,
    RippleModule,
    DialogModule,
  ],
  providers: [MessageService, DialogService],
  templateUrl: './financial-statements-historial.component.html',
  styleUrl: './financial-statements-historial.component.css',
})
export class FinancialStatementsHistorialComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  refDialog: DynamicDialogRef | undefined;
  history: FinancialStatementHistoryViewModel[] = [];
  private loadedHistory: FinancialStatementHistoryViewModel[] = [];

  isLoading = false;
  isDownloading = false;

  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchValue = '';

  constructor(
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly enterpriseService: EnterpriseService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    protected readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.ensureEnterpriseAndLoadHistory();
  }

  loadHistory(event?: {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
  }): void {
    this.isLoading = true;

    if (event) {
      this.first = event.first ?? this.first;
      this.rows = event.rows ?? this.rows;
      this.sortField = event.sortField || this.sortField;
      this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      this.loadedHistory = [];
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
      .getHistoryByEnterprise(enterpriseId, pageable)
      .subscribe({
        next: (pageResult) => {
          this.loadedHistory = (pageResult.content || []).map((item) =>
            this.mapHistoryItem(item)
          );
          this.totalRecords = Number(pageResult.totalElements ?? 0);
          this.applyClientFilter();
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: extractApiErrorMessage(
              error,
              'No se pudo cargar el historial. Intente de nuevo.'
            ),
          });
          this.loadedHistory = [];
          this.history = [];
          this.totalRecords = 0;
          this.isLoading = false;
        },
      });
  }

  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.applyClientFilter();
  }

  onPageChange(event: {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
  }): void {
    this.loadHistory(event);
  }

  onSort(event: {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
  }): void {
    this.loadHistory(event);
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    return getFinancialStatementStatusSeverity(status);
  }

  getStatusLabel(status: string): string {
    return getFinancialStatementStatusLabel(status);
  }

  showDetails(item: FinancialStatementHistoryViewModel): void {
    this.router.navigate([
      '/financial/reports/financial-statements/historial/details',
      item.reportId,
    ]);
  }

  downloadReport(item: FinancialStatementHistoryViewModel): void {
    if (!isFinancialStatementCompleted(item.status)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atencion',
        detail:
          'El reporte aun no finaliza. Puedes revisar la vista previa y exportarlo manualmente.',
      });
    }

    if (!item.reportId || this.isDownloading) {
      return;
    }

    this.isDownloading = true;
    this.financialStatementsService.getFinancialStatementReport(item.reportId).subscribe({
      next: (reportResponse) => {
        this.isDownloading = false;
        this.openExportPreviewDialog(item, reportResponse);
      },
      error: (error) => {
        this.isDownloading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudo cargar el reporte para la vista previa.'
          ),
        });
      },
    });
  }

  isCompletedStatus(status: string): boolean {
    return isFinancialStatementCompleted(status);
  }

  private applyClientFilter(): void {
    const normalizedTerm = this.searchValue.trim().toLowerCase();

    if (!normalizedTerm) {
      this.history = [...this.loadedHistory];
      return;
    }

    this.history = this.loadedHistory.filter((item) =>
      [
        item.bookName,
        item.user,
        item.reportPeriodLabel,
        this.getStatusLabel(item.status),
      ].some((value) =>
        String(value || '').toLowerCase().includes(normalizedTerm)
      )
    );
  }

  private mapHistoryItem(
    item: FinancialStatementHistoryItemResponse
  ): FinancialStatementHistoryViewModel {
    const eventDate = item.eventAt ?? item.reportCreatedAt;

    return {
      reportId: item.reportId,
      type: item.type,
      entId: item.entId,
      user: this.resolveCurrentUserLabel(),
      criteria: item.criteria ?? null,
      bookName: formatFinancialStatementType(item.type),
      reportPeriodLabel: this.buildReportPeriodLabel(item.type, item.criteria),
      generationDate: eventDate ? new Date(eventDate) : null,
      reportCreatedAt: item.reportCreatedAt ? new Date(item.reportCreatedAt) : null,
      deliveryWay: item.deliveryWay,
      downloadUrl: item.downloadUrl,
      status: item.state,
    };
  }

  private buildReportPeriodLabel(
    statementType: string,
    criteria: Criteria | null
  ): string {
    const safeCriteria = criteria || {
      criteriaType: null,
      criteriaRange: null,
      startDate: null,
      endDate: null,
    };
    const levelLabel = this.resolveCriteriaLevelLabel(safeCriteria.criteriaType);

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
      return this.prependLevelLabel(
        levelLabel,
        `${currentPeriod} | ${previousPeriod}`
      );
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
      return this.prependLevelLabel(levelLabel, labels.join(' | '));
    }

    if (startDate && endDate) {
      return this.prependLevelLabel(levelLabel, `Periodo: ${startDate} - ${endDate}`);
    }

    if (endDate) {
      return this.prependLevelLabel(levelLabel, `Corte: ${endDate}`);
    }

    if (startDate) {
      return this.prependLevelLabel(levelLabel, `Desde: ${startDate}`);
    }

    return levelLabel ? `Nivel: ${levelLabel}` : 'Sin fechas de criterio';
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

  private resolveCriteriaDateLabel(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const parsedDate = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private resolveCriteriaLevelLabel(criteriaType: string | null | undefined): string | null {
    const map: Record<string, string> = {
      NUMBER_CLASS: 'Clase',
      GROUP: 'Grupo',
      ACCOUNT: 'Cuenta',
      SUB_ACCOUNT: 'SubCuenta',
      AUXILIARY_ACCOUNT: 'Auxiliar',
    };

    const normalizedType = String(criteriaType || '').trim().toUpperCase();
    return map[normalizedType] || null;
  }

  private prependLevelLabel(levelLabel: string | null, baseLabel: string): string {
    if (!levelLabel) {
      return baseLabel;
    }

    return `Nivel: ${levelLabel} | ${baseLabel}`;
  }

  private resolveCurrentUserLabel(): string {
    const currentUser = this.authService.returnUserInfo() as Record<string, unknown> | null;
    const fullName = `${currentUser?.['firstName'] ?? ''} ${
      currentUser?.['lastName'] ?? ''
    }`.trim();

    if (fullName) {
      return fullName;
    }

    const fallback =
      currentUser?.['username'] ??
      currentUser?.['userName'] ??
      currentUser?.['name'] ??
      currentUser?.['email'];

    return String(fallback || 'Usuario').trim();
  }

  private resolveEnterpriseId(): string | null {
    const selectedEnterprise =
      this.enterpriseService.getSelectedEnterprise() as unknown as
        | Record<string, unknown>
        | null;
    const selectedEnterpriseId = selectedEnterprise?.['id'];

    return selectedEnterpriseId ? String(selectedEnterpriseId) : null;
  }

  private ensureEnterpriseAndLoadHistory(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (enterpriseId) {
      this.loadHistory();
      return;
    }

    this.loadedHistory = [];
    this.history = [];
    this.totalRecords = 0;
    this.messageService.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Debe seleccionar una empresa para consultar historial.',
    });
  }

  private openExportPreviewDialog(
    item: FinancialStatementHistoryViewModel,
    reportResponse: FinancialStatementRecordResponse
  ): void {
    const enterprise = this.enterpriseService.getSelectedEnterprise();
    const financialStatement =
      resolveFinancialStatementMetadata(reportResponse) ?? {
        reportId: item.reportId,
        type: item.type,
        criteria: item.criteria,
        createdAt: item.reportCreatedAt?.toISOString() ?? null,
        entId: item.entId,
      };
    const financialStatementData = resolveFinancialStatementRows(reportResponse);
    const statementType = String(financialStatement?.type || item.type || '')
      .trim()
      .toUpperCase();

    this.refDialog = this.dialogService.open(ExportFinancialStatementComponent, {
      data: {
        reportTitle: formatFinancialStatementType(statementType),
        statementType,
        financialStatement,
        dataTable: financialStatementData,
        headerConfig: this.buildHistoryPreviewHeaderConfig(
          statementType,
          financialStatementData
        ),
        enterpriseData: enterprise,
        generationDate: this.resolvePreviewGenerationDate(financialStatement, item),
        totals:
          'totalAssets' in reportResponse
            ? {
                totalAssets: reportResponse.totalAssets ?? null,
                totalLiabilities: reportResponse.totalLiabilities ?? null,
                totalEquity: reportResponse.totalEquity ?? null,
              }
            : {},
      },
    });
  }

  private resolvePreviewGenerationDate(
    financialStatement:
      | FinancialStatementMetadataResponse
      | { createdAt?: string | Date | null },
    item: FinancialStatementHistoryViewModel
  ): Date {
    const rawValue =
      financialStatement['createdAt'] ??
      item.reportCreatedAt ??
      item.generationDate ??
      new Date();

    const parsedDate =
      rawValue instanceof Date ? rawValue : new Date(String(rawValue));
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  private buildHistoryPreviewHeaderConfig(
    _statementType: string,
    rows: FinancialStatementRowResponse[]
  ): ColumnDefinition[][] {
    return this.buildComparativeHeaderConfig(rows);
  }

  private buildComparativeHeaderConfig(
    rows: FinancialStatementRowResponse[]
  ): ColumnDefinition[][] {
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
    rows: FinancialStatementRowResponse[],
    numericField: string,
    labelField: string
  ): string {
    const hasLabelField = rows.some((row) => {
      const value = (row as Record<string, unknown>)?.[labelField];
      return value !== undefined && value !== null && value !== '';
    });

    return hasLabelField ? labelField : numericField;
  }
}
