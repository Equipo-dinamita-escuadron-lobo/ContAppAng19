import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Product2, ProductList2 } from '../../models/Product2';
import { SteletonService } from '../../services/steleton.service';
import { ProductResponse } from '../../../BusinessMasters/ValuationModels/WeightedAverage/models/ProductResponse';
import { AutoCompleteModule } from 'primeng/autocomplete';
interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

interface ReturnType {
  label: string;
  value: string;
}

@Component({
  selector: 'app-create-return',
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
  templateUrl: './create-return.component.html',
  styleUrl: './create-return.component.css'
})
export class CreateReturnComponent implements OnInit {
  returnForm: FormGroup;

  allProducts: ProductList2[] = [];
  filteredProducts: ProductList2[] = [];
  selectedProduct: ProductList2 | undefined;

  returnTypes: ReturnType[] = [
    { label: 'Devolución en Venta', value: 'sale' },
    { label: 'Devolución en Compra', value: 'purchase' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private steletonService: SteletonService,
  ) {
    this.returnForm = this.createReturnForm();
  }

  ngOnInit(): void {
    console.log('Componente de creación de devolución inicializado');

    this.steletonService.getAllProductsByEnterpriseId().subscribe(response => {
      this.allProducts = response
    });
  }

  private createReturnForm(): FormGroup {
    return this.formBuilder.group({
      returnType: ['', Validators.required],
      factCode: ['', Validators.required],
      productId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit(): void {
    if (this.returnForm.valid) {
      const formValue = this.returnForm.value;

      // Preparar datos del producto
      const productData: Product2 = {
        productId: formValue.productId.id,
        amount: formValue.amount,
        description: this.getSelectedProductDescription(),
        descount: 0,
        unitPrice: 0,
        subtotal: 0,
        taxPercentage: []
      };

      // Llamar al servicio correspondiente según el tipo de devolución
      const serviceCall = formValue.returnType === 'sale'
        ? this.steletonService.createReturnOnSaleSkeleton(formValue.factCode, productData)
        : this.steletonService.createReturnOnPurchaseSkeleton(formValue.factCode, productData);

      serviceCall.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Devolución en ${formValue.returnType === 'sale' ? 'venta' : 'compra'} creada exitosamente`,
            life: 3000
          });

          // Limpiar el formulario después de guardar exitosamente
          this.clearForm();
        },
        error: (error) => {
          console.error('Error al crear devolución', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la devolución'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private getSelectedProductDescription(): string {
    const selectedProductId = this.returnForm.get('id')?.value;
    const product = this.allProducts.find(p => p.id === selectedProductId);
    return product ? product.name : '';
  }

  /**
   * Limpia el formulario y resetea las variables relacionadas
   */
  clearForm(): void {
    this.returnForm.reset();
    this.selectedProduct = undefined;
    this.filteredProducts = [];

    // Resetear el formulario con valores por defecto
    this.returnForm = this.createReturnForm();
  }

  /**
   * Maneja la acción de cancelar
   */
  cancelForm(): void {
    this.clearForm();
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.returnForm.controls).forEach(key => {
      const control = this.returnForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.returnForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  onProductSelect(event: ProductResponse) {
    this.returnForm.get('id')?.setValue(event.id);
    this.selectedProduct = event;
  }

  filterProducts(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredProducts = this.allProducts.filter(product => {
      return product.name.toLowerCase().includes(query);
    });
  }
}
