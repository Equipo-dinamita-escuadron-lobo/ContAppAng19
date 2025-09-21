import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Facture2 } from '../../models/Facture2';
import { Product2, ProductList2 } from '../../models/Product2';
import { SteletonService } from '../../services/steleton.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ProductResponse } from '../../../BusinessMasters/ValuationModels/WeightedAverage/models/ProductResponse';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProductService } from '../../../BusinessMasters/ValuationModels/WeightedAverage/services/product.service';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

interface InvoiceType {
  label: string;
  value: string;
}

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule,
    DatePickerModule,
    AutoCompleteModule
  ],
  providers: [MessageService],
  templateUrl: './create-invoice.component.html',
  styleUrl: './create-invoice.component.css'
})
export class CreateInvoiceComponent implements OnInit {
  invoiceForm: FormGroup;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  selectedInvoiceType: string = '';

  productId: number = 0;
  totalRecords = 0;
  first = 0;
  allProducts: ProductList2[] = [];
  filteredProducts: ProductList2[] = [];
  selectedProduct: ProductList2 | undefined;

  invoiceTypes: InvoiceType[] = [
    { label: 'Factura de Compra', value: 'purchase' },
    { label: 'Factura de Venta', value: 'sale' }
  ];

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private steletonService: SteletonService,

  ) {
    this.invoiceForm = this.createInvoiceForm();
  }

  ngOnInit(): void {
    console.log('Componente de creación de factura inicializado');
    this.entData = this.localStorageMethods.loadEnterpriseData();
    console.log('Datos de empresa cargados:', this.entData);

    // Suscribirse a cambios en el total pagado para calcular el valor pendiente
    this.invoiceForm.get('totalPay')?.valueChanges.subscribe(() => {
      this.calculatePendingValue();
    });

    this.steletonService.getAllProductsByEnterpriseId().subscribe(response => {
      this.allProducts = response;
    });
  }

  private createInvoiceForm(): FormGroup {
    const randomFactCode = Math.floor(Math.random() * 10000) + 1;

    return this.formBuilder.group({
      invoiceType: ['', Validators.required],
      factCode: [{ value: randomFactCode, disabled: true }, Validators.required],
      thId: ['', Validators.required],
      expirationDate: ['', Validators.required],
      accountingAccount: ['', Validators.required],
      factProducts: this.formBuilder.array([this.createProductForm()]),
      totalValue: [{ value: '', disabled: true }],
      totalPay: ['', Validators.required],
      pendingValue: [{ value: '', disabled: true }]
    });
  }

  private createProductForm(): FormGroup {
    const productForm = this.formBuilder.group({
      productId: [this.productId || '', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      descount: [0, [Validators.min(0), Validators.max(100)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]], // Siempre requerido
      subtotal: [{ value: 0, disabled: true }],
      taxPercentage: [[]],
      taxPercentageInput: ['']
    });

    // Suscribirse a cambios para calcular subtotal
    productForm.get('amount')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));
    productForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));
    productForm.get('descount')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));

    console.log('Nuevo formulario de producto creado:', productForm.value);
    return productForm;
  }

  get factProducts(): FormArray {
    return this.invoiceForm.get('factProducts') as FormArray;
  }

  getProductControls() {
    return this.factProducts.controls;
  }

  onInvoiceTypeChange(event: any): void {
    this.selectedInvoiceType = event.value;
  }

  addProduct(): void {
    const newProduct = this.createProductForm();
    this.factProducts.push(newProduct);
  }

  removeProduct(index: number): void {
    if (this.factProducts.length > 1) {
      this.factProducts.removeAt(index);
      this.calculateTotalValue();
    }
  }

  updateTaxPercentages(index: number): void {
    const product = this.factProducts.at(index);
    const taxInput = product.get('taxPercentageInput')?.value;

    if (taxInput) {
      const percentages = taxInput.split(',').map((p: string) => parseFloat(p.trim())).filter((p: number) => !isNaN(p));
      product.get('taxPercentage')?.setValue(percentages);
    }
  }

  private calculateSubtotal(productForm: FormGroup): void {
    const amount = productForm.get('amount')?.value || 0;
    const unitPrice = productForm.get('unitPrice')?.value || 0;
    const discount = productForm.get('descount')?.value || 0;

    const subtotalBeforeDiscount = amount * unitPrice;
    const discountAmount = subtotalBeforeDiscount * (discount / 100);
    const subtotal = subtotalBeforeDiscount - discountAmount;

    productForm.get('subtotal')?.setValue(subtotal);

    // Recalcular el total general
    this.calculateTotalValue();
  }

  private calculateTotalValue(): void {
    let total = 0;
    this.factProducts.controls.forEach(product => {
      const subtotal = product.get('subtotal')?.value || 0;
      total += subtotal;
    });

    this.invoiceForm.get('totalValue')?.setValue(total);
    this.calculatePendingValue();
  }

  private calculatePendingValue(): void {
    const totalValue = this.invoiceForm.get('totalValue')?.value || 0;
    const totalPay = this.invoiceForm.get('totalPay')?.value || 0;
    const pendingValue = totalValue - totalPay;

    this.invoiceForm.get('pendingValue')?.setValue(pendingValue);
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.getRawValue();

      // Formatear fecha
      const expirationDate = formValue.expirationDate instanceof Date
        ? formValue.expirationDate.toISOString().split('T')[0]
        : formValue.expirationDate;

      // Preparar productos
      const products: Product2[] = formValue.factProducts.map((product: any) => ({
        productId: product.productId,
        amount: product.amount,
        description: product.description,
        descount: product.descount,
        unitPrice: product.unitPrice || 0,
        subtotal: product.subtotal,
        taxPercentage: product.taxPercentage || []
      }));

      const factureData: Facture2 = {
        factId: 0, // Se genera en el backend
        entId: this.entData?.id || '',
        thId: formValue.thId,
        factCode: formValue.factCode,
        factProducts: products,
        totalValue: formValue.totalValue.toString(),
        totalPay: formValue.totalPay.toString(),
        pendingValue: formValue.pendingValue.toString(),
        expirationDate: expirationDate,
        accountingAccount: formValue.accountingAccount
      };

      // Llamar al servicio correspondiente según el tipo de factura
      const serviceCall = formValue.invoiceType === 'purchase'
        ? this.steletonService.createPurchaseSkeleton(factureData)
        : this.steletonService.createSaleForReceiptSkeleton(factureData);

      serviceCall.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Factura de ${formValue.invoiceType === 'purchase' ? 'compra' : 'venta'} creada exitosamente`,
            life: 3000
          });

          // Limpiar el formulario después de guardar exitosamente
          this.clearForm();
        },
        error: (error) => {
          console.error('Error al crear factura', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la factura'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(subKey => {
              arrayControl.get(subKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  /**
   * Limpia el formulario y resetea las variables relacionadas
   */
  clearForm(): void {
    this.invoiceForm.reset();
    this.selectedProduct = undefined;
    this.filteredProducts = [];
    this.selectedInvoiceType = '';

    // Resetear el formulario con valores por defecto
    this.invoiceForm = this.createInvoiceForm();
  }

  /**
   * Maneja la acción de cancelar
   */
  cancelForm(): void {
    this.clearForm();
  }

  /**
   * Navega de vuelta a la lista
   */
  goBack(): void {
    this.router.navigate(['/commercial/invoice-template']);
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.invoiceForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `El valor máximo es ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  onProductSelect(event: ProductResponse) {
    const productForm = this.factProducts.at(this.factProducts.length - 1);
    productForm.get('productId')?.setValue(event.id);
    productForm.get('description')?.setValue(event.name);
  }

  filterProducts(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredProducts = this.allProducts.filter(product => {
      // La propiedad `name` es la que se usa para la búsqueda.
      return product.name.toLowerCase().includes(query);
    });
  }
}
