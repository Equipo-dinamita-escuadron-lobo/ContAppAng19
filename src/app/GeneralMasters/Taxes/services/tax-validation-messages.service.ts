import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaxValidationMessagesService {

  constructor() { }

  getActiveStateSeverity(): 'success' {
    return 'success';
  }

  getInactiveStateSeverity(): 'danger' {
    return 'danger';
  }

  getActiveStateText(): string {
    return 'Activo';
  }

  getInactiveStateText(): string {
    return 'Inactivo';
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  isActive(status: boolean): boolean {
    return status === true;
  }
}