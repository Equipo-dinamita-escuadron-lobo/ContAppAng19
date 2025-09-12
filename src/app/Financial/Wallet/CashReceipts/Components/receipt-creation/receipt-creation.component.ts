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
    private router: Router,
    private paymentMethodService: PaymentMethodsServiceService,
    private cashReceiptService: CashReceiptService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();
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
    const enterpriseId = this.localStorageMethods.getIdEnterprise();

    // CAMBIO: Cargar desde el servicio
    this.cashReceiptService.getReceiptTypes().subscribe(data => {
      this.receiptTypes = data;
    });

    this.paymentMethodService.findAll(enterpriseId, 0, 10).subscribe((page) => {
      this.paymentMethods = page.content;
    });

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
    this.cashReceiptForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones

    if (this.isFormValidForSubmission()) {
      const formValue = this.cashReceiptForm.value;
      const client: Client = formValue.client; // Obtener el objeto completo del cliente
      const paymentMethod = formValue.paymentMethod;
      const auxAccount = formValue.auxiliaryAccount;

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
        paymentMethodId: paymentMethod,
        auxAccount: auxAccount
      };

      if (formValue.receiptTypeOption === 'direct_income') {
        // Si es ingreso directo, no hay detalles de factura, pero el totalAmount ya está calculado.
        // Podrías añadir un detalle genérico si el backend lo requiere, o dejarlo vacío.
        newReceipt.details = []; // o un detalle con id de cuenta contable si aplica
      }


      console.log('Datos del recibo de caja a enviar:', newReceipt);
      this.cashReceiptService.createReceipt(newReceipt).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recibo de caja creado correctamente.' });
          // Opcional: limpiar formulario y redirigir
          this.cashReceiptForm.reset();
          this.selectedInvoicesForPayment = [];
          this.updateTotalAmount();
          this.router.navigate(['/financial/wallet/receipts']);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el recibo. Intente de nuevo.' });
          console.error('Error al crear recibo:', err);
        }
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, revise los campos marcados en rojo.' });
      console.log('Formulario inválido', this.cashReceiptForm.errors);
      if (this.cashReceiptForm.get('receiptTypeOption')?.value === 'debt_payment') {
        const hasValidPayment = this.selectedInvoicesForPayment.some(invoice =>
          invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0 && invoice.amountToPay <= invoice.pendingValue!
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
