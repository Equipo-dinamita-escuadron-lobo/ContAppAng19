import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RegisterUser } from '../models/register-user';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerFail: boolean = false;
  invalidForm: boolean = false;

  authService: AuthService = inject(AuthService);

  constructor(public router: Router) {}

  registerForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (!this.registerForm.valid) {
      this.invalidForm = true;
      return;
    }

    this.invalidForm = false;
    this.registerFail = false;

    const user: RegisterUser = {
      username: this.registerForm.value.username || '',
      email: this.registerForm.value.email || '',
      firstName: this.registerForm.value.firstName || '',
      lastName: this.registerForm.value.lastName || '',
      password: this.registerForm.value.password || '',
    };

    this.authService.register(user).subscribe({
      next: () => {
        // Registro exitoso, redirigir al login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Register error:', error);
        this.registerFail = true;
      }
    });
  }
}
