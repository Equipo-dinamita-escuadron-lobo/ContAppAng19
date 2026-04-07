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
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-view-enterprise',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  templateUrl: './view-enterprise.component.html',
  styleUrl: './view-enterprise.component.css',
})
export class ViewEnterpriseComponent implements OnInit {
  entData: EntData | null = null;
  enterpriseData: EnterpriseDetails | null = null;
  loading: boolean = false;
  showSuccessModal: boolean = false;
  showArchiveConfirm: boolean = false;
  showArchiveSuccessModal: boolean = false;

  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  // Controla la visibilidad del modal
  showCompleteModal: boolean = false;

  // (Opcional - futuro) controla si la empresa está completa
  // Por ahora lo dejamos en false para que siempre se muestre el mensaje
  enterpriseCompleta: boolean = false;

  // (Opcional - futuro) porcentaje dinámico
  completionPercentage: number = 0;

  // valor objetivo (lo puedes cambiar luego dinámicamente)
  targetPercentage: number = 80;

  // valores del círculo
  radius: number = 45;
  circumference: number = 2 * Math.PI * this.radius;

  // offset dinámico (esto mueve el borde)
  strokeDashoffset: number = this.circumference;
  
  constructor(
    private router: Router,
    private enterpriseService: EnterpriseService,
  ) {}

  ngOnInit(): void {
    this.loadEnterpriseData();
    // 🔥 iniciar animación
    setTimeout(() => {
      this.animateProgress();
    }, 500);
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
        typeof liability === 'object' ? liability.name : liability,
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

  // ==================== MÉTODOS PARA MODAL COMPLETAR EMPRESA ====

  // Abrir modal
  openCompleteModal(): void {
    this.showCompleteModal = true;
  }

  // Cerrar modal
  closeCompleteModal(): void {
    this.showCompleteModal = false;
  }

  // Ir a crear impuestos
  goToCreateTaxes(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/gen-masters/taxes/create']);
  }

  // Ir a crear materias (pendiente conectar ruta real)
  goToCreateSubjects(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/gen-masters/subjects/list']);
  }

  openArchiveConfirmation(): void {
    this.showArchiveConfirm = true;
  }

  cancelArchive(): void {
    this.showArchiveConfirm = false;
  }

  confirmArchive(): void {
    const enterpriseId = this.entData?.id;
    if (!enterpriseId) return;

    this.enterpriseService.archiveEnterprise(enterpriseId).subscribe({
      next: () => {
        this.showArchiveConfirm = false;
        this.showArchiveSuccessModal = true;
      },
      error: (error) => {
        console.error('Error al archivar la empresa:', error);
        this.showArchiveConfirm = false;
      },
    });
  }

  closeArchiveSuccess(): void {
    this.showArchiveSuccessModal = false;
  }

  // Completar empresa
  completeEnterprise(): void {
    this.closeCompleteModal();
    this.goToEdit();
  }

  // ==================== ANIMACIÓN PROGRESO ====================
  animateProgress(): void {
    const duration = 1200; // duración total (ms)
    const steps = 60; // suavidad
    const increment = this.targetPercentage / steps;
    const intervalTime = duration / steps;

    let current = 0;

    const interval = setInterval(() => {
      current += increment;

      if (current >= this.targetPercentage) {
        current = this.targetPercentage;
        clearInterval(interval);
      }

      // actualizar porcentaje (texto)
      this.completionPercentage = Math.round(current);

      // calcular offset del círculo
      const progressRatio = current / 100;
      this.strokeDashoffset = this.circumference * (1 - progressRatio);
    }, intervalTime);
  }
}
