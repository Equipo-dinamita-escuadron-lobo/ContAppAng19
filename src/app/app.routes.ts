import { Routes } from '@angular/router';
import { hasRoleChildGuard } from './Core/Guards/has-role.guard';
import { isAuthenticatedChildGuard } from './Core/Guards/is-authenticated.guard';
import { AUTH_ROUTES } from './routes/auth.routes';
import { ENTERPRISE_ROUTES } from './routes/enterprise.routes';

export const routes: Routes = [
  // Rutas de autenticación
  ...AUTH_ROUTES,

  ...ENTERPRISE_ROUTES,

  // Plantilla principal con rutas protegidas
  {
    path: '',
    loadComponent: () =>
      import('./Core/Components/MainTemplate/main-template.component').then(
        (m) => m.MainTemplateComponent
      ),
    canActivate: [isAuthenticatedChildGuard],
    data: {
      breadcrumb: 'Home',
    },
    children: [
      // Home
      {
        path: 'home',
        loadComponent: () =>
          import(
            './GeneralMasters/Enterprise/view-enterprise/view-enterprise.component'
          ).then((m) => m.ViewEnterpriseComponent),
      },

      // Configuración
      {
        path: 'configuration',
        data: { breadcrumb: 'Configuración' },
        canActivate: [hasRoleChildGuard],
        loadChildren: () =>
          import('./routes/configuration.routes').then(
            (m) => m.CONFIGURATION_ROUTES
          ),
      },

      // Maestros Generales
      {
        path: 'gen-masters',
        data: {
          breadcrumb: 'Maestros Generales',
        },
        loadChildren: () =>
          import('./routes/general-masters.routes').then(
            (m) => m.GENERAL_MASTERS_ROUTES
          ),
      },

      // Módulo Financiero
      {
        path: 'financial',
        data: {
          breadcrumb: 'Módulo Financiero',
        },
        loadChildren: () =>
          import('./routes/financial.routes').then((m) => m.FINANCIAL_ROUTES),
      },

      // Módulo Comercial
      {
        path: 'commercial',
        data: {
          breadcrumb: 'Módulo Comercial',
        },
        loadChildren: () =>
          import('./routes/commercial.routes').then((m) => m.COMMERCIAL_ROUTES),
      },

      // Auditoría
      {
        path: 'audit',
        data: {
          breadcrumb: 'Auditoría',
        },
        loadChildren: () =>
          import('./routes/audit.routes').then((m) => m.AUDIT_ROUTES),
      },

      // Sincronización de productos
      {
        path: 'sync-products',
        data: { breadcrumb: 'Sincronizar Productos' },
        loadComponent: () =>
          import('./Core/sync/sync-products.component').then(
            (m) => m.SyncProductsComponent
          ),
      },
    ],
  },

  // Centro de ayuda público
  {
    path: 'help-center-view',
    data: {
      breadcrumb: 'Centro de Ayuda',
    },
    loadComponent: () =>
      import('./PublicSite/help-center/help-center-view.component').then(
        (m) => m.HelpCenterViewComponent
      ),
  },
  {
    path: 'help-center-view/:moduleId',
    data: {
      breadcrumb: 'Centro de Ayuda',
    },
    loadComponent: () =>
      import('./PublicSite/help-center/help-center-view.component').then(
        (m) => m.HelpCenterViewComponent
      ),
  },

  // Style Guide
  {
    path: 'style-guide',
    data: {
      breadcrumb: '',
    },
    loadComponent: () =>
      import('./Shared/Components/style-guide/style-guide.component').then(
        (m) => m.StyleGuideComponent
      ),
  },
];
