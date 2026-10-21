import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { SaleInvoice, SaleInvoiceLineInput } from '../../models/billing-sale-invoice.model';
import { CopCentsPipe } from '../../pipes/cop-cents.pipe';
import { BillingSaleInvoiceApi } from '../../services/billing-sale-invoice.api';
import { calcTotals } from '../../utils/money';

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Lista solo los borradores para retomarlos, duplicarlos o eliminarlos
@Component({
  selector: 'app-sale-invoice-pending',
  imports: [DatePipe, ButtonModule, TableModule, ConfirmDialogModule, SharedModule, CopCentsPipe],
  providers: [ConfirmationService],
  templateUrl: './sale-invoice-pending.component.html',
})
export class SaleInvoicePendingComponent implements OnInit {
  private readonly api = inject(BillingSaleInvoiceApi);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  drafts = signal<SaleInvoice[]>([]);
  loading = signal(true);
  busy = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.list('BORRADOR').subscribe((drafts) => {
      this.drafts.set(drafts);
      this.loading.set(false);
    });
  }

  totalOf(invoice: SaleInvoice): number {
    return calcTotals(invoice.lines).totalCents;
  }

  continue(invoice: SaleInvoice): void {
    this.router.navigate(['/billing/sale', invoice.id]);
  }

  confirmDuplicate(invoice: SaleInvoice): void {
    this.confirmation.confirm({
      header: 'Duplicar borrador',
      message: 'Se creará un nuevo borrador con el mismo cliente y las mismas líneas. ¿Continuar?',
      acceptLabel: 'Duplicar',
      rejectLabel: 'Cancelar',
      accept: () => this.duplicate(invoice),
    });
  }

  confirmDelete(invoice: SaleInvoice): void {
    this.confirmation.confirm({
      header: 'Eliminar borrador',
      icon: 'pi pi-exclamation-triangle',
      message: '¿Seguro que deseas eliminar este borrador? Esta acción no se puede deshacer.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.remove(invoice),
    });
  }

  goBack(): void {
    this.router.navigate(['/billing']);
  }

  // El duplicado es un borrador nuevo (sin id ni número) con fecha de hoy; conserva los valores
  // efectivos de cada línea (precio e IVA editados). Las referencias de catálogo las vuelve a fijar la API.
  private async duplicate(invoice: SaleInvoice): Promise<void> {
    this.busy.set(true);
    try {
      const lines: SaleInvoiceLineInput[] = invoice.lines.map(
        ({ precioCatalogoCents, ivaCatalogoPct, ...line }) => line,
      );
      await firstValueFrom(this.api.saveDraft({ clientId: invoice.clientId, date: todayIso(), lines }));
      this.toast('success', 'Borrador duplicado', 'Se creó un nuevo borrador con los mismos datos.');
      this.load();
    } catch (e) {
      this.toast('error', 'No se pudo duplicar', this.errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  private async remove(invoice: SaleInvoice): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.deleteDraft(invoice.id));
      this.drafts.update((list) => list.filter((d) => d.id !== invoice.id));
      this.toast('success', 'Borrador eliminado', 'El borrador se eliminó correctamente.');
    } catch (e) {
      this.toast('error', 'No se pudo eliminar', this.errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messages.add({ severity, summary, detail });
  }

  private errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
  }
}
