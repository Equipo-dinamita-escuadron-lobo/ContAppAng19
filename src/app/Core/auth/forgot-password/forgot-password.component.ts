import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  emailSent: boolean = false;
  errorMessage: string = '';

  authService: AuthService = inject(AuthService);

  constructor(public router: Router) {}

  forgotForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onSubmit() {
    if (!this.forgotForm.valid) return;

    const email = this.forgotForm.value.email || '';

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.emailSent = true;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        this.errorMessage = 'Error al enviar el email. Verifica tu correo.';
        this.emailSent = false;
      }
    });
  }
}
