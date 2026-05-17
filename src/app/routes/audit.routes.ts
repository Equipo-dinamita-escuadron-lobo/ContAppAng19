import { Routes } from '@angular/router';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../Audit/Components/audit-hub/audit-hub.component').then(
        (m) => m.AuditHubComponent
      ),
  },
  {
    path: 'sessions',
    data: { breadcrumb: 'Sesiones' },
    loadComponent: () =>
      import('../Audit/Components/audit-session/audit-session.component').then(
        (m) => m.AuditSessionComponent
      ),
  },
  {
    path: 'operations',
    data: { breadcrumb: 'Operaciones' },
    loadComponent: () =>
      import('../Audit/Components/audit-operations/audit-operations.component').then(
        (m) => m.AuditOperationsComponent
      ),
  },
  {
    path: 'documents',
    data: { breadcrumb: 'Documentos Contables' },
    loadComponent: () =>
      import('../Audit/Components/audit-accounting-documents/audit-accounting-documents.component').then(
        (m) => m.AuditAccountingDocumentsComponent
      ),
  },
  {
    path: 'consecutives',
    data: { breadcrumb: 'Consecutivos' },
    loadComponent: () =>
      import('../Audit/Components/audit-consecutive/audit-consecutive.component').then(
        (m) => m.AuditConsecutiveComponent
      ),
  },
];
