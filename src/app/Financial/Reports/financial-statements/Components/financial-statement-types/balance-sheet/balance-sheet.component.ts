import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import {
  BaseFinancialStatementComponent,
  FinancialStatementTableColumn,
} from '../base-financial-statement/base-financial-statement.component';
import { FinancialStatementType } from '../../../Models/eFinancialStatementType';
import { GenerateFinancialStatementRequest } from '../../../Models/Requests/GenerateFinancialStatementRequest';
import { BalanceSheetResponse } from '../../../Models/Responses/BalanceSheetResponse';
import { FinancialStatementsService } from '../../../Services/financial-statements.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { ColumnDefinition } from '../../report-preview/report-preview.component';

@Component({
  selector: 'app-balance-sheet',
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './balance-sheet.component.html',
  styleUrl: './balance-sheet.component.css',
})
export class BalanceSheetComponent extends BaseFinancialStatementComponent {
  override request: GenerateFinancialStatementRequest = {
    entId: '',
    userId: 0,
    type: FinancialStatementType.BALANCE_SHEET,
    criteria: this.criteria,
  };

  override dataTable: BalanceSheetResponse[] = [];

  override tableColumns: FinancialStatementTableColumn[] = [
    { header: 'Código', field: 'account.accountCode' },
    { header: 'Descripción de Cuenta', field: 'account.accountDescription' },
    { header: 'Descripción', field: 'description' },
    {
      header: 'Valor',
      field: 'value',
      type: 'number',
      natureField: 'account.nature',
    },
  ];

  override headerConfig: ColumnDefinition[][] = [
    [
      {
        header: 'Cuenta',
        colspan: 2,
        children: [
          { header: 'Código', field: 'account.accountCode' },
          { header: 'Descripción', field: 'account.accountDescription' },
        ],
      },
      { header: 'Descripción', field: 'description', rowspan: 2 },
      { header: 'Valor', field: 'value', type: 'number', rowspan: 2 },
    ],
    [
      { header: 'Código', field: 'account.accountCode' },
      { header: 'Descripción', field: 'account.accountDescription' },
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
      name: 'Balance General',
      type: FinancialStatementType.BALANCE_SHEET,
      description:
        'Resume la posición financiera mostrando saldos de activos, pasivos y patrimonio.',
      icon: 'balance',
      usesCutoffDate: true,
    };

    this.levels = [
      { label: 'Clase', value: 'NUMBER_CLASS' },
      { label: 'SubCuenta', value: 'SUB_ACCOUNT' },
      { label: 'Grupo', value: 'GROUP' },
      { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
      { label: 'Cuenta', value: 'ACCOUNT' },
    ];
  }

  protected organizeRequest(): void {
    const cutoffDate = this.parseDate(this.criteria.endDate) ?? new Date();
    const startOfYear = new Date(cutoffDate.getFullYear(), 0, 1);
    const enterpriseId = this.resolveEnterpriseId();
    const userId = this.resolveCurrentUserId();

    this.criteria.startDate = this.datePipe.transform(startOfYear, 'yyyy-MM-dd');
    this.criteria.endDate = this.datePipe.transform(cutoffDate, 'yyyy-MM-dd');

    this.request = {
      entId: enterpriseId ?? '',
      criteria: this.criteria,
      type: FinancialStatementType.BALANCE_SHEET,
      userId: userId ?? 0,
    };
  }

  private parseDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}


