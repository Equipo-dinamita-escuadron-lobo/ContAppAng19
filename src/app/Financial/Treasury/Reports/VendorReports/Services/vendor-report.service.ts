import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { VendorReportSummary, VendorReport, VendorListFilter, VendorReportTransaction } from '../Models/VendorReport';

@Injectable({
  providedIn: 'root'
})
export class VendorReportService {

  constructor() { }

  // Mock data para la lista de proveedores - Datos expandidos
  private mockVendorSummaries: VendorReportSummary[] = [
    {
      id: 1,
      name: 'Proveedor ABC S.A.S',
      totalDebits: 12500000,
      totalCredits: 15000000,
      currentBalance: 2500000,
      lastTransactionDate: new Date('2025-11-05'),
      transactionCount: 12
    },
    {
      id: 2,
      name: 'Suministros XYZ Ltda',
      totalDebits: 8200000,
      totalCredits: 8500000,
      currentBalance: 300000,
      lastTransactionDate: new Date('2025-11-01'),
      transactionCount: 8
    },
    {
      id: 3,
      name: 'Distribuciones DEF',
      totalDebits: 15800000,
      totalCredits: 16000000,
      currentBalance: 200000,
      lastTransactionDate: new Date('2025-10-28'),
      transactionCount: 15
    },
    {
      id: 4,
      name: 'Servicios GHI',
      totalDebits: 6500000,
      totalCredits: 6500000,
      currentBalance: 0,
      lastTransactionDate: new Date('2025-10-20'),
      transactionCount: 6
    },
    {
      id: 5,
      name: 'Materiales JKL',
      totalDebits: 9800000,
      totalCredits: 11000000,
      currentBalance: 1200000,
      lastTransactionDate: new Date('2025-10-15'),
      transactionCount: 10
    },
    {
      id: 6,
      name: 'Equipos MNO',
      totalDebits: 18700000,
      totalCredits: 20000000,
      currentBalance: 1300000,
      lastTransactionDate: new Date('2025-10-05'),
      transactionCount: 14
    },
    {
      id: 7,
      name: 'Tecnología PQR Ltda',
      totalDebits: 5400000,
      totalCredits: 5400000,
      currentBalance: 0,
      lastTransactionDate: new Date('2025-09-25'),
      transactionCount: 5
    },
    {
      id: 8,
      name: 'Servicios Integrales STU',
      totalDebits: 7600000,
      totalCredits: 8200000,
      currentBalance: 600000,
      lastTransactionDate: new Date('2025-09-15'),
      transactionCount: 9
    },
    {
      id: 9,
      name: 'Papelería VWX S.A.',
      totalDebits: 3200000,
      totalCredits: 3500000,
      currentBalance: 300000,
      lastTransactionDate: new Date('2025-08-30'),
      transactionCount: 7
    },
    {
      id: 10,
      name: 'Construcciones YZ Ltda',
      totalDebits: 22000000,
      totalCredits: 24000000,
      currentBalance: 2000000,
      lastTransactionDate: new Date('2025-08-15'),
      transactionCount: 18
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
