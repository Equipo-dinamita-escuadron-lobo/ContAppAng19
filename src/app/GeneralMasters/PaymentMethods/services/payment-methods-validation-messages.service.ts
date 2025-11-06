import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodsValidationMessagesService {

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
}