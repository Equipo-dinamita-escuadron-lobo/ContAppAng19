import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
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
import { finalize } from 'rxjs/operators';

export function strongPasswordValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.value as string;

  if (!password) {
    return null;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*#?&]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar
    ? null
    : {
        weakPassword: {
          hasUppercase,
          hasLowercase,
          hasNumber,
          hasSpecialChar,
        },
      };
}

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
      password: [
        '',
        [Validators.minLength(8), Validators.maxLength(20), strongPasswordValidator],
      ], // Opcional en edición. Si se informa, debe cumplir política.
      roles: [[], Validators.required],
    });
  }

  get passwordControl(): AbstractControl | null {
    return this.userForm.get('password');
  }

  get passwordValue(): string {
    return this.passwordControl?.value || '';
  }

  shouldShowPasswordChecklist(): boolean {
    const control = this.passwordControl;
    return !!control && (control.touched || control.dirty || this.passwordValue.length > 0);
  }

  hasMinLength(): boolean {
    return this.passwordValue.length >= 8;
  }

  hasMaxLength(): boolean {
    return this.passwordValue.length <= 20;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.passwordValue);
  }

  hasNumber(): boolean {
    return /\d/.test(this.passwordValue);
  }

  hasSpecialChar(): boolean {
    return /[@$!%*#?&]/.test(this.passwordValue);
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRoles();
    this.loadUser();
  }

  private loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roleOptions = roles
          .filter((role) => !this.isIdpTechnicalRole(role))
          .map((role) => ({
            label: role.charAt(0).toUpperCase() + role.slice(1),
            value: role,
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

  private isIdpTechnicalRole(role: string): boolean {
    const normalizedRole = role.toLowerCase();

    return (
      normalizedRole === 'offline_access' ||
      normalizedRole === 'uma_authorization' ||
      normalizedRole.startsWith('default-roles-')
    );
  }

  private loadUser(): void {
    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        this.originalEmail = user.email;
        const businessRoles = (user.roles || []).filter(
          (role) => !this.isIdpTechnicalRole(role)
        );

        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '',
          roles: businessRoles,
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
    // Agregar username si no está presente (usar email como username por defecto)
    if (!updateData.username) {
      updateData.username = this.originalEmail.split('@')[0];
    }

    this.isLoading = true;
    this.userService.updateUser(this.userId, updateData).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario editado',
          detail: 'Usuario editado con exito.',
          life: 3000,
        });
        setTimeout(() => {
          this.goBack();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        let errorMessage = 'No se pudo actualizar el usuario.';

        if (error.status === 409) {
          errorMessage =
            error.error?.message ||
            'Ya existe un usuario con este correo electronico o nombre de usuario.';
        } else if (error.status === 400) {
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage =
              'Los datos proporcionados no son validos. Por favor verifica la informacion.';
          }
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor intenta mas tarde.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error al editar usuario',
          detail: errorMessage,
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
