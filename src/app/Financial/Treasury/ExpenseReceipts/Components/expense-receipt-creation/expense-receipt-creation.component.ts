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
import { ExpenseReceipt } from '../../Model/ExpenseReceipt';
import { ExpenseReceiptDetail } from '../../Model/ExpenseReceiptDetail';
import { SupplierInvoiceSelectionComponent } from '../supplier-invoice-selection/supplier-invoice-selection.component';
import { PaymentMethodsServiceService } from '../../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { PaymentMethod } from '../../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { ExpenseReceiptService } from '../../Service/expense-receipt.service';
import { PurchaseInvoice } from '../../Model/Models';
import { ExpenseReceiptCreateRequest } from '../../Model/ExpenseReceiptCreateRequest';

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
    SupplierInvoiceSelectionComponent
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

  // Para Pago de Facturas
  selectedSupplierInvoices: PurchaseInvoice[] = []; // Facturas pendientes del proveedor seleccionado
  selectedInvoicesForPayment: PurchaseInvoice[] = []; // Facturas seleccionadas para pago en la tabla principal
  availableInvoicesToSelect: PurchaseInvoice[] = []; // Facturas disponibles en el diálogo de selección

  displayInvoiceSelectionDialog: boolean = false;

  totalAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private paymentMethodService: PaymentMethodsServiceService,
    private expenseReceiptService: ExpenseReceiptService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();
    this.updateTotalAmount();
    this.subscribeToFormChanges();
  }

  initializeForm(): void {
    this.expenseReceiptForm = this.fb.group({
      receiptType: ['', Validators.required],
      receiptTypeOption: ['debt_payment', Validators.required], // 'debt_payment' o 'direct_expense'
      supplier: [null, Validators.required],
      paymentMethod: ['', Validators.required],
      issueDate: [new Date(), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      observations: [''],
      auxiliaryAccount: [null] // Solo requerido si es gasto directo
    });
  }

  loadDropdownOptions(): void {
    // Cargar tipos de recibo
    this.expenseReceiptService.getReceiptTypes().subscribe(data => {
      this.receiptTypes = data;
    });

    // Cargar métodos de pago
    this.paymentMethodService.findAll(this.localStorageMethods.getIdEnterprise() || 'test', 0, 100)
      .subscribe({
        next: (page) => {
          this.paymentMethods = page.content;

          // Si no hay métodos de pago configurados, usar datos de respaldo
          if(this.paymentMethods.length === 0){
            this.paymentMethods = [
              { id: 1, name: 'Caja', accountingAccount: '110505', accountingAccountId: 1, status: true, idEnterprise: '' },
              { id: 2, name: 'Banco', accountingAccount: '111005', accountingAccountId: 2, status: true, idEnterprise: '' },
              { id: 3, name: 'Tarjeta de Crédito', accountingAccount: '112005', accountingAccountId: 3, status: true, idEnterprise: '' }
            ];
          }
        },
        error: (error) => {
          console.error('Error al cargar métodos de pago:', error);
          // En caso de error, usar datos de respaldo
          this.paymentMethods = [
            { id: 1, name: 'Caja', accountingAccount: '110505', accountingAccountId: 1, status: true, idEnterprise: '' },
            { id: 2, name: 'Banco', accountingAccount: '111005', accountingAccountId: 2, status: true, idEnterprise: '' },
            { id: 3, name: 'Tarjeta de Crédito', accountingAccount: '112005', accountingAccountId: 3, status: true, idEnterprise: '' }
          ];
        }
      });

    // Cargar cuentas auxiliares para gastos directos
    this.expenseReceiptService.getAuxiliaryAccounts().subscribe(data => {
      this.auxiliaryAccounts = data;
    });

    // Opciones de tipo de recibo
    this.receiptTypeOptions = [
      { label: 'Pago de facturas pendientes', value: 'debt_payment' },
      { label: 'Gasto directo', value: 'direct_expense' }
    ];
  }

  subscribeToFormChanges(): void {
    // Cuando cambia el tipo de opción de recibo
    this.expenseReceiptForm.get('receiptTypeOption')?.valueChanges.subscribe(value => {
      if (value === 'direct_expense') {
        // Gasto directo: limpiar facturas y hacer auxiliaryAccount requerido
        this.selectedInvoicesForPayment = [];
        this.expenseReceiptForm.get('auxiliaryAccount')?.setValidators([Validators.required]);
        this.expenseReceiptForm.get('totalAmount')?.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        // Pago de deuda: remover validación de auxiliaryAccount
        this.expenseReceiptForm.get('auxiliaryAccount')?.clearValidators();
        this.expenseReceiptForm.get('totalAmount')?.clearValidators();
      }
      this.expenseReceiptForm.get('auxiliaryAccount')?.updateValueAndValidity();
      this.expenseReceiptForm.get('totalAmount')?.updateValueAndValidity();
      this.updateTotalAmount();
    });

    // Cuando cambia el proveedor seleccionado
    this.expenseReceiptForm.get('supplier')?.valueChanges.subscribe(supplier => {
      if (supplier && supplier.id) {
        this.loadSupplierInvoices(supplier.id);
      } else {
        this.selectedSupplierInvoices = [];
        this.selectedInvoicesForPayment = [];
      }
    });
  }

  // Autocompletado de proveedores
  searchSupplier(event: any): void {
    this.expenseReceiptService.getSuppliers(event.query).subscribe(data => {
      this.filteredSuppliers = data;
    });
  }

  loadSupplierInvoices(supplierId: number): void {
    this.expenseReceiptService.getInvoicesBySupplier(supplierId).subscribe(
      invoices => {
        this.selectedSupplierInvoices = invoices.map(inv => ({
          ...inv,
          selectedForPayment: false,
          amountToPay: 0
        }));
      },
      error => {
        console.error('Error al cargar facturas del proveedor:', error);
        this.messageService.add({ severity: 'warn', summary: 'Información', detail: 'No se encontraron facturas pendientes para este proveedor.' });
        this.selectedSupplierInvoices = [];
      }
    );
  }

  // Gestión de facturas seleccionadas para pago
  openInvoiceSelectionDialog(): void {
    this.availableInvoicesToSelect = this.selectedSupplierInvoices.filter(inv =>
      !this.selectedInvoicesForPayment.some(selected => selected.id === inv.id)
    );
    this.displayInvoiceSelectionDialog = true;
  }

  onInvoicesSelected(selectedInvoices: PurchaseInvoice[]): void {
    selectedInvoices.forEach(invoice => {
      if (!this.selectedInvoicesForPayment.some(selected => selected.id === invoice.id)) {
        this.selectedInvoicesForPayment.push({
          ...invoice,
          selectedForPayment: true,
          amountToPay: invoice.pendingValue
        });
      }
    });
    this.updateTotalAmount();
  }

  removeInvoiceFromPayment(invoice: PurchaseInvoice): void {
    this.selectedInvoicesForPayment = this.selectedInvoicesForPayment.filter(inv => inv.id !== invoice.id);
    this.updateTotalAmount();
  }

  onInvoiceAmountChange(): void {
    this.updateTotalAmount();
  }

  updateTotalAmount(): void {
    if (this.expenseReceiptForm?.get('receiptTypeOption')?.value === 'debt_payment') {
      // Pago de facturas: sumar los montos de las facturas seleccionadas
      this.totalAmount = this.selectedInvoicesForPayment
        .filter(inv => inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0)
        .reduce((sum, inv) => sum + (inv.amountToPay || 0), 0);
    } else {
      // Gasto directo: usar el valor del formulario
      this.totalAmount = this.expenseReceiptForm?.get('totalAmount')?.value || 0;
    }

    // Actualizar el campo del formulario sin disparar eventos
    this.expenseReceiptForm?.get('totalAmount')?.setValue(this.totalAmount, { emitEvent: false });
  }

  isFormValidForSubmission(): boolean {
    if (!this.expenseReceiptForm.valid) {
      return false;
    }

    if (this.expenseReceiptForm.get('receiptTypeOption')?.value === 'debt_payment') {
      // Para pago de facturas, debe haber al menos una factura seleccionada con monto válido
      const hasValidPayment = this.selectedInvoicesForPayment.some(inv =>
        inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0
      );
      return hasValidPayment;
    }

    return this.expenseReceiptForm.valid;
  }

  onSubmit(): void {
    this.expenseReceiptForm.markAllAsTouched();

    if (!this.isFormValidForSubmission()) {
      this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'Por favor, revise los campos del formulario.' });

      // Mensaje específico si es pago de facturas y no hay facturas válidas seleccionadas
      if (this.expenseReceiptForm.get('receiptTypeOption')?.value === 'debt_payment') {
        const hasValidPayment = this.selectedInvoicesForPayment.some(inv => inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0);
        if (!hasValidPayment) {
          this.messageService.add({ severity: 'warn', summary: 'Información Faltante', detail: 'Debe seleccionar al menos una factura y especificar un monto a pagar.' });
        }
      }
      return;
    }

    const formValue = this.expenseReceiptForm.value;
    const supplier: Supplier = formValue.supplier;
    const enterpriseId = "asdasdasfafa"; // TODO: Obtener del localStorage

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

    // 1. Construir el objeto de solicitud para la API (ExpenseReceiptCreateRequest)
    const requestData: ExpenseReceiptCreateRequest = {
      thirdPartyId: supplier.id,
      paymentMethodId: formValue.paymentMethod,
      receiptTypeId: typeOptionId,
      observations: formValue.observations,
      enterpriseId: enterpriseId,
      totalAmount: this.totalAmount,
      details: this.selectedInvoicesForPayment
        .filter(inv => inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0)
        .map(inv => ({
          invoiceId: inv.id,
          amountPaid: inv.amountToPay || 0
        })),
      ledgerAccountId: formValue.auxiliaryAccount || 0
    };

    // 2. Enviar la solicitud al backend
    this.expenseReceiptService.createExpenseReceipt(requestData).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Comprobante de egreso ${response.receiptCode} creado correctamente.` });

        // 3. Redirigir al listado después de un breve retraso
        setTimeout(() => {
          this.router.navigate(['/financial/treasury/expense-receipts']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al crear el comprobante de egreso:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al crear el comprobante de egreso. Intente nuevamente.' });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/financial/treasury/expense-receipts']);
  }
}
