import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-audit-hub',
  imports: [CommonModule, ],
  templateUrl: './audit-hub.component.html',
  styleUrl: './audit-hub.component.css'
})
export class AuditHubComponent {
  auditItems = [
    {
      name: 'Auditoría de sesiones',
      route: '/configuration/audit/sessions',
      icon: 'computer',
      description: 'Registros de inicio y cierre de sesión',
    },
    {
      name: 'Auditoría de operaciones',
      route: '/configuration/audit/operations',
      icon: 'build',
      description: 'Acciones realizadas en el sistema',
    },
    {
      name: 'Auditoría de documentos',
      route: '/configuration/audit/documents',
      icon: 'description',
      description: 'Historial de cambios en documentos',
    },
    {
      name: 'Auditoría de consecutivos',
      route: '/configuration/audit/consecutives',
      icon: 'format_list_numbered',
      description: 'Seguimiento de numeración de documentos',
    },
  ];

  constructor(private router: Router) { }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
