import { Component} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { PortfolioWriteOffService } from '../../Services/portfolio-write-off.service';
import { AuxiliaryAccountOption, Client, Invoice } from '../../../CashReceipts/Model';
import { CreateWriteOffRequestDto, SelectionSummary } from '../../Models';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';


@Component({
  selector: 'app-write-off-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    AutoCompleteModule,
    CalendarModule,
    DropdownModule,
    InputTextarea,
    ToastModule,
  ],
  templateUrl: './write-off-creation.component.html',
  styleUrl: './write-off-creation.component.css',
  providers: [MessageService]
})
export class WriteOffCreationComponent {

  // Formulario y datos
  writeOffForm!: FormGroup;
  filteredClients: Client[] = [];

  // Facturas
  clientInvoices: Invoice[] = [];
  selectedInvoices: Invoice[] = [];

  // Resumen de selección
  summary: SelectionSummary = { count: 0, totalPending: 0, totalValue: 0 };

  auxiliaryAccounts: AuxiliaryAccountOption[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private cashReceiptService: CashReceiptService,
    private portfolioWriteOffService: PortfolioWriteOffService,
    private localStorageMethods: LocalStorageMethods
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();
  }

  private initForm(): void {
    this.writeOffForm = this.fb.group({
      justification: ['', [Validators.required, Validators.maxLength(500)]],
      writeOffDate: [new Date(), Validators.required],
      debitAuxiliaryAccount: [null, Validators.required],
      client: [null, Validators.required],
    });
  }

  loadDropdownOptions(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    this.cashReceiptService.getAuxiliaryAccountsCached(enterpriseId).subscribe(data => {
      this.auxiliaryAccounts = data;
      console.log('Cuentas Auxiliares cargadas:', this.auxiliaryAccounts);
    });
  }

  searchClient(event: any): void {
    // Reutilizamos el servicio de recibos de caja para buscar clientes
    this.cashReceiptService.getClients(event.query).subscribe(clients => {
      this.filteredClients = clients;
    });
  }

  onClientSelect(event: any): void {
    const selectedClient: Client = event.value;
    // Reutilizamos el servicio para obtener las facturas pendientes del cliente
    this.cashReceiptService.getInvoicesByClient(selectedClient.id).subscribe(invoices => {
      this.clientInvoices = invoices;
      this.selectedInvoices = []; // Limpiamos la selección anterior
      this.calculateSummary(); // Reseteamos el resumen
    });
  }

  onClientClear(): void {
    this.clientInvoices = [];
    this.selectedInvoices = [];
    this.calculateSummary();
  }

  calculateSummary(): void {
    this.summary.count = this.selectedInvoices.length;
    this.summary.totalPending = this.selectedInvoices.reduce((acc, inv) => acc + (inv.pendingValue ?? 0), 0);
    this.summary.totalValue = this.selectedInvoices.reduce((acc, inv) => acc + (inv.totalValue ?? 0), 0);
  }

  onSubmit(): void {
    this.writeOffForm.markAllAsTouched();
    if (this.writeOffForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, complete todos los campos requeridos.' });
      return;
    }
    if (this.selectedInvoices.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar al menos una factura para castigar.' });
      return;
    }

    const formValue = this.writeOffForm.value;

    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    const debitAuxiliaryAccount = this.auxiliaryAccounts.find(acc => acc.value === formValue.debitAuxiliaryAccount);
    const debitAuxiliaryAccountCode = debitAuxiliaryAccount?.codeAccount;

    const request: CreateWriteOffRequestDto = {
      justification: formValue.justification,
      writeOffDate: formValue.writeOffDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      debitAuxiliaryAccount: debitAuxiliaryAccountCode ? Number(debitAuxiliaryAccountCode) : 0,
      debitAuxiliaryAccountId: formValue.debitAuxiliaryAccount,
      thirdId: formValue.client.id,
      enterpriseId: enterpriseId,
      details: this.selectedInvoices.map(inv => ({ invoiceId: inv.id })),
    };
    
    this.portfolioWriteOffService.createWriteOff(request).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Borrador de castigo #${response.id} creado correctamente.` });
        setTimeout(() => {
          this.router.navigate(['/financial/wallet/write-offs', response.id]); // Navegar al detalle
        }, 1500);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el borrador del castigo.' });
        console.error(err);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/financial/wallet/write-offs']);
  }

}
