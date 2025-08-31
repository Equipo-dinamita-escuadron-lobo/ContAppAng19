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
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { DropdownOption, ReceiptView } from '../../Model/Models';

@Component({
  selector: 'app-receipts-list',
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
  templateUrl: './receipts-list.component.html',
  styleUrl: './receipts-list.component.css'
})
export class ReceiptsListComponent {
  filterForm!: FormGroup;
  allReceipts: ReceiptView[] = [];
  filteredReceipts: ReceiptView[] = [];

  // Propiedades para el AutoComplete de Cliente
  allClients: string[] = []; // Lista única de nombres de clientes
  clientSuggestions: string[] = []; // Sugerencias para el dropdown

  statusOptions: DropdownOption[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cashReceiptService: CashReceiptService
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
      client: [''], // El valor será un string simple
      startDate: [null],
      endDate: [null],
      status: [null]
    });
  }

  loadReceipts(): void {
    this.cashReceiptService.getAllReceipts().subscribe(data => {
      this.allReceipts = data;
      this.filteredReceipts = [...this.allReceipts];
      // Extraer una lista única de nombres de clientes para el AutoComplete
      this.allClients = [...new Set(this.allReceipts.map(r => r.clientName))];
    });
  }

  // Método para el evento (completeMethod) del AutoComplete
  searchClient(event: any): void {
    const query = event.query.toLowerCase();
    this.clientSuggestions = this.allClients.filter(client =>
      client.toLowerCase().includes(query)
    );
  }

  applyFilters(): void {
    // La lógica de applyFilters sigue siendo la misma y funciona perfectamente
    // con el string que provee el AutoComplete.
    const filters = this.filterForm.value;
    let results = [...this.allReceipts];

    if (filters.client) {
      const clientQuery = filters.client.toLowerCase();
      results = results.filter(r => r.clientName.toLowerCase().includes(clientQuery));
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
    this.filterForm.reset({ client: '', startDate: null, endDate: null, status: null });
    this.filteredReceipts = [...this.allReceipts];
  }

  goToCreateReceipt(): void {
    this.router.navigate(['/financial/wallet/receipts/creation']);
  }

  viewReceiptDetails(receipt: ReceiptView): void {
    console.log('Viendo detalles del recibo:', receipt);
    this.router.navigate(['/financial/wallet/receipts/details', receipt.id]);
  }
}
