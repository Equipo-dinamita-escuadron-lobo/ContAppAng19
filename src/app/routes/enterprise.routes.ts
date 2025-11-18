import { Routes } from '@angular/router';
import { isAuthenticatedGuard } from '../Core/Guards/is-authenticated.guard';

export const ENTERPRISE_ROUTES: Routes = [
  {
    path: 'enterprise/list',
    canActivate: [isAuthenticatedGuard],
    data: {
      breadcrumb: 'enterprise-list',
    },
    loadComponent: () =>
      import('../GeneralMasters/Enterprise/list-enterprise/list-enterprise.component').then(
        (m) => m.ListEnterpriseComponent
      ),
  },
  {
    path: 'enterprise/archive',
    canActivate: [isAuthenticatedGuard],
    data: {
      breadcrumb: 'enterprise-archive',
    },
    loadComponent: () =>
      import('../GeneralMasters/Enterprise/archive-enterprise/archive-enterprise.component').then(
        (m) => m.ArchiveEnterpriseComponent
      ),
  },
  {
    path: 'enterprise/create',
    data: {
      breadcrumb: 'enterprise-create',
    },
    loadComponent: () =>
      import('../GeneralMasters/Enterprise/create-enterprise/create-enterprise.component').then(
        (m) => m.CreateEnterpriseComponent
      ),
  },
  {
    path: 'enterprise/edit',
    data: {
      breadcrumb: 'enterprise-edit',
    },
    loadComponent: () =>
      import('../GeneralMasters/Enterprise/edit-enterprise/edit-enterprise.component').then(
        (m) => m.EditEnterpriseComponent
      ),
  },
  {
    path: 'subjects/list',
    data: {
      breadcrumb: 'subjects-list',
    },
    loadComponent: () =>
      import('../GeneralMasters/Subjects/list-subjects/list-subjects.component').then(
        (m) => m.ListSubjectsComponent
      ),
  },
];
