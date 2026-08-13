import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Services and Models
import { VendorReportService } from '../../Services/vendor-report.service';
import { VendorReportSummary, VendorListFilter } from '../../Models/VendorReport';
import { MessageService } from 'primeng/api';
import { TreasuryExportService } from '../../../../Shared/treasury-export.service';
import { exportErrorDetail, exportSuccessDetail, reportEmptyFiltersMessage } from '../../../../Shared/treasury-status-labels';
import { ContextualHelpComponent } from '../../../../../../Shared/Components/contextual-help/contextual-help.component';
import { TREASURY_HELP } from '../../../../Shared/treasury-help-content';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    CardModule,
    ToastModule,
    TagModule,
    TooltipModule,
    ContextualHelpComponent,
  ],
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.css'],
  providers: [MessageService]
})
export class VendorListComponent implements OnInit {

  vendors: VendorReportSummary[] = [];
  filteredVendors: VendorReportSummary[] = [];
  loading: boolean = false;

  filterForm!: FormGroup;
  exportingPdf = false;
  exportingCsv = false;

  statusOptions = [
    { label: 'Todos los proveedores', value: 'all' },
    { label: 'Con saldo pendiente', value: 'with_balance' },
    { label: 'Sin saldo pendiente', value: 'no_balance' }
  ];
  readonly help = TREASURY_HELP.vendorReports;

  constructor(
    private fb: FormBuilder,
    private vendorReportService: VendorReportService,
    private messageService: MessageService,
    private router: Router,
    private exportService: TreasuryExportService,
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadVendors();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      dateFrom: [null],
      dateTo: [null],
      balanceFrom: [null],
      balanceTo: [null],
      status: ['all']
    });
  }

  loadVendors(): void {
    this.loading = true;
    const filter: VendorListFilter = this.filterForm.value;

    this.vendorReportService.getVendorSummaries(filter).subscribe({
      next: (data) => {
        this.vendors = data;
        this.filteredVendors = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los proveedores'
        });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadVendors();
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      dateFrom: null,
      dateTo: null,
      balanceFrom: null,
      balanceTo: null,
      status: 'all'
    });
    this.loadVendors();
  }

  viewVendorReport(vendor: VendorReportSummary): void {
    // Navegar al reporte detallado del proveedor
    this.router.navigate(['/financial/treasury/reports/vendor-report', vendor.id], {
      queryParams: {
        name: vendor.name
      }
    });
  }

  getBalanceTagSeverity(balance: number): 'success' | 'warning' | 'danger' | 'info' {
    if (balance === 0) return 'info';
    if (balance > 0) return 'warning';
    return 'success';
  }

  getBalanceTagText(balance: number): string {
    if (balance === 0) return 'Sin saldo';
    if (balance > 0) return 'Pendiente';
    return 'A favor';
  }

  getTotalWithBalance(): number {
    return this.filteredVendors.filter(v => v.currentBalance > 0).length;
  }

  getTotalWithoutBalance(): number {
    return this.filteredVendors.filter(v => v.currentBalance === 0).length;
  }

  getTotalBalance(): number {
    return this.filteredVendors.reduce((sum, vendor) => sum + vendor.currentBalance, 0);
  }

  hasActiveFilters(): boolean {
    const filter = this.filterForm.value;
    return !!(
      filter.searchTerm?.trim()
      || filter.dateFrom
      || filter.dateTo
      || filter.balanceFrom != null
      || filter.balanceTo != null
      || (filter.status && filter.status !== 'all')
    );
  }

  getEmptyTitle(): string {
    if (this.vendors.length === 0) {
      return 'No hay proveedores con facturas pendientes';
    }
    if (this.hasActiveFilters()) {
      return 'No se encontraron proveedores que coincidan con la búsqueda';
    }
    return 'No hay proveedores con facturas pendientes';
  }

  getEmptySubtitle(): string {
    return this.hasActiveFilters() ? 'Intente ajustar los filtros de búsqueda' : '';
  }

  // Utility methods for consistent formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
  }

  exportToCsv(): void {
    this.runExport('csv');
  }

  exportToPdf(): void {
    this.runExport('pdf');
  }

  private runExport(format: 'csv' | 'pdf'): void {
    if (!this.filteredVendors.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: reportEmptyFiltersMessage(),
      });
      return;
    }

    const headers = [
      'Proveedor',
      'Transacciones',
      'Débitos',
      'Créditos',
      'Saldo',
      'Última transacción',
      'Estado',
    ];
    const rows = this.filteredVendors.map((vendor) => [
      vendor.name,
      vendor.transactionCount,
      vendor.totalDebits,
      vendor.totalCredits,
      vendor.currentBalance,
      this.formatDate(vendor.lastTransactionDate),
      this.getBalanceTagText(vendor.currentBalance),
    ]);
    const options = {
      title: 'Reportes de proveedores',
      subtitle: `${rows.length} proveedor(es) exportado(s)`,
      filename: this.exportService.datedFilename('reportes-proveedores', format),
      headers,
      rows,
      orientation: 'landscape' as const,
    };

    const loadingFlag = format === 'csv' ? 'exportingCsv' : 'exportingPdf';
    this[loadingFlag] = true;
    try {
      if (format === 'csv') {
        this.exportService.downloadCsv(options);
      } else {
        this.exportService.downloadPdf(options);
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Exportado',
        detail: exportSuccessDetail('proveedores', format),
      });
    } catch (error) {
      console.error(`Error al exportar ${format}:`, error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: exportErrorDetail(format),
      });
    } finally {
      this[loadingFlag] = false;
    }
  }
}
