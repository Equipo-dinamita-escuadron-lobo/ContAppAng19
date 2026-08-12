import { Routes } from '@angular/router';
import { hasAnyRoleGuard } from '../../Core/Guards/has-anyRole.guard';

const operationalRoles = ['Estudiante', 'Profesor', 'Administrador'];
export const TREASURY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'operations' },
  {
    path: 'operations', canActivate: [hasAnyRoleGuard(operationalRoles)],
    data: { breadcrumb: 'Operaciones de Tesoreria' },
    loadComponent: () => import('../../Financial/Treasury/Operations/treasury-operations.component').then(m => m.TreasuryOperationsComponent),
  },
  { path: 'expense-receipts', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'expense-receipts/creation', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'expense-receipts/details/:id', redirectTo: 'operations' },
  { path: 'expense-receipts/:id/accounting', redirectTo: 'operations' },
  { path: 'purchase-bills', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'purchase-bills/create', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'purchase-bills/:id', redirectTo: 'operations' },
  { path: 'payment-schedules', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'payables', redirectTo: 'operations', pathMatch: 'full' },
  { path: 'payable-write-offs', redirectTo: 'operations', pathMatch: 'full' },
  {
    path: 'reports', canActivate: [hasAnyRoleGuard(operationalRoles)], data: { breadcrumb: 'Reportes' },
    children: [
      { path: 'vendors', data: { breadcrumb: 'Estado de cuenta por proveedor' }, loadComponent: () => import('../../Financial/Treasury/Reports/VendorReports/Components/vendor-list/vendor-list.component').then(m => m.VendorListComponent) },
      { path: 'vendor-report/:id', data: { breadcrumb: 'Estado de cuenta' }, loadComponent: () => import('../../Financial/Treasury/Reports/VendorReports/Components/vendor-report/vendor-report.component').then(m => m.VendorReportComponent) },
      { path: 'aging-report', data: { breadcrumb: 'Vencimiento por edades' }, loadComponent: () => import('../../Financial/Treasury/Reports/AgingReport/Components/aging-report/aging-report.component').then(m => m.AgingReportComponent) },
    ],
  },
];
