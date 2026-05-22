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
  public saveEnterpriseData(data: EntData): void {
    localStorage.setItem('entData', JSON.stringify(data));
  }

  public loadEnterpriseData(): EntData | null {
    const enterpriseData = localStorage.getItem('entData');
    if (enterpriseData) {
      const parsedData = JSON.parse(enterpriseData);
      return parsedData;
    }
    return null;
  }

  public getIdEnterprise(): string{
    const enterpriseData = localStorage.getItem('entData');
    if (enterpriseData) {
      const parsedData = JSON.parse(enterpriseData);
      return parsedData.id ?? '';
    }
    return '';
  }

  public getInventoryConfigType(): 'PEPS' | 'WEIGHTED_AVERAGE' {
    const enterpriseData = localStorage.getItem('entData');
    if (enterpriseData) {
      const parsedData = JSON.parse(enterpriseData);
      return parsedData.inventoryConfigType || 'WEIGHTED_AVERAGE';
    }
    return 'WEIGHTED_AVERAGE';
  }

  public clearEnterpriseData(): void {
    localStorage.removeItem('entData');
  }

  public clearLocalStorage(): void {
    localStorage.clear();
  }
}
