import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const THIRD_PARTIES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../../GeneralMasters/ThirdParties/Components/third-list/third-list.component').then(
        (m) => m.ThirdListComponent,
      ),
  },
  {
    path: 'create',
    data: {
      breadcrumb: 'Crear Tercero',
    },
    loadComponent: () =>
      import('../../GeneralMasters/ThirdParties/Components/third-creation/third-creation.component').then(
        (m) => m.ThirdCreationComponent,
      ),
    canActivate: [hasPermissionGuard(['TD#C'])],
  },
  {
    path: 'edit/:id',
    data: {
      breadcrumb: 'Editar Tercero',
    },
    loadComponent: () =>
      import('../../GeneralMasters/ThirdParties/Components/third-edit/third-edit.component').then(
        (m) => m.ThirdEditComponent,
      ),
    canActivate: [hasPermissionGuard(['TD#U'])],
  },
  {
    path: 'configuration',
    data: {
      breadcrumb: 'Configuración de Terceros',
    },
    loadComponent: () =>
      import('../../GeneralMasters/ThirdParties/Components/third-config/third-config.component').then(
        (m) => m.ThirdConfigComponent,
      ),
  },
];
