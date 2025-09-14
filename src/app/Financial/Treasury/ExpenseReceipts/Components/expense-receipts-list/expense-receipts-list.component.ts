import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
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
    CalendarModule,
    DropdownModule,
    TooltipModule,
    AutoCompleteModule
  ],
  templateUrl: './expense-receipts-list.component.html',
  styleUrl: './expense-receipts-list.component.css'
})
export class ExpenseReceiptsListComponent {
  filterForm!: FormGroup;
  allReceipts: ExpenseReceiptView[] = [];
  filteredReceipts: ExpenseReceiptView[] = [];

  // Propiedades para el AutoComplete de Proveedor
  allSuppliers: string[] = []; // Lista única de nombres de proveedores
  supplierSuggestions: string[] = []; // Sugerencias para el dropdown

  statusOptions: DropdownOption[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService
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
      status: [null]
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

    if (filters.supplier) {
      const supplierQuery = filters.supplier.toLowerCase();
      results = results.filter(r => r.supplierName.toLowerCase().includes(supplierQuery));
    }

    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }

    if (filters.startDate) {
      results = results.filter(r => r.issueDate >= filters.startDate);
    }

    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(r => r.issueDate <= endDate);
    }

    this.filteredReceipts = results;
  }

  clearFilters(): void {
    this.filterForm.reset({ supplier: '', startDate: null, endDate: null, status: null });
    this.filteredReceipts = [...this.allReceipts];
  }

  goToCreateReceipt(): void {
    this.router.navigate(['/financial/treasury/expense-receipts/creation']);
  }

  viewReceiptDetails(receipt: ExpenseReceiptView): void {
    console.log('Viendo detalles del recibo de gasto:', receipt);
    this.router.navigate(['/financial/treasury/expense-receipts/details', receipt.id]);
  }
}
