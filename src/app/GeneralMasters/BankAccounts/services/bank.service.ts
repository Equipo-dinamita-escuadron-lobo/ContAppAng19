import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface Bank {
  id?: number;
  code: string;
  name: string;
  currency: string;
  status: boolean;
  isDeleted?: boolean;
  idEnterprise?: string;
}

export interface BankCreateRequest {
  idEnterprise: string;
  code: string;
  name: string;
  currency: string;
}

export interface BankUpdateRequest {
  id: number;
  code: string;
  name: string;
  currency: string;
  status: boolean;
  idEnterprise: string;
}

export interface Currency {
  code: string;
  description: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = environment.API_URL + 'accountCatalogue/banks';

  /**
   * Obtiene la lista de bancos paginada
   */
  findAll(enterpriseId: string, page: number = 0, size: number = 10, sortField?: string, sortOrder?: string, search?: string): Observable<PageResponse<Bank>> {
    let url = `${this.API_BASE}/findAll/${enterpriseId}?page=${page}&size=${size}`;

    if (sortField && sortField.trim()) {
      url += `&sortField=${sortField}`;
    }
    if (sortOrder && sortOrder.trim()) {
      url += `&sortOrder=${sortOrder}`;
    }
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.http.get<PageResponse<Bank>>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la lista de bancos activos
   */
  findAllActive(enterpriseId: string, page: number = 0, size: number = 100): Observable<PageResponse<Bank>> {
    return this.http.get<PageResponse<Bank>>(`${this.API_BASE}/findAllByStatus/${enterpriseId}?status=true&page=${page}&size=${size}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene un banco por ID
   */
  findById(id: number, enterpriseId: string): Observable<Bank> {
    return this.http.get<Bank>(`${this.API_BASE}/findById/${id}/${enterpriseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crea un nuevo banco
   */
  create(request: BankCreateRequest): Observable<Bank> {
    return this.http.post<Bank>(`${this.API_BASE}/create`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualiza un banco existente
   */
  update(request: BankUpdateRequest): Observable<Bank> {
    return this.http.put<Bank>(`${this.API_BASE}/update`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambia el estado de un banco
   */
  changeState(id: number, enterpriseId: string, state: boolean): Observable<Bank> {
    return this.http.patch<Bank>(`${this.API_BASE}/changeState/${id}/${enterpriseId}?state=${state}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Elimina un banco
   */
  delete(id: number, enterpriseId: string): Observable<Bank> {
    return this.http.delete<Bank>(`${this.API_BASE}/delete/${id}/${enterpriseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene las opciones de monedas disponibles
   */
  getCurrencies(): Currency[] {
    return [
      { code: 'COP', description: 'COP - Peso Colombiano' },
      { code: 'USD', description: 'USD - Dólar Estadounidense' },
      { code: 'EUR', description: 'EUR - Euro' },
      { code: 'GBP', description: 'GBP - Libra Esterlina' },
      { code: 'CHF', description: 'CHF - Franco Suizo' },
      { code: 'JPY', description: 'JPY - Yen Japonés' }
    ];
  }

  /**
   * Obtiene la descripción de una moneda por su código
   */
  getCurrencyDisplay(currencyCode: string): string {
    const currency = this.getCurrencies().find(c => c.code === currencyCode);
    return currency ? currency.description : currencyCode;
  }

  /**
   * Validador personalizado para el código del banco
   * Valida que sea un número positivo de máximo 2 dígitos
   */
  static validateBankCode(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();
    
    // Validar que solo contenga números
    if (!/^\d+$/.test(value)) {
      return { invalidFormat: true };
    }

    // Validar que sea un número positivo
    const numValue = Number.parseInt(value, 10);
    if (numValue <= 0) {
      return { notPositive: true };
    }

    // Validar que tenga máximo 2 dígitos
    if (value.length > 2) {
      return { maxDigits: true };
    }

    return null;
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
      // Capturar mensaje del backend
      if (typeof error.error === 'string' && error.error.trim()) {
        errorMessage = error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
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
