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
    TooltipModule
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

  statusOptions = [
    { label: 'Todos los proveedores', value: 'all' },
    { label: 'Con saldo pendiente', value: 'with_balance' },
    { label: 'Sin saldo pendiente', value: 'no_balance' }
  ];

  constructor(
    private fb: FormBuilder,
    private vendorReportService: VendorReportService,
    private messageService: MessageService,
    private router: Router
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

  // Export functionality
  onExportData(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad Pendiente',
      detail: 'La exportación de datos será implementada próximamente.'
    });
  }
}
