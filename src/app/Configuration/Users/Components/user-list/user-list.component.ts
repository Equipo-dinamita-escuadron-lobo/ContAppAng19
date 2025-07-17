import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/User';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  imports: [TableModule, Button, IconField, InputIcon, CommonModule],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading: boolean = false;

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
}
