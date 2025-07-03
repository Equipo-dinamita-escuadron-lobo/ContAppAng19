import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  applicationName = 'ContApp';
  companyName = 'Nombre de la empresa';
  userName = 'Nombre completo del usuario';
  userRole = 'Rol del usuario';

  userMenuItems: MenuItem[] = [
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      command: () => {
        this.viewProfile();
      },
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => {
        this.openSettings();
      },
    },
    {
      separator: true,
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => {
        this.logout();
      },
    },
  ];

  constructor() {}

  viewProfile(): void {
    console.log('Ver perfil del usuario');
    // Implementar lógica para mostrar perfil
  }

  openSettings(): void {
    console.log('Abrir configuración');
    // Implementar lógica para abrir configuración
  }

  logout(): void {
    console.log('Cerrar sesión');
    // Implementar lógica de cierre de sesión
    // Ejemplo: this.authService.logout();
    // Ejemplo: this.router.navigate(['/login']);
  }
}
