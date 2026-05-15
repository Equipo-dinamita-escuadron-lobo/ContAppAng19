import { Routes } from '@angular/router';
import { hasAnyRoleGuard } from '../Core/Guards/has-anyRole.guard';

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
    path: 'system',
    canActivate: [hasAnyRoleGuard(['Administrador'])],
    data: { breadcrumb: 'Operaciones de configuración', auditType: 'system' },
    loadComponent: () =>
      import('../Audit/Components/audit-operations/audit-operations.component').then(
        (m) => m.AuditOperationsComponent
      ),
  },
  {
    path: 'sessions',
    canActivate: [hasAnyRoleGuard(['Administrador', 'Profesor'])],
    data: { breadcrumb: 'Sesiones' },
    loadComponent: () =>
      import('../Audit/Components/audit-session/audit-session.component').then(
        (m) => m.AuditSessionComponent
      ),
  },
  {
    path: 'operations',
    data: { breadcrumb: 'Operaciones de la empresa' },
    loadComponent: () =>
      import('../Audit/Components/audit-operations/audit-operations.component').then(
        (m) => m.AuditOperationsComponent
      ),
  },
  {
    path: 'documents',
    data: { breadcrumb: 'Documentos Contables' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../Audit/Components/audit-accounting-documents/audit-accounting-documents.component')
            .then(m => m.AuditAccountingDocumentsComponent)
      },
      {
        path: 'details/:documentCode',
        data: { breadcrumb: 'Detalles de operaciones del Documento' },
        loadComponent: () =>
          import('../Audit/Components/audit-accounting-documents-details/audit-accounting-documents-details.component')
            .then(m => m.AuditAccountingDocumentsDetailsComponent)
      }
    ]
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
