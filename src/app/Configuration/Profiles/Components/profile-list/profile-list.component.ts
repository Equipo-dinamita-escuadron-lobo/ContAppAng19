import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Profile } from '../../Models/Profile';
import { Router } from '@angular/router';
import { ProfileService } from '../../Services/profile.service';

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
  profiles: Profile[] = [];
  loading: boolean = false;

  globalFilterFields: string[] = ['name', 'description'];

  displayedColumns: any[] = ['Nombre', 'Descripción', 'Acciones'];

  constructor(private profileService: ProfileService, private router: Router) {}

  ngOnInit(): void {
    this.getProfiles();
  }

  getProfiles(): void {
    this.loading = true;
    this.profileService.getAllProfiles().subscribe(
      (data) => {
        this.profiles = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error al obtener perfiles:', error);
        this.loading = false;
      }
    );
  }

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
