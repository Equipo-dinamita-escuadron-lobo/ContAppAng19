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

// Interfaz para el recibo (puedes moverla a un archivo de modelos)
interface ReceiptView {
  id: number;
  receiptCode: string;
  issueDate: Date;
  thirdPartyId: number;
  clientName: string; // Añadimos el nombre para facilitar la visualización
  status: 'Activo' | 'Anulado';
  totalAmount: number;
}

// Interfaz para las opciones del dropdown
interface DropdownOption {
  label: string;
  value: string;
}

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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadMockReceipts();
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

  loadMockReceipts(): void {
    this.allReceipts = [
        { id: 1, receiptCode: 'RC-1-10000', issueDate: new Date('2025-06-20'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 60000 },
        { id: 2, receiptCode: 'RC-1-10001', issueDate: new Date('2025-06-19'), thirdPartyId: 105, clientName: 'Julian Piamba', status: 'Activo', totalAmount: 120000 },
        { id: 3, receiptCode: 'RC-1-10002', issueDate: new Date('2025-06-17'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Anulado', totalAmount: 85000 },
        { id: 4, receiptCode: 'RC-1-10003', issueDate: new Date('2025-06-17'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Activo', totalAmount: 50000 },
        { id: 5, receiptCode: 'RC-1-10004', issueDate: new Date('2025-06-15'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Anulado', totalAmount: 75000 },
        { id: 6, receiptCode: 'RC-1-10005', issueDate: new Date('2025-06-14'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 200000 },
        { id: 7, receiptCode: 'RC-1-10006', issueDate: new Date('2025-05-30'), thirdPartyId: 102, clientName: 'Maria Lopez', status: 'Activo', totalAmount: 95000 },
    ];

    // Extraer una lista única de nombres de clientes para el AutoComplete
    this.allClients = [...new Set(this.allReceipts.map(r => r.clientName))];
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
    // this.router.navigate(['/financial/wallet/cash-receipts/details', receipt.id]);
  }
}
