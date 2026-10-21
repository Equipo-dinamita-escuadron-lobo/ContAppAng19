import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { INVOICE_STATUS_LABEL, InvoiceStatus, SaleInvoice } from '../../models/billing-sale-invoice.model';
import { CopCentsPipe } from '../../pipes/cop-cents.pipe';
import { BillingSaleInvoiceApi } from '../../services/billing-sale-invoice.api';
import { calcTotals } from '../../utils/money';
import { BillingStatusBadgeComponent } from '../billing-status-badge/billing-status-badge.component';

@Component({
  selector: 'app-sale-invoice-list',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    TableModule,
    CopCentsPipe,
    BillingStatusBadgeComponent,
  ],
  templateUrl: './sale-invoice-list.component.html',
})
export class SaleInvoiceListComponent implements OnInit {
  private readonly api = inject(BillingSaleInvoiceApi);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  invoices = signal<SaleInvoice[]>([]);
  loading = signal(true);
  statusFilter = signal<InvoiceStatus | null>(null);

  readonly statusOptions = [
    { label: 'Todos los estados', value: null },
    ...(Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((s) => ({
      label: INVOICE_STATUS_LABEL[s],
      value: s,
    })),
  ];

  filtered = computed(() => {
    const status = this.statusFilter();
    return status ? this.invoices().filter((i) => i.status === status) : this.invoices();
  });

  // Diálogo de anulación
  annulTarget = signal<SaleInvoice | null>(null);
  annulReason = '';
  annulling = signal(false);

  ngOnInit(): void {
    this.load();
  }

  totalOf(invoice: SaleInvoice): number {
    return calcTotals(invoice.lines).totalCents;
  }

  view(invoice: SaleInvoice): void {
    this.router.navigate(['/billing/sale', invoice.id]);
  }

  goBack(): void {
    this.router.navigate(['/billing']);
  }

  openAnnul(invoice: SaleInvoice): void {
    this.annulReason = '';
    this.annulTarget.set(invoice);
  }

  closeAnnul(): void {
    this.annulTarget.set(null);
  }

  async confirmAnnul(): Promise<void> {
    const target = this.annulTarget();
    if (!target) return;
    if (!this.annulReason.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Motivo requerido', detail: 'Indica el motivo de la anulación.' });
      return;
    }
    this.annulling.set(true);
    try {
      await firstValueFrom(this.api.annul(target.id, this.annulReason));
      this.messages.add({ severity: 'success', summary: 'Factura anulada', detail: `${target.number} fue anulada.` });
      this.closeAnnul();
      this.load();
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
      this.messages.add({ severity: 'error', summary: 'No se pudo anular', detail });
    } finally {
      this.annulling.set(false);
    }
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe((invoices) => {
      this.invoices.set(invoices);
      this.loading.set(false);
    });
  }
}
