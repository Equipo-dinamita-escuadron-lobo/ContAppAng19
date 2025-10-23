import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/User';

@Component({
  selector: 'app-user-edit',
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
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
})
export class UserEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);

  userForm: FormGroup;
  userId: string = '';
  originalEmail: string = '';

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
          Validators.pattern(UserEditComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern(UserEditComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Opcional en edición
      roles: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRoles();
    this.loadUser();
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
          { label: 'Administrador', value: 'Administrador' },
          { label: 'Estudiante', value: 'Estudiante' },
          { label: 'Profesor', value: 'Profesor' },
        ];
      }
    });
  }

  private loadUser(): void {
    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        this.originalEmail = user.email;
        // Filtrar solo roles personalizados
        const customRoles = (user.roles || []).filter(role =>
          ['administrador', 'estudiante', 'profesor'].includes(role)
        );
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '', // Dejar vacío para no cambiar
          roles: customRoles,
        });
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el usuario.',
        });
      },
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      // Si el email cambió, verificar unicidad (excluyendo el actual)
      if (formValue.email !== this.originalEmail) {
        this.userService.findByEmail(formValue.email).subscribe({
          next: (existingUsers) => {
            const otherUsers = existingUsers.filter(u => u.id !== this.userId);
            if (otherUsers.length > 0) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Ya existe un usuario con este correo electrónico.',
              });
              return;
            }
            this.updateUser(formValue);
          },
          error: (error) => {
            console.error('Error verificando email:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo verificar el correo electrónico.',
            });
          },
        });
      } else {
        this.updateUser(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private updateUser(formValue: any): void {
    // Si password está vacío, no enviarlo para mantener el actual
    const updateData = { ...formValue };
    if (!updateData.password) {
      delete updateData.password;
    }

    this.userService.updateUser(this.userId, updateData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario actualizado exitosamente!',
          life: 3000,
        });
        setTimeout(() => {
          this.goBack();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el usuario.',
        });
      },
    });
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
