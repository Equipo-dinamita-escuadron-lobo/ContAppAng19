export class LocalStorageMethods {
  public saveEnterpriseData(id: string): void {
    const data = { entId: id };
    localStorage.setItem('entData', JSON.stringify(data));
  }

  public loadEnterpriseData(): string | null {
    const enterpriseData = localStorage.getItem('entData');
    if (enterpriseData) {
      const parsedData = JSON.parse(enterpriseData);
      return parsedData.entId;
    }
    return null;
  }

  public clearLocalStoage(): void {
    localStorage.clear();
  }
}
