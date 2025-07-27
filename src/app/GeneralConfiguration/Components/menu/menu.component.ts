import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MenuOption {
  title: string;
  icon: string;
  route: string;
  description?: string;
}

@Component({
  selector: 'app-menu',
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  menuOptions: MenuOption[] = [
    {
      title: 'Catálogo de Cuentas',
      icon: 'account_balance_wallet',
      route: '/general-configuration/account-catalogue',
      description: 'Gestión del plan de cuentas contables'
    },
    {
      title: 'Impuestos',
      icon: 'request_page',
      route: '/general-configuration/taxes',
      description: 'Configuración de impuestos y tarifas'
    },
    {
      title: 'Terceros',
      icon: 'groups',
      route: '/general-configuration/third-parties',
      description: 'Gestión de clientes y proveedores'
    },
    {
      title: 'Inventario',
      icon: 'data_table',
      route: '/general-configuration/inventory',
      description: 'Configuración de inventarios'
    },
    {
      title: 'Métodos de Pago',
      icon: 'payments',
      route: '/general-configuration/payment-methods',
      description: 'Formas de pago disponibles'
    },
    {
      title: 'Tipos de Documentos',
      icon: 'description',
      route: '/general-configuration/document-types',
      description: 'Tipos de documentos del sistema'
    },
    {
      title: 'Estados de Documentos',
      icon: 'Task',
      route: '/general-configuration/document-statuses',
      description: 'Estados de los documentos'
    },
    {
      title: 'Banco y Cuentas Bancarias',
      icon: 'account_balance',
      route: '/general-configuration/bank-accounts',
      description: 'Gestión de cuentas bancarias'
    },
    {
      title: 'Centros de Costo',
      icon: 'paid',
      route: '/general-configuration/cost-centers',
      description: 'Configuración de centros de costo'
    },
    {
      title: 'Edades Cartera',
      icon: 'Calendar_month',
      route: '/general-configuration/aged-receivables',
      description: 'Configuración de edades de cartera'
    },
    {
      title: 'Cuadros de Diálogo',
      icon: 'help',
      route: '/general-configuration/help-panels',
      description: 'Paneles de ayuda del sistema'
    }
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
