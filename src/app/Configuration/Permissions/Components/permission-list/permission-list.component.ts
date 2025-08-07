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
  selector: 'app-permission-list',
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
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.css',
})
export class PermissionListComponent {
  profiles: any[] = [];

  globalFilterFields: string[] = ['Perfil'];

  displayedColumns: any[] = ['Perfil', 'Permisos'];

  redirectTo(arg0: string) {
    throw new Error('Method not implemented.');
  }
  redirectToView(arg0: any) {
    throw new Error('Method not implemented.');
  }
}
