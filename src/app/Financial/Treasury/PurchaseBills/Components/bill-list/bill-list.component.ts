import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services and Models
import { PurchaseBillService } from '../../Services/purchase-bill.service';
import { PurchaseBillListView } from '../../Models/PurchaseBill';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { MessageService, ConfirmationService } from 'primeng/api';

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    TooltipModule,
    TagModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule
  ],
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class BillListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();

  // Data
  allBills: PurchaseBillListView[] = [];
  filteredBills: PurchaseBillListView[] = [];

  // Filter form
  filterForm!: FormGroup;

  // Filter options
  statusOptions: StatusOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Borrador', value: 'DRAFT' },
    { label: 'Contabilizada', value: 'POSTED' },
    { label: 'Pagada', value: 'PAID' },
    { label: 'Cancelada', value: 'CANCELLED' }
  ];

  // Loading state
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private purchaseBillService: PurchaseBillService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadBills();
    this.setupFilterSubscriptions();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      billId: [''],
      supplierName: [''],
      dateFrom: [null],
      dateTo: [null],
      status: [''],
      minAmount: [null],
      maxAmount: [null]
    });
  }

  setupFilterSubscriptions(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadBills(): void {
    this.loading = true;
    const enterpriseId = this.localStorageMethods.getIdEnterprise() || 'test-enterprise';

    this.purchaseBillService.getAllPurchaseBills(enterpriseId).subscribe({
      next: (bills) => {
        this.allBills = bills;
        this.filteredBills = [...bills];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las facturas. Intente nuevamente.'
        });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredBills = this.allBills.filter(bill => {
      // Filter by Bill ID
      if (filters.billId && !bill.billId.toLowerCase().includes(filters.billId.toLowerCase())) {
        return false;
      }

      // Filter by Supplier Name
      if (filters.supplierName && !bill.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }

      // Filter by Date Range
      if (filters.dateFrom && bill.dateOpened < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && bill.dateOpened > filters.dateTo) {
        return false;
      }

      // Filter by Status
      if (filters.status && bill.status !== filters.status) {
        return false;
      }

      // Filter by Amount Range
      if (filters.minAmount && bill.total < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && bill.total > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredBills = [...this.allBills];
  }

  // Navigation methods
  onCreateBill(): void {
    this.router.navigate(['/financial/treasury/purchase-bills/create']);
  }

  onViewBill(bill: PurchaseBillListView): void {
    this.router.navigate(['/financial/treasury/purchase-bills', bill.id]);
  }

  onEditBill(bill: PurchaseBillListView): void {
    if (bill.status === 'POSTED' || bill.status === 'PAID') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción No Permitida',
        detail: 'No se puede editar una factura que ya ha sido contabilizada o pagada.'
      });
      return;
    }

    this.router.navigate(['/financial/treasury/purchase-bills', bill.id, 'edit']);
  }

  onDeleteBill(bill: PurchaseBillListView): void {
    if (bill.status === 'POSTED' || bill.status === 'PAID') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción No Permitida',
        detail: 'No se puede eliminar una factura que ya ha sido contabilizada o pagada.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la factura ${bill.billId}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.purchaseBillService.deletePurchaseBill(bill.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Factura eliminada correctamente.'
            });
            this.loadBills(); // Reload the list
          },
          error: (error) => {
            console.error('Error al eliminar factura:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la factura. Intente nuevamente.'
            });
          }
        });
      }
    });
  }

  // Utility methods
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'DRAFT': 'info',
      'POSTED': 'success',
      'PAID': 'success',
      'CANCELLED': 'danger'
    };
    return severityMap[status] || 'info';
  }

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

  // Export functionality (could be implemented later)
  onExportData(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad Pendiente',
      detail: 'La exportación de datos será implementada próximamente.'
    });
  }

  // Statistics methods for summary cards
  getDraftCount(): number {
    return this.allBills.filter(bill => bill.status === 'DRAFT').length;
  }

  getPostedCount(): number {
    return this.allBills.filter(bill => bill.status === 'POSTED').length;
  }

  getPaidCount(): number {
    return this.allBills.filter(bill => bill.status === 'PAID').length;
  }
}
