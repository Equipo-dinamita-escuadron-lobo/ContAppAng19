import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InvoiceWithReturnsSummary } from '../../models/billing-sale-return.model';
import { CopCentsPipe } from '../../pipes/cop-cents.pipe';
import { BillingSaleReturnApi } from '../../services/billing-sale-return.api';
import { RETURN_STATE_LABEL } from '../../utils/sale-return';

@Component({
  selector: 'app-sale-return-list',
  imports: [DatePipe, ButtonModule, TableModule, CopCentsPipe],
  templateUrl: './sale-return-list.component.html',
})
export class SaleReturnListComponent implements OnInit {
  private readonly api = inject(BillingSaleReturnApi);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  rows = signal<InvoiceWithReturnsSummary[]>([]);
  loading = signal(true);

  // Tipado como Record<string, string>: en la plantilla `row` llega como `any` y no puede indexar un Record con clave restringida
  readonly stateLabel: Record<string, string> = RETURN_STATE_LABEL;

  ngOnInit(): void {
    this.api.listInvoicesWithReturns().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado.' });
      },
    });
  }

  // El detalle de las devoluciones está en la sección "Devoluciones" de la factura original
  view(row: InvoiceWithReturnsSummary): void {
    this.router.navigate(['/billing/sale', row.invoiceId]);
  }

  goBack(): void {
    this.router.navigate(['/billing']);
  }
}
