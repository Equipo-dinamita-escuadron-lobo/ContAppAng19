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
import { InvoiceSelectionComponent } from '../invoice-selection/invoice-selection.component';
import { PaymentMethodsServiceService } from '../../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { PaymentMethod } from '../../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { AuxiliaryAccountOption, Client, DropdownOption, Invoice } from '../../Model';
import { ReceiptCreateRequest } from '../../Model/api';
import { CostCenter } from '../../../../../GeneralMasters/CostCenters/models/cost-center.model';
import { CostCenterService } from '../../../../../GeneralMasters/CostCenters/services/cost-center.service';

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

  cashReceiptForm!: FormGroup; // Formulario reactivo para el recibo de caja
  receiptTypes: DropdownOption[] = []; // Tipos de recibo
  paymentMethods: PaymentMethod[] = []; // Métodos de pago cargados desde el servicio
  receiptTypeOptions: DropdownOption[] = []; // Opciones para el tipo de recibo (Abono a Deuda, Ingreso Directo)
  auxiliaryAccounts: AuxiliaryAccountOption[] = []; // Cuentas auxiliares cargadas desde el servicio

  // Para Autocomplete de Cliente
  clients: Client[] = [];
  filteredClients: Client[] = [];

  // Para Abono a Deuda
  selectedClientInvoices: Invoice[] = []; // Facturas pendientes del cliente seleccionado
  selectedInvoicesForPayment: Invoice[] = []; // Facturas seleccionadas para abono en la tabla principal
  availableInvoicesToSelect: Invoice[] = []; // Facturas disponibles en el diálogo de selección

  displayInvoiceSelectionDialog: boolean = false;

  totalAmount: number = 0;

  // Propiedades para el Centro de Costo
  costCenters: CostCenter[] = [];
  showCostCenterField: boolean = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private paymentMethodService: PaymentMethodsServiceService,
    private cashReceiptService: CashReceiptService,
    private costCenterService: CostCenterService
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
      client: [null, Validators.required],
      issueDate: [new Date(), Validators.required],
      receiptTypeOption: ['', Validators.required],
      observations: [''],

      // Campos condicionales para "Ingreso Directo"
      auxiliaryAccount: [null],
      directIncomeAmount: [null],
      costCenter: [null]
    });
  }

  loadDropdownOptions(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();

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

    this.cashReceiptService.getAuxiliaryAccountsCached(enterpriseId).subscribe(data => {
      this.auxiliaryAccounts = data;
      console.log('Cuentas Auxiliares cargadas:', this.auxiliaryAccounts);
    });
  }

  /**
   * Búsqueda de clientes para el autocomplete
   * @param event Evento del autocomplete 
   */
  searchClient(event: any): void {
    this.cashReceiptService.getClients(event.query).subscribe(clients => {
      this.filteredClients = clients;
    });
  }

  /**
   * Manejador de selección de cliente, aqui se cargan las facturas pendientes del cliente seleccionado
   * @param event Evento de selección del cliente en el autocomplete
   */
  onClientSelect(event: any): void {
    const selectedClient: Client = event.value;
    this.cashReceiptForm.get('client')?.setValue(selectedClient);
    this.loadClientInvoices(selectedClient.id);
    this.selectedInvoicesForPayment = []; // Limpiar selección anterior
    this.updateTotalAmount();
  }

  /**
   * Carga las facturas pendientes de un cliente seleccionado
   * @param clientId ID del cliente para cargar sus facturas pendientes
   */
  loadClientInvoices(clientId: number): void {
    console.log(`Cargando facturas para el cliente ID: ${clientId}`);
    this.cashReceiptService.getInvoicesByClient(clientId).subscribe(invoices => {
      this.selectedClientInvoices = invoices;
      this.availableInvoicesToSelect = [...this.selectedClientInvoices];
    });
  }

  /**
   * Manejador para el cambio en la opcion del tipo de recibo (Abono a Duda o ingreso directo)
   * Resetea y limpia las validaciones de los campos condicionales y limpia la tabla de abono
   */
  onReceiptTypeOptionChange(): void {
    const option = this.cashReceiptForm.get('receiptTypeOption')?.value;

    // Resetear y limpiar validaciones de campos condicionales
    this.cashReceiptForm.get('auxiliaryAccount')?.clearValidators();
    this.cashReceiptForm.get('auxiliaryAccount')?.updateValueAndValidity();
    this.cashReceiptForm.get('directIncomeAmount')?.clearValidators();
    this.cashReceiptForm.get('directIncomeAmount')?.updateValueAndValidity();

    this.resetCostCenterField(); // Reseteamos el campo de centro de costo

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

  /**
   * Manejador para el cambio en la seleccion de facturas en la tabla de abonos
   * @param invoice Factura que fue seleccionada o deseleccionada en la tabla para el respectivo abono
   */
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

  /**
   * Manejador para el cambio en el monto a abonar de una factura en la tabla
   * @param invoice Factura cuyo monto a abonar fue modificado
   */
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

  /**
   * Manejador para cuando el hijo emite las facturas seleccionadas 
   * @param selectedInvoicesFromDialog Facturas seleccionadas en el dialogo hijo
   */
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

  /**
   * Manejador para cuando el hijo cancela
   */
  handleSelectionCancel(): void {
    this.displayInvoiceSelectionDialog = false;
  }


  /**
   * Metodo para suscribirse a los cambios del formulario y actualizar el total en consecuencia 
   */
  subscribeToFormChanges(): void {
    this.cashReceiptForm.valueChanges.subscribe(() => {
      this.updateTotalAmount();
    });
  }

  /**
   * Calcula y actualiza el monto total del recibo basado en la opcion seleccionada y los monstos ingresados
   */
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

  /**
   * Se activa al cambiar la cuenta auxiliar.
   * Verifica si la cuenta seleccionada requiere centro de costo.
   */
  onAuxiliaryAccountChange(): void {
    const accountCode = this.cashReceiptForm.get('auxiliaryAccount')?.value;
    this.resetCostCenterField(); // Reseteamos por si cambian de opción

    if (!accountCode) {
      return;
    }

    const selectedAccount = this.auxiliaryAccounts.find(acc => acc.codeAccount === accountCode);

    console.log('Cuenta Auxiliar seleccionada:', selectedAccount);
    if (selectedAccount && selectedAccount.costCenter) {
      this.showCostCenterField = true;
      this.cashReceiptForm.get('centerCost')?.setValidators(Validators.required);
      this.loadCostCenters();
    }

    this.cashReceiptForm.get('centerCost')?.updateValueAndValidity();
  }

  /**
   * Carga los centros de costo desde el servicio.
   */
  loadCostCenters(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

    this.costCenterService.findActiveAuxiliary(enterpriseId).subscribe(data => {
      this.costCenters = data;
    });

    console.log('Centros de costo cargados:', this.costCenters);
  }

  /**
   * Método para resetear el estado del campo de centro de costo.
   */
  private resetCostCenterField(): void {
    this.showCostCenterField = false;
    this.costCenters = [];
    const costCenterControl = this.cashReceiptForm.get('centerCost');
    costCenterControl?.clearValidators();
    costCenterControl?.setValue(null);
    costCenterControl?.updateValueAndValidity();
  }

  /**
   * Valida si el formulario es valido para ser enviado, 
   * considerando las validaciones condicionales para cada tipo de recibo
   */
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
    return this.cashReceiptForm.valid;
  }

  /**
   * Manejador para el envio del formulario
   * Valida el formulario, construye el objeto de solicitud y llama al servicio para crear el recibo
   */
  onSubmit(): void {
    this.cashReceiptForm.markAllAsTouched();

    if (!this.isFormValidForSubmission()) {
      this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'Por favor, revise los campos del formulario.' });

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
    const enterpriseId = this.localStorageMethods.getIdEnterprise();

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

    const accountingAccount = this.accountingAccountForPaymentMethod();

    if (accountingAccount === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Configuración',
        detail: 'El método de pago seleccionado no tiene una cuenta contable asociada. Por favor, revise la configuración.'
      });
      return; // Detenemos la ejecución.
    }

    // Construir el objeto de solicitud para la API (ReceiptCreateRequest)
    const requestData: ReceiptCreateRequest = {
      thirdPartyId: client.id,
      paymentMethodId: formValue.paymentMethod,
      paymentMethodAccount: accountingAccount,
      receiptTypeId: typeOptionId,
      observations: formValue.observations,
      ledgerAccountId: formValue.auxiliaryAccount,
      enterpriseId: enterpriseId,
      totalAmount: this.totalAmount,
      details: [],
    };

    // Llenar los detalles según el tipo de recibo
    if (formValue.receiptTypeOption === 'debt_payment') {
      requestData.details = this.selectedInvoicesForPayment
        .filter(invoice => invoice.selectedForPayment && invoice.amountToPay && invoice.amountToPay > 0)
        .map(invoice => ({
          invoiceId: invoice.id,
          amountPaid: invoice.amountToPay!
        }));
    } else if (formValue.receiptTypeOption === 'direct_income') {
      requestData.ledgerAccountId = formValue.auxiliaryAccount;

      if (this.showCostCenterField) {
        requestData.centerCostId = formValue.centerCost;
        console.log('Centro de costo seleccionado:', formValue.centerCost);
      }

    }

    console.log('Enviando a la API:', requestData);

    // Llamar al servicio con el objeto correcto
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

  /**
 * Busca el método de pago seleccionado y devuelve el numero de su cuenta contable.
 * @returns La cuenta contable (number) o null si no se encuentra.
 */
  accountingAccountForPaymentMethod(): number | null {
    const paymentMethodId = this.cashReceiptForm.get('paymentMethod')?.value;

    console.log('ID del método de pago seleccionado:', paymentMethodId);

    if (!paymentMethodId)
      return null;

    const selectedPaymentMethod = this.paymentMethods.find(pm => pm.id === paymentMethodId);

    console.log('Método de pago seleccionado:', selectedPaymentMethod);

    if (selectedPaymentMethod && selectedPaymentMethod.accountingAccountId) {

      const accountingAccountString = selectedPaymentMethod.accountingAccount;
      const accountNumberMatch = accountingAccountString.match(/^(\d+)\s*-/);
      if (accountNumberMatch && accountNumberMatch[1]) {
        return Number(accountNumberMatch[1]);
      }
    }

    return null;
  }

  goBack(): void {
    this.router.navigate(['/financial/wallet/receipts']);
  }
}
