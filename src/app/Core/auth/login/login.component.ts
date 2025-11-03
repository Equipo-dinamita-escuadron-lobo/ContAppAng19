import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Login } from '../models/login';
import { ButtonModule } from 'primeng/button';
import { PublicFooterComponent } from '../../../PublicSite/public-footer/public-footer.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,CommonModule, RouterModule, ButtonModule, PublicFooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginFail: boolean = false;
  invalidForm: boolean = false;

  authService: AuthService = inject(AuthService);

  constructor(public router: Router,) {

  }

  loginForm = new FormGroup({
    //! Valores por defecto servidor en desarrollo cambiar a '' en produccion
    username: new FormControl('contables2@unicauca.edu.co', [Validators.required]),
    password: new FormControl('12345', [Validators.required]),
  });

  onSubmit() {
    if (!this.loginForm.valid) return;

    //Cramos el objeto de tipo Login par enviar al servidor
    const login: Login = {
      username: this.loginForm.value.username || '',
      password: this.loginForm.value.password || '',
    };

    this.authService.login(login).subscribe();

  }

}
