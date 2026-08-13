import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize, Subscription, timeout, TimeoutError } from 'rxjs';
import { Third } from '../../../../GeneralMasters/ThirdParties/models/Third';
import { eThirdType } from '../../../../GeneralMasters/ThirdParties/models/eThirdType';
import { ThirdService } from '../../../../GeneralMasters/ThirdParties/Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ProductToSale } from '../../../SaleInvoice/models/ProductToSale';
import { SaleInvoiceSelectedProductsComponent } from '../../../SaleInvoice/components/sale-invoice-selected-products/sale-invoice-selected-products.component';
import { UnitOfMeasureService } from '../../../SaleInvoice/services/unit-of-measure.service';
import { PurchaseInvoicePayload, PurchaseInvoiceProductLine } from '../../models/purchase-invoice-payload';
import { PurchaseInvoiceService } from '../../services/purchase-invoice.service';

@Component({
  selector: 'app-purchase-invoice-creation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TooltipModule,
    AutoCompleteModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
  templateUrl: './purchase-invoice-creation.component.html',
  styleUrl: './purchase-invoice-creation.component.css',
})
export class PurchaseInvoiceCreationComponent implements OnInit, OnDestroy {
  private static readonly SAVE_TIMEOUT_MS = 20_000;

  private readonly localStorageMethods = new LocalStorageMethods();
  private ref?: DynamicDialogRef;
  private dialogSubscription?: Subscription;

  currentDate = new Date();
  dueDate?: Date;
  paymentTermDays = 30;
  initialPayment = 0;
  observations = '';
  saving = false;

  supplier?: Third;
  filteredSuppliers: Third[] = [];
  allSuppliers: Third[] = [];

  lstProducts: ProductToSale[] = [];
  subTotal = 0;
  taxTotal = 0;
  total = 0;
  pendingTotal = 0;
  impuestoCheck = true;

  constructor(
    private readonly thirdService: ThirdService,
    private readonly unitMeasureService: UnitOfMeasureService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.ref?.close();
    this.dialogSubscription?.unsubscribe();
  }

  loadSuppliers(): void {
    const entId = this.localStorageMethods.getIdEnterprise();
    this.thirdService.getThirdsByType(entId.toString(), eThirdType.Proveedor).subscribe({
      next: (data) => {
        this.allSuppliers = data.content || [];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los proveedores',
        });
      },
    });
  }

  searchSupplier(event: { query: string }): void {
    const query = (event.query || '').toLowerCase();
    const suppliersWithLabel = this.allSuppliers.map((third) => ({
      ...third,
      displayName: this.getDisplayName(third),
    }));

    this.filteredSuppliers = !query
      ? suppliersWithLabel.slice(0, 50)
      : suppliersWithLabel.filter((third) => {
          const idNumber = third.idNumber?.toString().toLowerCase() || '';
          return third.displayName.toLowerCase().includes(query) || idNumber.includes(query);
        });
  }

  getDisplayName(third: Third): string {
    if (third.personType === 'Natural') {
      return `${third.names || ''} ${third.lastNames || ''}`.trim();
    }
    return third.socialReason || '';
  }

  onSupplierSelect(): void {
    if (this.lstProducts.length === 0) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Cambio de proveedor',
      message: 'Cambiar de proveedor limpiará los productos seleccionados. ¿Desea continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.lstProducts = [];
        this.calculateTotals();
      },
    });
  }

  selectProducts(): void {
    if (!this.supplier?.thId) {
      return;
    }
    const entId = this.localStorageMethods.getIdEnterprise();
    this.ref = this.dialogService.open(SaleInvoiceSelectedProductsComponent, {
      header: 'Seleccionar productos',
      width: '50%',
      contentStyle: { 'max-height': '500px', overflow: 'auto' },
      data: { entId, thId: this.supplier.thId, products: this.lstProducts },
    });

    this.dialogSubscription = this.ref.onClose.subscribe((result: any[]) => {
      if (!result?.length) {
        return;
      }
      this.lstProducts = result.map((prod) => ({
        id: prod.id,
        name: prod.name,
        description: prod.description,
        cost: prod.cost,
        displayPrice: String(prod.cost),
        taxPercentage: prod.taxPercentage,
        unitOfMeasureId: prod.unitOfMeasureId,
        IVA: prod.taxPercentage || 0,
        IvaValor: 0,
        amount: 1,
        totalValue: 0,
        descuentos: [0, 0] as [number, number],
        displayDescuentos: '0',
      })) as ProductToSale[];
      this.lstProducts.forEach((prod) => {
        prod.IVA = prod.taxPercentage;
        prod.IvaValor = (prod.cost * prod.IVA) / 100;
      });
      this.loadUnitOfMeasureAbbreviations();
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    this.subTotal = this.lstProducts.reduce((acc, prod) => acc + this.computeLineSubtotal(prod), 0);
    this.taxTotal = this.impuestoCheck
      ? this.lstProducts.reduce((acc, prod) => acc + (prod.IvaValor || 0) * (prod.amount || 0), 0)
      : 0;
    this.total = this.subTotal + this.taxTotal;
    this.pendingTotal = Math.max(this.total - (this.initialPayment || 0), 0);
  }

  calculateLine(prod: ProductToSale): void {
    prod.totalValue = this.lineSubtotal(prod);
    prod.IvaValor = this.impuestoCheck ? (prod.cost * (prod.IVA || 0)) / 100 : 0;
    this.calculateTotals();
  }

  lineSubtotal(prod: ProductToSale): number {
    return this.computeLineSubtotal(prod);
  }

  switchDescuento(type: 'porc' | 'val', prod: ProductToSale): void {
    if (!prod.descuentos) {
      return;
    }
    if (type === 'porc') {
      prod.descuentos[1] = 0;
    } else {
      prod.descuentos[0] = 0;
    }
    this.calculateLine(prod);
  }

  deleteProduct(index: number): void {
    this.lstProducts.splice(index, 1);
    this.calculateTotals();
  }

  saveInvoice(): void {
    if (!this.supplier?.thId) {
      this.messageService.add({ severity: 'warn', summary: 'Proveedor requerido', detail: 'Seleccione un proveedor' });
      return;
    }
    if (this.lstProducts.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Productos requeridos', detail: 'Agregue al menos un producto' });
      return;
    }
    if (this.initialPayment > this.total) {
      this.messageService.add({ severity: 'warn', summary: 'Abono inválido', detail: 'El abono no puede superar el total' });
      return;
    }

    const entData = this.localStorageMethods.loadEnterpriseData();
    if (!entData?.id) {
      this.messageService.add({ severity: 'error', summary: 'Empresa requerida', detail: 'No hay empresa activa' });
      return;
    }

    const expirationDate = this.resolveDueDate();
    const payload: PurchaseInvoicePayload = {
      factCode: 0,
      entId: entData.id,
      thId: this.supplier.thId,
      products: this.buildProductLines(),
      totalValue: this.total.toFixed(2),
      totalPay: (this.initialPayment || 0).toFixed(2),
      pendingValue: this.pendingTotal.toFixed(2),
      expirationDate,
      factureType: 'PURCHASE',
      inventoryConfigType: this.localStorageMethods.getInventoryConfigType() as 'PEPS' | 'WEIGHTED_AVERAGE',
    };

    this.saving = true;
    this.purchaseInvoiceService.createPurchaseInvoice(payload).pipe(
      timeout(PurchaseInvoiceCreationComponent.SAVE_TIMEOUT_MS),
      finalize(() => {
        this.saving = false;
      }),
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Factura creada',
          detail: 'La factura de compra se registró y se sincronizará con Tesorería',
          life: 5000,
        });
        this.resetForm();
      },
      error: (error) => {
        const timedOut = error instanceof TimeoutError;
        this.messageService.add({
          severity: timedOut ? 'warn' : 'error',
          summary: timedOut ? 'Respuesta demorada' : 'Error',
          detail: timedOut
            ? 'El servidor tardó demasiado en responder. Verifique el listado antes de intentar guardar nuevamente.'
            : 'No se pudo crear la factura de compra',
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/enterprise/list']);
  }

  onPaymentTermChange(): void {
    if (this.paymentTermDays < 0) {
      this.paymentTermDays = 0;
    }
    if (this.dueDate) {
      this.dueDate = this.addDays(this.currentDate, this.paymentTermDays);
    }
  }

  onDueDateChange(): void {
    if (!this.dueDate) {
      return;
    }
    const diffMs = this.dueDate.getTime() - this.stripTime(this.currentDate).getTime();
    this.paymentTermDays = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 0);
  }

  private buildProductLines(): PurchaseInvoiceProductLine[] {
    return this.lstProducts.map((prod) => ({
      productId: prod.id,
      amount: prod.amount,
      description: prod.description,
      discount: this.discountPercent(prod),
      unitPrice: prod.cost,
      subtotal: this.computeLineSubtotal(prod),
      taxPercentage: this.impuestoCheck && prod.IVA ? [prod.IVA] : [],
    }));
  }

  private discountPercent(prod: ProductToSale): number {
    if (!prod.descuentos) {
      return 0;
    }
    if (prod.descuentos[1] > 0) {
      const base = prod.cost * prod.amount;
      return base > 0 ? (100 * prod.descuentos[1]) / base : 0;
    }
    return prod.descuentos[0] || 0;
  }

  private computeLineSubtotal(prod: ProductToSale): number {
    const base = (prod.cost || 0) * (prod.amount || 0);
    const discountPerc = prod.descuentos?.[0] || 0;
    const discountVal = prod.descuentos?.[1] || 0;
    return base - base * (discountPerc / 100) - discountVal;
  }

  private resolveDueDate(): string | undefined {
    const due = this.dueDate ?? this.addDays(this.currentDate, this.paymentTermDays || 30);
    return due.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private loadUnitOfMeasureAbbreviations(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    this.lstProducts.forEach((prod) => {
      if (!prod.unitOfMeasureId) {
        return;
      }
      this.unitMeasureService.getUnitOfMeasuresId(String(prod.unitOfMeasureId), enterpriseId).subscribe({
        next: (response: { abbreviation: string }) => {
          prod.unitOfMeasure = response.abbreviation;
        },
      });
    });
  }

  private resetForm(): void {
    this.supplier = undefined;
    this.lstProducts = [];
    this.initialPayment = 0;
    this.observations = '';
    this.paymentTermDays = 30;
    this.dueDate = undefined;
    this.calculateTotals();
  }
}
