import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ExpenseReceiptService } from '../../Service/expense-receipt.service';
import { DropdownOption, ExpenseReceiptView, ReceiptFilterOption } from '../../Model/Models';
import { exportErrorDetail, exportSuccessDetail, reportEmptyFiltersMessage, voucherStatusFilterOptions } from '../../../Shared/treasury-status-labels';
import { ContextualHelpComponent } from '../../../../../Shared/Components/contextual-help/contextual-help.component';
import { TREASURY_HELP } from '../../../Shared/treasury-help-content';
import { TreasuryExportService } from '../../../Shared/treasury-export.service';

@Component({
  selector: 'app-expense-receipts-list',
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
    CardModule,
    ToastModule,
    TagModule,
    ContextualHelpComponent,
  ],
  templateUrl: './expense-receipts-list.component.html',
  styleUrls: ['./expense-receipts-list.component.css'],
  providers: [MessageService],
})
export class ExpenseReceiptsListComponent implements OnInit {
  filterForm!: FormGroup;
  allReceipts: ExpenseReceiptView[] = [];
  filteredReceipts: ExpenseReceiptView[] = [];
  loading = false;

  supplierOptions: ReceiptFilterOption[] = [];
  receiptCodeOptions: ReceiptFilterOption[] = [];
  allReceiptCodeOptions: ReceiptFilterOption[] = [];

  statusOptions: DropdownOption[] = voucherStatusFilterOptions();
  readonly emptyFiltersMessage = reportEmptyFiltersMessage();
  readonly help = TREASURY_HELP.expenseReceipts;
  exportingPdf = false;
  exportingCsv = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService,
    private messageService: MessageService,
    private exportService: TreasuryExportService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFilterSubscriptions();
    this.loadReceipts();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      supplierId: [null],
      receiptCode: [null],
      startDate: [null],
      endDate: [null],
      status: [''],
      minAmount: [null],
      maxAmount: [null],
    });
  }

  setupFilterSubscriptions(): void {
    this.filterForm.get('supplierId')?.valueChanges.subscribe(() => this.onSupplierFilterChange());
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadReceipts(): void {
    this.loading = true;
    this.expenseReceiptService.getAllExpenseReceipts().subscribe({
      next: (data) => {
        this.allReceipts = data;
        this.buildFilterOptions(data);
        this.filteredReceipts = [...data];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los comprobantes de egreso.',
        });
      },
    });
  }

  buildFilterOptions(receipts: ExpenseReceiptView[]): void {
    this.supplierOptions = [...new Set(receipts.map((r) => r.thirdPartyId).filter((id) => id > 0))]
      .map((id) => {
        const name = receipts.find((r) => r.thirdPartyId === id)?.supplierName || `Proveedor ${id}`;
        return { value: id, label: `${id} — ${name}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    this.allReceiptCodeOptions = receipts
      .map((r) => ({
        value: r.receiptCode,
        label: `${r.receiptCode} · ${r.supplierName}`,
        supplierId: r.thirdPartyId,
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    this.receiptCodeOptions = [...this.allReceiptCodeOptions];
  }

  onSupplierFilterChange(): void {
    const supplierId = this.filterForm.value.supplierId;
    this.receiptCodeOptions =
      supplierId == null
        ? [...this.allReceiptCodeOptions]
        : this.allReceiptCodeOptions.filter((opt) => opt.supplierId === Number(supplierId));

    const selected = this.filterForm.value.receiptCode;
    if (selected && !this.receiptCodeOptions.some((o) => o.value === selected)) {
      this.filterForm.patchValue({ receiptCode: null }, { emitEvent: false });
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let results = [...this.allReceipts];

    if (filters.supplierId != null) {
      results = results.filter((r) => r.thirdPartyId === Number(filters.supplierId));
    }

    if (filters.receiptCode) {
      results = results.filter((r) => r.receiptCode === filters.receiptCode);
    }

    if (filters.status) {
      results = results.filter((r) => (r.statusKey || '') === filters.status);
    }

    if (filters.startDate) {
      const from = new Date(filters.startDate);
      from.setHours(0, 0, 0, 0);
      results = results.filter((r) => new Date(r.issueDate) >= from);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      results = results.filter((r) => new Date(r.issueDate) <= endDate);
    }

    if (filters.minAmount !== null && filters.minAmount !== undefined) {
      results = results.filter((r) => r.totalAmount >= filters.minAmount);
    }

    if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
      results = results.filter((r) => r.totalAmount <= filters.maxAmount);
    }

    this.filteredReceipts = results;
  }

  clearFilters(): void {
    this.filterForm.reset({
      supplierId: null,
      receiptCode: null,
      startDate: null,
      endDate: null,
      status: '',
      minAmount: null,
      maxAmount: null,
    });
    this.receiptCodeOptions = [...this.allReceiptCodeOptions];
    this.filteredReceipts = [...this.allReceipts];
  }

  goToCreateReceipt(): void {
    this.router.navigate(['/financial/treasury/expense-receipts/creation']);
  }

  viewReceiptDetails(receipt: ExpenseReceiptView): void {
    this.router.navigate(['/financial/treasury/expense-receipts/details', receipt.id]);
  }

  getTotalReceipts(): number {
    return this.allReceipts.length;
  }

  getActiveReceipts(): number {
    return this.filteredReceipts.filter((r) => r.statusKey === 'POSTED' || r.status === 'Contabilizado').length;
  }

  getCancelledReceipts(): number {
    return this.filteredReceipts.filter((r) => r.statusKey === 'VOIDED' || r.status === 'Anulado').length;
  }

  getTotalAmount(): number {
    return this.filteredReceipts
      .filter((r) => r.statusKey !== 'VOIDED' && r.status !== 'Anulado')
      .reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch ((status || '').toLowerCase()) {
      case 'contabilizado':
      case 'pagado':
      case 'completado':
        return 'success';
      case 'borrador':
      case 'contabilizando':
      case 'pendiente':
        return 'warning';
      case 'anulado':
      case 'fallido':
      case 'anulación fallida':
      case 'anulando':
      case 'cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  printReceipt(receipt: ExpenseReceiptView): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimir',
      detail: `Imprimiendo comprobante ${receipt.receiptCode}`,
    });
  }

  cancelReceipt(receipt: ExpenseReceiptView): void {
    if (receipt.statusKey === 'VOIDED' || receipt.status === 'Anulado') {
      return;
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Anular Comprobante',
      detail: `Use Operaciones de Tesorería para anular ${receipt.receiptCode}.`,
    });
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
    if (!this.filteredReceipts.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: this.emptyFiltersMessage,
      });
      return;
    }

    const headers = ['Código', 'Fecha', 'Proveedor', 'Total', 'Estado'];
    const rows = this.filteredReceipts.map((receipt) => [
      receipt.receiptCode,
      this.formatDate(receipt.issueDate),
      receipt.supplierName,
      receipt.totalAmount,
      receipt.status,
    ]);
    const options = {
      title: 'Comprobantes de egreso',
      subtitle: `${rows.length} comprobante(s) exportado(s)`,
      filename: this.exportService.datedFilename('comprobantes-egreso', format),
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
        detail: exportSuccessDetail('comprobantes', format),
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
