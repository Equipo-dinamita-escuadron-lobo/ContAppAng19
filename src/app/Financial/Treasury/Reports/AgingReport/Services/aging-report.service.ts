import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import {
  AgingReportFilter,
  AgingReportResponse,
  AgingReportLine,
} from '../Models/AgingReport';

@Injectable({
  providedIn: 'root',
})
export class AgingReportService {
  private apiUrl = `${environment.API_URL}/aging-reports`;

  constructor(private http: HttpClient) {}

  /**
   * Get aging report based on filters
   */
  getAgingReport(
    enterpriseId: string,
    filters: AgingReportFilter
  ): Observable<AgingReportResponse> {
    // For now, return mock data
    // TODO: Replace with actual API call
    return this.getMockAgingReport(filters);
  }

  /**
   * Get available account types for filtering
   */
  getAccountTypes(enterpriseId: string): Observable<any[]> {
    // Mock data for account types
    return of([
      { label: 'Pasivo', value: '2' },
      { label: 'Cuentas por Pagar', value: '22' },
      { label: 'Proveedores', value: '2205' },
      { label: 'Obligaciones Financieras', value: '21' },
    ]).pipe(delay(300));
  }

  /**
   * Export aging report to Excel/PDF
   */
  exportAgingReport(
    enterpriseId: string,
    filters: AgingReportFilter,
    format: 'excel' | 'pdf'
  ): Observable<Blob> {
    let params = new HttpParams();
    params = params.append('enterpriseId', enterpriseId);
    params = params.append('format', format);

    if (filters.supplierId) {
      params = params.append('supplierId', filters.supplierId);
    }
    if (filters.accountTypeStart) {
      params = params.append('accountTypeStart', filters.accountTypeStart);
    }
    if (filters.accountTypeEnd) {
      params = params.append('accountTypeEnd', filters.accountTypeEnd);
    }
    if (filters.cutoffDate) {
      params = params.append(
        'cutoffDate',
        filters.cutoffDate.toISOString().split('T')[0]
      );
    }
    if (filters.includeDocuments !== undefined) {
      params = params.append(
        'includeDocuments',
        filters.includeDocuments.toString()
      );
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Mock data generator for development
   */
  private getMockAgingReport(
    filters: AgingReportFilter
  ): Observable<AgingReportResponse> {
    const mockLines: AgingReportLine[] = [
      {
        id: 1,
        accountDescription: 'Pasivo',
        totalDue: 178500000,
        current: 52000000,
        days1to30: 38000000,
        days31to60: 50000000,
        days61to90: 18500000,
        days91to180: 20000000,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 2,
        accountDescription: 'Disponible',
        totalDue: 0,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'AVAILABLE',
      },
      {
        id: 3,
        accountDescription: 'Cuentas por Pagar Proveedores',
        totalDue: 145000000,
        current: 42000000,
        days1to30: 38000000,
        days31to60: 35000000,
        days61to90: 18000000,
        days91to180: 12000000,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 4,
        accountDescription: 'Obligaciones Financieras',
        totalDue: 95000000,
        current: 65000000,
        days1to30: 20000000,
        days31to60: 10000000,
        days61to90: 0,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 5,
        accountDescription: 'Proveedores Nacionales',
        totalDue: 28500000,
        current: 10000000,
        days1to30: 8000000,
        days31to60: 7000000,
        days61to90: 3500000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 6,
        accountDescription: 'Proveedor ABC S.A.S',
        totalDue: 12500000,
        current: 5500000,
        days1to30: 4000000,
        days31to60: 2000000,
        days61to90: 1000000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 7,
        accountDescription: 'Suministros XYZ Ltda',
        totalDue: 8200000,
        current: 3500000,
        days1to30: 2500000,
        days31to60: 2200000,
        days61to90: 0,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 8,
        accountDescription: 'Distribuciones DEF',
        totalDue: 15800000,
        current: 8000000,
        days1to30: 5000000,
        days31to60: 2000000,
        days61to90: 800000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 9,
        accountDescription: 'Servicios GHI',
        totalDue: 6500000,
        current: 2000000,
        days1to30: 1500000,
        days31to60: 2000000,
        days61to90: 1000000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 10,
        accountDescription: 'Materiales JKL',
        totalDue: 9800000,
        current: 4000000,
        days1to30: 3000000,
        days31to60: 1800000,
        days61to90: 1000000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
      {
        id: 11,
        accountDescription: 'Equipos MNO',
        totalDue: 18700000,
        current: 9000000,
        days1to30: 6000000,
        days31to60: 3000000,
        days61to90: 700000,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
        status: 'ACTIVE',
      },
    ];

    const totals = mockLines.reduce(
      (
        acc,
        {
          totalDue,
          current,
          days1to30,
          days31to60,
          days61to90,
          days91to180,
          days181to260,
          daysOver260,
        }
      ) => ({
        totalDue: acc.totalDue + totalDue,
        current: acc.current + current,
        days1to30: acc.days1to30 + days1to30,
        days31to60: acc.days31to60 + days31to60,
        days61to90: acc.days61to90 + days61to90,
        days91to180: acc.days91to180 + days91to180,
        days181to260: acc.days181to260 + days181to260,
        daysOver260: acc.daysOver260 + daysOver260,
      }),
      {
        totalDue: 0,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91to180: 0,
        days181to260: 0,
        daysOver260: 0,
      }
    );

    const mockResponse: AgingReportResponse = {
      reportDate: filters.cutoffDate || new Date(),
      supplierName: filters.supplierName || 'Proveedor XYZ',
      lines: mockLines,
      totals: totals,
    };

    return of(mockResponse).pipe(delay(800));
  }
}
