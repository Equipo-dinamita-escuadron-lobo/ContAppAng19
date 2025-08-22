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
import { MessageService } from 'primeng/api';
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
  providers: [MessageService],
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
        this.rolesWithPermissions = data;
        this.filteredRolesWithPermissions = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles con permisos.',
        });
        this.loading = false;
      },
    });
  }

  assignPermissions(): void {
    this.router.navigate(['/configuration/permissions/assign']);
  }

  editPermisos(role: RolesWithPermissions): void {
    this.router.navigate(['/configuration/permissions/edit', role.role]);
  }
}
