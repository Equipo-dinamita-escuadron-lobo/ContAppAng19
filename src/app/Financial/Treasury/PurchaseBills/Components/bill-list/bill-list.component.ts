import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
import { DialogModule } from 'primeng/dialog';

import { PurchaseBillService } from '../../Services/purchase-bill.service';
import { BillFilterOption, PurchaseBillListView } from '../../Models/PurchaseBill';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TreasuryExportService } from '../../../Shared/treasury-export.service';
import {
  exportErrorDetail,
  exportSuccessDetail,
  reportEmptyFiltersMessage,
} from '../../../Shared/treasury-status-labels';
import { ContextualHelpComponent } from '../../../../../Shared/Components/contextual-help/contextual-help.component';
import { TREASURY_HELP } from '../../../Shared/treasury-help-content';

interface StatusOption {
  label: string;
  value: string;
}

interface CutoffDateOption {
  label: string;
  value: string;
  days?: number;
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
    ConfirmDialogModule,
    DialogModule,
    ContextualHelpComponent,
  ],
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class BillListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();

  allBills: PurchaseBillListView[] = [];
  filteredBills: PurchaseBillListView[] = [];

  filterForm!: FormGroup;

  billIdOptions: BillFilterOption[] = [];
  allBillIdOptions: BillFilterOption[] = [];
  supplierOptions: BillFilterOption[] = [];

  statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendiente de pago', value: 'POSTED' },
    { label: 'Abono parcial', value: 'PARTIALLY_PAID' },
    { label: 'Pagada', value: 'PAID' },
  ];

  cutoffDateOptions: CutoffDateOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Últimos 7 días', value: 'LAST_7_DAYS', days: 7 },
    { label: 'Últimos 15 días', value: 'LAST_15_DAYS', days: 15 },
    { label: 'Último mes (30 días)', value: 'LAST_MONTH', days: 30 },
    { label: 'Últimos 3 meses', value: 'LAST_3_MONTHS', days: 90 },
    { label: 'Últimos 6 meses', value: 'LAST_6_MONTHS', days: 180 },
    { label: 'Último año', value: 'LAST_YEAR', days: 365 },
    { label: 'Rango personalizado', value: 'CUSTOM' },
  ];

  showCutoffDateSelector = false;
  loading = false;
  detailVisible = false;
  selectedBill: PurchaseBillListView | null = null;
  exportingPdf = false;
  exportingCsv = false;
  readonly emptyFiltersMessage = reportEmptyFiltersMessage();
  readonly help = TREASURY_HELP.paymentSchedule;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private purchaseBillService: PurchaseBillService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private exportService: TreasuryExportService,
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadBills();
    this.setupFilterSubscriptions();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      billId: [null],
      supplierId: [null],
      dateFrom: [null],
      dateTo: [null],
      status: [''],
      cutoffDateRange: [''],
      minAmount: [null],
      maxAmount: [null],
    });
  }

  setupFilterSubscriptions(): void {
    this.filterForm.get('status')?.valueChanges.subscribe((status) => {
      this.showCutoffDateSelector = status === 'POSTED' || status === 'PARTIALLY_PAID';

      if (!this.showCutoffDateSelector) {
        this.filterForm.patchValue(
          {
            cutoffDateRange: '',
            dateFrom: null,
            dateTo: null,
          },
          { emitEvent: false },
        );
      }
    });

    this.filterForm.get('cutoffDateRange')?.valueChanges.subscribe((range) => {
      if (range && range !== 'CUSTOM') {
        this.applyCutoffDateRange(range);
      } else if (range === 'CUSTOM' || range === '') {
        this.filterForm.patchValue(
          {
            dateFrom: null,
            dateTo: null,
          },
          { emitEvent: false },
        );
      }
    });

    this.filterForm.get('supplierId')?.valueChanges.subscribe(() => this.onSupplierFilterChange());

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadBills(): void {
    this.loading = true;
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      this.loading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Empresa requerida',
        detail: 'Seleccione una empresa activa para ver las facturas.',
      });
      return;
    }

    this.purchaseBillService.getAllPurchaseBills(enterpriseId).subscribe({
      next: (bills) => {
        this.allBills = bills;
        this.buildFilterOptions(bills);
        this.filteredBills = [...bills];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las facturas. Intente nuevamente.',
        });
        this.loading = false;
      },
    });
  }

  buildFilterOptions(bills: PurchaseBillListView[]): void {
    this.supplierOptions = [...new Set(bills.map((b) => b.supplierId))]
      .map((id) => {
        const name = bills.find((b) => b.supplierId === id)?.supplierName || `Proveedor ${id}`;
        return { value: id, label: `${id} — ${name}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    this.allBillIdOptions = bills
      .map((b) => ({
        value: b.billId,
        label: `${b.billId} · Proveedor ${b.supplierId}`,
        supplierId: b.supplierId,
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    this.billIdOptions = [...this.allBillIdOptions];
  }

  onSupplierFilterChange(): void {
    const supplierId = this.filterForm.value.supplierId;
    this.billIdOptions =
      supplierId == null
        ? [...this.allBillIdOptions]
        : this.allBillIdOptions.filter((opt) => opt.supplierId === Number(supplierId));

    const selectedBill = this.filterForm.value.billId;
    if (selectedBill && !this.billIdOptions.some((b) => b.value === selectedBill)) {
      this.filterForm.patchValue({ billId: null }, { emitEvent: false });
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredBills = this.allBills.filter((bill) => {
      if (filters.billId && bill.billId !== filters.billId) {
        return false;
      }

      if (filters.supplierId != null && bill.supplierId !== Number(filters.supplierId)) {
        return false;
      }

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (new Date(bill.dateOpened) < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(bill.dateOpened) > to) return false;
      }

      if (filters.status && bill.status !== filters.status) {
        return false;
      }

      if (filters.minAmount != null && bill.total < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount != null && bill.total > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }

  applyCutoffDateRange(rangeValue: string): void {
    const option = this.cutoffDateOptions.find((opt) => opt.value === rangeValue);

    if (option?.days) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const startDate = new Date();
      startDate.setDate(today.getDate() - option.days);
      startDate.setHours(0, 0, 0, 0);

      this.filterForm.patchValue(
        {
          dateFrom: startDate,
          dateTo: today,
        },
        { emitEvent: false },
      );

      this.applyFilters();
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      billId: null,
      supplierId: null,
      dateFrom: null,
      dateTo: null,
      status: '',
      cutoffDateRange: '',
      minAmount: null,
      maxAmount: null,
    });
    this.showCutoffDateSelector = false;
    this.billIdOptions = [...this.allBillIdOptions];
    this.filteredBills = [...this.allBills];
  }

  onCreateBill(): void {
    this.router.navigate(['/financial/treasury/purchase-bills/create']);
  }

  onViewBill(bill: PurchaseBillListView): void {
    this.selectedBill = bill;
    this.detailVisible = true;
  }

  onEditBill(bill: PurchaseBillListView): void {
    if (bill.status === 'POSTED' || bill.status === 'PAID' || bill.status === 'PARTIALLY_PAID') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción No Permitida',
        detail: 'No se puede editar una obligación sincronizada desde Facturación.',
      });
      return;
    }

    this.router.navigate(['/financial/treasury/purchase-bills', bill.id, 'edit']);
  }

  onDeleteBill(bill: PurchaseBillListView): void {
    if (bill.status === 'POSTED' || bill.status === 'PAID' || bill.status === 'PARTIALLY_PAID') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción No Permitida',
        detail: 'Las obligaciones sincronizadas no se eliminan desde Tesorería.',
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
              detail: 'Factura eliminada correctamente.',
            });
            this.loadBills();
          },
          error: (error) => {
            console.error('Error al eliminar factura:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error?.message || 'No se pudo eliminar la factura.',
            });
          },
        });
      },
    });
  }

  onPayBill(bill: PurchaseBillListView): void {
    this.router.navigate(['/financial/treasury/expense-receipts/creation'], {
      queryParams: {
        billId: bill.id,
        billCode: bill.billId,
        supplierId: bill.supplierId,
        supplierName: bill.supplierName,
        totalAmount: bill.total,
        paidAmount: bill.paidAmount ?? 0,
        pendingBalance: bill.pendingBalance ?? bill.total,
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      DRAFT: 'info',
      POSTED: 'warning',
      PARTIALLY_PAID: 'info',
      PAID: 'success',
      CANCELLED: 'danger',
    };
    return severityMap[status] || 'info';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  exportToCsv(): void {
    this.runExport('csv');
  }

  exportToPdf(): void {
    this.runExport('pdf');
  }

  private runExport(format: 'csv' | 'pdf'): void {
    if (!this.filteredBills.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: this.emptyFiltersMessage,
      });
      return;
    }

    const headers = ['Factura', 'Fecha', 'Proveedor', 'Total', 'Pagado', 'Saldo', 'Estado'];
    const rows = this.filteredBills.map((bill) => [
      bill.billId,
      this.formatDate(bill.dateOpened),
      bill.supplierName,
      bill.total,
      bill.paidAmount ?? 0,
      bill.pendingBalance ?? 0,
      bill.statusDisplay,
    ]);
    const options = {
      title: 'Programación de pagos de factura',
      subtitle: `${rows.length} obligación(es) exportada(s)`,
      filename: this.exportService.datedFilename('programacion-pagos', format),
      headers,
      rows,
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
        detail: exportSuccessDetail('programación de pagos', format),
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

  getPartialCount(): number {
    return this.allBills.filter((bill) => bill.status === 'PARTIALLY_PAID').length;
  }

  getPostedCount(): number {
    return this.allBills.filter(
      (bill) => bill.status === 'POSTED' || bill.status === 'PARTIALLY_PAID',
    ).length;
  }

  getPaidCount(): number {
    return this.allBills.filter((bill) => bill.status === 'PAID').length;
  }

  getCutoffDateLabel(): string {
    const rangeValue = this.filterForm.get('cutoffDateRange')?.value;
    const option = this.cutoffDateOptions.find((opt) => opt.value === rangeValue);
    return option ? option.label : 'Rango personalizado';
  }

  getTotalFilteredAmount(): string {
    const total = this.filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    return this.formatCurrency(total);
  }
}
