import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RolesWithPermissions } from '../../Models/Permission';
import { PermissionsService } from '../../Services/permission.service';

@Component({
  selector: 'app-permission-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.css',
})
export class PermissionListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly permissionsService = inject(PermissionsService);
  private readonly messageService = inject(MessageService);

  rolesWithPermissions: RolesWithPermissions[] = [];
  filteredRolesWithPermissions: RolesWithPermissions[] = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.getRolesWithPermissions();
  }

  getRolesWithPermissions(): void {
    this.loading = true;
    this.permissionsService.getRolesWithPermissions().subscribe({
      next: (data) => {
        // Agrupamos y ordenamos los permisos de cada rol
        this.rolesWithPermissions = data.map((role) => ({
          ...role,
          groupedPermissions: this.groupPermissions(role.permissions),
        }));
        this.filteredRolesWithPermissions = this.rolesWithPermissions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles con permisos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles con permisos.',
        });
        this.loading = false;
      },
    });
  }

  /**
   * Agrupa permisos por módulo y los ordena alfabéticamente
   */
  private groupPermissions(
    permissions: any[]
  ): { module: string; permissions: any[] }[] {
    const grouped: Record<string, any[]> = {};
    permissions.forEach((perm) => {
      const module = this.findModuleForPermission(perm.name);
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(perm);
    });

    // Ordenar permisos dentro de cada módulo
    return Object.keys(grouped).map((module) => ({
      module,
      permissions: grouped[module].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      ),
    }));
  }

  private findModuleForPermission(permissionName: string): string {
    const modules = [
      'Unidad de Medida',
      'Empresa',
      'Tipo de Movimiento',
      'Bodega',
      'Producto',
      'Usuarios',
    ];

    const match = modules.find((m) =>
      permissionName.toLowerCase().includes(m.toLowerCase())
    );
    if (match) return match;

    const words = permissionName.split(' ');
    return words.length > 1
      ? words.slice(-2).join(' ')
      : words[words.length - 1];
  }

  assignPermissions(): void {
    this.router.navigate(['/configuration/permissions/create']);
  }

  editPermisos(role: RolesWithPermissions): void {
    this.router.navigate(['/configuration/permissions/edit', role.role]);
  }
}
