import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'home',
      route: '/home',
      active: true,
    },
    {
      label: 'Catálogo de Cuentas',
      icon: 'account_balance',
      children: [
        {
          label: 'Cuentas Principales',
          icon: 'folder',
          route: '/catalogo/principales',
        },
        {
          label: 'Subcuentas',
          icon: 'folder',
          route: '/catalogo/subcuentas',
        },
        {
          label: 'Auxiliares',
          icon: 'description',
          route: '/catalogo/auxiliares',
        },
      ],
    },
    {
      label: 'Terceros',
      icon: 'people',
      children: [
        {
          label: 'Clientes',
          icon: 'person',
          route: '/terceros/clientes',
        },
        {
          label: 'Proveedores',
          icon: 'business',
          route: '/terceros/proveedores',
        },
        {
          label: 'Empleados',
          icon: 'badge',
          route: '/terceros/empleados',
        },
      ],
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      children: [
        {
          label: 'Estados Financieros',
          icon: 'bar_chart',
          route: '/reportes/estados-financieros',
        },
        {
          label: 'Libros Auxiliares',
          icon: 'menu_book',
          route: '/reportes/libros-auxiliares',
        },
      ],
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setActiveItem();
  }

  toggleExpanded(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    } else if (item.route) {
      this.navigateToRoute(item);
    }
  }

  navigateToRoute(item: MenuItem): void {
    if (item.route) {
      this.clearActiveStates();
      item.active = true;
      this.router.navigate([item.route]);
    }
  }

  private clearActiveStates(): void {
    this.menuItems.forEach((item) => {
      item.active = false;
      if (item.children) {
        item.children.forEach((child) => (child.active = false));
      }
    });
  }

  private setActiveItem(): void {
    const currentUrl = this.router.url;
    this.menuItems.forEach((item) => {
      if (item.route === currentUrl) {
        item.active = true;
      } else if (item.children) {
        item.children.forEach((child) => {
          if (child.route === currentUrl) {
            child.active = true;
            item.expanded = true;
          }
        });
      }
    });
  }
}
