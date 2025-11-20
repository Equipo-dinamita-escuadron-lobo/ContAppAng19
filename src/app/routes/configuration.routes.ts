import { Routes } from '@angular/router';
import { hasRoleChildGuard } from '../Core/Guards/has-role.guard';

export const CONFIGURATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../Configuration/Components/configuration-main/configuration-main.component').then(
        (m) => m.ConfigurationMainComponent
      ),
  },
  {
    path: 'users',
    data: { breadcrumb: 'Usuarios' },
    children: [
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../Configuration/Users/Components/user-list/user-list.component').then(
            (m) => m.UserListComponent
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear usuario' },
        loadComponent: () =>
          import('../Configuration/Users/Components/user-create/user-create.component').then(
            (m) => m.UserCreateComponent
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar usuario' },
        loadComponent: () =>
          import('../Configuration/Users/Components/user-edit/user-edit.component').then(
            (m) => m.UserEditComponent
          ),
      },
    ],
  },
  {
    path: 'profiles',
    data: {
      breadcrumb: 'Gestión de Perfiles',
    },
    children: [
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../Configuration/Profiles/Components/profile-list/profile-list.component').then(
            (m) => m.ProfileListComponent
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear Perfil' },
        loadComponent: () =>
          import('../Configuration/Profiles/Components/profile-create/profile-create.component').then(
            (m) => m.ProfileCreateComponent
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar Perfil' },
        loadComponent: () =>
          import('../Configuration/Profiles/Components/profile-edit/profile-edit.component').then(
            (m) => m.ProfileEditComponent
          ),
      },
    ],
  },
  {
    path: 'permissions',
    data: {
      breadcrumb: 'Gestión de Permisos',
    },
    children: [
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../Configuration/Permissions/Components/permission-list/permission-list.component').then(
            (m) => m.PermissionListComponent
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Asignar Permisos a un Perfil' },
        loadComponent: () =>
          import('../Configuration/Permissions/Components/permission-create/permission-create.component').then(
            (m) => m.PermissionCreateComponent
          ),
      },
      {
        path: 'edit/:role',
        data: { breadcrumb: 'Editar Permisos del Perfil' },
        loadComponent: () =>
          import('../Configuration/Permissions/Components/permission-edit/permission-edit.component').then(
            (m) => m.PermissionEditComponent
          ),
      },
    ],
  },
];
