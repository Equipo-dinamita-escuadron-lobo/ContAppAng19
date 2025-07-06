import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';
import { ListEnterpriseComponent } from './GeneralMasters/Enterprise/list-enterprise/list-enterprise.component';
import { hasRoleGuard } from './Core/Guards/has-role.guard';

export const routes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: 'Home',
    },
    children: [
      {
        path: 'gen-masters',
        data: {
          breadcrumb: 'Maestros Generales',
        },
        children: [
          {
            path: 'third-parties/list',
            data: {
              breadcrumb: 'Terceros',
            },
            loadComponent: () =>
              import(
                './GeneralMasters/ThirdParties/Components/third-parties-list/third-parties-list.component'
              ).then((m) => m.ThirdPartiesListComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'style-guide',
    data: {
      breadcrumb: '',
    },
    component: StyleGuideComponent,
  },
  {
    path: 'login',
    data: {
      breadcrumb: '',
    },
    component: LoginComponent,
  },
  {
    path: 'enterprise/list',
    data: {
      breadcrumb: '',
    },
    component: ListEnterpriseComponent,
    canActivate: [hasRoleGuard(['admin_realm'])],
  },
];
