import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import {
  BaseFinancialStatementComponent,
  FinancialStatementTableColumn,
} from '../base-financial-statement/base-financial-statement.component';
import { FinancialStatementType } from '../../../Models/eFinancialStatementType';
import { GenerateFinancialStatementRequest } from '../../../Models/Requests/GenerateFinancialStatementRequest';
import { FinancialPositionStatementResponse } from '../../../Models/Responses/FinancialPositionStatementResponse';
import { FinancialStatementsService } from '../../../Services/financial-statements.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { ColumnDefinition } from '../../report-preview/report-preview.component';

interface IncomeStatementComparativeRow extends FinancialPositionStatementResponse {
  currentPercentageLabel?: string;
  previousPercentageLabel?: string;
  variationPercentageLabel?: string;
}

@Component({
  selector: 'app-income-statement',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './income-statement.component.html',
  styleUrl: './income-statement.component.css',
})
export class IncomeStatementComponent extends BaseFinancialStatementComponent {
  currentPeriod: { startDate: Date | null; endDate: Date | null } = {
    startDate: null,
    endDate: null,
  };

  previousPeriod: { startDate: Date | null; endDate: Date | null } = {
    startDate: null,
    endDate: null,
  };

  isLoadingComparison = false;

  override request: GenerateFinancialStatementRequest = {
    entId: '',
    userId: 0,
    type: FinancialStatementType.INCOME_STATEMENT,
    criteria: this.criteria,
  };

  override dataTable: IncomeStatementComparativeRow[] = [];

  override tableColumns: FinancialStatementTableColumn[] = [
    { header: 'Cuenta', field: 'lineDescription' },
    {
      header: 'Periodo Actual - Valor',
      field: 'currentAmount',
      type: 'number',
    },
    { header: 'Periodo Actual - Porcentaje', field: 'currentPercentageLabel' },
    {
      header: 'Periodo Anterior - Valor',
      field: 'previousAmount',
      type: 'number',
    },
    { header: 'Periodo Anterior - Porcentaje', field: 'previousPercentageLabel' },
    { header: 'Variacion - Valor', field: 'variation', type: 'number' },
    { header: 'Variacion - Porcentaje', field: 'variationPercentageLabel' },
  ];

  override headerConfig: ColumnDefinition[][] = [
    [
      {
        header: 'Cuenta',
        field: 'lineDescription',
        rowspan: 2,
      },
      {
        header: 'Periodo Actual',
        colspan: 2,
        children: [
          { header: 'Valor', field: 'currentAmount', type: 'number' },
          { header: 'Porcentaje', field: 'currentPercentageLabel' },
        ],
      },
      {
        header: 'Periodo Anterior',
        colspan: 2,
        children: [
          { header: 'Valor', field: 'previousAmount', type: 'number' },
          { header: 'Porcentaje', field: 'previousPercentageLabel' },
        ],
      },
      {
        header: 'Variacion',
        colspan: 2,
        children: [
          { header: 'Valor', field: 'variation', type: 'number' },
          { header: 'Porcentaje', field: 'variationPercentageLabel' },
        ],
      },
    ],
    [
      { header: 'Valor', field: 'currentAmount', type: 'number' },
      { header: 'Porcentaje', field: 'currentPercentageLabel' },
      { header: 'Valor', field: 'previousAmount', type: 'number' },
      { header: 'Porcentaje', field: 'previousPercentageLabel' },
      { header: 'Valor', field: 'variation', type: 'number' },
      { header: 'Porcentaje', field: 'variationPercentageLabel' },
    ],
  ];

  constructor(
    financialStatementsService: FinancialStatementsService,
    authService: AuthService,
    enterpriseService: EnterpriseService,
    thirdService: ThirdService,
    accountService: ChartAccountService,
    messageService: MessageService,
    dialogService: DialogService,
    private readonly datePipe: DatePipe
  ) {
    super(
      financialStatementsService,
      authService,
      enterpriseService,
      thirdService,
      accountService,
      messageService,
      dialogService
    );
  }

  protected loadConfig(): void {
    this.financialStatementInfo = {
      name: 'Estado de Resultados',
      type: FinancialStatementType.INCOME_STATEMENT,
      description:
        'Compara ingresos, costos y gastos entre un periodo actual y un periodo anterior.',
      icon: 'monitoring',
      usesCutoffDate: false,
      requiresLevelSelection: false,
    };
    this.criteria.criteriaType = '';
    this.isLevelSelected = true;

    this.initializeDefaultPeriods();
    this.configureComparativeColumns(
      this.currentPeriod.startDate,
      this.currentPeriod.endDate,
      this.previousPeriod.startDate,
      this.previousPeriod.endDate
    );
  }

  public override generateReport(): void {
    this.syncCurrentPeriodWithDateRange();

    if (!this.validateComparativePeriods()) {
      return;
    }

    super.generateReport();
  }

  syncCurrentPeriodWithDateRange(): void {
    if (!this.currentPeriod.startDate || !this.currentPeriod.endDate) {
      this.datePeriod = [];
      return;
    }

    this.datePeriod = [this.currentPeriod.startDate, this.currentPeriod.endDate];
    this.configureComparativeColumns(
      this.currentPeriod.startDate,
      this.currentPeriod.endDate,
      this.previousPeriod.startDate,
      this.previousPeriod.endDate
    );
  }

  onPreviousPeriodChange(): void {
    this.configureComparativeColumns(
      this.currentPeriod.startDate,
      this.currentPeriod.endDate,
      this.previousPeriod.startDate,
      this.previousPeriod.endDate
    );
  }

  isPercentageColumn(field?: string): boolean {
    return (
      field === 'currentPercentageLabel' ||
      field === 'previousPercentageLabel' ||
      field === 'variationPercentageLabel'
    );
  }

  protected organizeRequest(): void {
    const currentStartDate = this.formatDate(this.currentPeriod.startDate);
    const currentEndDate = this.formatDate(this.currentPeriod.endDate);
    const previousStartDate = this.formatDate(this.previousPeriod.startDate);
    const previousEndDate = this.formatDate(this.previousPeriod.endDate);

    this.criteria.startDate = currentStartDate;
    this.criteria.endDate = currentEndDate;
    this.criteria.previousStartDate = previousStartDate;
    this.criteria.previousEndDate = previousEndDate;

    this.request = this.buildRequest(
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate
    );
  }

  override normalizeDataTable(dataTable: any[]): IncomeStatementComparativeRow[] {
    return (dataTable || [])
      .map((row) => this.normalizeIncomeRow(row))
      .filter(
        (row) =>
          !!row.lineDescription ||
          row.currentAmount !== null ||
          row.previousAmount !== null ||
          row.variation !== null
      );
  }

  override afterReportLoaded(_rawResponse: any): void {}

  override calculateTotals(): void {
    this.totalDebit = null;
    this.totalCredit = null;
  }

  private initializeDefaultPeriods(): void {
    const today = new Date();
    const currentStartDate = new Date(today.getFullYear(), 0, 1);
    const currentEndDate = new Date(today);

    this.currentPeriod = {
      startDate: currentStartDate,
      endDate: currentEndDate,
    };

    this.previousPeriod = { startDate: null, endDate: null };

    this.syncCurrentPeriodWithDateRange();
  }

  private validateComparativePeriods(): boolean {
    const errors: string[] = [];

    if (!this.currentPeriod.startDate || !this.currentPeriod.endDate) {
      errors.push('Debe seleccionar fecha inicial y final del periodo actual.');
    } else if (
      this.currentPeriod.startDate.getTime() >
      this.currentPeriod.endDate.getTime()
    ) {
      errors.push(
        'El periodo actual no es valido. La fecha inicial debe ser menor a la final.'
      );
    }

    if (!this.previousPeriod.startDate || !this.previousPeriod.endDate) {
      errors.push('Debe seleccionar fecha inicial y final del periodo anterior.');
    } else if (
      this.previousPeriod.startDate.getTime() >
      this.previousPeriod.endDate.getTime()
    ) {
      errors.push(
        'El periodo anterior no es valido. La fecha inicial debe ser menor a la final.'
      );
    }

    if (errors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en los criterios',
        detail: errors.join(' '),
      });
      return false;
    }

    return true;
  }

  private buildRequest(
    startDate: string | null,
    endDate: string | null,
    previousStartDate: string | null,
    previousEndDate: string | null
  ): GenerateFinancialStatementRequest {
    const enterpriseId = this.resolveEnterpriseId();
    const userId = this.resolveCurrentUserId();

    return {
      entId: enterpriseId ?? '',
      criteria: {
        ...this.criteria,
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
      },
      type: FinancialStatementType.INCOME_STATEMENT,
      userId: userId ?? 0,
    };
  }

  private formatDate(value: Date | null): string | null {
    if (!value) {
      return null;
    }

    return this.datePipe.transform(value, 'yyyy-MM-dd');
  }

  private formatPercentage(value: number | null): string {
    if (value === null) {
      return '-';
    }

    return `${value.toFixed(2)}%`;
  }

  private parseAmount(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const parsed = Number(String(value).replaceAll(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeIncomeRow(row: any): IncomeStatementComparativeRow {
    const debit = this.parseAmount(this.getFirstDefinedValue(row, ['debit', 'debitMovement'])) ?? 0;
    const credit = this.parseAmount(this.getFirstDefinedValue(row, ['credit', 'creditMovement'])) ?? 0;
    const nature = String(
      this.getFirstDefinedValue(row, ['account.nature', 'nature']) ?? 'CREDITO'
    )
      .trim()
      .toUpperCase();

    const fallbackCurrentAmount =
      nature === 'DEBITO' || nature === 'DEBIT' ? debit - credit : credit - debit;

    const currentAmount =
      this.parseAmount(
        this.getFirstDefinedValue(row, [
          'currentAmount',
          'amountCurrent',
          'valueCurrent',
        ])
      ) ?? fallbackCurrentAmount;
    const previousAmount = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'previousAmount',
        'amountPrevious',
        'valuePrevious',
      ])
    );
    const currentPercentage = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'currentPercentage',
        'currentPercent',
        'percentageCurrent',
      ])
    );
    const previousPercentage = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'previousPercentage',
        'previousPercent',
        'percentagePrevious',
      ])
    );
    const variation =
      this.parseAmount(this.getFirstDefinedValue(row, ['variation', 'variance'])) ??
      (currentAmount !== null && previousAmount !== null
        ? currentAmount - previousAmount
        : null);
    const variationPercentage =
      this.parseAmount(
        this.getFirstDefinedValue(row, [
          'variationPercentage',
          'variancePercentage',
          'percentageVariation',
        ])
      ) ??
      (currentPercentage !== null && previousPercentage !== null
        ? currentPercentage - previousPercentage
        : null);

    return {
      lineDescription: String(
        this.getFirstDefinedValue(row, [
          'lineDescription',
          'accountDescription',
          'account.accountDescription',
          'description',
        ]) ?? ''
      ).trim(),
      note: this.getFirstDefinedValue(row, ['note']),
      rowType: String(this.getFirstDefinedValue(row, ['rowType']) ?? '').trim(),
      currentAmount,
      currentPercentage,
      previousAmount,
      previousPercentage,
      variation,
      variationPercentage,
      currentPercentageLabel: this.formatPercentage(currentPercentage),
      previousPercentageLabel: this.formatPercentage(previousPercentage),
      variationPercentageLabel: this.formatPercentage(variationPercentage),
    };
  }

  getRowClass(row: IncomeStatementComparativeRow): string {
    const rowType = String(row.rowType || '').toUpperCase();
    if (rowType.includes('TOTAL')) {
      return 'esf-total-row';
    }
    if (rowType.includes('SECTION') || rowType.includes('SUBSECTION')) {
      return 'esf-section-row';
    }
    return '';
  }

  private configureComparativeColumns(
    currentStart: Date | null,
    currentEnd: Date | null,
    previousStart: Date | null,
    previousEnd: Date | null
  ): void {
    const currentLabel =
      currentStart && currentEnd
        ? `Periodo Actual (${this.formatDisplayDate(currentStart)} - ${this.formatDisplayDate(currentEnd)})`
        : 'Periodo Actual';
    const previousLabel =
      previousStart && previousEnd
        ? `Periodo Anterior (${this.formatDisplayDate(previousStart)} - ${this.formatDisplayDate(previousEnd)})`
        : 'Periodo Anterior';

    this.tableColumns = [
      { header: 'Cuenta', field: 'lineDescription' },
      { header: `${currentLabel} - Valor`, field: 'currentAmount', type: 'number' },
      { header: `${currentLabel} - Porcentaje`, field: 'currentPercentageLabel' },
      { header: `${previousLabel} - Valor`, field: 'previousAmount', type: 'number' },
      { header: `${previousLabel} - Porcentaje`, field: 'previousPercentageLabel' },
      { header: 'Variacion - Valor', field: 'variation', type: 'number' },
      { header: 'Variacion - Porcentaje', field: 'variationPercentageLabel' },
    ];

    this.headerConfig = [
      [
        { header: 'Cuenta', field: 'lineDescription', rowspan: 2 },
        {
          header: 'Periodo Actual',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'currentAmount', type: 'number' },
            { header: 'Porcentaje', field: 'currentPercentageLabel' },
          ],
        },
        {
          header: 'Periodo Anterior',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'previousAmount', type: 'number' },
            { header: 'Porcentaje', field: 'previousPercentageLabel' },
          ],
        },
        {
          header: 'Variacion',
          colspan: 2,
          children: [
            { header: 'Valor', field: 'variation', type: 'number' },
            { header: 'Porcentaje', field: 'variationPercentageLabel' },
          ],
        },
      ],
      [
        { header: 'Valor', field: 'currentAmount', type: 'number' },
        { header: 'Porcentaje', field: 'currentPercentageLabel' },
        { header: 'Valor', field: 'previousAmount', type: 'number' },
        { header: 'Porcentaje', field: 'previousPercentageLabel' },
        { header: 'Valor', field: 'variation', type: 'number' },
        { header: 'Porcentaje', field: 'variationPercentageLabel' },
      ],
    ];
  }

  private formatDisplayDate(value: Date): string {
    return this.datePipe.transform(value, 'dd/MM/yyyy') || '';
  }

  private getFirstDefinedValue(source: any, paths: string[]): any {
    for (const path of paths) {
      const value = path
        .split('.')
        .reduce(
          (acc, key) =>
            acc !== null && acc !== undefined && acc[key] !== undefined
              ? acc[key]
              : undefined,
          source
        );

      if (value !== undefined && value !== null) {
        return value;
      }
    }

    return null;
  }
}
