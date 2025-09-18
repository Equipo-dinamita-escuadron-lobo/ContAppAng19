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
import { PaymentMethodsServiceService } from '../../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { PaymentMethod } from '../../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { Invoice } from '../../Model/Models';
import { ReceiptCreateRequest } from '../../Model/ReceiptCreateRequest';

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
  localStorageMethods = new LocalStorageMethods();

  cashReceiptForm!: FormGroup;
  receiptTypes: DropdownOption[] = [];
  paymentMethods: PaymentMethod[] = [];
  receiptTypeOptions: DropdownOption[] = [];
  auxiliaryAccounts: DropdownOption[] = [];

  // Para Autocomplete de Cliente
  clients: Client[] = [];
  filteredClients: Client[] = [];

  // Para Abono a Deuda
  selectedClientInvoices: Invoice[] = []; // Facturas pendientes del cliente seleccionado
  selectedInvoicesForPayment: Invoice[] = []; // Facturas seleccionadas para abono en la tabla principal
  availableInvoicesToSelect: Invoice[] = []; // Facturas disponibles en el diálogo de selección

  displayInvoiceSelectionDialog: boolean = false;

  totalAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private paymentMethodService: PaymentMethodsServiceService,
    private cashReceiptService: CashReceiptService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();
    this.updateTotalAmount();
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
    const enterpriseId = this.localStorageMethods.getIdEnterprise();

    // CAMBIO: Cargar desde el servicio
    this.cashReceiptService.getReceiptTypes().subscribe(data => {
      this.receiptTypes = data;
    });

    this.paymentMethodService.findAll(enterpriseId, 0, 10).subscribe((page) => {
      this.paymentMethods = page.content;
    });

    if(this.paymentMethods.length === 0){
      this.paymentMethods = [
        { id: 1, name: 'Caja', accountingAccount: '110505', accountingAccountId: 1, status: true, idEnterprise: '' },
        { id: 2, name: 'Banco', accountingAccount: '111005', accountingAccountId: 2, status: true, idEnterprise: '' },
        { id: 3, name: 'Tarjeta de Crédito', accountingAccount: '112005', accountingAccountId: 3, status: true, idEnterprise: '' }
      ];
    }

    this.receiptTypeOptions = [
      { label: 'Abono a Deuda', value: 'debt_payment' },
      { label: 'Ingreso Directo', value: 'direct_income' },
    ];

    // CAMBIO: Cargar desde el servicio
    this.cashReceiptService.getAuxiliaryAccounts().subscribe(data => {
      this.auxiliaryAccounts = data;
    });
  }

  // Lógica para Autocomplete de Cliente
  searchClient(event: any): void {
    this.cashReceiptService.getClients(event.query).subscribe(clients => {
      this.filteredClients = clients;
    });
  }

  onClientSelect(event: any): void {
    const selectedClient: Client = event.value;
    this.cashReceiptForm.get('client')?.setValue(selectedClient);
    this.loadClientInvoices(selectedClient.id);
    this.selectedInvoicesForPayment = []; // Limpiar selección anterior
    this.updateTotalAmount();
  }

  loadClientInvoices(clientId: number): void {
    console.log(`Cargando facturas para el cliente ID: ${clientId}`);
    this.cashReceiptService.getInvoicesByClient(clientId).subscribe(invoices => {
      this.selectedClientInvoices = invoices;
      this.availableInvoicesToSelect = [...this.selectedClientInvoices]; // Copia para el diálogo
    });
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
      invoice.amountToPay = invoice.pendingValue; // Inicializar con el saldo pendiente
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
    } else if (invoice.amountToPay > invoice.pendingValue!) {
      invoice.amountToPay = invoice.pendingValue; // No se puede abonar más del saldo
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
        amountToPay: previouslyPaidAmount !== undefined ? previouslyPaidAmount : invoice.pendingValue
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
        invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0 && invoice.amountToPay <= invoice.pendingValue!
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
    this.cashReceiptForm.markAllAsTouched();

    if (!this.isFormValidForSubmission()) {
      this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'Por favor, revise los campos del formulario.' });

      // Mensaje específico si es abono a deuda y no hay facturas válidas seleccionadas
      if (this.cashReceiptForm.get('receiptTypeOption')?.value === 'debt_payment') {
        const hasValidPayment = this.selectedInvoicesForPayment.some(inv => inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0);
        if (!hasValidPayment) {
          this.messageService.add({ severity: 'warn', summary: 'Información Faltante', detail: 'Debe seleccionar al menos una factura y especificar un monto a abonar.' });
        }
      }
      return;
    }

    const formValue = this.cashReceiptForm.value;
    const client: Client = formValue.client;
    //const enterpriseId = this.localStorageMethods.getIdEnterprise();
    const enterpriseId = "asdasdasfafa"

    if (!enterpriseId) {
      this.messageService.add({ severity: 'error', summary: 'Error de Configuración', detail: 'No se encontró el ID de la empresa. Por favor, inicie sesión de nuevo.' });
      return;
    }

    let typeOptionId: number = 1;

    if (formValue.receiptTypeOption === 'debt_payment') {
      typeOptionId = 1;
    } else {
      typeOptionId = 2;
    }

    // 1. Construir el objeto de solicitud para la API (ReceiptCreateRequest)
    const requestData: ReceiptCreateRequest = {
      thirdPartyId: client.id,
      paymentMethodId: formValue.paymentMethod,
      receiptTypeId: typeOptionId, // Asegúrate que el dropdown entrega el ID numérico
      observations: formValue.observations,
      ledgerAccountId: 123,
      enterpriseId: enterpriseId,
      totalAmount: this.totalAmount,
      details: [],
    };

    // 2. Llenar los detalles según el tipo de recibo
    if (formValue.receiptTypeOption === 'debt_payment') {
      requestData.details = this.selectedInvoicesForPayment
        .filter(invoice => invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0)
        .map(invoice => ({
          invoiceId: invoice.id,
          amountPaid: invoice.amountToPay!
        }));
    } else if (formValue.receiptTypeOption === 'direct_income') {
      requestData.ledgerAccountId = formValue.auxiliaryAccount; // Asigna la cuenta para ingreso directo
    }

    console.log('Enviando a la API:', requestData);

    // 3. Llamar al servicio con el objeto correcto
    this.cashReceiptService.createReceipt(requestData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Recibo de caja ${response.receiptCode} creado correctamente.`
        });
        // Redirigir después de un breve momento para que el usuario vea el mensaje
        setTimeout(() => {
          this.router.navigate(['/financial/wallet/receipts']);
        }, 2000);
      },
      error: (err) => {
        // Manejo de errores más específico si la API devuelve mensajes
        const errorMessage = err.error?.message || 'No se pudo crear el recibo. Intente de nuevo.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        console.error('Error al crear recibo:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/financial/wallet/receipts']); // Define la ruta a la que deseas volver
  }
}
