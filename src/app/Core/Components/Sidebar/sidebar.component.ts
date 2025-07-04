import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, PanelMenuModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  sidebarVisible = false;

  items: MenuItem[] = [
    {
      label: 'Inicio',
      icon: 'home',
      route: '/home',
    },
    {
      label: 'Catalogo de Cuentas',
      icon: 'article',
      route: '/catalogo',
    },
    {
      label: 'Terceros',
      icon: 'groups',
      route: '/third-parties/list',
    },
    {
      label: 'Reportes',
      icon: 'finance_mode',
      items: [
        {
          label: 'Estados Financieros',
          icon: 'price_check',
          route: '/reportes/estados-financieros',
        },
        {
          label: 'Libros Auxiliares',
          icon: 'book_2',
          route: '/reportes/libros-auxiliares',
        },
      ],
    },
  ];

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
