import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { AuthLayoutComponent } from '../../../auth-layout/auth-layout.component';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  forgotForm: FormGroup;
  isLoading = false;

  constructor() {
    this.forgotForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const email = (this.forgotForm.value.email || '').trim().toLowerCase();
    this.isLoading = true;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Correo Enviado',
          detail: 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.',
          life: 6000,
        });
        this.forgotForm.reset();
        setTimeout(() => {
          this.goToLogin();
        }, 1200);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de conexión',
            detail: 'No fue posible conectar con el servicio de recuperación. Verifica que el backend esté corriendo y la URL del ambiente actual sea correcta.',
            life: 7000,
          });
          return;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo enviar el correo',
          detail: 'El servicio respondió con error. Intenta nuevamente en unos minutos.',
          life: 7000,
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.forgotForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }


  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}