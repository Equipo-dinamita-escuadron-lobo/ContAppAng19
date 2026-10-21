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
import { ProfileService } from '../../../Profiles/Services/profile.service';
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
  private readonly profileService = inject(ProfileService);

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
        // Filtrar solo roles personalizados para cada usuario
        this.users = data.map(user => ({
          ...user,
          roles: (user.roles || []).filter(role =>
            ['Administrador', 'Estudiante', 'Profesor'].includes(role)
          ).map(role => role.charAt(0).toUpperCase() + role.slice(1))
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

  goToCreateUser(): void {
    this.router.navigate(['/configuration/users/create']);
  }

  goToEditUser(userId: string): void {
    this.router.navigate(['/configuration/users/edit', userId]);
  }

  redirectToDelete(userId: string): void {
    // Verificar si el usuario está asignado a algún perfil
    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        const assignedProfiles = profiles.filter(profile =>
          profile.name && this.users.find(u => u.id === userId)?.roles?.some(role => role === profile.name)
        );

        if (assignedProfiles.length > 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se puede eliminar el usuario porque está asignado a uno o varios perfiles.`,
          });
          return;
        }

        // Confirmación y eliminación normal
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
                this.getUsers();
              },
              error: () => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo eliminar el usuario.',
                });
              },
            });
          },
        });
      },
      error: (error) => {
        console.error('Error al verificar perfiles:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo verificar los perfiles asignados.',
        });
      },
    });
  }
}
