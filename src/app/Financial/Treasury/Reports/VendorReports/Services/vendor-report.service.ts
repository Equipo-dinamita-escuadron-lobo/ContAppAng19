import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { VendorReportSummary, VendorReport, VendorListFilter, VendorReportTransaction } from '../Models/VendorReport';

@Injectable({
  providedIn: 'root'
})
export class VendorReportService {

  constructor() { }

  // Mock data para la lista de proveedores
  private mockVendorSummaries: VendorReportSummary[] = [
    {
      id: 1,
      name: 'Proveedor ABC S.A.S',
      totalDebits: 1190000,
      totalCredits: 1150000,
      currentBalance: 40000,
      lastTransactionDate: new Date('2025-09-13'),
      transactionCount: 4
    },
    {
      id: 2,
      name: 'Distribuidora XYZ Ltda',
      totalDebits: 2850000,
      totalCredits: 2850000,
      currentBalance: 0,
      lastTransactionDate: new Date('2025-09-12'),
      transactionCount: 6
    },
    {
      id: 3,
      name: 'Servicios Técnicos DEF',
      totalDebits: 750000,
      totalCredits: 500000,
      currentBalance: 250000,
      lastTransactionDate: new Date('2025-09-11'),
      transactionCount: 3
    },
    {
      id: 4,
      name: 'Materiales GHI S.A.',
      totalDebits: 3200000,
      totalCredits: 3000000,
      currentBalance: 200000,
      lastTransactionDate: new Date('2025-09-10'),
      transactionCount: 8
    },
    {
      id: 5,
      name: 'Suministros JKL',
      totalDebits: 450000,
      totalCredits: 450000,
      currentBalance: 0,
      lastTransactionDate: new Date('2025-09-09'),
      transactionCount: 2
    }
  ];

  // Obtener lista de proveedores con filtros
  getVendorSummaries(filter?: VendorListFilter): Observable<VendorReportSummary[]> {
    let filteredData = [...this.mockVendorSummaries];

    if (filter) {
      // Filtro por término de búsqueda
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        filteredData = filteredData.filter(vendor =>
          vendor.name.toLowerCase().includes(searchLower)
        );
      }

      // Filtro por balance
      if (filter.balanceFrom !== undefined) {
        filteredData = filteredData.filter(vendor => vendor.currentBalance >= filter.balanceFrom!);
      }
      if (filter.balanceTo !== undefined) {
        filteredData = filteredData.filter(vendor => vendor.currentBalance <= filter.balanceTo!);
      }

      // Filtro por estado
      if (filter.status === 'with_balance') {
        filteredData = filteredData.filter(vendor => vendor.currentBalance > 0);
      } else if (filter.status === 'no_balance') {
        filteredData = filteredData.filter(vendor => vendor.currentBalance === 0);
      }
    }

    return of(filteredData).pipe(delay(300));
  }

  // Obtener reporte detallado de un proveedor específico
  getVendorReport(vendorId: number, startDate: Date, endDate: Date): Observable<VendorReport> {
    const vendor = this.mockVendorSummaries.find(v => v.id === vendorId);

    if (!vendor) {
      throw new Error(`Proveedor con ID ${vendorId} no encontrado`);
    }

    // Mock data basado en la imagen proporcionada
    const mockTransactions: VendorReportTransaction[] = [
      {
        date: new Date('2025-09-13'),
        dueDate: new Date('2025-09-13'),
        reference: '232323',
        type: 'Bill',
        description: '',
        debits: 0,
        credits: 668888.00,
        balance: 668888.00
      },
      {
        date: new Date('2025-09-13'),
        dueDate: new Date('2025-09-13'),
        reference: '',
        type: 'Payment',
        description: '',
        debits: 200000.00,
        credits: 0,
        balance: -131112.00
      },
      {
        date: new Date('2025-09-13'),
        dueDate: new Date('2025-09-13'),
        reference: '0002',
        type: 'Bill',
        description: '',
        debits: 0,
        credits: 200000.00,
        balance: 68888.00
      },
      {
        date: new Date('2025-09-13'),
        dueDate: new Date('2025-09-13'),
        reference: '',
        type: 'Payment',
        description: '',
        debits: 28888.00,
        credits: 0,
        balance: 40000.00
      }
    ];

    const mockReport: VendorReport = {
      vendor: {
        id: vendor.id,
        name: vendor.name
      },
      dateRange: {
        startDate: startDate,
        endDate: endDate
      },
      transactions: mockTransactions,
      periodTotals: {
        totalDebits: 228888.00,
        totalCredits: 268888.00,
        netBalance: 40000.00
      },
      totalDue: 40000.00,
      agingReport: {
        prePaid: 0.00,
        current: 0.00,
        days0to30: 40000.00,
        days31to60: 0.00,
        days61to90: 0.00,
        days91Plus: 0.00,
        total: 40000.00
      }
    };

    return of(mockReport).pipe(delay(500));
  }

  // Exportar reporte a PDF (mock)
  exportToPdf(vendorId: number, startDate: Date, endDate: Date): Observable<Blob> {
    // En implementación real, esto llamaría a un endpoint que genere el PDF
    const mockPdfContent = `Reporte de Proveedor ${vendorId} - ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`;
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }

  // Exportar reporte a Excel (mock)
  exportToExcel(vendorId: number, startDate: Date, endDate: Date): Observable<Blob> {
    // En implementación real, esto llamaría a un endpoint que genere el Excel
    const mockExcelContent = `Reporte Excel de Proveedor ${vendorId}`;
    const blob = new Blob([mockExcelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return of(blob).pipe(delay(800));
  }
}
