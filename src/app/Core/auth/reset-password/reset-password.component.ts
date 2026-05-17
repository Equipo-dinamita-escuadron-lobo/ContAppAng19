import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthLayoutComponent } from '../../../auth-layout/auth-layout.component';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  standalone: true, 
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    RouterModule, 
    ButtonModule,
    AuthLayoutComponent, 
    MessageModule 
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  passwordReset: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  authService: AuthService = inject(AuthService);
  route: ActivatedRoute = inject(ActivatedRoute);

  constructor(public router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  // Validator function for password matching
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const newPassword = formGroup.get('newPassword')?.value;
      const confirmPassword = formGroup.get('confirmPassword')?.value;
      
      return newPassword === confirmPassword ? null : { mismatch: true };
    };
  }

  resetForm = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: this.passwordMatchValidator() });

  onSubmit() {
    if (!this.resetForm.valid || !this.token) return;

    const newPassword = this.resetForm.value.newPassword || '';

    this.isLoading = true;
    this.authService.resetPassword(this.token, newPassword).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: () => {
        this.passwordReset = true;
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Reset password error:', error);
        
        // Manejar diferentes tipos de errores del backend
        if (error.status === 400) {
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'El enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'Error interno del servidor. Por favor intenta más tarde.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al restablecer la contraseña. El enlace puede haber expirado.';
        }
        
        this.passwordReset = false;
      }
    });
  }
}
