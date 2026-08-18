import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, map, Observable, of, switchMap, catchError, finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Third } from '../../../../GeneralMasters/ThirdParties/models/Third';
import { ThirdService } from '../../../../GeneralMasters/ThirdParties/Services/third.service';
import { eThirdType } from '../../../../GeneralMasters/ThirdParties/models/eThirdType';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { SteletonService } from '../../../InvoiceTemplate/services/steleton.service';

interface PurchaseFactureSummary {
  id: number;
  entId: string;
  factureType: string;
}

interface PurchaseFactureDetail extends PurchaseFactureSummary {
  factCode: number;
  thId: number;
  totalValue: string;
  totalPay: string;
  pendingValue: string;
  expirationDate?: string;
  createdAt: string;
  purchaseStatus?: string;
}

interface PurchaseInvoiceRow {
  id: number;
  reference: string;
  supplier: string;
  issueDate: string;
  dueDate?: string;
  total: number;
  paid: number;
  pending: number;
  status: 'Pendiente' | 'Vencida' | 'Pagada' | 'Anulada';
}

@Component({
  selector: 'app-purchase-invoice-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule],
  templateUrl: './purchase-invoice-list.component.html',
  styleUrl: './purchase-invoice-list.component.css',
})
export class PurchaseInvoiceListComponent implements OnInit {
  private readonly localStorageMethods = new LocalStorageMethods();

  invoices: PurchaseInvoiceRow[] = [];
  loading = false;
  loadError = '';

  constructor(
    private readonly factureService: SteletonService,
    private readonly thirdService: ThirdService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      this.loadError = 'Seleccione una empresa activa para consultar las facturas de compra.';
      return;
    }

    this.loading = true;
    this.loadError = '';

    forkJoin({
      summaries: this.factureService.getAllFactures() as Observable<PurchaseFactureSummary[]>,
      suppliers: this.thirdService.getThirdsByType(enterpriseId, eThirdType.Proveedor).pipe(
        catchError(() => of({ content: [] })),
      ),
    }).pipe(
      switchMap(({ summaries, suppliers }) => {
        const supplierNames = this.supplierNames(suppliers.content ?? []);
        const purchases = (summaries ?? []).filter((facture) =>
          facture.factureType === 'PURCHASE' && facture.entId === enterpriseId,
        );

        if (purchases.length === 0) {
          return of([] as PurchaseInvoiceRow[]);
        }

        return forkJoin(purchases.map((facture) =>
          (this.factureService.getFactureById(facture.id) as Observable<PurchaseFactureDetail>).pipe(
            map((detail) => this.toRow(detail, supplierNames)),
          ),
        ));
      }),
      finalize(() => {
        this.loading = false;
      }),
    ).subscribe({
      next: (invoices) => {
        this.invoices = [...invoices].sort((left, right) =>
          right.issueDate.localeCompare(left.issueDate) || right.id - left.id,
        );
      },
      error: () => {
        this.loadError = 'No se pudieron cargar las facturas de compra. Intente nuevamente.';
      },
    });
  }

  createInvoice(): void {
    this.router.navigate(['/commercial/purchase-invoice/new']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  statusSeverity(status: PurchaseInvoiceRow['status']): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'Pagada') {
      return 'success';
    }
    if (status === 'Vencida') {
      return 'danger';
    }
    if (status === 'Anulada') {
      return 'secondary';
    }
    return 'warn';
  }

  private toRow(detail: PurchaseFactureDetail, supplierNames: Map<number, string>): PurchaseInvoiceRow {
    const pending = this.amount(detail.pendingValue);
    return {
      id: detail.id,
      reference: `#${detail.factCode}`,
      supplier: supplierNames.get(detail.thId) ?? `Proveedor #${detail.thId}`,
      issueDate: detail.createdAt,
      dueDate: detail.expirationDate,
      total: this.amount(detail.totalValue),
      paid: this.amount(detail.totalPay),
      pending,
      status: this.invoiceStatus(detail.purchaseStatus, pending, detail.expirationDate),
    };
  }

  private invoiceStatus(purchaseStatus: string | undefined, pending: number, dueDate?: string): PurchaseInvoiceRow['status'] {
    if (purchaseStatus === 'VOIDED') {
      return 'Anulada';
    }
    if (pending <= 0) {
      return 'Pagada';
    }
    if (dueDate && dueDate < this.today()) {
      return 'Vencida';
    }
    return 'Pendiente';
  }

  private supplierNames(suppliers: Third[]): Map<number, string> {
    return new Map(suppliers.map((supplier) => [supplier.thId, this.supplierName(supplier)]));
  }

  private supplierName(supplier: Third): string {
    if (supplier.personType === 'Natural') {
      return `${supplier.names ?? ''} ${supplier.lastNames ?? ''}`.trim() || `Proveedor #${supplier.thId}`;
    }
    return supplier.socialReason?.trim() || `Proveedor #${supplier.thId}`;
  }

  private amount(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private today(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
