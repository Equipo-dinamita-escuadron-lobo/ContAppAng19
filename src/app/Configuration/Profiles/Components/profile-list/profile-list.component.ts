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
import { ProfileList } from '../../Models/Profile';
import { ProfileService } from '../../Services/profile.service';
import { UserService } from '../../../Users/Services/user.service';

@Component({
  selector: 'app-profile-list',
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
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.css',
})
export class ProfileListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly userService = inject(UserService);

  profiles: ProfileList[] = [];
  filteredProfiles: ProfileList[] = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.getProfiles();
  }

  getProfiles(): void {
    this.loading = true;
    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.filteredProfiles = profiles;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los perfiles.',
        });
        this.loading = false;
      },
    });
  }

  createProfile(): void {
    this.router.navigate(['/configuration/profiles/create']);
  }
  editProfile(profile: ProfileList): void {
    this.router.navigate(['/configuration/profiles/edit', profile.id]);
  }
  deleteProfile(profile: ProfileList): void {
    this.userService.getAllUsers().subscribe((users) => {
      const assignedUsers = users.filter(
        (u) => u.roles?.some((r) => r === profile.name) // o r.id === profile.id según tu modelo
      );

      if (assignedUsers.length > 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se puede eliminar el perfil "${profile.name}" porque está asignado a uno o varios usuarios.`,
        });
        return;
      }

      // confirmación y eliminación normal
      this.confirmationService.confirm({
        message: `¿Está seguro que desea eliminar el perfil "${profile.name}"?`,
        header: 'Confirmar eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Si, eliminar',
        rejectLabel: 'Cancelar',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => {
          this.profileService.deleteProfile(profile.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Perfil eliminado exitosamente.',
              });
              this.getProfiles();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el perfil.',
              });
            },
          });
        },
      });
    });
  }
}
