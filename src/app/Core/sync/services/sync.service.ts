import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { StockSyncService } from './stock-sync.service';
import { KardexWeightedAverageSyncService } from './kardex-weighted-average-sync.service';
import { KardexPepsSyncService } from './kardex-peps-sync.service';

export interface SyncResponse {
  data: string;
  status: number;
  message: string;
}

export interface SyncAllResponse {
  stock: SyncResponse;
  weightedAverage: SyncResponse;
  peps: SyncResponse;
}

/**
 * Servicio principal de sincronización que coordina todos los módulos
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  constructor(
    private stockSyncService: StockSyncService,
    private kardexWeightedAverageSyncService: KardexWeightedAverageSyncService,
    private kardexPepsSyncService: KardexPepsSyncService
  ) {}

  /**
   * Sincroniza productos en el módulo de stock
   */
  syncStock(enterpriseId: string): Observable<SyncResponse> {
    return this.stockSyncService.syncProducts(enterpriseId);
  }

  /**
   * Sincroniza productos en el módulo de kardex con promedio ponderado
   */
  syncWeightedAverage(enterpriseId: string): Observable<SyncResponse> {
    return this.kardexWeightedAverageSyncService.syncProducts(enterpriseId);
  }

  /**
   * Sincroniza productos en el módulo de kardex con PEPS
   */
  syncPeps(enterpriseId: string): Observable<SyncResponse> {
    return this.kardexPepsSyncService.syncProducts(enterpriseId);
  }

  /**
   * Sincroniza todos los módulos simultáneamente
   * @param enterpriseId ID de la empresa
   * @returns Observable con todas las respuestas de sincronización
   */
  syncAll(enterpriseId: string): Observable<SyncAllResponse> {
    return forkJoin({
      stock: this.syncStock(enterpriseId),
      weightedAverage: this.syncWeightedAverage(enterpriseId),
      peps: this.syncPeps(enterpriseId)
    });
  }
}
