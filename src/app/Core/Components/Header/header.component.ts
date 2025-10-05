import { Component, OnInit } from '@angular/core'; // 👈 agrega OnInit
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  applicationName = 'ContApp';
  companyName = 'Nombre de la empresa';
  userName = 'Nombre completo del usuario';
  userRole = 'Rol del usuario';

  // 👇 inicializa vacío; lo llenamos en ngOnInit
  userMenuItems: MenuItem[] = [];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.userMenuItems = [
      {
        label: 'Perfil',
        icon: 'pi pi-user',
        command: () => this.viewProfile(),
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        visible: this.auth.hasRole('Administrador'), // ✅ ya puedes usar this.auth
        command: () => this.openSettings(),
      },
      { separator: true },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
  }

  viewProfile(): void {
    console.log('Ver perfil del usuario');
  }
  openSettings(): void {
    this.router.navigate(['/configuration']);
  }
  logout(): void {
    this.auth.logout().subscribe();
  }
}
