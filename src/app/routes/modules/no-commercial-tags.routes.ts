import { Routes } from '@angular/router';

export const NO_COMMERCIAL_TAGS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/noCommercialTags/Components/list-tag/list-tag.component').then(
        (m) => m.ListTagComponent
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Etiqueta No Comercial' },
    loadComponent: () =>
      import('../../GeneralMasters/noCommercialTags/Components/create-tag/create-tag.component').then(
        (m) => m.CreateTagComponent
      ),
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Etiqueta No Comercial' },
    loadComponent: () =>
      import('../../GeneralMasters/noCommercialTags/Components/edit-tag/edit-tag.component').then(
        (m) => m.EditTagComponent
      ),
  },
];
