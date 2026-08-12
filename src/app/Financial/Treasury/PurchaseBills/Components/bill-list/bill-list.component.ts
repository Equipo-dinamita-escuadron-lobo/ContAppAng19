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

interface CutoffDateOption {
  label: string;
  value: string;
  days?: number; // Para calcular rangos predefinidos
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

  // Opciones de Fecha de Corte (solo para facturas contabilizadas)
  cutoffDateOptions: CutoffDateOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Últimos 7 días', value: 'LAST_7_DAYS', days: 7 },
    { label: 'Últimos 15 días', value: 'LAST_15_DAYS', days: 15 },
    { label: 'Último mes (30 días)', value: 'LAST_MONTH', days: 30 },
    { label: 'Últimos 3 meses', value: 'LAST_3_MONTHS', days: 90 },
    { label: 'Últimos 6 meses', value: 'LAST_6_MONTHS', days: 180 },
    { label: 'Último año', value: 'LAST_YEAR', days: 365 },
    { label: 'Rango personalizado', value: 'CUSTOM' }
  ];

  // Control de visibilidad del selector de fecha de corte
  showCutoffDateSelector: boolean = false;

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
      cutoffDateRange: [''], // Fecha de corte para facturas contabilizadas
      minAmount: [null],
      maxAmount: [null]
    });
  }

  setupFilterSubscriptions(): void {
    // Suscribirse a cambios en el estado para mostrar/ocultar fecha de corte
    this.filterForm.get('status')?.valueChanges.subscribe((status) => {
      this.showCutoffDateSelector = status === 'POSTED';

      // Si no es contabilizada, limpiar el campo de fecha de corte
      if (!this.showCutoffDateSelector) {
        this.filterForm.patchValue({
          cutoffDateRange: '',
          dateFrom: null,
          dateTo: null
        }, { emitEvent: false });
      }
    });

    // Suscribirse a cambios en fecha de corte para calcular rangos
    this.filterForm.get('cutoffDateRange')?.valueChanges.subscribe((range) => {
      if (range && range !== 'CUSTOM') {
        this.applyCutoffDateRange(range);
      } else if (range === 'CUSTOM') {
        // Limpiar las fechas para que el usuario pueda seleccionar manualmente
        this.filterForm.patchValue({
          dateFrom: null,
          dateTo: null
        }, { emitEvent: false });
      } else if (range === '') {
        // Si selecciona "Todos", limpiar las fechas
        this.filterForm.patchValue({
          dateFrom: null,
          dateTo: null
        }, { emitEvent: false });
      }
    });

    // Aplicar filtros cuando cambien los valores
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadBills(): void {
    this.loading = true;
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

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
      // Filtrar por número de factura
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

  applyCutoffDateRange(rangeValue: string): void {
    const option = this.cutoffDateOptions.find(opt => opt.value === rangeValue);

    if (option && option.days) {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin del día de hoy

      const startDate = new Date();
      startDate.setDate(today.getDate() - option.days);
      startDate.setHours(0, 0, 0, 0); // Inicio del día

      this.filterForm.patchValue({
        dateFrom: startDate,
        dateTo: today
      }, { emitEvent: false }); // No emitir evento para evitar loop infinito

      // Aplicar filtros manualmente
      this.applyFilters();
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.showCutoffDateSelector = false;
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

  onPayBill(bill: PurchaseBillListView): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad en desarrollo',
      detail: `La programación de pago para la factura ${bill.billId} estará disponible próximamente.`
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

  getCutoffDateLabel(): string {
    const rangeValue = this.filterForm.get('cutoffDateRange')?.value;
    const option = this.cutoffDateOptions.find(opt => opt.value === rangeValue);
    return option ? option.label : 'Rango personalizado';
  }

  getTotalFilteredAmount(): string {
    const total = this.filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    return this.formatCurrency(total);
  }
}
