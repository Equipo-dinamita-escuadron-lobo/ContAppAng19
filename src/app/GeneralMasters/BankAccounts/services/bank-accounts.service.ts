import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Bank } from './bank.service';

export interface BankAccount {
  id?: number;
  accountNumber: string;
  bank: Bank;
  accountType: string;
  accountingAccountId: string;
  status: boolean;
  idEnterprise?: string;
}

export interface BankAccountCreateRequest {
  idEnterprise: string;
  accountNumber: string;
  bankId: number;
  accountType: string;
  accountingAccountId: string;
}

export interface BankAccountUpdateRequest {
  id: number;
  accountNumber: string;
  bankId: number;
  accountType: string;
  accountingAccountId: string;
  status: boolean;
  idEnterprise: string;
}

export interface AccountType {
  code: string;
  description: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BankAccountsService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = environment.API_URL + 'accountCatalogue/bank-accounts';

  /**
   * Obtiene la lista de cuentas bancarias paginada
   */
  findAll(enterpriseId: string, page: number = 0, size: number = 10): Observable<PageResponse<BankAccount>> {
    return this.http.get<PageResponse<BankAccount>>(`${this.API_BASE}/findAll/${enterpriseId}?page=${page}&size=${size}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la lista de cuentas bancarias activas
   */
  findAllActive(enterpriseId: string, page: number = 0, size: number = 100): Observable<PageResponse<BankAccount>> {
    return this.http.get<PageResponse<BankAccount>>(`${this.API_BASE}/findAllActive/${enterpriseId}?page=${page}&size=${size}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene una cuenta bancaria por ID
   */
  findById(id: number, enterpriseId: string): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.API_BASE}/findById/${id}/${enterpriseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crea una nueva cuenta bancaria
   */
  create(request: BankAccountCreateRequest): Observable<BankAccount> {
    return this.http.post<BankAccount>(`${this.API_BASE}/create`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualiza una cuenta bancaria existente
   */
  update(request: BankAccountUpdateRequest): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.API_BASE}/update`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambia el estado de una cuenta bancaria
   */
  changeState(id: number, enterpriseId: string, state: boolean): Observable<BankAccount> {
    return this.http.patch<BankAccount>(`${this.API_BASE}/changeState/${id}/${enterpriseId}?state=${state}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Elimina una cuenta bancaria
   */
  delete(id: number, enterpriseId: string): Observable<BankAccount> {
    return this.http.delete<BankAccount>(`${this.API_BASE}/delete/${id}/${enterpriseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene los tipos de cuenta disponibles
   */
  getAccountTypes(): AccountType[] {
    return [
      { code: 'AHORROS', description: 'Cuenta de Ahorros' },
      { code: 'CORRIENTE', description: 'Cuenta Corriente' }
    ];
  }

  /**
   * Obtiene la descripción de un tipo de cuenta por su código
   */
  getAccountTypeDisplay(accountTypeCode: string): string {
    const accountType = this.getAccountTypes().find(at => at.code === accountTypeCode);
    return accountType ? accountType.description : accountTypeCode;
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    let errorTitle = 'Error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string' && error.error.trim()) {
        errorMessage = error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.fieldErrors && typeof error.error.fieldErrors === 'object') {
        const fieldErrorMessages = Object.values(error.error.fieldErrors);
        errorMessage = fieldErrorMessages.join('. ');
      } else if (error.error?.errors && Array.isArray(error.error.errors)) {
        const validationErrors = error.error.errors.map((err: any) => err.defaultMessage || err.message);
        errorMessage = validationErrors.join('. ');
      } else if (error.error?.field && error.error?.defaultMessage) {
        errorMessage = error.error.defaultMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Definir título según código de estado
      if (error.status === 409) {
        errorTitle = 'Registro Duplicado';
      } else if (error.status === 404) {
        errorTitle = 'No Encontrado';
      } else if (error.status === 400) {
        errorTitle = 'Datos Inválidos';
      } else if (error.status === 500) {
        errorTitle = 'Error del Servidor';
      }
    }

    return throwError(() => ({ status: error.status, title: errorTitle, message: errorMessage }));
  }
}
