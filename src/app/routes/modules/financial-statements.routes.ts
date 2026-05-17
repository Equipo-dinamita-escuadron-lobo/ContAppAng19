import { Routes } from '@angular/router';

export const FINANCIAL_STATEMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statements-list/financial-statements-list.component').then(
        (m) => m.FinancialStatementsListComponent
      ),
  },
  {
    path: 'statement-financial-position',
    data: {
      breadcrumb: 'Estado de Situacion Financiera',
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statement-types/statement-financial-position/statement-financial-position.component').then(
        (m) => m.StatementFinancialPositionComponent
      ),
  },
  {
    path: 'income-statement',
    data: {
      breadcrumb: 'Estado de Resultados',
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statement-types/income-statement/income-statement.component').then(
        (m) => m.IncomeStatementComponent
      ),
  },
  {
    path: 'statement-of-changes-in-equity',
    data: {
      breadcrumb: 'Estado de Cambios en el Patrimonio',
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statement-types/statement-of-changes-in-equity/statement-of-changes-in-equity.component').then(
        (m) => m.StatementOfChangesInEquityComponent
      ),
  },
  {
    path: 'historial',
    data: {
      breadcrumb: 'Historial',
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statements-historial/financial-statements-historial.component').then(
        (m) => m.FinancialStatementsHistorialComponent
      ),
  },
  {
    path: 'historial/details/:reportId',
    data: {
      breadcrumb: 'Detalle',
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statements-historial/Components/financial-statements-details/financial-statements-details.component').then(
        (m) => m.FinancialStatementsDetailsComponent
      ),
  },
];



