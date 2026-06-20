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
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { forkJoin } from 'rxjs';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

interface ReturnType {
  label: string;
  value: string;
}

interface FactureProduct {
  productId: number;
  description: string;
  amount: number;
  unitPrice: number;
  subtotal: number;
  returnedQuantity?: number;
  maxReturnQuantity?: number;
  quantityToReturn?: number;
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
    AutoCompleteModule,
    TableModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './create-return.component.html',
  styleUrl: './create-return.component.css'
})
export class CreateReturnComponent implements OnInit {
  returnForm: FormGroup;

  allFactures: any[] = [];
  filteredFactures: any[] = [];
  selectedFacture: any | null = null;
  factureProducts: FactureProduct[] = [];
  selectedProducts: FactureProduct[] = [];

  inventoryConfigType: 'PEPS' | 'WEIGHTED_AVERAGE' = 'WEIGHTED_AVERAGE';

  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private steletonService: SteletonService,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.returnForm = this.createReturnForm();
  }

  ngOnInit(): void {
    console.log('Componente de creación de devolución inicializado');

    // Obtener tipo de configuración de inventario desde localStorage
    this.inventoryConfigType = this.localStorageMethods.getInventoryConfigType();
    console.log('Tipo de configuración de inventario:', this.inventoryConfigType);

    // Cargar todas las facturas
    this.loadAllFactures();
  }

  private loadAllFactures(): void {
    this.steletonService.getAllFactures().subscribe({
      next: (response) => {
        this.allFactures = response;
        console.log('Facturas cargadas:', this.allFactures);
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las facturas'
        });
      }
    });
  }

  private createReturnForm(): FormGroup {
    return this.formBuilder.group({
      factCode: ['', Validators.required]
    });
  }

  getInventoryConfigTypeName(): string {
    return this.inventoryConfigType === 'PEPS' ? 'PEPS' : 'Promedio Ponderado';
  }

  getFactureTypeName(): string {
    if (!this.selectedFacture) return '';

    const factureType = this.selectedFacture.factureType?.toUpperCase();
    if (factureType?.includes('PURCHASE')) {
      return 'Compra';
    } else if (factureType?.includes('SALE')) {
      return 'Venta';
    }
    return this.selectedFacture.factureType || '';
  }

  translateFactureType(factureType: string): string {
    if (!factureType) return '';

    const type = factureType.toUpperCase();
    if (type.includes('PURCHASE')) {
      return 'Compra';
    } else if (type.includes('SALE')) {
      return 'Venta';
    }
    return factureType;
  }

  getReturnTypeName(): string {
    if (!this.selectedFacture) return '';

    const factureType = this.selectedFacture.factureType?.toUpperCase();
    if (factureType?.includes('PURCHASE') || factureType?.includes('COMPRA')) {
      return 'Devolución en Compra';
    } else if (factureType?.includes('SALE') || factureType?.includes('VENTA')) {
      return 'Devolución en Venta';
    }
    return 'Devolución';
  }

  private getReturnType(): 'sale' | 'purchase' {
    if (!this.selectedFacture) return 'sale';

    const factureType = this.selectedFacture.factureType?.toUpperCase();
    if (factureType?.includes('PURCHASE') || factureType?.includes('COMPRA')) {
      return 'purchase';
    }
    return 'sale';
  }

  filterFactures(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredFactures = this.allFactures.filter(facture => {
      return facture.factCode.toString().includes(query) ||
             facture.factureType?.toLowerCase().includes(query);
    });
  }

  onFactureSelect(event: any): void {
    const selectedFactCode = event.value.factCode;
    this.loadFactureDetails(selectedFactCode);
  }

  private loadFactureDetails(factCode: number): void {
    this.steletonService.getFactureByCode(factCode).subscribe({
      next: (facture) => {
        this.selectedFacture = facture;
        this.factureProducts = [];

        // Cargar productos con información de cantidades devueltas
        const productRequests = facture.products.map((product: any) =>
          this.steletonService.getTotalReturnedQuantity(factCode, product.productId)
        );

        if (productRequests.length === 0) {
          return;
        }

        forkJoin(productRequests).subscribe(
          (returnedQuantities: any) => {
            this.factureProducts = facture.products.map((product: any, index: number) => ({
              productId: product.productId,
              description: product.description,
              amount: product.amount,
              unitPrice: product.unitPrice,
              subtotal: product.subtotal,
              returnedQuantity: returnedQuantities[index] || 0,
              maxReturnQuantity: product.amount - (returnedQuantities[index] || 0),
              quantityToReturn: 0
            }));

            console.log('Productos de la factura:', this.factureProducts);
          },
          (error) => {
            console.error('Error al cargar cantidades devueltas:', error);
            // Si falla, cargar sin información de devoluciones previas
            this.factureProducts = facture.products.map((product: any) => ({
              productId: product.productId,
              description: product.description,
              amount: product.amount,
              unitPrice: product.unitPrice,
              subtotal: product.subtotal,
              returnedQuantity: 0,
              maxReturnQuantity: product.amount,
              quantityToReturn: 0
            }));
          }
        );
      },
      error: (error) => {
        console.error('Error al cargar detalles de la factura:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los detalles de la factura'
        });
      }
    });
  }

  selectAllQuantity(product: FactureProduct): void {
    product.quantityToReturn = product.maxReturnQuantity;
  }

  isProductValid(product: FactureProduct): boolean {
    return (product.quantityToReturn || 0) > 0 &&
           (product.quantityToReturn || 0) <= (product.maxReturnQuantity || 0);
  }

  getSelectedProductsCount(): number {
    return this.factureProducts.filter(p => (p.quantityToReturn || 0) > 0).length;
  }

  onSubmit(): void {
    if (this.returnForm.valid && this.selectedFacture) {
      // Filtrar productos con cantidad a devolver
      const productsToReturn = this.factureProducts
        .filter(p => (p.quantityToReturn || 0) > 0)
        .map(p => ({
          productId: p.productId,
          quantity: p.quantityToReturn,
          reason: 'Devolución'
        }));

      if (productsToReturn.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Debe seleccionar al menos un producto con cantidad a devolver'
        });
        return;
      }

      // Preparar request según el formato del backend
      const returnRequest = {
        factCode: this.selectedFacture.factCode,
        products: productsToReturn,
        inventoryConfigType: this.inventoryConfigType
      };

      console.log('Request de devolución:', returnRequest);

      // Determinar el tipo de devolución automáticamente según el tipo de factura
      const returnType = this.getReturnType();
      const serviceCall = returnType === 'sale'
        ? this.steletonService.createReturnOnSaleSkeleton(returnRequest)
        : this.steletonService.createReturnOnPurchaseSkeleton(returnRequest);

      serviceCall.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `${this.getReturnTypeName()} creada exitosamente`,
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
            detail: error?.error?.message || 'No se pudo crear la devolución'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Limpia el formulario y resetea las variables relacionadas
   */
  clearForm(): void {
    this.returnForm.reset();
    this.selectedFacture = null;
    this.factureProducts = [];
    this.filteredFactures = [];

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
}
