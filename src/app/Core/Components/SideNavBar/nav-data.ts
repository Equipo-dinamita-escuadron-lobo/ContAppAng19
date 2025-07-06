import { INavbarData } from './helper';

export const navbarData: INavbarData[] = [
  {
    routeLink: '/',
    icon: 'home',
    label: 'Home',
  },
  {
    routeLink: 'TO DO',
    icon: 'construction',
    label: 'Maestros Generales',
    items: [
      {
        routeLink: '/gen-masters/third-parties/list',
        icon: 'groups',
        label: 'Terceros',
      },
      {
        routeLink: 'TO DO',
        icon: 'article',
        label: 'Catálogo de cuentas',
      },
    ],
  },
  {
    routeLink: 'TO DO',
    icon: 'monetization_on',
    label: 'Financiero',
    items: [
      {
        routeLink: 'TO DO',
        icon: 'circle',
        label: 'Maestros',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'assignment',
            label: 'PUC',
          },
          {
            routeLink: 'TO DO',
            icon: 'docs',
            label: 'Documentos',
          },
          {
            routeLink: 'TO DO',
            icon: 'request_quote',
            label: 'Impuestos',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'format_list_numbered',
        label: 'Notas Contables',
      },
      {
        routeLink: 'TO DO',
        icon: 'finance_mode',
        label: 'Reportes',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'book_5',
            label: 'Libros Auxiliares',
          },
          {
            routeLink: 'TO DO',
            icon: 'article',
            label: 'Estados Financieros',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'money_bag',
        label: 'Tesorería',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'receipt_long',
            label: 'Comprobantes de Egreso',
          },
          {
            routeLink: 'TO DO',
            icon: 'analytics',
            label: 'Reportes',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'point_of_sale',
        label: 'Cartera',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'receipt',
            label: 'Recibos de Caja',
          },
          {
            routeLink: 'TO DO',
            icon: 'analytics',
            label: 'Reportes',
          },
        ],
      },
    ],
  },
  {
    routeLink: 'TO DO',
    icon: 'store',
    label: 'Comercial',
    items: [
      {
        routeLink: 'TO DO',
        icon: 'construction',
        label: 'Maestros Comerciales',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'box',
            label: 'Productos',
          },
          {
            routeLink: 'TO DO',
            icon: 'dashboard',
            label: 'Tipos de Productos',
          },
          {
            routeLink: 'TO DO',
            icon: 'category_search',
            label: 'Categorias',
          },
          {
            routeLink: 'TO DO',
            icon: 'square_foot',
            label: 'Unidad de Medida',
          },
          {
            routeLink: 'TO DO',
            icon: 'decimal_increase',
            label: 'Modelos de Valoracion',
            items: [
              {
                routeLink: 'TO DO',
                icon: '',
                label: 'Inventario con Promedio Ponderado',
              },
              {
                routeLink: 'TO DO',
                icon: '',
                label: 'Inventario PEPS',
              },
            ],
          },
          {
            routeLink: 'TO DO',
            icon: 'analytics',
            label: 'Reportes',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'order_approve',
        label: 'Factura de Venta',
      },
      {
        routeLink: 'TO DO',
        icon: 'receipt_long',
        label: 'Factura de Compra',
      },
      {
        routeLink: 'TO DO',
        icon: 'analytics',
        label: 'Reportes',
      },
      {
        routeLink: 'TO DO',
        icon: 'shelves',
        label: 'Ajustes de Inventario',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'arrows_input',
            label: 'Entradas',
          },
          {
            routeLink: 'TO DO',
            icon: 'arrows_output',
            label: 'Salidas',
          },
          {
            routeLink: 'TO DO',
            icon: 'difference',
            label: 'Recalculos',
          },
        ],
      },
    ],
  },
];
