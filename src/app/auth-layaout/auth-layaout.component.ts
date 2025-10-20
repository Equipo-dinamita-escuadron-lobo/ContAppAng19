// auth-layaout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ¡Importante para ng-content!

@Component({
  selector: 'app-auth-layaout',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './auth-layaout.component.html',
  styleUrl: './auth-layaout.component.css'
})
export class AuthLayaoutComponent {

}