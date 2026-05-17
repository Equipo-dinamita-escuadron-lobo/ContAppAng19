import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { RegisterUser } from '../models/register-user';
import { AuthLayoutComponent } from '../../../auth-layout/auth-layout.component';
import { finalize } from 'rxjs/operators';

// Custom Validator for Passwords
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsNotMatching: true };
}

export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
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
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ToastModule,
    AuthLayoutComponent,
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  registerForm: FormGroup;
  isLoading = false;

  private static readonly ONLY_LETTERS_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1 ]+$/;

  constructor() {
    this.registerForm = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.pattern(RegisterComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern(RegisterComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          strongPasswordValidator,
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordsMatchValidator });
  }

  get passwordControl(): AbstractControl | null {
    return this.registerForm.get('password');
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

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const user: RegisterUser = {
      username: this.registerForm.value.email || '',
      email: this.registerForm.value.email || '',
      firstName: this.registerForm.value.firstName || '',
      lastName: this.registerForm.value.lastName || '',
      password: this.registerForm.value.password || '',
    };

    this.isLoading = true;
    this.authService.register(user).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: '¡Registro exitoso! Serás redirigido al login.',
          life: 3000,
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        let errorMessage = 'No se pudo completar el registro.';
        
        // Manejar diferentes tipos de errores del backend
        if (err.status === 409) {
          errorMessage = err.error?.message || 'Ya existe un usuario con este correo electrónico.';
        } else if (err.status === 400) {
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage = 'Los datos proporcionados no son válidos. Por favor verifica la información.';
          }
        } else if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor intenta más tarde.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error en el Registro',
          detail: errorMessage,
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.registerForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}