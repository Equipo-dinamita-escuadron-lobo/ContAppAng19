import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';
import { ListEnterpriseComponent } from './GeneralMasters/Enterprise/list-enterprise/list-enterprise.component';
import { hasRoleChildGuard, hasRoleGuard } from './Core/Guards/has-role.guard';
import { MainTemplateComponent } from './Core/Components/MainTemplate/main-template.component';
import { ViewEnterpriseComponent } from './GeneralMasters/Enterprise/view-enterprise/view-enterprise.component';
import { Breadcrumb } from 'primeng/breadcrumb';
import { hasPermissionGuard } from './Core/Guards/has-permission.guard';
import {
  isAuthenticatedChildGuard,
  isAuthenticatedGuard,
} from './Core/Guards/is-authenticated.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./Core/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./Core/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./Core/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: '',
    component: MainTemplateComponent,
    canActivate: [isAuthenticatedGuard],
    children: [
      {
        path: 'enterprise',
        canActivateChild: [isAuthenticatedChildGuard],
        children: [
          {
            path: 'list',
            component: ListEnterpriseComponent,
            canActivate: [hasPermissionGuard],
            data: {
              breadcrumb: 'Empresas',
              permission: 'enterprise:read',
            },
          },
          {
            path: 'view/:id',
            component: ViewEnterpriseComponent,
            canActivate: [hasPermissionGuard],
            data: {
              breadcrumb: 'Ver Empresa',
              permission: 'enterprise:read',
            },
          },
        ],
      },
      {
        path: 'style-guide',
        component: StyleGuideComponent,
        canActivate: [hasRoleGuard],
        data: {
          role: 'Administrador',
        },
      },
    ],
  },
];
