import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessagesModule } from 'primeng/messages';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Receipt } from '../../Model/Receipt';
import { ReceiptDetail } from '../../Model/ReceiptDetail';
import { InvoiceSelectionComponent } from '../invoice-selection/invoice-selection.component';

// Modelos adicionales para el frontend
interface DropdownOption {
  label: string;
  value: string;
}

interface Client {
  id: number;
  name: string;
  // Otros campos relevantes del cliente
}

interface Invoice {
  id: number;
  code: string;
  dueDate: Date;
  pendingBalance: number;
  selectedForPayment?: boolean; // Para el checkbox
  amountToPay?: number; // Para el input de abono
}

@Component({
  selector: 'app-receipt-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    DropdownModule,
    AutoCompleteModule,
    CalendarModule,
    InputNumberModule,
    InputTextarea,
    ButtonModule,
    TableModule,
    CheckboxModule,
    DialogModule,
    MessagesModule,
    FormsModule,
    InvoiceSelectionComponent 
],
  templateUrl: './receipt-creation.component.html',
  styleUrl: './receipt-creation.component.css',
  providers: [MessageService]
})
export class ReceiptCreationComponent {
  cashReceiptForm!: FormGroup;
  receiptTypes: DropdownOption[] = [];
  paymentMethods: DropdownOption[] = [];
  receiptTypeOptions: DropdownOption[] = [];
  auxiliaryAccounts: DropdownOption[] = [];

  // Para Autocomplete de Cliente
  clients: Client[] = []; // Simula la lista de clientes del backend
  filteredClients: Client[] = [];

  // Para Abono a Deuda
  selectedClientInvoices: Invoice[] = []; // Facturas pendientes del cliente seleccionado
  selectedInvoicesForPayment: Invoice[] = []; // Facturas seleccionadas para abono en la tabla principal
  availableInvoicesToSelect: Invoice[] = []; // Facturas disponibles en el diálogo de selección

  displayInvoiceSelectionDialog: boolean = false;

  totalAmount: number = 0; // Para mostrar el valor total recibido

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();
    this.loadMockClients(); // Cargar clientes de ejemplo
    this.updateTotalAmount(); // Inicializa el total
    this.subscribeToFormChanges();
  }

  initializeForm(): void {
    this.cashReceiptForm = this.fb.group({
      receiptType: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      client: [null, Validators.required], // Se usará para el objeto Client completo
      issueDate: [new Date(), Validators.required],
      receiptTypeOption: ['', Validators.required], // 'debt_payment' o 'direct_income'
      observations: [''],

      // Campos condicionales para "Ingreso Directo"
      auxiliaryAccount: [null],
      directIncomeAmount: [null],

      // La lógica de las facturas se manejará directamente en el componente para la tabla y el diálogo
    });
  }

  loadDropdownOptions(): void {
    this.receiptTypes = [
      { label: 'RC-1 - Recibo de Caja', value: 'RC-1' },
      { label: 'RC-2 - Recibo Bancario', value: 'RC-2' },
    ];

    this.paymentMethods = [
      { label: 'Efectivo', value: 'cash' },
      { label: 'Transferencia Bancaria', value: 'bank_transfer' },
      { label: 'Cheque', value: 'check' },
    ];

    this.receiptTypeOptions = [
      { label: 'Abono a Deuda', value: 'debt_payment' },
      { label: 'Ingreso Directo', value: 'direct_income' },
    ];

    this.auxiliaryAccounts = [
      { label: 'Cuenta Auxiliar 1', value: 'aux_1' },
      { label: 'Cuenta Auxiliar 2', value: 'aux_2' },
      { label: 'Cuenta Auxiliar 3', value: 'aux_3' },
    ];
  }

  // Simula la carga de clientes
  loadMockClients(): void {
    this.clients = [
      { id: 101, name: 'Julian Ruano Majin' },
      { id: 102, name: 'Maria Lopez' },
      { id: 103, name: 'Pedro Gomez' },
      { id: 104, name: 'Ana Fernandez' },
    ];
  }

  // Lógica para Autocomplete de Cliente
  searchClient(event: any): void {
    let query = event.query;
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  onClientSelect(event: any): void {
    const selectedClient: Client = event.value;
    this.cashReceiptForm.get('client')?.setValue(selectedClient);
    this.loadClientInvoices(selectedClient.id);
    this.selectedInvoicesForPayment = []; // Limpiar selección anterior
    this.updateTotalAmount();
  }

  // Simula la carga de facturas de un cliente
  loadClientInvoices(clientId: number): void {
    // En un caso real, harías una llamada HTTP al backend
    console.log(`Cargando facturas para el cliente ID: ${clientId}`);
    if (clientId === 101) {
      this.selectedClientInvoices = [
        { id: 1, code: 'FV-2-10000', dueDate: new Date('2025-06-20'), pendingBalance: 1200000 },
        { id: 2, code: 'FV-2-10001', dueDate: new Date('2025-07-15'), pendingBalance: 500000 },
        { id: 3, code: 'FV-2-10002', dueDate: new Date('2025-08-10'), pendingBalance: 750000 },
      ];
    } else {
      this.selectedClientInvoices = [];
    }
    this.availableInvoicesToSelect = [...this.selectedClientInvoices]; // Copia para el diálogo
  }

  onReceiptTypeOptionChange(): void {
    const option = this.cashReceiptForm.get('receiptTypeOption')?.value;

    // Resetear y limpiar validaciones de campos condicionales
    this.cashReceiptForm.get('auxiliaryAccount')?.clearValidators();
    this.cashReceiptForm.get('auxiliaryAccount')?.updateValueAndValidity();
    this.cashReceiptForm.get('directIncomeAmount')?.clearValidators();
    this.cashReceiptForm.get('directIncomeAmount')?.updateValueAndValidity();

    this.selectedInvoicesForPayment = []; // Limpiar tabla de abono

    if (option === 'direct_income') {
      this.cashReceiptForm.get('auxiliaryAccount')?.setValidators(Validators.required);
      this.cashReceiptForm.get('directIncomeAmount')?.setValidators([Validators.required, Validators.min(0.01)]);
      this.cashReceiptForm.get('auxiliaryAccount')?.updateValueAndValidity();
      this.cashReceiptForm.get('directIncomeAmount')?.updateValueAndValidity();
      this.cashReceiptForm.get('directIncomeAmount')?.setValue(0); // Inicializar a 0 para cálculo
    } else if (option === 'debt_payment') {
      // Asegurarse de que los campos de ingreso directo estén nulos
      this.cashReceiptForm.get('auxiliaryAccount')?.setValue(null);
      this.cashReceiptForm.get('directIncomeAmount')?.setValue(null);
    }
    this.updateTotalAmount();
  }

  // Lógica para el checkbox de la tabla de abono
  onInvoiceSelectionChange(invoice: Invoice, rowIndex: number): void {
    if (invoice.selectedForPayment) {
      invoice.amountToPay = invoice.pendingBalance; // Inicializar con el saldo pendiente
      this.selectedInvoicesForPayment.push(invoice);
    } else {
      invoice.amountToPay = undefined; // Limpiar el monto si se deselecciona
      this.selectedInvoicesForPayment = this.selectedInvoicesForPayment.filter(inv => inv.id !== invoice.id);
    }
    this.updateTotalAmount();
  }

  // Lógica para el cambio de monto a pagar en la tabla
  onAmountToPayChange(invoice: Invoice, rowIndex: number): void {
    if (invoice.amountToPay === null || invoice.amountToPay === undefined) {
      invoice.amountToPay = 0; // Asegurarse de que no sea null
    }
    if (invoice.amountToPay < 0) {
      invoice.amountToPay = 0;
    } else if (invoice.amountToPay > invoice.pendingBalance!) {
      invoice.amountToPay = invoice.pendingBalance; // No se puede abonar más del saldo
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El valor a abonar no puede ser mayor al saldo pendiente.' });
    }
    this.updateTotalAmount();
  }

  // Mostrar diálogo de selección de facturas
  showInvoiceSelectionDialog(): void {
    this.displayInvoiceSelectionDialog = true;
  }

  handleInvoiceSelection(selectedInvoicesFromDialog: Invoice[]): void {
    // Mapeamos las selecciones previas para no perder los montos ya digitados
    const previousPayments = new Map(
      this.selectedInvoicesForPayment.map(inv => [inv.id, inv.amountToPay])
    );

    this.selectedInvoicesForPayment = selectedInvoicesFromDialog.map(invoice => {
      const previouslyPaidAmount = previousPayments.get(invoice.id);
      return {
        ...invoice,
        selectedForPayment: true,
        // Si ya tenía un monto, lo conservamos. Si es nueva, le asignamos el saldo total.
        amountToPay: previouslyPaidAmount !== undefined ? previouslyPaidAmount : invoice.pendingBalance
      };
    });

    this.displayInvoiceSelectionDialog = false; // Cerramos el diálogo
    this.updateTotalAmount(); // Recalculamos el total
  }

  // ¡NUEVO! Manejador para cuando el hijo cancela
  handleSelectionCancel(): void {
    this.displayInvoiceSelectionDialog = false;
  }

  subscribeToFormChanges(): void {
    this.cashReceiptForm.valueChanges.subscribe(() => {
      this.updateTotalAmount();
    });
    // También suscribirse a cambios en los montos de la tabla si no están en el formArray
    // Esto es un poco más manual al no tener un FormArray para la tabla directamente.
    // Podrías tener un evento (onAmountToPayChange) que lo dispare
  }

  updateTotalAmount(): void {
    const receiptTypeOption = this.cashReceiptForm.get('receiptTypeOption')?.value;
    let calculatedTotal = 0;

    if (receiptTypeOption === 'direct_income') {
        calculatedTotal = this.cashReceiptForm.get('directIncomeAmount')?.value || 0;
    } else if (receiptTypeOption === 'debt_payment') {
        calculatedTotal = this.selectedInvoicesForPayment.reduce((sum, invoice) => {
            // Solo sumar si el checkbox está marcado y tiene un monto válido
            return sum + (invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0 ? invoice.amountToPay : 0);
        }, 0);
    }
    this.totalAmount = calculatedTotal;
  }

  isFormValidForSubmission(): boolean {
    const receiptTypeOption = this.cashReceiptForm.get('receiptTypeOption')?.value;

    if (receiptTypeOption === 'debt_payment') {
      // Validar que al menos una factura esté seleccionada y tenga un monto válido
      const hasValidPayment = this.selectedInvoicesForPayment.some(invoice =>
        invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0 && invoice.amountToPay <= invoice.pendingBalance!
      );
      return this.cashReceiptForm.valid && hasValidPayment;
    } else if (receiptTypeOption === 'direct_income') {
      // Validar los campos específicos de ingreso directo
      const directIncomeAmount = this.cashReceiptForm.get('directIncomeAmount');
      return this.cashReceiptForm.valid && !!directIncomeAmount?.valid && directIncomeAmount?.value > 0;
    }
    // Si no se ha seleccionado ninguna opción o es otro caso, la validación general del formulario
    return this.cashReceiptForm.valid;
  }

  onSubmit(): void {
    this.cashReceiptForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones

    if (this.isFormValidForSubmission()) {
      const formValue = this.cashReceiptForm.value;
      const client: Client = formValue.client; // Obtener el objeto completo del cliente

      let receiptDetails: ReceiptDetail[] = [];
      if (formValue.receiptTypeOption === 'debt_payment') {
        receiptDetails = this.selectedInvoicesForPayment
          .filter(invoice => invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0)
          .map(invoice => ({
            invoiceId: invoice.id,
            amountPaid: invoice.amountToPay!
          }));
      }

      const newReceipt: Receipt = {
        receiptCode: 'REC-' + Math.floor(Math.random() * 10000), // Generar un código temporal
        thirdPartyId: client.id,
        status: 'CREATED',
        issueDate: formValue.issueDate,
        totalAmount: this.totalAmount,
        observations: formValue.observations,
        details: receiptDetails,
      };

      if (formValue.receiptTypeOption === 'direct_income') {
        // Si es ingreso directo, no hay detalles de factura, pero el totalAmount ya está calculado.
        // Podrías añadir un detalle genérico si el backend lo requiere, o dejarlo vacío.
        newReceipt.details = []; // o un detalle con id de cuenta contable si aplica
      }


      console.log('Datos del recibo de caja a enviar:', newReceipt);
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recibo de caja creado correctamente.' });
      // Aquí llamarías a tu servicio para enviar newReceipt al backend.
      // this.receiptService.createReceipt(newReceipt).subscribe(...)
      // Después de un éxito, podrías limpiar el formulario o redirigir:
      // this.cashReceiptForm.reset();
      // this.router.navigate(['/cash-receipts/list']);
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, revise los campos marcados en rojo.' });
      console.log('Formulario inválido', this.cashReceiptForm.errors);
      if (this.cashReceiptForm.get('receiptTypeOption')?.value === 'debt_payment') {
        const hasValidPayment = this.selectedInvoicesForPayment.some(invoice =>
          invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0 && invoice.amountToPay <= invoice.pendingBalance!
        );
        if (!hasValidPayment) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar al menos una factura y especificar un monto válido a abonar.' });
        }
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/financial/wallet/receipts']); // Define la ruta a la que deseas volver
  }
}
