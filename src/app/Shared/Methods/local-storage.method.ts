export interface EntData {
  id: string;
  name: string;
  nit: string;
  logo: string;
}

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

  public clearLocalStorage(): void {
    localStorage.clear();
  }
}
