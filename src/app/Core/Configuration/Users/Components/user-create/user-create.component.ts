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
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../Services/user.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-user-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css',
})
export class UserCreateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);

  userForm: FormGroup;
  isLoading = false;

  // Regex que permite solo letras (con acentos), ñ/Ñ y espacios
  private static readonly ONLY_LETTERS_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1 ]+$/;

  // Opciones para roles
  roleOptions: { label: string; value: string }[] = [];

  constructor() {
    this.userForm = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.pattern(UserCreateComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern(UserCreateComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      roles: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roleOptions = roles.map(role => ({
          label: role.charAt(0).toUpperCase() + role.slice(1),
          value: role
        }));
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        // Valores por defecto
        this.roleOptions = [
          { label: 'Administrador', value: 'administrador' },
          { label: 'Estudiante', value: 'estudiante' },
          { label: 'Profesor', value: 'profesor' },
        ];
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      const userData = {
        ...formValue,
        username: formValue.email, // Usar email como username
        roles: formValue.roles, // Ya es array
      };

      this.isLoading = true;
      this.userService.createUser(userData).pipe(
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario creado exitosamente!',
            life: 3000,
          });
          setTimeout(() => {
            this.goBack();
          }, 3000);
        },
        error: (error) => {
          console.error('Error al crear el usuario:', error);
          let errorMessage = 'No se pudo crear el usuario.';
          
          // Manejar diferentes tipos de errores del backend
          if (error.status === 409) {
            errorMessage = error.error?.message || 'Ya existe un usuario con este correo electrónico o nombre de usuario.';
          } else if (error.status === 400) {
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = 'Los datos proporcionados no son válidos. Por favor verifica la información.';
            }
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Por favor intenta más tarde.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error al Crear Usuario',
            detail: errorMessage,
          });
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/users/list']);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
      if (field.errors['pattern']) {
        return `El campo ${fieldName} solo debe contener letras y espacios`;
      }
      if (field.errors['email']) {
        return `El campo ${fieldName} debe ser un email válido`;
      }
    }
    return '';
  }
}
