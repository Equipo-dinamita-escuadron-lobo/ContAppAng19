import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const DOCUMENT_TYPES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/document-types-list/document-types-list.component').then(
        (m) => m.DocumentTypesListComponent,
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Tipo de Documento' },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/document-types-creation/document-types-creation.component').then(
        (m) => m.DocumentTypesCreationComponent,
      ),
    canActivate: [hasPermissionGuard(['DT#C'])],
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Tipo de Documento' },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/document-types-edit/document-types-edit.component').then(
        (m) => m.DocumentTypesEditComponent,
      ),
    canActivate: [hasPermissionGuard(['DT#U'])],
  },
  {
    path: 'classes/list',
    data: { breadcrumb: 'Clases de Documentos' },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/classes-of-documents-list/classes-of-documents-list.component').then(
        (m) => m.ClassesOfDocumentsListComponent,
      ),
  },
  {
    path: 'classes/create',
    data: { breadcrumb: 'Crear Clase de Documento' },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/classes-of-documents-creation/classes-of-documents-creation.component').then(
        (m) => m.ClassesOfDocumentsCreationComponent,
      ),
    canActivate: [hasPermissionGuard(['DC#C'])],
  },
  {
    path: 'classes/edit/:id',
    data: { breadcrumb: 'Editar Clase de Documento' },
    loadComponent: () =>
      import('../../GeneralMasters/DocumentTypes/Components/classes-of-documents-edit/classes-of-documents-edit.component').then(
        (m) => m.ClassesOfDocumentsEditComponent,
      ),
    canActivate: [hasPermissionGuard(['DC#U'])],
  },
];
