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

    const email = this.forgotForm.value.email || '';

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Petición Enviada',
          detail: 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.',
          life: 5000,
        });
        this.forgotForm.reset();
      },
      error: (err) => {
        // Por seguridad, mostramos el mismo mensaje de éxito incluso si hay un error
        // (ej: el usuario no existe). Esto previene la enumeración de correos.
        this.messageService.add({
          severity: 'success',
          summary: 'Petición Enviada',
          detail: 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.',
          life: 5000,
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.forgotForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  // Removed getFieldError method as individual p-message are used now

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}