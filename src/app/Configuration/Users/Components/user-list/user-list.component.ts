import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/User';
import { TableModule } from 'primeng/table';
import { Button, ButtonModule } from 'primeng/button';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIcon, InputIconModule } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
  ],
})
export class UserListComponent implements OnInit {
  redirectToView(arg0: any) {
    throw new Error('Method not implemented.');
  }
  redirectToDelete(arg0: any) {
    throw new Error('Method not implemented.');
  }
  users: User[] = [];
  loading: boolean = false;

  globalFilterFields: string[] = [
    'firstName',
    'lastName',
    'email',
    'username',
    'roles',
  ];

  displayedColumns: any[] = [
    'Nombre',
    'Apellido',
    'Correo',
    'Usuario',
    'Roles',
    'Acciones',
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe(
      (data) => {
        this.users = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading = false;
      }
    );
  }
  redirectToEdit(arg0: any) {
    throw new Error('Method not implemented.');
  }
  redirectTo(arg0: string) {
    throw new Error('Method not implemented.');
  }
}
