import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Core/auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-audit-hub',
  imports: [CommonModule, ],
  templateUrl: './audit-hub.component.html',
  styleUrl: './audit-hub.component.css'
})
export class AuditHubComponent {
   constructor(
    private router: Router,
    private auth: AuthService
  ) { }

  private allAuditItems = [
    {
      name: 'Auditoría de configuración',
      route: '/audit/system',
      icon: 'admin_panel_settings',
      description: 'Cambios en usuarios y empresas',
      roles: ['Administrador'],
    },
    {
      name: 'Auditoría de sesiones',
      route: '/audit/sessions',
      icon: 'computer',
      description: 'Registros de inicio y cierre de sesión',
      roles: ['Administrador', 'Profesor'],
    },
    {
      name: 'Auditoría de operaciones',
      route: '/audit/operations',
      icon: 'build',
      description: 'Cambios en la configuración y datos base',
    },
    {
      name: 'Auditoría de documentos',
      route: '/audit/documents',
      icon: 'description',
      description: 'Historial de cambios en documentos',
    },
  ];

  auditItems: typeof this.allAuditItems = [];

  ngOnInit(): void {
    this.auditItems = this.allAuditItems.filter(item =>
      !item.roles || item.roles.length === 0 || 
      item.roles.some(r => this.auth.hasRole(r))
    );
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
