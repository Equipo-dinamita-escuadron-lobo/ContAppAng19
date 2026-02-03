import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/Inventory/Components/MenuCards/inventory-menu.component').then(
        (m) => m.InventoryMenuComponent,
      ),
  },
  {
    path: 'products',
    data: { breadcrumb: 'Productos' },
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Products/Components/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear Producto' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Products/Components/product-creation/product-creation.component').then(
            (m) => m.ProductCreationComponent,
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar Producto' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Products/Components/product-edit/product-edit.component').then(
            (m) => m.ProductEditComponent,
          ),
      },
    ],
  },
  {
    path: 'product-types',
    data: { breadcrumb: 'Tipos de Productos' },
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/ProductTypes/Components/product-type-list/product-type-list.component').then(
            (m) => m.ProductTypeListComponent,
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear Tipo de Producto' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/ProductTypes/Components/product-type-creation/product-type-creation.component').then(
            (m) => m.ProductTypeCreationComponent,
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar Tipo de Producto' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/ProductTypes/Components/product-type-edit/product-type-edit.component').then(
            (m) => m.ProductTypeEditComponent,
          ),
      },
    ],
  },
  {
    path: 'categories',
    data: { breadcrumb: 'Categorías' },
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Category/Components/category-list/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear Categoría' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Category/Components/category-creation/category-creation.component').then(
            (m) => m.CategoryCreationComponent,
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar Categoría' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/Category/Components/category-edit/category-edit.component').then(
            (m) => m.CategoryEditComponent,
          ),
      },
    ],
  },
  {
    path: 'measurement-units',
    data: { breadcrumb: 'Unidades de Medida' },
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-list/unit-of-measure-list.component').then(
            (m) => m.UnitOfMeasureListComponent,
          ),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Crear Unidad de Medida' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-creation/unit-of-measure-creation.component').then(
            (m) => m.UnitOfMeasureCreationComponent,
          ),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Editar Unidad de Medida' },
        loadComponent: () =>
          import('../../GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-edit/unit-of-measure-edit.component').then(
            (m) => m.UnitOfMeasureEditComponent,
          ),
      },
    ],
  },
];
