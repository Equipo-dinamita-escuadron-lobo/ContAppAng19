import { Component, inject, OnInit } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/User';

@Component({
  selector: 'app-user-list',
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
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = false;

  globalFilterFields: string[] = [
    'firstName',
    'lastName',
    'email',
    'username',
    'roles',
  ];

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        // Oculta roles técnicos del IDP y muestra cualquier rol de negocio.
        this.users = data.map((user) => ({
          ...user,
          roles: (user.roles || [])
            .filter((role) => !this.isIdpTechnicalRole(role))
            .map(
              (role) =>
                role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
            ),
        }));
        this.filteredUsers = this.users;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios.',
        });
        this.loading = false;
      },
    });
  }

  private isIdpTechnicalRole(role: string): boolean {
    const normalizedRole = role.toLowerCase();

    return (
      normalizedRole === 'offline_access' ||
      normalizedRole === 'uma_authorization' ||
      normalizedRole.startsWith('default-roles-')
    );
  }

  goToEditUser(userId: string): void {
    this.router.navigate(['/configuration/users/edit', userId]);
  }

  redirectToDelete(userId: string): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar este usuario?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Usuario eliminado exitosamente.',
            });
            this.getUsers(); // Refresh the list after deletion
          },
          error: (err) => {
            console.error("Error al eliminar usuario:", err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo eliminar el usuario.',
            });
          },
        });
      },
    });
  }
}
