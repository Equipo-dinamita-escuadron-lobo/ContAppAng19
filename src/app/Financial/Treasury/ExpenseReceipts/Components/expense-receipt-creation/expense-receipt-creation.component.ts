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

  // Cuentas por pagar (Post To)
  payableAccounts: any[] = [];

  // Detalles de la factura seleccionada
  selectedInvoiceDetails: any = null;

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
      supplier: [null, Validators.required],
      invoice: [null, Validators.required],
      postToAccount: [null, Validators.required],
      transferAccount: [null, Validators.required],
      issueDate: [new Date(), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      observations: [''],
      auxiliaryAccount: [null] // Solo requerido si es gasto directo
    });
  }

  loadDropdownOptions(): void {
    // Cargar métodos de pago (Transfer Account)
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

    // Cargar cuentas por pagar (Post To)
    this.payableAccounts = [
      { id: 1, code: '220505', name: 'Proveedores Nacionales', fullName: '220505 - Proveedores Nacionales' },
      { id: 2, code: '220510', name: 'Proveedores del Exterior', fullName: '220510 - Proveedores del Exterior' },
      { id: 3, code: '220515', name: 'Cuentas por Pagar Diversas', fullName: '220515 - Cuentas por Pagar Diversas' }
    ];

    // Cargar cuentas auxiliares para gastos directos
    this.expenseReceiptService.getAuxiliaryAccounts().subscribe(data => {
      this.auxiliaryAccounts = data;
    });
  }

  subscribeToFormChanges(): void {
    // Los cambios se manejan directamente en los métodos onSupplierSelect y onInvoiceSelect
  }

  // Autocompletado de proveedores
  searchSupplier(event: any): void {
    this.expenseReceiptService.getSuppliers(event.query).subscribe(data => {
      this.filteredSuppliers = data;
    });
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
    // Mock data de facturas contabilizadas (POSTED) del proveedor
    const mockInvoices = [
      {
        id: 1,
        billId: 'BILL-20250914-0001',
        date: new Date('2025-09-14'),
        total: 1190000,
        displayText: 'BILL-20250914-0001 - $1,190,000 (14/09/2025)'
      },
      {
        id: 2,
        billId: 'BILL-20250913-0002',
        date: new Date('2025-09-13'),
        total: 595000,
        displayText: 'BILL-20250913-0002 - $595,000 (13/09/2025)'
      }
    ];

    this.availableInvoices = mockInvoices;

    // Limpiar factura seleccionada anterior
    this.expenseReceiptForm.get('invoice')?.setValue(null);
    this.selectedInvoiceDetails = null;
  }

  // Cuando selecciona una factura
  onInvoiceSelect(event: any): void {
    const invoiceId = event.value;
    const selectedInvoice = this.availableInvoices.find(inv => inv.id === invoiceId);

    if (selectedInvoice) {
      // Llenar automáticamente el monto
      this.expenseReceiptForm.get('totalAmount')?.setValue(selectedInvoice.total);

      // Mostrar detalles de la factura
      this.selectedInvoiceDetails = {
        date: selectedInvoice.date,
        number: selectedInvoice.billId,
        type: 'Factura',
        debit: selectedInvoice.total, // En el pago, se debita cuentas por pagar
        credit: selectedInvoice.total  // Se acredita la cuenta de pago (caja/banco)
      };
    }
  }

  updateTotalAmount(): void {
    // El total se actualiza automáticamente al seleccionar la factura
    this.totalAmount = this.expenseReceiptForm?.get('totalAmount')?.value || 0;
  }

  isFormValidForSubmission(): boolean {
    return this.expenseReceiptForm.valid;
  }

  onSubmit(): void {
    this.expenseReceiptForm.markAllAsTouched();

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

    // Construir el objeto de solicitud para la API
    const requestData: ExpenseReceiptCreateRequest = {
      thirdPartyId: supplier.id,
      paymentMethodId: formValue.transferAccount,
      receiptTypeId: 1, // Siempre es pago de factura
      observations: formValue.observations,
      enterpriseId: enterpriseId,
      totalAmount: formValue.totalAmount,
      details: [{
        invoiceId: formValue.invoice,
        amountPaid: formValue.totalAmount
      }],
      ledgerAccountId: formValue.postToAccount
    };

    // Enviar la solicitud al backend
    this.expenseReceiptService.createExpenseReceipt(requestData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Comprobante de egreso ${response.receiptCode} creado correctamente.`
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
