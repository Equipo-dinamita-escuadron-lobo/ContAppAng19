import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { KardexService } from '../services/kardex.service';
import { KardexPurchaseRequest } from '../models/KardexPurchaseRequest';
import { KardexSaleRequest } from '../models/KardexSaleRequest';
import { KardexRow } from '../models/KardexRow';
import { ProductResponse } from '../models/ProductResponse';

@Component({
  selector: 'app-inventory-adjustment',
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
    DatePickerModule
  ],
  providers: [MessageService],
  templateUrl: './inventory-adjustment.component.html',
  styleUrl: './inventory-adjustment.component.css'
})
export class InventoryAdjustmentComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() productData: ProductResponse | null = null;
  @Input() lastKardexRecord: KardexRow | null = null;
  @Output() adjustmentCompleted = new EventEmitter<void>();
  @Output() dialogClosed = new EventEmitter<void>();

  adjustmentForm!: FormGroup;
  adjustmentTypes = [
    { label: 'Ajuste de Compra', value: 'purchase' },
    { label: 'Ajuste de Venta', value: 'sale' }
  ];

  // Vista previa para ajuste de compra
  previewResult: any = null;
  showPreview: boolean = false;

  // Control de envío de formulario
  isSubmitting: boolean = false;

  // Fechas límite para el calendario
  minDate: Date | null = null;
  maxDate: Date = new Date(); // Fecha actual como máximo

  constructor(
    private fb: FormBuilder,
    private kardexService: KardexService,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.initializeForm();
    this.setDateLimits();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Cuando cambia el lastKardexRecord, actualizar los límites de fecha y la vista previa
    if (changes['lastKardexRecord'] && !changes['lastKardexRecord'].firstChange) {
      this.setDateLimits();
      this.updatePreview();
    }
  }

  private setDateLimits() {
    // Si hay un último registro de kardex, usar su fecha como mínimo
    if (this.lastKardexRecord && this.lastKardexRecord.date) {
      this.minDate = new Date(this.lastKardexRecord.date);
    } else {
      // Si no hay registros, permitir cualquier fecha hasta hoy
      this.minDate = null;
    }
    // maxDate ya está establecido en la inicialización como new Date()
  }

  private initializeForm() {
    this.adjustmentForm = this.fb.group({
      adjustmentType: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPrice: [null],
      details: [''], // Campo opcional
      date: [null] // Fecha opcional
    });

    // Escuchar cambios en el tipo de ajuste
    this.adjustmentForm.get('adjustmentType')?.valueChanges.subscribe(type => {
      this.onAdjustmentTypeChange(type);
    });

    // Escuchar cambios en quantity y unitPrice para vista previa
    this.adjustmentForm.get('quantity')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });

    this.adjustmentForm.get('unitPrice')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  onAdjustmentTypeChange(type: string) {
    const unitPriceControl = this.adjustmentForm.get('unitPrice');

    if (type === 'sale') {
      // Para venta no necesita precio unitario
      unitPriceControl?.clearValidators();
      unitPriceControl?.setValue(null);
      unitPriceControl?.disable();
    } else if (type === 'purchase') {
      // Para compra sí necesita precio unitario
      unitPriceControl?.setValidators([Validators.required, Validators.min(0.01)]);
      unitPriceControl?.enable();
    }

    unitPriceControl?.updateValueAndValidity();
    this.updatePreview();
  }

  updatePreview() {
    const adjustmentType = this.adjustmentForm.get('adjustmentType')?.value;
    const quantity = this.adjustmentForm.get('quantity')?.value;
    const unitPrice = this.adjustmentForm.get('unitPrice')?.value;

    if (adjustmentType === 'purchase' && quantity && unitPrice && this.lastKardexRecord) {
      // Calcular promedio ponderado para compra
      const currentQuantity = this.lastKardexRecord.balanceQuantity || 0;
      const currentUnitPrice = this.lastKardexRecord.balanceUnitPrice || 0;
      const currentTotal = currentQuantity * currentUnitPrice;

      const newTotal = quantity * unitPrice;
      const totalQuantity = currentQuantity + quantity;
      const weightedAveragePrice = totalQuantity > 0 ? (currentTotal + newTotal) / totalQuantity : 0;

      this.previewResult = {
        type: 'purchase',
        newQuantity: totalQuantity,
        newUnitPrice: weightedAveragePrice,
        newTotal: totalQuantity * weightedAveragePrice,
        addedQuantity: quantity,
        addedUnitPrice: unitPrice,
        addedTotal: newTotal
      };
      this.showPreview = true;
    } else if (adjustmentType === 'sale' && quantity && this.lastKardexRecord) {
      // Para venta, precio se mantiene, cantidad se reduce
      const currentQuantity = this.lastKardexRecord.balanceQuantity || 0;
      const currentUnitPrice = this.lastKardexRecord.balanceUnitPrice || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);

      this.previewResult = {
        type: 'sale',
        newQuantity: newQuantity,
        newUnitPrice: currentUnitPrice,
        newTotal: newQuantity * currentUnitPrice,
        soldQuantity: quantity,
        soldUnitPrice: currentUnitPrice,
        soldTotal: quantity * currentUnitPrice
      };
      this.showPreview = true;
    } else {
      this.showPreview = false;
      this.previewResult = null;
    }
  }

  onSubmit() {
    if (this.adjustmentForm.valid && this.productData && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.adjustmentForm.value;

      if (formValue.adjustmentType === 'purchase') {
        const request: KardexPurchaseRequest = {
          quantity: formValue.quantity,
          unitPrice: formValue.unitPrice,
          details: formValue.details,
          productId: this.productData.productId
        };

        // Agregar fecha si está presente
        if (formValue.date) {
          request.date = new Date(formValue.date).toISOString();
        }

        this.kardexService.purchaseAdjustment(request).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ajuste de compra registrado correctamente',
              life: 5000
            });
            this.resetForm();
            this.adjustmentCompleted.emit();
            this.isSubmitting = false;
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al registrar el ajuste de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
              life: 5000
            });
            this.isSubmitting = false;
          }
        });
      } else {
        const request: KardexSaleRequest = {
          quantity: formValue.quantity,
          details: formValue.details,
          productId: this.productData.productId
        };

        // Agregar fecha si está presente
        if (formValue.date) {
          request.date = new Date(formValue.date).toISOString();
        }

        this.kardexService.saleAdjustment(request).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ajuste de venta registrado correctamente',
              life: 7000
            });
            this.resetForm();
            this.adjustmentCompleted.emit();
            this.isSubmitting = false;
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al registrar el ajuste de venta';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
              life: 7000
            });
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  resetForm() {
    this.adjustmentForm.reset();
    this.showPreview = false;
    this.previewResult = null;
    this.isSubmitting = false;
  }

  onDialogHide() {
    this.resetForm();
    this.dialogClosed.emit();
  }

  canSubmitSale(): boolean {
    if (!this.lastKardexRecord || !this.adjustmentForm.get('quantity')?.value) {
      return false;
    }

    const requestedQuantity = this.adjustmentForm.get('quantity')?.value;
    const availableQuantity = this.lastKardexRecord.balanceQuantity || 0;

    return requestedQuantity <= availableQuantity;
  }

  getMaxSaleQuantity(): number {
    return this.lastKardexRecord?.balanceQuantity || 0;
  }

  isFormValid(): boolean {
    const adjustmentType = this.adjustmentForm.get('adjustmentType')?.value;

    if (adjustmentType === 'sale') {
      return this.adjustmentForm.valid && this.canSubmitSale() && !this.isSubmitting;
    }

    return this.adjustmentForm.valid && !this.isSubmitting;
  }
}
