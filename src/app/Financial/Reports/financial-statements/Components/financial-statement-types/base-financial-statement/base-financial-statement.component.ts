import { Directive, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Account } from '../../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Criteria } from '../../../Models/Criteria';
import { GenerateFinancialStatementRequest } from '../../../Models/Requests/GenerateFinancialStatementRequest';
import { FinancialStatementType } from '../../../Models/eFinancialStatementType';
import { FinancialStatementGenerationResultResponse } from '../../../Models/Responses/FinancialStatementGenerationResultResponse';
import { FinancialStatementMetadataResponse } from '../../../Models/Responses/FinancialStatementMetadataResponse';
import { FinancialStatementRowResponse } from '../../../Models/Responses/FinancialStatementRowResponse';
import { FinancialStatementsService } from '../../../Services/financial-statements.service';
import { ExportFinancialStatementComponent } from '../../export-financial-statement/export-financial-statement.component';
import { ColumnDefinition } from '../../report-preview/report-preview.component';
import { extractApiErrorMessage } from '../../../Utils/financial-statements.utils';

export interface FinancialStatementInfo {
  name: string;
  type: FinancialStatementType;
  description: string;
  icon: string;
  usesCutoffDate?: boolean;
  requiresLevelSelection?: boolean;
  requiresPreviousCutoffDate?: boolean;
}

export interface FinancialStatementTableColumn {
  header: string;
  field: string;
  type?: 'number' | 'percentage' | 'text';
  natureField?: string;
}

@Directive()
export abstract class BaseFinancialStatementComponent implements OnInit {
  financialStatementInfo!: FinancialStatementInfo;
  financialStatementGenerated: FinancialStatementMetadataResponse | null = null;

  datePeriod: Date[] = [];

  levels: { label: string; value: string }[] = [];
  protected accountCatalogByCode = new Map<string, Account>();
  protected accountOrderByCode = new Map<string, number>();

  enterpriseData: Record<string, unknown> | null = null;

  criteria: Criteria = {
    criteriaType: '',
    criteriaRange: null,
    startDate: null,
    endDate: null,
  };

  errors: string[] = [];

  isReportGenerated = false;
  isGeneratingReport = false;

  request: GenerateFinancialStatementRequest | null = null;
  dataTable: unknown[] = [];
  protected rawReportData: FinancialStatementRowResponse[] = [];
  protected lastReportResponse: FinancialStatementGenerationResultResponse | null =
    null;

  tableColumns: FinancialStatementTableColumn[] = [];
  headerConfig: ColumnDefinition[][] = [];

  totalDebit: number | null = null;
  totalCredit: number | null = null;

  refDialog: DynamicDialogRef | undefined;

  constructor(
    protected readonly financialStatementsService: FinancialStatementsService,
    protected readonly enterpriseService: EnterpriseService,
    protected readonly accountService: ChartAccountService,
    protected readonly messageService: MessageService,
    protected readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.enterpriseData =
      (this.enterpriseService.getSelectedEnterprise() as unknown as
        | Record<string, unknown>
        | null) ??
      null;
    this.preloadAccountCatalog();
  }

  protected abstract loadConfig(): void;

  protected abstract organizeRequest(): void;

  protected initializeLevelFilter(): void {
    this.levels = [
      { label: 'Clase', value: 'NUMBER_CLASS' },
      { label: 'Grupo', value: 'GROUP' },
      { label: 'Cuenta', value: 'ACCOUNT' },
      { label: 'SubCuenta', value: 'SUB_ACCOUNT' },
      { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
    ];
    this.criteria.criteriaType = '';
    this.criteria.criteriaRange = null;
  }

  onLevelChange(): void {
    this.criteria.criteriaRange = null;
    this.refreshRenderedReport();
  }

  protected getLevelCodeLength(level: string | null | undefined): number | null {
    const map: Record<string, number> = {
      NUMBER_CLASS: 1,
      GROUP: 2,
      ACCOUNT: 4,
      SUB_ACCOUNT: 6,
      AUXILIARY_ACCOUNT: 8,
    };

    return map[String(level || '').trim().toUpperCase()] ?? null;
  }

  protected getSelectedLevelCodeLength(): number | null {
    return this.getLevelCodeLength(this.criteria.criteriaType);
  }

  protected normalizeAccountCode(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const rawValue = String(value).trim();
    if (!rawValue) {
      return null;
    }

    const digitsOnly = rawValue.replace(/\D/g, '');
    return digitsOnly || rawValue;
  }

  protected isStructuralRow(
    rowType?: string | null,
    accountCode?: string | null
  ): boolean {
    if (!accountCode) {
      return true;
    }

    const normalizedType = String(rowType || '').trim().toUpperCase();
    return (
      normalizedType.includes('SECTION') ||
      normalizedType.includes('HEADER') ||
      normalizedType.includes('TOTAL') ||
      normalizedType.includes('SUBSECTION')
    );
  }

  protected sumNullableValues(
    ...values: Array<number | null | undefined>
  ): number | null {
    const numericValues = values.filter(
      (value): value is number => typeof value === 'number' && !Number.isNaN(value)
    );

    if (numericValues.length === 0) {
      return null;
    }

    return numericValues.reduce((sum, value) => sum + value, 0);
  }

  protected resolveAccountDescription(
    code: string,
    fallbackDescription?: string | null
  ): string {
    const normalizedCode = this.normalizeAccountCode(code);
    if (!normalizedCode) {
      return String(fallbackDescription || '').trim();
    }

    const account = this.accountCatalogByCode.get(normalizedCode);
    if (account?.description) {
      return account.description;
    }

    return String(fallbackDescription || '').trim();
  }

  protected resolveAccountOrder(
    code: string,
    fallbackOrder = Number.MAX_SAFE_INTEGER
  ): number {
    const normalizedCode = this.normalizeAccountCode(code);
    if (!normalizedCode) {
      return fallbackOrder;
    }

    return this.accountOrderByCode.get(normalizedCode) ?? fallbackOrder;
  }

  protected calculateTotals(): void {}

  protected normalizeDataTable(
    dataTable: FinancialStatementRowResponse[],
    _rawResponse?: FinancialStatementGenerationResultResponse | null
  ): unknown[] {
    return dataTable;
  }

  protected afterReportLoaded(
    _rawResponse: FinancialStatementGenerationResultResponse
  ): void {}

  protected generateReport(): void {
    if (!this.validateCriteria()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en el formulario',
        detail: this.errors.join(' '),
      });
      return;
    }

    this.organizeRequest();
    if (!this.hasValidRequestContext()) {
      return;
    }

    this.resetGeneratedReport();
    this.isGeneratingReport = true;

    this.financialStatementsService
      .registerFinancialStatement(this.request as GenerateFinancialStatementRequest)
      .subscribe({
        next: (response) => {
          this.isGeneratingReport = false;
          this.lastReportResponse = response;
          this.financialStatementGenerated = response.financialStatement ?? null;
          this.rawReportData = Array.isArray(response.financialStatementData)
            ? [...response.financialStatementData]
            : [];
          this.dataTable = this.normalizeDataTable(this.rawReportData, response);
          this.calculateTotals();
          this.afterReportLoaded(response);
          this.isReportGenerated = true;

          if (this.dataTable.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail:
                'La consulta no arrojo resultados con los criterios seleccionados.',
            });
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: 'El reporte fue generado correctamente.',
          });
        },
        error: (error) => {
          this.isGeneratingReport = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: extractApiErrorMessage(
              error,
              'Error al generar el reporte. Intente mas tarde'
            ),
          });
        },
      });
  }

  protected refreshRenderedReport(): void {
    if (!this.isReportGenerated || this.rawReportData.length === 0) {
      return;
    }

    this.dataTable = this.normalizeDataTable(
      this.rawReportData,
      this.lastReportResponse
    );
    this.calculateTotals();
  }

  protected resolveEnterpriseId(): string | null {
    const selectedEnterprise =
      (this.enterpriseService.getSelectedEnterprise() as unknown as
        | Record<string, unknown>
        | null) ??
      null;
    const enterpriseId = selectedEnterprise?.['id'] ?? this.enterpriseData?.['id'];

    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Debe seleccionar una empresa antes de generar el reporte.',
      });
      return null;
    }

    this.enterpriseData = selectedEnterprise ?? this.enterpriseData;
    return String(enterpriseId);
  }

  showExportDialog(): void {
    this.refDialog = this.dialogService.open(ExportFinancialStatementComponent, {
      data: {
        reportTitle: this.financialStatementInfo.name,
        statementType: this.financialStatementInfo.type,
        financialStatement: this.buildFinancialStatementForExport(),
        dataTable: this.dataTable,
        headerConfig: this.headerConfig,
        enterpriseData: this.enterpriseData,
        generationDate: this.resolveGenerationDate(),
        totals: {
          totalDebit: this.totalDebit,
          totalCredit: this.totalCredit,
          totalAssets: this.lastReportResponse?.totalAssets ?? null,
          totalLiabilities: this.lastReportResponse?.totalLiabilities ?? null,
          totalEquity: this.lastReportResponse?.totalEquity ?? null,
        },
      },
    });
  }

  getNestedValue(obj: unknown, path: string): unknown {
    if (!path || !obj || typeof obj !== 'object') {
      return '';
    }

    return path
      .split('.')
      .reduce<unknown>((accumulator, key) => {
        if (
          accumulator &&
          typeof accumulator === 'object' &&
          key in accumulator
        ) {
          return (accumulator as Record<string, unknown>)[key];
        }

        return '';
      }, obj);
  }

  getNestedNumberValue(obj: unknown, path: string): number | null {
    const value = this.getNestedValue(obj, path);
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
  }

  getNestedTextValue(obj: unknown, path: string): string {
    const value = this.getNestedValue(obj, path);
    return value === null || value === undefined ? '' : String(value);
  }

  formatMoneyAligned(value: number | null | undefined, nature?: string): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const parts = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(Math.abs(value));

    const integer = parts
      .filter((part) => part.type === 'integer' || part.type === 'group')
      .map((part) => part.value)
      .join('');

    const decimal = parts.find((part) => part.type === 'decimal')?.value ?? ',';
    const fraction =
      parts.find((part) => part.type === 'fraction')?.value ?? '00';

    const symbol = '$';
    const isNegative = value < 0;
    const sign = isNegative ? '-' : '';

    let cssClasses = '';

    if (nature) {
      const normalizedNature = nature.trim().toUpperCase();
      const isRed =
        (normalizedNature === 'DEBITO' && value < 0) ||
        (normalizedNature === 'CREDITO' && value > 0);

      if (isRed) {
        cssClasses = 'text-red-600 font-bold';
      }
    } else if (isNegative) {
      cssClasses = 'negative';
    }

    return `
      <span class="money font-mono ${cssClasses}">
        <span class="symbol">${symbol}</span>
        <span class="integer">${sign}${integer}</span>
        <span class="decimal">${decimal}${fraction}</span>
      </span>
    `;
  }

  formatMoneyCompact(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const sign = value < 0 ? '-$ ' : '$ ';
    const absoluteValue = Math.abs(value);
    const formattedValue = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absoluteValue);

    return `${sign}${formattedValue}`;
  }

  private preloadAccountCatalog(): void {
    const selectedEnterprise =
      (this.enterpriseService.getSelectedEnterprise() as unknown as
        | Record<string, unknown>
        | null) ?? this.enterpriseData;
    const enterpriseId = selectedEnterprise?.['id']
      ? String(selectedEnterprise['id'])
      : null;

    if (!enterpriseId) {
      return;
    }

    this.accountService.getListAccounts(enterpriseId).subscribe({
      next: (accounts) => {
        this.accountCatalogByCode.clear();
        this.accountOrderByCode.clear();

        let order = 0;
        const visit = (items: Account[]) => {
          for (const item of items || []) {
            const normalizedCode = this.normalizeAccountCode(item.code);
            if (normalizedCode) {
              this.accountCatalogByCode.set(normalizedCode, item);
              this.accountOrderByCode.set(normalizedCode, order++);
            }

            if (item.children?.length) {
              visit(item.children);
            }
          }
        };

        visit(accounts);
      },
      error: () => {
        this.accountCatalogByCode.clear();
        this.accountOrderByCode.clear();
      },
    });
  }

  private resetGeneratedReport(): void {
    this.isReportGenerated = false;
    this.financialStatementGenerated = null;
    this.rawReportData = [];
    this.lastReportResponse = null;
    this.dataTable = [];
    this.totalDebit = null;
    this.totalCredit = null;
  }

  private hasValidRequestContext(): boolean {
    const enterpriseId = String(this.request?.entId ?? '').trim();

    if (!enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'No se pudo generar el reporte porque la empresa no esta definida.',
      });
      return false;
    }

    return true;
  }

  private validateCriteria(): boolean {
    this.errors = [];
    const requiresLevelSelection =
      this.financialStatementInfo?.requiresLevelSelection === true;

    if (requiresLevelSelection && !this.criteria.criteriaType) {
      this.errors.push('No ha seleccionado un nivel.');
    }

    if (this.financialStatementInfo?.usesCutoffDate) {
      if (!this.isDateValid(this.criteria.endDate)) {
        this.errors.push('No ha seleccionado una fecha de corte.');
      }

      if (
        this.financialStatementInfo?.requiresPreviousCutoffDate &&
        !this.isDateValid(this.criteria.startDate)
      ) {
        this.errors.push('No ha seleccionado la fecha de corte anterior.');
      }

      if (
        this.financialStatementInfo?.requiresPreviousCutoffDate &&
        this.isDateValid(this.criteria.startDate) &&
        this.isDateValid(this.criteria.endDate) &&
        !this.isPreviousCutoffBeforeCurrent(
          this.criteria.startDate,
          this.criteria.endDate
        )
      ) {
        this.errors.push(
          'La fecha de corte anterior debe ser menor a la fecha de corte actual.'
        );
      }
    } else if (this.datePeriod.length === 2) {
      if (!this.isDatePeriodValid()) {
        this.errors.push(
          'El rango de fechas no es valido. La fecha inicial debe ser anterior a la fecha final.'
        );
      }
    } else {
      this.errors.push(
        'Debe seleccionar 2 fechas (Inicial y Final) para el periodo.'
      );
    }

    return this.errors.length === 0;
  }

  private isDateValid(date: string | Date | null | undefined): boolean {
    return this.parseToDate(date) !== null;
  }

  private isPreviousCutoffBeforeCurrent(
    previousDate: string | Date | null | undefined,
    currentDate: string | Date | null | undefined
  ): boolean {
    const previous = this.parseToDate(previousDate);
    const current = this.parseToDate(currentDate);

    if (!previous || !current) {
      return false;
    }

    return previous.getTime() < current.getTime();
  }

  private parseToDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isDatePeriodValid(): boolean {
    if (this.datePeriod.length !== 2) {
      return false;
    }

    return this.datePeriod[0].getTime() <= this.datePeriod[1].getTime();
  }

  private buildFinancialStatementForExport(): Record<string, unknown> {
    const currentCriteria = {
      ...(this.financialStatementGenerated?.criteria ?? {}),
      ...(this.criteria ?? {}),
    };

    return {
      ...(this.financialStatementGenerated ?? {}),
      type: this.financialStatementGenerated?.type ?? this.financialStatementInfo.type,
      criteria: currentCriteria,
    };
  }

  private resolveGenerationDate(): Date {
    const rawDate = this.financialStatementGenerated?.createdAt;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
}
