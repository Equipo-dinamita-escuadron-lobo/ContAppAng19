import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelpCenterPresentationService {


  truncateDescription(description: string, maxLength: number = 30): string {
    if (!description) return '';
    return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  }

  
  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  
  getStateSeverity(status: boolean): string {
    return status ? 'success' : 'danger';
  }

  
  isActive(status: boolean): boolean {
    return status === true;
  }
}