import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProfileService } from '../../Services/profile.service';
import { ProfileCreateRequest } from '../../Models/Profile';

@Component({
  selector: 'app-profile-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './profile-create.component.html',
  styleUrl: './profile-create.component.css',
})
export class ProfileCreateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(ProfileService);

  addForm: FormGroup;

  constructor() {
    this.addForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.addForm.valid) {
      const formValue = this.addForm.value;

      // Validar si ya existe antes de crear
      this.profileService.findByName(formValue.name).subscribe({
        next: (existingProfile) => {
          if (existingProfile && existingProfile.length > 0) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Ya existe un perfil con este nombre.',
            });
          } else {
            // Si no existe, lo creamos
            const profileData: ProfileCreateRequest = {
              name: formValue.name,
              description: formValue.description,
            };

            this.profileService.createProfile(profileData).subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Perfil creado exitosamente!',
                  life: 3000,
                });
                setTimeout(() => {
                  this.goBack();
                }, 3000);
              },
              error: (error) => {
                console.error('Error al crear el perfil:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo crear el perfil.',
                });
              },
            });
          }
        },
        error: (error) => {
          console.error('Error verificando nombre de perfil:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo verificar el nombre del perfil.',
          });
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addForm.controls).forEach((key) => {
      const control = this.addForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/profiles/list']);
  }

  getFieldError(fieldName: string): string {
    const field = this.addForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
    }
    return '';
  }
}
