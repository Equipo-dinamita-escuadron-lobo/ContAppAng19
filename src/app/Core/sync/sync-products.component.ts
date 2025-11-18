import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LocalStorageMethods } from '../../Shared/Methods/local-storage.method';
import { SyncService } from './services/sync.service';

interface SyncOption {
  id: string;
  title: string;
  description: string;
  syncMethod: (enterpriseId: string) => void;
  icon: string;
  loading: boolean;
  lastSync?: Date;
}

@Component({
  selector: 'app-sync-products',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './sync-products.component.html',
  styleUrl: './sync-products.component.css'
})
export class SyncProductsComponent implements OnInit {
  enterpriseId: string = '';
  syncOptions: SyncOption[] = [];

  constructor(
    private syncService: SyncService,
    private localStorageMethods: LocalStorageMethods,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethods.getIdEnterprise();

    if (!this.enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se encontró el ID de la empresa. Por favor, inicie sesión nuevamente.',
        life: 5000
      });
      return;
    }

    this.initializeSyncOptions();
  }

  private initializeSyncOptions(): void {
    this.syncOptions = [
      {
        id: 'stock',
        title: 'Stock',
        description: 'Sincroniza los productos en el módulo de stock/inventario',
        syncMethod: (enterpriseId: string) => this.syncStock(enterpriseId),
        icon: 'pi pi-box',
        loading: false
      },
      {
        id: 'weighted-average',
        title: 'Promedio Ponderado',
        description: 'Sincroniza los productos en el kardex de promedio ponderado',
        syncMethod: (enterpriseId: string) => this.syncWeightedAverage(enterpriseId),
        icon: 'pi pi-chart-line',
        loading: false
      },
      {
        id: 'peps',
        title: 'PEPS',
        description: 'Sincroniza los productos en el kardex de PEPS (Primeras Entradas, Primeras Salidas)',
        syncMethod: (enterpriseId: string) => this.syncPeps(enterpriseId),
        icon: 'pi pi-sort-amount-up',
        loading: false
      }
    ];
  }

  private syncStock(enterpriseId: string): void {
    const option = this.syncOptions.find(opt => opt.id === 'stock');
    if (!option) return;

    option.loading = true;
    this.syncService.syncStock(enterpriseId).subscribe({
      next: (response) => {
        option.loading = false;
        option.lastSync = new Date();

        this.messageService.add({
          severity: 'success',
          summary: 'Sincronización Exitosa',
          detail: response.message || 'Stock sincronizado correctamente',
          life: 5000
        });
      },
      error: (error) => {
        option.loading = false;
        const errorMessage = error?.error?.message || 'Error al sincronizar stock';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Sincronización',
          detail: errorMessage,
          life: 7000
        });
      }
    });
  }

  private syncWeightedAverage(enterpriseId: string): void {
    const option = this.syncOptions.find(opt => opt.id === 'weighted-average');
    if (!option) return;

    option.loading = true;
    this.syncService.syncWeightedAverage(enterpriseId).subscribe({
      next: (response) => {
        option.loading = false;
        option.lastSync = new Date();

        this.messageService.add({
          severity: 'success',
          summary: 'Sincronización Exitosa',
          detail: response.message || 'Kardex promedio ponderado sincronizado correctamente',
          life: 5000
        });
      },
      error: (error) => {
        option.loading = false;
        const errorMessage = error?.error?.message || 'Error al sincronizar kardex promedio ponderado';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Sincronización',
          detail: errorMessage,
          life: 7000
        });
      }
    });
  }

  private syncPeps(enterpriseId: string): void {
    const option = this.syncOptions.find(opt => opt.id === 'peps');
    if (!option) return;

    option.loading = true;
    this.syncService.syncPeps(enterpriseId).subscribe({
      next: (response) => {
        option.loading = false;
        option.lastSync = new Date();

        this.messageService.add({
          severity: 'success',
          summary: 'Sincronización Exitosa',
          detail: response.message || 'Kardex PEPS sincronizado correctamente',
          life: 5000
        });
      },
      error: (error) => {
        option.loading = false;
        const errorMessage = error?.error?.message || 'Error al sincronizar kardex PEPS';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Sincronización',
          detail: errorMessage,
          life: 7000
        });
      }
    });
  }

  syncProducts(option: SyncOption): void {
    if (!this.enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede realizar la sincronización. ID de empresa no encontrado.',
        life: 5000
      });
      return;
    }

    // Ejecutar el método de sincronización correspondiente
    option.syncMethod(this.enterpriseId);
  }

  syncAll(): void {
    if (!this.enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede realizar la sincronización. ID de empresa no encontrado.',
        life: 5000
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Sincronización Iniciada',
      detail: 'Iniciando sincronización de todos los módulos...',
      life: 3000
    });

    // Sincronizar todos los módulos secuencialmente
    this.syncOptions.forEach((option, index) => {
      setTimeout(() => {
        this.syncProducts(option);
      }, index * 1000); // Esperar 1 segundo entre cada sincronización
    });
  }

  getLastSyncText(lastSync?: Date): string {
    if (!lastSync) {
      return 'Nunca sincronizado';
    }

    return `Última sincronización: ${lastSync.toLocaleString('es-ES')}`;
  }

  isAnySyncing(): boolean {
    return this.syncOptions.some(option => option.loading);
  }
}
