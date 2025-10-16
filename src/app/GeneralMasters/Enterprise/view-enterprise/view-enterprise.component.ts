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

  // Retornan directamente los nombres recibidos del backend
  getEnterpriseTypeName(): string {
    if (!this.enterpriseData?.enterpriseType) return 'No disponible';
    return (
      (this.enterpriseData.enterpriseType as any).name ||
      this.enterpriseData.enterpriseType ||
      'No disponible'
    );
  }

  getPersonTypeName(): string {
    if (!this.enterpriseData?.personType) return 'No disponible';
    return (
      (this.enterpriseData.personType as any).name ||
      this.enterpriseData.personType ||
      'No disponible'
    );
  }

  getTaxPayerTypeName(): string {
    if (!this.enterpriseData?.taxPayerType) return 'No disponible';
    return (
      (this.enterpriseData.taxPayerType as any).name ||
      this.enterpriseData.taxPayerType ||
      'No disponible'
    );
  }

  getTaxLiabilitiesNames(): string {
    if (
      !this.enterpriseData?.taxLiabilities ||
      this.enterpriseData.taxLiabilities.length === 0
    )
      return 'No disponible';
    return this.enterpriseData.taxLiabilities
      .map((liability: any) => liability.name || liability)
      .join(', ');
  }

  getLocationData(field: string): string {
    if (!this.enterpriseData?.location) return 'No disponible';
    const location = this.enterpriseData.location;
    switch (field) {
      case 'country':
        return location.country?.name || location.country || 'No disponible';
      case 'department':
        return (
          location.department?.name || location.department || 'No disponible'
        );
      case 'city':
        return location.city?.name || location.city || 'No disponible';
      case 'address':
        return location.address || 'No disponible';
      default:
        return 'No disponible';
    }
  }
}
