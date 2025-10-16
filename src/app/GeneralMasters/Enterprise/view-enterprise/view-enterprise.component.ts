import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import {
  LocalStorageMethods,
  EntData,
} from '../../../Shared/Methods/local-storage.method';
import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseDetails } from '../models/EnterpriseDetails';

@Component({
  selector: 'app-view-enterprise',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './view-enterprise.component.html',
  styleUrl: './view-enterprise.component.css',
})
export class ViewEnterpriseComponent implements OnInit {
  entData: EntData | null = null;
  enterpriseData: EnterpriseDetails | null = null;
  loading: boolean = false;

  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  constructor(
    private router: Router,
    private enterpriseService: EnterpriseService
  ) {}

  ngOnInit(): void {
    this.loadEnterpriseData();
  }

  loadEnterpriseData(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();

    if (this.entData?.id) {
      this.loading = true;
      this.enterpriseService.getEnterpriseById(this.entData.id).subscribe({
        next: (data: EnterpriseDetails) => {
          this.enterpriseData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar datos de la empresa:', error);
          this.loading = false;
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }

  goToEdit(): void {
    this.router.navigate(['/enterprise/edit']);
  }

  /** ==================== GETTERS DE DATOS ==================== */

  // Tipo de empresa
  getEnterpriseTypeName(): string {
    if (!this.enterpriseData?.enterpriseType) return 'No disponible';
    const type = this.enterpriseData.enterpriseType;
    return typeof type === 'object' ? type.name : type;
  }

  // Tipo de persona
  getPersonTypeName(): string {
    if (!this.enterpriseData?.personType) return 'No disponible';
    const type = this.enterpriseData.personType;
    return typeof type === 'object' ? type.type : type;
  }

  // Razón social (business name)
  getBusinessName(): string {
    if (!this.enterpriseData?.personType) return 'No disponible';
    const person = this.enterpriseData.personType;
    return typeof person === 'object' && person.bussinessName
      ? person.bussinessName
      : 'No disponible';
  }

  // Tipo de contribuyente
  getTaxPayerTypeName(): string {
    if (!this.enterpriseData?.taxPayerType) return 'No disponible';
    const type = this.enterpriseData.taxPayerType;
    return typeof type === 'object' ? type.name : type;
  }

  // Responsabilidades tributarias
  getTaxLiabilitiesNames(): string {
    if (
      !this.enterpriseData?.taxLiabilities ||
      this.enterpriseData.taxLiabilities.length === 0
    )
      return 'No disponible';
    return this.enterpriseData.taxLiabilities
      .map((liability: any) =>
        typeof liability === 'object' ? liability.name : liability
      )
      .join(', ');
  }

  // Localización
  getLocationData(field: string): string {
    if (!this.enterpriseData?.location) return 'No disponible';
    const location = this.enterpriseData.location;
    switch (field) {
      case 'country':
        return typeof location.country === 'object'
          ? location.country.name
          : location.country;
      case 'department':
        return typeof location.department === 'object'
          ? location.department.name
          : location.department;
      case 'city':
        return typeof location.city === 'object'
          ? location.city.name
          : location.city;
      case 'address':
        return location.address || 'No disponible';
      default:
        return 'No disponible';
    }
  }
}
