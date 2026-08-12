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
import { CardModule } from 'primeng/card';
import { Router, ActivatedRoute } from '@angular/router';
import { ExpenseReceipt } from '../../Model/ExpenseReceipt';
import { ExpenseReceiptDetail } from '../../Model/ExpenseReceiptDetail';
import { PaymentMethodsServiceService } from '../../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { PaymentMethod } from '../../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { ExpenseReceiptService } from '../../Service/expense-receipt.service';
import { PurchaseInvoice } from '../../Model/Models';
import { ExpenseReceiptCreateRequest } from '../../Model/ExpenseReceiptCreateRequest';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';

// Modelos adicionales para el frontend
interface DropdownOption {
  label: string;
  value: string;
}

interface Supplier {
  id: number;
  name: string;
  // Otros campos relevantes del proveedor
}

@Component({
  selector: 'app-expense-receipt-creation',
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
    CardModule,
  ],
  templateUrl: './expense-receipt-creation.component.html',
  styleUrl: './expense-receipt-creation.component.css',
  providers: [MessageService]
})
export class ExpenseReceiptCreationComponent {
  localStorageMethods = new LocalStorageMethods();

  expenseReceiptForm!: FormGroup;
  receiptTypes: DropdownOption[] = [];
  paymentMethods: PaymentMethod[] = [];
  receiptTypeOptions: DropdownOption[] = [];
  auxiliaryAccounts: DropdownOption[] = [];

  // Para Autocomplete de Proveedor
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];

  // Para facturas disponibles del proveedor seleccionado
  availableInvoices: any[] = [];

  // Para selección múltiple de facturas
  selectedInvoices: any[] = [];

  // Cuentas por pagar (Post To)
  payableAccounts: any[] = [];

  // Detalles de la factura seleccionada
  selectedInvoiceDetails: any = null;

  totalAmount: number = 0;

  // Payment information from bill
  billPaymentInfo: {
    billId?: number;
    billCode?: string;
    supplierName?: string;
    totalAmount?: number;
    paidAmount?: number;
    pendingBalance?: number;
  } = {};

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private paymentMethodService: PaymentMethodsServiceService,
    private expenseReceiptService: ExpenseReceiptService,
    private chartAccountService: ChartAccountService
  ) { }

  ngOnInit(): void {
    // Check if we're coming from a bill payment
    this.route.queryParams.subscribe(params => {
      if (params['billId']) {
        this.billPaymentInfo = {
          billId: +params['billId'],
          billCode: params['billCode'],
          supplierName: params['supplierName'],
          totalAmount: +params['totalAmount'],
          paidAmount: +params['paidAmount'] || 0,
          pendingBalance: +params['pendingBalance']
        };
      }
    });

    this.initializeForm();
    this.loadDropdownOptions();
    this.updateTotalAmount();
    this.subscribeToFormChanges();

    // Pre-populate form if coming from bill payment
    if (this.billPaymentInfo.billId) {
      this.prefillFormWithBillInfo();
    }
  }

  initializeForm(): void {
    this.expenseReceiptForm = this.fb.group({
      supplier: [null, Validators.required],
      postToAccount: [null, Validators.required],
      transferAccount: [null, Validators.required],
      issueDate: [new Date(), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      observations: [''],
      auxiliaryAccount: [null], // Solo requerido si es gasto directo
      isPartialPayment: [false]
    });
  }

  // Validator for partial payment
  validatePaymentAmount(): boolean {
    const totalAmount = this.expenseReceiptForm.get('totalAmount')?.value || 0;
    const pendingBalance = this.billPaymentInfo.pendingBalance || 0;

    if (this.billPaymentInfo.billId && totalAmount > pendingBalance) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto Excedido',
        detail: `El monto del pago (${this.formatCurrency(totalAmount)}) no puede exceder el saldo pendiente (${this.formatCurrency(pendingBalance)})`
      });
      return false;
    }

    return true;
  }

  loadDropdownOptions(): void {
    // Cargar métodos de pago (Transfer Account)
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      this.messageService.add({ severity: 'error', summary: 'Empresa requerida', detail: 'Seleccione una empresa activa.' });
      return;
    }
    this.paymentMethodService.findAll(enterpriseId, 0, 100)
      .subscribe({
        next: (page) => {
          this.paymentMethods = page.content;

          // Si no hay métodos de pago configurados, usar datos de respaldo
        },
        error: (error) => {
          console.error('Error al cargar métodos de pago:', error);
          // En caso de error, usar datos de respaldo
          this.paymentMethods = [];
        }
      });

    // Cargar cuentas por pagar (Post To)
    this.chartAccountService.getListAuxiliaryAccounts(enterpriseId).subscribe(accounts => {
      this.payableAccounts = accounts.filter(account => account.status !== false).map(account => ({
        id: account.id, code: account.code, name: account.description,
        fullName: `${account.code} - ${account.description}`
      }));
    });

    // Cargar cuentas auxiliares para gastos directos
    this.expenseReceiptService.getAuxiliaryAccounts().subscribe(data => {
      this.auxiliaryAccounts = data;
    });
  }

  subscribeToFormChanges(): void {
    // Los cambios se manejan directamente en los métodos onSupplierSelect y onInvoiceSelect
  }

  // Pre-fill form when coming from bill payment
  prefillFormWithBillInfo(): void {
    if (!this.billPaymentInfo.billId) return;

    // Precarga opcional al navegar desde una obligación.
    const supplier = {
      id: 1, // This should be the actual supplier ID from the bill
      name: this.billPaymentInfo.supplierName || ''
    };
    this.expenseReceiptForm.patchValue({
      supplier: supplier,
      totalAmount: this.billPaymentInfo.pendingBalance
    });

    // Load invoices for this supplier
    if (supplier.id) {
      this.loadInvoicesForSupplier(supplier.id);
    }

    // Show message about partial payment
    if (this.billPaymentInfo.paidAmount && this.billPaymentInfo.paidAmount > 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Pago Parcial',
        detail: `Esta factura ya tiene un pago de ${this.formatCurrency(this.billPaymentInfo.paidAmount)}. Saldo pendiente: ${this.formatCurrency(this.billPaymentInfo.pendingBalance || 0)}`
      });
    }
  }

  // Autocompletado de proveedores
  searchSupplier(event: any): void {
    this.expenseReceiptService.getSuppliers(event.query).subscribe(data => {
      this.filteredSuppliers = data;
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Cuando selecciona un proveedor
  onSupplierSelect(event: any): void {
    const supplier = event.value || event;
    if (supplier && supplier.id) {
      this.loadInvoicesForSupplier(supplier.id);
    }
  }

  // Cargar facturas del proveedor seleccionado
  loadInvoicesForSupplier(supplierId: number): void {
    // Las obligaciones disponibles provienen de la réplica de Tesorería.
    this.expenseReceiptService.getInvoicesBySupplier(supplierId).subscribe(invoices => {
      this.availableInvoices = invoices.map(invoice => ({
        id: invoice.id, billId: invoice.factCode, date: invoice.expirationDate,
        total: invoice.pendingValue, paidAmount: 0, pendingBalance: invoice.pendingValue,
        displayText: `${invoice.factCode} - ${this.formatCurrency(invoice.pendingValue)}`
      }));
    });

    // Limpiar selección anterior
    this.selectedInvoices = [];
    this.selectedInvoiceDetails = null;
    
    // Actualizar el total a 0
    this.expenseReceiptForm.get('totalAmount')?.setValue(0);
  }

  // Calcular el total de las facturas seleccionadas
  calculateSelectedTotal(): number {
    return this.selectedInvoices.reduce((sum, invoice) => sum + (invoice.pendingBalance || 0), 0);
  }

  // Actualizar el monto total cuando cambia la selección
  onInvoiceSelectionChange(): void {
    const totalSelected = this.calculateSelectedTotal();
    this.expenseReceiptForm.get('totalAmount')?.setValue(totalSelected);
  }

  // Obtener el nombre del método de pago seleccionado
  getPaymentMethodName(): string {
    const methodId = this.expenseReceiptForm.get('transferAccount')?.value;
    if (!methodId) return '';
    
    const method = this.paymentMethods.find(m => m.id === methodId);
    return method ? `${method.name} (${method.accountingAccount})` : '';
  }

  // Obtener los IDs de las facturas seleccionadas como string
  getSelectedBillIds(): string {
    return this.selectedInvoices.map(inv => inv.billId).join(', ');
  }

  updateTotalAmount(): void {
    // El total se actualiza automáticamente al seleccionar la factura
    this.totalAmount = this.expenseReceiptForm?.get('totalAmount')?.value || 0;
  }

  isFormValidForSubmission(): boolean {
    // Validar que se haya seleccionado al menos una factura
    if (this.selectedInvoices.length === 0) {
      return false;
    }
    
    // Validar los campos del formulario
    const basicValidation = this.expenseReceiptForm.get('supplier')?.valid &&
                           this.expenseReceiptForm.get('postToAccount')?.valid &&
                           this.expenseReceiptForm.get('transferAccount')?.valid &&
                           this.expenseReceiptForm.get('issueDate')?.valid &&
                           this.expenseReceiptForm.get('totalAmount')?.valid;
    
    return basicValidation || false;
  }

  onSubmit(): void {
    this.expenseReceiptForm.markAllAsTouched();

    // Validar selección de facturas
    if (this.selectedInvoices.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selección Requerida',
        detail: 'Debe seleccionar al menos una factura para pagar.'
      });
      return;
    }

    if (!this.isFormValidForSubmission()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Validación',
        detail: 'Por favor, complete todos los campos requeridos.'
      });
      return;
    }

    const formValue = this.expenseReceiptForm.value;
    const supplier: Supplier = formValue.supplier;
    const enterpriseId = this.localStorageMethods.getIdEnterprise();

    if (!enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Configuración',
        detail: 'No se encontró el ID de la empresa. Por favor, inicie sesión de nuevo.'
      });
      return;
    }

    // Construir los detalles de pago para cada factura seleccionada
    const paymentDetails = this.selectedInvoices.map(invoice => ({
      invoiceId: invoice.id,
      amountPaid: invoice.pendingBalance // Pagar el saldo pendiente completo
    }));

    // Construir el objeto de solicitud para la API
    const requestData: ExpenseReceiptCreateRequest = {
      thirdPartyId: supplier.id,
      paymentMethodId: formValue.transferAccount,
      receiptTypeId: 1, // Siempre es pago de factura
      observations: formValue.observations || `Pago de ${this.selectedInvoices.length} factura(s): ${this.selectedInvoices.map(inv => inv.billId).join(', ')}`,
      enterpriseId: enterpriseId,
      totalAmount: formValue.totalAmount,
      details: paymentDetails,
      ledgerAccountId: formValue.postToAccount
    };

    // Mostrar resumen antes de enviar
    const billIds = this.selectedInvoices.map(inv => inv.billId).join(', ');
    console.log('Creando comprobante de egreso para:', billIds);
    console.log('Total a pagar:', this.formatCurrency(formValue.totalAmount));

    // Enviar la solicitud al backend
    this.expenseReceiptService.createExpenseReceipt(requestData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Comprobante de egreso ${response.receiptCode} creado correctamente para ${this.selectedInvoices.length} factura(s).`
        });

        // Redirigir al listado después de un breve retraso
        setTimeout(() => {
          this.router.navigate(['/financial/treasury/expense-receipts']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al crear el comprobante de egreso:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al crear el comprobante de egreso. Intente nuevamente.'
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/financial/treasury/expense-receipts']);
  }
}
