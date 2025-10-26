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

// Custom Validator for Passwords
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsNotMatching: true };
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
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordsMatchValidator });
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

    this.authService.register(user).subscribe({
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
        const detail = err.error?.message || 'No se pudo completar el registro.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: detail,
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