import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButton } from 'primeng/radiobutton';
import { SplitButtonModule } from 'primeng/splitbutton';
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
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { ColumnDefinition } from '../../report-preview/report-preview.component';

@Component({
  selector: 'app-statement-financial-position',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    DatePickerModule,
    RadioButton,
    TableModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './statement-financial-position.component.html',
  styleUrl: './statement-financial-position.component.css',
})
export class StatementFinancialPositionComponent extends BaseFinancialStatementComponent {
  override request: GenerateFinancialStatementRequest = {
    entId: '',
    type: FinancialStatementType.STATEMENT_FINANCIAL_POSITION,
    criteria: this.criteria,
  };

  override dataTable: FinancialPositionStatementResponse[] = [];
  override tableColumns: FinancialStatementTableColumn[] = [];
  override headerConfig: ColumnDefinition[][] = [];

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
      name: 'Estado de Situacion Financiera',
      type: FinancialStatementType.STATEMENT_FINANCIAL_POSITION,
      description:
        'Presenta activos, pasivos y patrimonio en formato comparativo entre fecha de corte actual y anterior.',
      icon: 'account_balance_wallet',
      usesCutoffDate: true,
      requiresLevelSelection: true,
      requiresPreviousCutoffDate: true,
    };
    this.initializeLevelFilter();

    this.configureComparativeColumns(null, null);
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

    const requestCriteria = {
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
    };

    this.request = {
      entId: enterpriseId ?? '',
      criteria: requestCriteria,
      type: FinancialStatementType.STATEMENT_FINANCIAL_POSITION,
    };
  }

  override normalizeDataTable(
    dataTable: any[]
  ): FinancialPositionStatementResponse[] {
    const normalizedRows = dataTable
      .map((row) => this.normalizeRow(row))
      .filter(
        (row) =>
          !!row.lineDescription ||
          row.note !== null ||
          row.currentAmount !== null ||
          row.currentPercentage !== null ||
          row.previousAmount !== null ||
          row.previousPercentage !== null ||
          row.variation !== null ||
          row.variationPercentage !== null
      );

    return this.projectRowsToSelectedLevel(normalizedRows);
  }

  override afterReportLoaded(rawResponse: any): void {
    const totalAssets = this.resolveTotal(rawResponse, [
      'totalAssets',
      'assetsTotal',
      'activoTotal',
      'totalActivos',
    ]);
    const totalLiabilities = this.resolveTotal(rawResponse, [
      'totalLiabilities',
      'liabilitiesTotal',
      'pasivoTotal',
      'totalPasivos',
    ]);
    const totalEquity = this.resolveTotal(rawResponse, [
      'totalEquity',
      'equityTotal',
      'patrimonioTotal',
      'totalPatrimonio',
    ]);

    if (
      totalAssets === null ||
      totalLiabilities === null ||
      totalEquity === null
    ) {
      return;
    }

    const diff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    if (diff > 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail:
          'El estado no cumple la ecuacion ACTIVO = PASIVO + PATRIMONIO con los totales recibidos.',
      });
    }
  }

  getRowClass(row: FinancialPositionStatementResponse): string {
    const rowType = String(row.rowType || '').toUpperCase();

    if (rowType.includes('TOTAL')) {
      return 'esf-total-row';
    }

    if (rowType.includes('SECTION') || rowType.includes('HEADER')) {
      return 'esf-section-row';
    }

    return '';
  }

  private configureComparativeColumns(
    currentCutoffDate: Date | null,
    previousCutoffDate: Date | null
  ): void {
    const currentPeriodHeader = currentCutoffDate
      ? `Periodo Actual (${this.formatDisplayDate(currentCutoffDate)})`
      : 'Periodo Actual';
    const previousPeriodHeader = previousCutoffDate
      ? `Periodo Anterior (${this.formatDisplayDate(previousCutoffDate)})`
      : 'Periodo Anterior';
    const variationHeader = 'Variacion';

    this.tableColumns = [
      { header: 'Cuenta', field: 'lineDescription' },
      {
        header: `${currentPeriodHeader} - Valor`,
        field: 'currentAmount',
        type: 'number',
      },
      {
        header: `${currentPeriodHeader} - Porcentaje`,
        field: 'currentPercentage',
        type: 'percentage',
      },
      {
        header: `${previousPeriodHeader} - Valor`,
        field: 'previousAmount',
        type: 'number',
      },
      {
        header: `${previousPeriodHeader} - Porcentaje`,
        field: 'previousPercentage',
        type: 'percentage',
      },
      {
        header: `${variationHeader} - Valor`,
        field: 'variation',
        type: 'number',
      },
      {
        header: `${variationHeader} - Porcentaje`,
        field: 'variationPercentage',
        type: 'percentage',
      },
    ];

    this.headerConfig = [
      [
        { header: 'Cuenta', field: 'lineDescription', rowspan: 2 },
        {
          header: 'Periodo Actual',
          colspan: 2,
          children: [
            {
              header: 'Valor',
              field: 'currentAmount',
              type: 'number',
            },
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
            {
              header: 'Valor',
              field: 'previousAmount',
              type: 'number',
            },
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
        {
          header: 'Valor',
          field: 'currentAmount',
          type: 'number',
        },
        {
          header: 'Porcentaje',
          field: 'currentPercentage',
          type: 'percentage',
        },
        {
          header: 'Valor',
          field: 'previousAmount',
          type: 'number',
        },
        {
          header: 'Porcentaje',
          field: 'previousPercentage',
          type: 'percentage',
        },
        { header: 'Valor', field: 'variation', type: 'number' },
        {
          header: 'Porcentaje',
          field: 'variationPercentage',
          type: 'percentage',
        },
      ],
    ];
  }

  private normalizeRow(row: any): FinancialPositionStatementResponse {
    const accountCode = this.normalizeAccountCode(
      this.getFirstDefinedValue(row, ['account.accountCode', 'accountCode', 'code'])
    );
    const accountDescription = String(
      this.getFirstDefinedValue(row, [
        'account.accountDescription',
        'accountDescription',
        'description',
      ]) ?? ''
    ).trim();
    const currentAmount = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'currentAmount',
        'currentYear',
        'amountCurrent',
        'valueCurrent',
        'value',
      ])
    );

    const previousAmount = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'previousAmount',
        'previousYear',
        'amountPrevious',
        'valuePrevious',
        'lastYearValue',
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

    let variation = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'variation',
        'variance',
        'amountVariation',
        'difference',
      ])
    );
    const variationPercentage = this.parseAmount(
      this.getFirstDefinedValue(row, [
        'variationPercentage',
        'variationPercent',
        'percentageVariation',
      ])
    );

    if (
      variation === null &&
      currentAmount !== null &&
      previousAmount !== null
    ) {
      variation = currentAmount - previousAmount;
    }

    return {
      account: row.account ?? null,
      accountCode,
      accountDescription,
      description: row.description,
      value: this.parseAmount(row.value),
      lineDescription: String(
        this.getFirstDefinedValue(row, [
          'lineDescription',
          'description',
          'partida',
          'itemName',
          'name',
          'concept',
          'account.accountDescription',
          'sectionName',
        ]) ?? ''
      ).trim(),
      note: this.getFirstDefinedValue(row, ['note', 'nota', 'noteNumber']),
      currentAmount,
      currentPercentage,
      previousAmount,
      previousPercentage,
      variation,
      variationPercentage,
      rowType: String(
        this.getFirstDefinedValue(row, ['rowType', 'lineType', 'type']) ?? ''
      ).trim(),
    };
  }

  private projectRowsToSelectedLevel(
    rows: FinancialPositionStatementResponse[]
  ): FinancialPositionStatementResponse[] {
    const targetLength = this.getSelectedLevelCodeLength();
    if (!targetLength) {
      return rows;
    }

    const accountRows = rows.filter((row) =>
      !!this.normalizeAccountCode(row.accountCode ?? row.account?.accountCode)
    );

    if (accountRows.length === 0) {
      return rows;
    }

    const exactLevelRows = accountRows.filter((row) => {
      const accountCode = this.normalizeAccountCode(
        row.accountCode ?? row.account?.accountCode
      );
      return accountCode?.length === targetLength;
    });

    if (exactLevelRows.length > 0) {
      return rows.filter((row) => {
        const accountCode = this.normalizeAccountCode(
          row.accountCode ?? row.account?.accountCode
        );

        return (
          this.isStructuralRow(row.rowType, accountCode) ||
          accountCode?.length === targetLength
        );
      });
    }

    return this.aggregateRowsToSelectedLevel(rows, targetLength);
  }

  private aggregateRowsToSelectedLevel(
    rows: FinancialPositionStatementResponse[],
    targetLength: number
  ): FinancialPositionStatementResponse[] {
    const aggregatedRows = new Map<
      string,
      FinancialPositionStatementResponse & { order: number }
    >();

    rows.forEach((row, index) => {
      const accountCode = this.normalizeAccountCode(
        row.accountCode ?? row.account?.accountCode
      );
      if (!accountCode) {
        return;
      }

      const projectedCode = accountCode.slice(0, Math.min(targetLength, accountCode.length));
      const existingRow = aggregatedRows.get(projectedCode);
      const accountDescription = this.resolveProjectedDescription(
        projectedCode,
        row.accountDescription ?? row.account?.accountDescription ?? row.lineDescription
      );

      aggregatedRows.set(projectedCode, {
        account: {
          accountCode: projectedCode,
          accountDescription,
          nature: row.account?.nature ?? '',
        },
        accountCode: projectedCode,
        accountDescription,
        description: accountDescription,
        lineDescription: `${projectedCode} - ${accountDescription}`,
        note: null,
        currentAmount: this.sumNullableValues(
          existingRow?.currentAmount,
          row.currentAmount
        ),
        currentPercentage: null,
        previousAmount: this.sumNullableValues(
          existingRow?.previousAmount,
          row.previousAmount
        ),
        previousPercentage: null,
        variation: this.sumNullableValues(existingRow?.variation, row.variation),
        variationPercentage: null,
        rowType: '',
        order: existingRow?.order ?? this.resolveAccountOrder(projectedCode, index),
      });
    });

    return Array.from(aggregatedRows.values())
      .sort((left, right) => left.order - right.order)
      .map(({ order, ...row }) => ({
        ...row,
        variation:
          row.variation ??
          (row.currentAmount !== null &&
          row.currentAmount !== undefined &&
          row.previousAmount !== null &&
          row.previousAmount !== undefined
            ? row.currentAmount - row.previousAmount
            : null),
      }));
  }

  private resolveProjectedDescription(
    projectedCode: string,
    fallbackDescription?: string | null
  ): string {
    const resolvedDescription = this.resolveAccountDescription(
      projectedCode,
      fallbackDescription
    );

    return resolvedDescription || projectedCode;
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

  formatPercentage(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    return `${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}%`;
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

  private resolveTotal(source: any, keys: string[]): number | null {
    const candidates = [source, source?.data, source?.totals, source?.summary];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      for (const key of keys) {
        const value = candidate[key];
        const parsed = this.parseAmount(value);
        if (parsed !== null) {
          return parsed;
        }
      }
    }

    return null;
  }
}

