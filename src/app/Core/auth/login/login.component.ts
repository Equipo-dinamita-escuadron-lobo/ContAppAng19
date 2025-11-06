import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { Login } from '../models/login';
import { AuthLayoutComponent } from '../../../auth-layout/auth-layout.component';

@Component({
  selector: 'app-login',
  standalone: true,
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const login: Login = {
      username: this.loginForm.value.username || '',
      password: this.loginForm.value.password || '',
    };

    this.authService.login(login).subscribe({
      // La navegación en caso de éxito ya se maneja dentro del AuthService
      error: (err) => {
        let errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';
        
        // Manejar diferentes tipos de errores del backend
        if (err.status === 401) {
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage = 'Credenciales inválidas. Por favor verifica tu usuario y contraseña.';
          }
        } else if (err.status === 403) {
          errorMessage = 'Tu cuenta está inactiva. Por favor contacta al administrador.';
        } else if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor intenta más tarde.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error de Autenticación',
          detail: errorMessage,
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  // Removed getFieldError method as individual p-message are used now
}