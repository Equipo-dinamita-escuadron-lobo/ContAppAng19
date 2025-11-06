import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KardexPurchaseRequest } from '../models/KardexPurchaseRequest';
import { KardexSaleRequest } from '../models/KardexSaleRequest';
import { ProductResponse } from '../models/ProductResponse';
import { KardexPepsService } from '../services/kardex-peps.service';
import { KardexPurchaseResponse } from '../models/KardexPurchaseResponse';

@Component({
  selector: 'app-inventory-adjustment-peps',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './inventory-adjustment.component.html',
  styleUrl: './inventory-adjustment.component.css'
})
export class InventoryAdjustmentComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() productData: ProductResponse | null = null;
  @Output() adjustmentCompleted = new EventEmitter<void>();
  @Output() dialogClosed = new EventEmitter<void>();

  adjustmentForm!: FormGroup;
  adjustmentTypes = [
    { label: 'Ajuste de Compra', value: 'purchase' },
    { label: 'Ajuste de Venta', value: 'sale' }
  ];

  // Lotes disponibles (saldo actual)
  availableLots: KardexPurchaseResponse[] = [];
  isLoadingLots: boolean = false;

  // Vista previa
  previewResult: any = null;
  showPreview: boolean = false;

  constructor(
    private fb: FormBuilder,
    private kardexService: KardexPepsService,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Cuando se abre el dialog y hay productData, cargar los lotes disponibles
    if (changes['visible'] && this.visible && this.productData) {
      this.loadAvailableLots();
    }
  }

  /**
   * Carga los lotes disponibles del producto desde el backend
   */
  private loadAvailableLots() {
    if (!this.productData) return;

    this.isLoadingLots = true;
    this.kardexService.getAvailableQuantity(this.productData.id).subscribe({
      next: (response) => {
        this.availableLots = response.data || [];
        this.isLoadingLots = false;
        console.log('Lotes cargados:', this.availableLots);
      },
      error: (error) => {
        console.error('Error loading available lots:', error);
        this.availableLots = [];
        this.isLoadingLots = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar los lotes disponibles'
        });
      }
    });
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private initializeForm() {
    this.adjustmentForm = this.fb.group({
      adjustmentType: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPrice: [null],
      factCode: [null, [Validators.required, Validators.min(1)]], 
      details: ['', Validators.required]
    });

    // Escuchar cambios en el tipo de ajuste
    this.adjustmentForm.get('adjustmentType')?.valueChanges.subscribe(type => {
      this.onAdjustmentTypeChange(type);
    });

    // Escuchar cambios en cantidad y precio para actualizar vista previa
    this.adjustmentForm.get('quantity')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });

    this.adjustmentForm.get('unitPrice')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  /**
   * Maneja el cambio de tipo de ajuste (compra/venta)
   */
  onAdjustmentTypeChange(type: string) {
    const unitPriceControl = this.adjustmentForm.get('unitPrice');

    if (type === 'sale') {
      // Para venta no se necesita precio unitario
      unitPriceControl?.clearValidators();
      unitPriceControl?.setValue(null);
      unitPriceControl?.disable();
    } else if (type === 'purchase') {
      // Para compra sí se necesita precio unitario
      unitPriceControl?.setValidators([Validators.required, Validators.min(0.01)]);
      unitPriceControl?.enable();
    }

    unitPriceControl?.updateValueAndValidity();
    this.updatePreview();
  }

  /**
   * Actualiza la vista previa del ajuste
   */
  /**
 * Actualiza la vista previa del ajuste
 */
updatePreview() {
  const adjustmentType = this.adjustmentForm.get('adjustmentType')?.value;
  const quantity = this.adjustmentForm.get('quantity')?.value;
  const unitPrice = this.adjustmentForm.get('unitPrice')?.value;
  const factCode = this.adjustmentForm.get('factCode')?.value;

  if (adjustmentType === 'purchase' && quantity && unitPrice && factCode) {
    // PEPS: Se agrega un nuevo lote
    const currentQuantity = this.getTotalBalanceQuantity();
    const currentTotal = this.getTotalBalanceValue();

    const newLotTotal = quantity * unitPrice;
    const totalQuantity = currentQuantity + quantity;
    const totalValue = currentTotal + newLotTotal;

    const resultingLots = [
      ...this.availableLots.map(lot => ({
        factCode: lot.factCode,
        quantity: lot.quantity,
        unitPrice: lot.unitPrice,
        total: lot.quantity * lot.unitPrice,
        date: lot.date
      })),
      {
        factCode: factCode,
        quantity: quantity,
        unitPrice: unitPrice,
        total: newLotTotal,
        date: new Date().toISOString()
      }
    ];

    this.previewResult = {
      type: 'purchase',
      newQuantity: totalQuantity,
      newTotal: totalValue,
      addedQuantity: quantity,
      addedUnitPrice: unitPrice,
      addedTotal: newLotTotal,
      resultingLots: resultingLots
    };
    this.showPreview = true;
  } else if (adjustmentType === 'sale' && quantity) {
  
    const saleSimulation = this.simulatePepsSale(quantity);
    
    if (saleSimulation) {
      const newTotalQuantity = this.getTotalBalanceQuantity() - quantity;
      const newTotalValue = this.getTotalBalanceValue() - saleSimulation.totalCost;

      this.previewResult = {
        type: 'sale',
        newQuantity: newTotalQuantity,
        newTotal: newTotalValue,
        soldQuantity: quantity,
        soldUnitPrice: saleSimulation.averageUnitPrice,
        soldTotal: saleSimulation.totalCost,
        lotsUsed: saleSimulation.lotsUsed,
        resultingLots: saleSimulation.resultingLots 
      };
      this.showPreview = true;
    } else {
      this.showPreview = false;
      this.previewResult = null;
    }
  } else {
    this.showPreview = false;
    this.previewResult = null;
  }
}


 
 /**
 * Simula una venta usando PEPS 
 * Consume los lotes más antiguos primero y retorna los lotes restantes
 */
private simulatePepsSale(quantityToSell: number): { 
  totalCost: number; 
  averageUnitPrice: number;
  lotsUsed: number;
  resultingLots: any[]; 
} | null {
  if (!this.availableLots || this.availableLots.length === 0) {
    return null;
  }

  const lots = [...this.availableLots]; 
  let remainingQuantity = quantityToSell;
  let totalCost = 0;
  let lotsUsed = 0;
  const resultingLots: any[] = []; 

  for (const lot of lots) {
    if (remainingQuantity <= 0) {
      // Si ya vendimos todo, este lote permanece intacto
      resultingLots.push({
        factCode: lot.factCode,
        quantity: lot.quantity,
        unitPrice: lot.unitPrice,
        total: lot.quantity * lot.unitPrice,
        date: lot.date
      });
    } else if (lot.quantity > 0) {
      const quantityFromThisLot = Math.min(lot.quantity, remainingQuantity);
      totalCost += quantityFromThisLot * lot.unitPrice;
      remainingQuantity -= quantityFromThisLot;
      lotsUsed++;

      // Si el lote no se consume completamente, agregar lo que queda
      const remainingInLot = lot.quantity - quantityFromThisLot;
      if (remainingInLot > 0) {
        resultingLots.push({
          factCode: lot.factCode,
          quantity: remainingInLot,
          unitPrice: lot.unitPrice,
          total: remainingInLot * lot.unitPrice,
          date: lot.date
        });
      }
    }
  }

  if (remainingQuantity > 0) {
    
    return null;
  }

  return {
    totalCost,
    averageUnitPrice: totalCost / quantityToSell,
    lotsUsed,
    resultingLots
  };
}

  /**
   * Calcula la cantidad total de todos los lotes disponibles
   */
  getTotalBalanceQuantity(): number {
    if (!this.availableLots || this.availableLots.length === 0) {
      return 0;
    }
    return this.availableLots.reduce((sum, lot) => sum + lot.quantity, 0);
  }

  /**
   * Calcula el valor total de todos los lotes disponibles
   */
  getTotalBalanceValue(): number {
    if (!this.availableLots || this.availableLots.length === 0) {
      return 0;
    }
    return this.availableLots.reduce((sum, lot) => sum + (lot.quantity * lot.unitPrice), 0);
  }

  /**
   * Envía el formulario de ajuste
   */
  onSubmit() {
    if (this.adjustmentForm.valid && this.productData) {
      const formValue = this.adjustmentForm.value;

      if (formValue.adjustmentType === 'purchase') {
        const request: KardexPurchaseRequest = {
          quantity: formValue.quantity,
          unitPrice: formValue.unitPrice,
          factCode: formValue.factCode,
          details: formValue.details,
          productId: this.productData.id
        };

        this.kardexService.purchaseAdjustment(request).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ajuste de compra registrado correctamente'
            });
            this.resetForm();
            this.adjustmentCompleted.emit();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Error al registrar el ajuste de compra'
            });
          }
        });
      } else {
        const request: KardexSaleRequest = {
          quantity: formValue.quantity,
          details: formValue.details,
          factCode: formValue.factCode,
          productId: this.productData.id
        };

        this.kardexService.saleAdjustment(request).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ajuste de venta registrado correctamente'
            });
            this.resetForm();
            this.adjustmentCompleted.emit();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Error al registrar el ajuste de venta'
            });
          }
        });
      }
    }
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  resetForm() {
    this.adjustmentForm.reset();
    this.showPreview = false;
    this.previewResult = null;
  }

  /**
   * Maneja el cierre del dialog
   */
  onDialogHide() {
    this.resetForm();
    this.dialogClosed.emit();
  }

  /**
   * Verifica si se puede realizar una venta
   */
  canSubmitSale(): boolean {
    if (!this.availableLots || this.availableLots.length === 0 || !this.adjustmentForm.get('quantity')?.value) {
      return false;
    }

    const requestedQuantity = this.adjustmentForm.get('quantity')?.value;
    const availableQuantity = this.getTotalBalanceQuantity();

    return requestedQuantity <= availableQuantity;
  }

  /**
   * Obtiene la cantidad máxima que se puede vender
   */
  getMaxSaleQuantity(): number {
    return this.getTotalBalanceQuantity();
  }

  /**
   * Valida si el formulario es válido para enviar
   */
  isFormValid(): boolean {
    const adjustmentType = this.adjustmentForm.get('adjustmentType')?.value;

    if (adjustmentType === 'sale') {
      return this.adjustmentForm.valid && this.canSubmitSale();
    }

    return this.adjustmentForm.valid;
  }

  /**
   * Verifica si hay lotes disponibles
   */
  hasAvailableLots(): boolean {
    return this.availableLots && this.availableLots.length > 0;
  }
}
