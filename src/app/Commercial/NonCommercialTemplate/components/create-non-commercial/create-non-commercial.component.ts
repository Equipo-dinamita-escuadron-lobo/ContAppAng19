import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Facture2 } from '../../models/Facture';
import { Product2, ProductList2 } from '../../models/Product2';
import { SkeletonNonCommercialService } from '../../service/skeleton-non-commercial.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Tag } from '../../models/Tag';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

interface NonCommercialEventType {
  label: string;
  value: string;
}

@Component({
  selector: 'app-create-non-commercial',
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
    AutoCompleteModule
  ],
  providers: [MessageService],
  templateUrl: './create-non-commercial.component.html',
  styleUrl: './create-non-commercial.component.css'
})
export class CreateNonCommercialComponent implements OnInit {
  nonCommercialForm: FormGroup;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  selectedEventType: string = '';

  productId: number = 0;
  allProducts: ProductList2[] = [];
  filteredProducts: ProductList2[] = [];
  selectedProduct: ProductList2 | undefined;

  allTags: Tag[] = [];
  selectedTag: Tag | undefined;

  eventTypes: NonCommercialEventType[] = [
    { label: 'Entrada no Comercial', value: 'entry' },
    { label: 'Salida no Comercial', value: 'exit' }
  ];

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private skeletonNonCommercialService: SkeletonNonCommercialService
  ) {
    this.nonCommercialForm = this.createNonCommercialForm();
  }

  ngOnInit(): void {
    console.log('Componente de evento no comercial inicializado');
    this.entData = this.localStorageMethods.loadEnterpriseData();
    console.log('Datos de empresa cargados:', this.entData);

    this.skeletonNonCommercialService.getAllProductsByEnterpriseId().subscribe({
      next: (response) => {
        this.allProducts = response;
        console.log('Productos cargados:', this.allProducts); // Para debug
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
      }
    });

    this.skeletonNonCommercialService.getAllNonCommercialTag().subscribe({
      next: (response) => {
        this.allTags = response;
        console.log('Tags cargados:', this.allTags);
      },
      error: (error) => {
        console.error('Error cargando tags:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las etiquetas'
        });
      }
    });

  }

  private createNonCommercialForm(): FormGroup {
    const randomFactCode = Math.floor(Math.random() * 10000) + 1;

    return this.formBuilder.group({
      eventType: ['exit', Validators.required],
      factCode: [{ value: randomFactCode, disabled: true }, Validators.required],
      thId: [1, Validators.required],
      accountingAccount: [5, Validators.required],
      tagTitle: ['', Validators.required],
      factProducts: this.formBuilder.array([this.createProductForm()]),
      totalValue: [{ value: 0, disabled: true }]
    });
  }

  private createProductForm(): FormGroup {
    const productForm = this.formBuilder.group({
      productId: [this.productId || '', Validators.required], 
      amount: [5, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      descount: [0, [Validators.min(0), Validators.max(100)]],
      unitPrice: [12, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }]
    });

    productForm.get('amount')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));
    productForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));
    productForm.get('descount')?.valueChanges.subscribe(() => this.calculateSubtotal(productForm));

    console.log('Nuevo formulario de producto creado:', productForm.value);
    return productForm;
  }

  get factProducts(): FormArray {
    return this.nonCommercialForm.get('factProducts') as FormArray;
  }

  getProductControls() {
    return this.factProducts.controls;
  }


  private getProductFormGroup(index: number): FormGroup {
    return this.factProducts.at(index) as FormGroup;
  }

  onEventTypeChange(event: any): void {
    this.selectedEventType = event.value;
    console.log('Event type changed:', event.value);
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

  onProductSelect(event: ProductList2): void {
    console.log('Producto seleccionado:', event); 
    
    // Obtener el último producto agregado
    const productForm = this.factProducts.at(this.factProducts.length - 1) as FormGroup;
    
    if (productForm && event) {
      productForm.get('productId')?.setValue(event.id);
      productForm.get('description')?.setValue(event.name);
      
      // Recalcular subtotal
      this.calculateSubtotal(productForm);
      
      console.log('Formulario actualizado:', productForm.value); 
    }
  }

  onTagChange(event: any): void {
    const selectedTitle = event.value;
    this.selectedTag = this.allTags.find(tag => tag.title === selectedTitle);
    console.log('Tag seleccionado:', this.selectedTag);
    console.log('Título:', selectedTitle);
  }



  filterProducts(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    console.log('Filtrando productos con query:', query); 
    
    this.filteredProducts = this.allProducts.filter(product => {
      return product.name.toLowerCase().includes(query);
    });
    
    console.log('Productos filtrados:', this.filteredProducts.length); 
  }


  private calculateSubtotal(productForm: FormGroup): void {
    const amount = productForm.get('amount')?.value || 0;
    const unitPrice = productForm.get('unitPrice')?.value || 0;
    const discount = productForm.get('descount')?.value || 0;

    const subtotalBeforeDiscount = amount * unitPrice;
    const discountAmount = subtotalBeforeDiscount * (discount / 100);
    const subtotal = subtotalBeforeDiscount - discountAmount;

    productForm.get('subtotal')?.setValue(subtotal);

    this.calculateTotalValue();
  }


  private calculateTotalValue(): void {
    let total = 0;
    this.factProducts.controls.forEach(control => {
      const productForm = control as FormGroup;
      const subtotal = productForm.get('subtotal')?.value || 0;
      total += subtotal;
    });

    this.nonCommercialForm.get('totalValue')?.setValue(total);
  }

  onSubmit(): void {
    if (this.nonCommercialForm.valid) {
      const formValue = this.nonCommercialForm.getRawValue();

    
      const products: Product2[] = formValue.factProducts.map((product: any) => ({
        productId: product.productId,
        amount: product.amount,
        description: product.description,
        descount: product.descount,
        unitPrice: product.unitPrice || 0,
        subtotal: product.subtotal,
        taxPercentage: []
      }));

      const factureData: Facture2 = {
        factId: 0,
        entId: this.entData?.id || '',
        thId: formValue.thId,
        factCode: formValue.factCode,
        factProducts: products,
        totalValue: formValue.totalValue.toString(),
        totalPay: '0',
        pendingValue: formValue.totalValue.toString(),
        expirationDate: new Date().toISOString().split('T')[0],
        accountingAccount: formValue.accountingAccount,
        tagTitle: formValue.tagTitle
      };

      const serviceCall = formValue.eventType === 'entry'
        ? this.skeletonNonCommercialService.createNonCommercialEntry(factureData)
        : this.skeletonNonCommercialService.createNonCommercialExit(factureData as any);

      serviceCall.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Evento no comercial de ${formValue.eventType === 'entry' ? 'entrada' : 'salida'} creado exitosamente`,
            life: 3000
          });

          this.clearForm();
        },
        error: (error) => {
          console.error('Error al crear evento no comercial', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el evento no comercial'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.nonCommercialForm.controls).forEach(key => {
      const control = this.nonCommercialForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach((arrayControl, index) => {
          const formGroup = arrayControl as FormGroup;
          Object.keys(formGroup.controls).forEach(subKey => {
            formGroup.get(subKey)?.markAsTouched();
          });
        });
      }
    });
  }

  clearForm(): void {
    this.nonCommercialForm.reset();
    this.selectedProduct = undefined;
    this.filteredProducts = [];
    this.selectedEventType = '';

    this.nonCommercialForm = this.createNonCommercialForm();
  }

  cancelForm(): void {
    this.clearForm();
  }

  goBack(): void {
    this.router.navigate(['/commercial/non-commercial-template']);
  }

  getFieldError(fieldName: string): string {
    const field = this.nonCommercialForm.get(fieldName);
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
}
