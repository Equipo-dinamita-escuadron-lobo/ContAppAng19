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
import { AuthLayaoutComponent } from '../../../auth-layaout/auth-layaout.component';

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
    AuthLayaoutComponent,
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Autenticación',
          detail: 'El usuario o la contraseña son incorrectos.',
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