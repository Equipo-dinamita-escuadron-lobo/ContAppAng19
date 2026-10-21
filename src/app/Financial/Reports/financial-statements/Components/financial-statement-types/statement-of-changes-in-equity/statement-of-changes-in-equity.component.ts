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
import { FinancialStatementsService } from '../../../Services/financial-statements.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { ColumnDefinition } from '../../report-preview/report-preview.component';

interface EquityChangesComparativeRow {
  lineDescription: string;
  currentAmount: number | null;
  currentPercentage: number | null;
  previousAmount: number | null;
  previousPercentage: number | null;
  variation: number | null;
  variationPercentage: number | null;
  rowType: string;
  nature: string;
}

@Component({
  selector: 'app-statement-of-changes-in-equity',
  imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, TableModule],
  providers: [DatePipe, DialogService],
  templateUrl: './statement-of-changes-in-equity.component.html',
  styleUrl: './statement-of-changes-in-equity.component.css',
})
export class StatementOfChangesInEquityComponent extends BaseFinancialStatementComponent {
  override request: GenerateFinancialStatementRequest = {
    entId: '',
    type: FinancialStatementType.STATEMENT_CHANGES_EQUITY,
    criteria: this.criteria,
  };

  override dataTable: EquityChangesComparativeRow[] = [];

  override tableColumns: FinancialStatementTableColumn[] = [
    { header: 'Cuenta', field: 'lineDescription' },
    {
      header: 'Periodo Actual - Valor',
      field: 'currentAmount',
      type: 'number',
    },
    {
      header: 'Periodo Actual - Porcentaje',
      field: 'currentPercentage',
      type: 'percentage',
    },
    {
      header: 'Periodo Anterior - Valor',
      field: 'previousAmount',
      type: 'number',
    },
    {
      header: 'Periodo Anterior - Porcentaje',
      field: 'previousPercentage',
      type: 'percentage',
    },
    { header: 'Variacion - Valor', field: 'variation', type: 'number' },
    {
      header: 'Variacion - Porcentaje',
      field: 'variationPercentage',
      type: 'percentage',
    },
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
          {
            header: 'Porcentaje',
            field: 'currentPercentage',
            type: 'percentage',
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
            field: 'previousPercentage',
            type: 'percentage',
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
            field: 'variationPercentage',
            type: 'percentage',
          },
        ],
      },
    ],
    [
      { header: 'Valor', field: 'currentAmount', type: 'number' },
      { header: 'Porcentaje', field: 'currentPercentage', type: 'percentage' },
      { header: 'Valor', field: 'previousAmount', type: 'number' },
      { header: 'Porcentaje', field: 'previousPercentage', type: 'percentage' },
      { header: 'Valor', field: 'variation', type: 'number' },
      {
        header: 'Porcentaje',
        field: 'variationPercentage',
        type: 'percentage',
      },
    ],
  ];

  constructor(
    financialStatementsService: FinancialStatementsService,
    enterpriseService: EnterpriseService,
    accountService: ChartAccountService,
    messageService: MessageService,
    dialogService: DialogService,
    private readonly datePipe: DatePipe
  ) {
    super(
      financialStatementsService,
      enterpriseService,
      accountService,
      messageService,
      dialogService
    );
  }

  protected loadConfig(): void {
    this.financialStatementInfo = {
      name: 'Estado de Cambios en el Patrimonio',
      type: FinancialStatementType.STATEMENT_CHANGES_EQUITY,
      description:
        'Presenta cambios del patrimonio en formato comparativo entre fecha de corte actual y anterior.',
      icon: 'swap_horiz',
      usesCutoffDate: true,
      requiresLevelSelection: false,
      requiresPreviousCutoffDate: true,
    };

    const today = new Date();
    this.criteria.endDate = today;
    this.criteria.startDate = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );

    this.configureComparativeColumns(
      this.parseDate(this.criteria.endDate),
      this.parseDate(this.criteria.startDate)
    );
  }

  onCurrentCutoffDateChange(): void {
    this.configureComparativeColumns(
      this.parseDate(this.criteria.endDate),
      this.parseDate(this.criteria.startDate)
    );
  }

  onPreviousCutoffDateChange(): void {
    this.configureComparativeColumns(
      this.parseDate(this.criteria.endDate),
      this.parseDate(this.criteria.startDate)
    );
  }

  protected organizeRequest(): void {
    const currentCutoffDate = this.parseDate(this.criteria.endDate);
    const previousCutoffDate = this.parseDate(this.criteria.startDate);
    const enterpriseId = this.resolveEnterpriseId();

    this.configureComparativeColumns(currentCutoffDate, previousCutoffDate);

    this.request = {
      entId: enterpriseId ?? '',
      criteria: {
        ...this.criteria,
        startDate: previousCutoffDate
          ? this.datePipe.transform(previousCutoffDate, 'yyyy-MM-dd')
          : null,
        endDate: currentCutoffDate
          ? this.datePipe.transform(currentCutoffDate, 'yyyy-MM-dd')
          : null,
        previousCutoffDate: previousCutoffDate
          ? this.datePipe.transform(previousCutoffDate, 'yyyy-MM-dd')
          : null,
        currentCutoffDate: currentCutoffDate
          ? this.datePipe.transform(currentCutoffDate, 'yyyy-MM-dd')
          : null,
      },
      type: FinancialStatementType.STATEMENT_CHANGES_EQUITY,
    };
  }

  override normalizeDataTable(dataTable: any[]): EquityChangesComparativeRow[] {
    return (dataTable || [])
      .map((row) => this.normalizeRow(row))
      .filter(
        (row) =>
          !!row.lineDescription ||
          row.currentAmount !== null ||
          row.currentPercentage !== null ||
          row.previousAmount !== null ||
          row.previousPercentage !== null ||
          row.variation !== null ||
          row.variationPercentage !== null
      );
  }

  getRowClass(row: EquityChangesComparativeRow): string {
    const rowType = String(row.rowType || '').toUpperCase();
    if (rowType.includes('TOTAL')) {
      return 'esf-total-row';
    }
    if (rowType.includes('SECTION') || rowType.includes('SUBSECTION')) {
      return 'esf-section-row';
    }
    return '';
  }

  formatPercentage(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    return `${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}%`;
  }

  private configureComparativeColumns(
    currentCutoffDate: Date | null,
    previousCutoffDate: Date | null
  ): void {
    const currentLabel = currentCutoffDate
      ? `Periodo Actual (${this.formatDisplayDate(currentCutoffDate)})`
      : 'Periodo Actual';
    const previousLabel = previousCutoffDate
      ? `Periodo Anterior (${this.formatDisplayDate(previousCutoffDate)})`
      : 'Periodo Anterior';

    this.tableColumns = [
      { header: 'Cuenta', field: 'lineDescription' },
      { header: `${currentLabel} - Valor`, field: 'currentAmount', type: 'number' },
      {
        header: `${currentLabel} - Porcentaje`,
        field: 'currentPercentage',
        type: 'percentage',
      },
      { header: `${previousLabel} - Valor`, field: 'previousAmount', type: 'number' },
      {
        header: `${previousLabel} - Porcentaje`,
        field: 'previousPercentage',
        type: 'percentage',
      },
      { header: 'Variacion - Valor', field: 'variation', type: 'number' },
      {
        header: 'Variacion - Porcentaje',
        field: 'variationPercentage',
        type: 'percentage',
      },
    ];
  }

  private normalizeRow(row: any): EquityChangesComparativeRow {
    const lineDescription = String(
      this.getFirstDefinedValue(row, [
        'lineDescription',
        'changeDescription',
        'classDescription',
        'account.accountDescription',
        'description',
      ]) ?? ''
    ).trim();

    const nature = String(
      this.getFirstDefinedValue(row, ['account.nature', 'nature']) ?? 'CREDITO'
    )
      .trim()
      .toUpperCase();

    const currentAmount = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'currentAmount',
        'finalBalance',
        'periodAmount',
        'amount',
        'value',
      ])
    );
    const previousAmount = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'previousAmount',
        'initialBalance',
        'valuePrevious',
      ])
    );
    const currentPercentage = this.parseAmount(
      this.getFirstDefinedValue(row, ['currentPercentage', 'currentPercent'])
    );
    const previousPercentage = this.parseAmount(
      this.getFirstDefinedValue(row, ['previousPercentage', 'previousPercent'])
    );

    const variation =
      this.parseAmount(this.getFirstDefinedValue(row, ['variation'])) ??
      (currentAmount !== null && previousAmount !== null
        ? currentAmount - previousAmount
        : null);

    const variationPercentage =
      this.parseAmount(
        this.getFirstDefinedValue(row, ['variationPercentage', 'variationPercent'])
      ) ??
      (currentPercentage !== null && previousPercentage !== null
        ? currentPercentage - previousPercentage
        : null);

    const rowType = String(
      this.getFirstDefinedValue(row, ['rowType', 'lineType', 'type']) ?? ''
    ).trim();

    return {
      lineDescription,
      currentAmount,
      currentPercentage,
      previousAmount,
      previousPercentage,
      variation,
      variationPercentage,
      rowType,
      nature,
    };
  }

  private parseDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDisplayDate(value: Date): string {
    return this.datePipe.transform(value, 'dd/MM/yyyy') || '';
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
