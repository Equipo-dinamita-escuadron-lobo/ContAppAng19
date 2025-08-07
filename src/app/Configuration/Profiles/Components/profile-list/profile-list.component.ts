import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-profile-list',
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
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.css',
})
export class ProfileListComponent {
  profiles: any[] = [];

  globalFilterFields: string[] = ['name', 'description'];

  displayedColumns: any[] = ['Nombre', 'Descripción', 'Acciones'];

  redirectTo(arg0: string) {
    throw new Error('Method not implemented.');
  }
  redirectToDelete(arg0: any) {
    throw new Error('Method not implemented.');
  }
  redirectToEdit(arg0: any) {
    throw new Error('Method not implemented.');
  }
}
