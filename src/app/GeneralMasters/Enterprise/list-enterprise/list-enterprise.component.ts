import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseList } from '../models/EnterpriseList';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../Core/Components/Header/header.component';
import { DropdownModule } from "primeng/dropdown";
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { LocalStorageMethods, EntData } from '../../../Shared/Methods/local-storage.method';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-list-enterprise',
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    HeaderComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DropdownModule,
],
  templateUrl: './list-enterprise.component.html',
  styleUrl: './list-enterprise.component.css'
})
export class ListEnterpriseComponent {
  enterprises: EnterpriseList[] = [];
  filteredEnterprises: EnterpriseList[] = [];
  selectedStatus: string = 'active';
  searchTerm: string = '';
  showPdfModal: boolean = false;
  selectedPdfFile: File | null = null;

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router,
    private http: HttpClient
  ) {}

  LocalStorageMethods = new LocalStorageMethods();
  entData: EntData | null = null;

  ngOnInit() {
    this.getEnterpriseActive();
  }

  getEnterpriseActive() {
    this.enterpriseService.getEnterprisesActive().subscribe({
      next: (data: EnterpriseList[]) => {
        console.log('Datos de empresas recibidos:', data);
        this.enterprises = data;
        this.filteredEnterprises = [...this.enterprises];
      },
      error: (error) => {
        console.error('Error fetching enterprises:', error);
      }
    });
  }

  getEnterpriseInactive() {
    this.enterpriseService.getEnterprisesInactive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.enterprises = data;
        this.filteredEnterprises = [...this.enterprises];
      },
      error: (error) => {
        console.error('Error fetching inactive enterprises:', error);
      }
    });
  }

  filterEnterprises() {
    if (!this.searchTerm) {
      this.filteredEnterprises = [...this.enterprises];
    } else {
      this.filteredEnterprises = this.enterprises.filter(enterprise =>
        enterprise.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectEnterpriseStatus() {
    if (this.selectedStatus === 'active') {
      this.getEnterpriseActive();
    } else if (this.selectedStatus === 'inactive') {
      this.getEnterpriseInactive();
    } else {
      this.filteredEnterprises = [...this.enterprises];
    }
  }

  saveSelectedEnterprise(enterprise: any) {
    this.entData = {
      id: enterprise.id,
      name: enterprise.name,
      nit: enterprise.nit,
      logo: enterprise.logo
    };
    this.LocalStorageMethods.saveEnterpriseData(this.entData);
  }

  onCreateEnterprise(): void {
    this.router.navigate(['/enterprise/create']);
  }

  showPdfRutModal(): void {
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.selectedPdfFile = null;
  }

  onPdfFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdfFile = file;
      console.log('Archivo PDF seleccionado:', file.name);
    } else {
      console.error('Por favor selecciona un archivo PDF válido');
      this.selectedPdfFile = null;
    }
  }

  createEnterpriseFromPdf(): void {
    if (this.selectedPdfFile) {
      const formData = new FormData();
      formData.append('pdf', this.selectedPdfFile);

      this.http.post(`${environment.API_URL}enterprises/create-from-pdf`, formData).subscribe({
        next: (response) => {
          console.log('Empresa creada desde PDF:', response);
          this.closePdfModal();
          this.getEnterpriseActive(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al crear empresa desde PDF:', error);
        }
      });
    }
  }

  onImageError(event: any): void {
    console.error('Error loading image:', event);
    console.log('Enterprise data:', this.enterprises);
  }

  onImageLoad(enterprise: EnterpriseList): void {
    console.log('Image loaded successfully for enterprise:', enterprise.name, 'Logo URL:', enterprise.logo);
  }
}
