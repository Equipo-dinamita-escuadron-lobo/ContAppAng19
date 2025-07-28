import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { LocalStorageMethods, EntData } from '../../../Shared/Methods/local-storage.method';
import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseDetails } from '../models/EnterpriseDetails';

@Component({
  selector: 'app-view-enterprise',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './view-enterprise.component.html',
  styleUrl: './view-enterprise.component.css'
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
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }

  // Métodos para obtener nombres de los tipos
  getEnterpriseTypeName(type: any): string {
    if (!type) return 'No disponible';
    
    const types: { [key: number]: string } = {
      1: 'Privada',
      2: 'Oficial', 
      3: 'Mixta'
    };
    
    const typeId = typeof type === 'object' ? type.id : type;
    return types[typeId] || (typeof type === 'object' ? type.name : type) || 'No disponible';
  }

  getPersonTypeName(type: any): string {
    if (!type) return 'No disponible';
    
    if (typeof type === 'string') {
      return type === 'juridica' ? 'Persona Jurídica' : 'Persona Natural';
    }
    
    return type.name || 'No disponible';
  }

  getTaxPayerTypeName(type: any): string {
    if (!type) return 'No disponible';
    
    const types: { [key: number]: string } = {
      1: 'Responsable de IVA',
      2: 'No responsable de IVA',
      3: 'Gran contribuyente'
    };
    
    const typeId = typeof type === 'object' ? type.id : type;
    return types[typeId] || (typeof type === 'object' ? type.name : type) || 'No disponible';
  }

  getTaxLiabilitiesNames(liabilities: any[] | undefined): string {
    if (!liabilities || liabilities.length === 0) return 'No disponible';
    
    const liabilityNames: { [key: number]: string } = {
      1: 'IVA',
      2: 'ICA', 
      3: 'Retención en la fuente',
      4: 'Retención de IVA'
    };
    
    return liabilities.map(liability => {
      const liabilityId = typeof liability === 'object' ? liability.id : liability;
      return liabilityNames[liabilityId] || (typeof liability === 'object' ? liability.name : liability) || 'Desconocido';
    }).join(', ');
  }

  getLocationData(field: string): string {
    if (!this.enterpriseData?.location) return 'No disponible';
    
    const location = this.enterpriseData.location;
    
    switch (field) {
      case 'country':
        return location.country?.name || location.country || 'No disponible';
      case 'department':
        return location.department?.name || location.department || 'No disponible';
      case 'city':
        return location.city?.name || location.city || 'No disponible';
      case 'address':
        return location.address || 'No disponible';
      default:
        return 'No disponible';
    }
  }
}
