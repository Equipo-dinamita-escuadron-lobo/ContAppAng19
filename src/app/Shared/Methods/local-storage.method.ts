import { Injectable } from "@angular/core";

export interface EntData {
  id: string;
  name: string;
  nit: string;
  logo: string;
  inventoryConfigType?: 'PEPS' | 'WEIGHTED_AVERAGE';
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageMethods {
  
  private readonly ENTERPRISE_KEY = 'entData';

  /**
   * Guarda los datos completos de la empresa en localStorage
   */
  public saveEnterpriseData(data: EntData): void {
    localStorage.setItem(this.ENTERPRISE_KEY, JSON.stringify(data));
  }

  /**
   * Carga los datos de la empresa desde localStorage
   */
  public loadEnterpriseData(): EntData | null {
    const enterpriseData = localStorage.getItem(this.ENTERPRISE_KEY);
    if (enterpriseData) {
      try {
        const parsedData = JSON.parse(enterpriseData);
        return parsedData;
      } catch (error) {
        console.error('Error al parsear datos de empresa:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Obtiene solo el ID de la empresa
   */
  public getIdEnterprise(): string {
    const enterpriseData = this.loadEnterpriseData();
    return enterpriseData?.id || '';
  }

  /**
   * Obtiene el tipo de configuración de inventario actual
   */
  public getInventoryConfigType(): 'PEPS' | 'WEIGHTED_AVERAGE' {
    const enterpriseData = this.loadEnterpriseData();
    return enterpriseData?.inventoryConfigType || 'WEIGHTED_AVERAGE';
  }

  /**
   * Actualiza SOLO el tipo de configuración de inventario
   * sin modificar los demás datos de la empresa
   */
  public updateInventoryConfigType(newConfigType: 'PEPS' | 'WEIGHTED_AVERAGE'): boolean {
    const currentData = this.loadEnterpriseData();
    
    if (!currentData) {
      console.error('No hay datos de empresa en localStorage para actualizar');
      return false;
    }

    // Actualizar solo el campo inventoryConfigType
    const updatedData: EntData = {
      ...currentData,
      inventoryConfigType: newConfigType
    };

    this.saveEnterpriseData(updatedData);
    console.log(`Configuración de inventario actualizada a: ${newConfigType}`);
    return true;
  }

  /**
   * Actualiza múltiples campos de la empresa
   */
  public updateEnterpriseData(updates: Partial<EntData>): boolean {
    const currentData = this.loadEnterpriseData();
    
    if (!currentData) {
      console.error('No hay datos de empresa en localStorage para actualizar');
      return false;
    }

    const updatedData: EntData = {
      ...currentData,
      ...updates
    };

    this.saveEnterpriseData(updatedData);
    return true;
  }

  /**
   * Verifica si existe una empresa en localStorage
   */
  public hasEnterpriseData(): boolean {
    return this.loadEnterpriseData() !== null;
  }

  /**
   * Elimina los datos de la empresa
   */
  public clearEnterpriseData(): void {
    localStorage.removeItem(this.ENTERPRISE_KEY);
  }

  /**
   * Limpia todo el localStorage
   */
  public clearLocalStorage(): void {
    localStorage.clear();
  }
}
