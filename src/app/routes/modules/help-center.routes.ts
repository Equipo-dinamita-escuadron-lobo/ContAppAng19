import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const HELP_CENTER_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/HelpCenter/components/help-center-list/help-center-list.component').then(
        (m) => m.HelpCenterListComponent,
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Centro de Ayuda' },
    loadComponent: () =>
      import('../../GeneralMasters/HelpCenter/components/help-center-creation/help-center-creation.component').then(
        (m) => m.HelpCenterCreationComponent,
      ),
    canActivate: [hasPermissionGuard(['HC#C'])],
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Centro de Ayuda' },
    loadComponent: () =>
      import('../../GeneralMasters/HelpCenter/components/help-center-edit/help-center-edit.component').then(
        (m) => m.HelpCenterEditComponent,
      ),
    canActivate: [hasPermissionGuard(['HC#U'])],
  },
];
