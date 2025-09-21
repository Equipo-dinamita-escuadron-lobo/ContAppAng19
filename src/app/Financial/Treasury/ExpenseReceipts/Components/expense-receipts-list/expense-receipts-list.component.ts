import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
import { DropdownOption, ExpenseReceiptView } from '../../Model/Models';

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
    AutoCompleteModule,
    CardModule,
    ToastModule,
    TagModule
  ],
  templateUrl: './expense-receipts-list.component.html',
  styleUrls: ['./expense-receipts-list.component.css'],
  providers: [MessageService]
})
export class ExpenseReceiptsListComponent implements OnInit {
  filterForm!: FormGroup;
  allReceipts: ExpenseReceiptView[] = [];
  filteredReceipts: ExpenseReceiptView[] = [];
  loading: boolean = false;

  // Propiedades para el AutoComplete de Proveedor
  allSuppliers: string[] = []; // Lista única de nombres de proveedores
  supplierSuggestions: string[] = []; // Sugerencias para el dropdown

  statusOptions: DropdownOption[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadReceipts();
    this.filteredReceipts = this.allReceipts;
    this.statusOptions = [
      { label: 'Activo', value: 'Activo' },
      { label: 'Anulado', value: 'Anulado' }
    ];
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      supplier: [''], // El valor será un string simple
      startDate: [null],
      endDate: [null],
      status: [null],
      receiptCode: [''],
      minAmount: [null],
      maxAmount: [null]
    });
  }

  loadReceipts(): void {
    this.expenseReceiptService.getAllExpenseReceipts().subscribe(data => {
      this.allReceipts = data;
      this.filteredReceipts = [...this.allReceipts];
      // Extraer una lista única de nombres de proveedores para el AutoComplete
      this.allSuppliers = [...new Set(this.allReceipts.map(r => r.supplierName))];
    });
  }

  // Método para el evento (completeMethod) del AutoComplete
  searchSupplier(event: any): void {
    const query = event.query.toLowerCase();
    this.supplierSuggestions = this.allSuppliers.filter(supplier =>
      supplier.toLowerCase().includes(query)
    );
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let results = [...this.allReceipts];

    // Filtro por proveedor
    if (filters.supplier) {
      const supplierQuery = filters.supplier.toLowerCase();
      results = results.filter(r => r.supplierName.toLowerCase().includes(supplierQuery));
    }

    // Filtro por estado
    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }

    // Filtro por rango de fechas
    if (filters.startDate) {
      results = results.filter(r => r.issueDate >= filters.startDate);
    }

    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(r => r.issueDate <= endDate);
    }

    // Filtro por código de comprobante
    if (filters.receiptCode) {
      const codeQuery = filters.receiptCode.toLowerCase();
      results = results.filter(r => r.receiptCode.toLowerCase().includes(codeQuery));
    }

    // Filtro por rango de montos
    if (filters.minAmount !== null && filters.minAmount !== undefined) {
      results = results.filter(r => r.totalAmount >= filters.minAmount);
    }

    if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
      results = results.filter(r => r.totalAmount <= filters.maxAmount);
    }

    this.filteredReceipts = results;
  }

  clearFilters(): void {
    this.filterForm.reset({
      supplier: '',
      startDate: null,
      endDate: null,
      status: null,
      receiptCode: '',
      minAmount: null,
      maxAmount: null
    });
    this.filteredReceipts = [...this.allReceipts];
  }

  goToCreateReceipt(): void {
    this.router.navigate(['/financial/treasury/expense-receipts/creation']);
  }

  viewReceiptDetails(receipt: ExpenseReceiptView): void {
    console.log('Viendo detalles del recibo de gasto:', receipt);
    this.router.navigate(['/financial/treasury/expense-receipts/details', receipt.id]);
  }

  // Métodos para las estadísticas
  getTotalReceipts(): number {
    return this.filteredReceipts.length;
  }

  getActiveReceipts(): number {
    return this.filteredReceipts.filter(r => r.status !== 'Anulado').length;
  }

  getCancelledReceipts(): number {
    return this.filteredReceipts.filter(r => r.status === 'Anulado').length;
  }

  getTotalAmount(): number {
    return this.filteredReceipts
      .filter(r => r.status !== 'Anulado')
      .reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0);
  }

  // Método para obtener la severidad del tag de estado
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status?.toLowerCase()) {
      case 'activo':
      case 'pagado':
      case 'completado':
        return 'success';
      case 'pendiente':
      case 'en proceso':
        return 'warning';
      case 'anulado':
      case 'cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  // Métodos para las acciones adicionales
  printReceipt(receipt: ExpenseReceiptView): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimir',
      detail: `Imprimiendo comprobante ${receipt.receiptCode}`
    });
    // Aquí iría la lógica para imprimir
  }

  cancelReceipt(receipt: ExpenseReceiptView): void {
    if (receipt.status === 'Anulado') {
      return;
    }

    // Mostrar confirmación
    this.messageService.add({
      severity: 'warn',
      summary: 'Anular Comprobante',
      detail: `¿Está seguro de anular el comprobante ${receipt.receiptCode}?`
    });

    // Aquí iría la lógica para anular el comprobante
    // Por ahora solo mostramos el mensaje
  }

  // Métodos para filtros mejorados
  getActiveFiltersCount(): number {
    const filters = this.filterForm.value;
    let count = 0;

    if (filters.supplier) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.status) count++;
    if (filters.receiptCode) count++;
    if (filters.minAmount !== null && filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== null && filters.maxAmount !== undefined) count++;

    return count;
  }

  applyQuickFilter(type: 'today' | 'week' | 'month'): void {
    const today = new Date();
    let startDate: Date;

    switch (type) {
      case 'today':
        startDate = new Date(today);
        this.filterForm.patchValue({
          startDate: startDate,
          endDate: today
        });
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        this.filterForm.patchValue({
          startDate: startDate,
          endDate: today
        });
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        this.filterForm.patchValue({
          startDate: startDate,
          endDate: today
        });
        break;
    }

    this.applyFilters();

    this.messageService.add({
      severity: 'success',
      summary: 'Filtro Aplicado',
      detail: `Mostrando comprobantes de ${type === 'today' ? 'hoy' : type === 'week' ? 'los últimos 7 días' : 'los últimos 30 días'}`
    });
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
