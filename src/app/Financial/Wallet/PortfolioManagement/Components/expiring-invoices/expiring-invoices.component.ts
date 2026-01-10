import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs'; 

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { InvoicePortfolioService } from '../../Service/invoice-portfolio.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { Invoice } from '../../../CashReceipts/Model';

@Component({
  selector: 'app-expiring-invoices',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    CalendarModule, 
    ToastModule
  ],
  providers: [MessageService], // Importante para las notificaciones toast
  templateUrl: './expiring-invoices.component.html',
  styleUrls: ['./expiring-invoices.component.css']
})
export class ExpiringInvoicesComponent implements OnInit {

  invoices: Invoice[] = [];
  loading: boolean = true;
  
  // Variables para el Modal de Reprogramación
  displayModal: boolean = false;
  selectedInvoice: Invoice | null = null;
  newDueDate: Date | undefined;
  minDate: Date = new Date(); // Para no permitir fechas pasadas

  constructor(
    private invoiceService: InvoicePortfolioService,
    private localStorageMethods: LocalStorageMethods,
    private messageService: MessageService,
    private cashReceiptService: CashReceiptService 
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const entId = this.localStorageMethods.getIdEnterprise();
    
    if (!entId) {
      this.loading = false;
      return; 
    }

    // 2. Aplicar el patrón de enriquecimiento
    this.invoiceService.getExpiringInvoices(entId).pipe(
      switchMap(invoicesFromApi => {
        // Si no hay facturas, devolvemos un array vacío
        if (!invoicesFromApi || invoicesFromApi.length === 0) {
          return of([]);
        }

        // Creamos un array de observables, cada uno es una llamada para obtener un cliente
        const clientRequests = invoicesFromApi.map(invoice =>
          this.cashReceiptService.getClientById(invoice.thirdId)
        );

        // forkJoin ejecuta todas las llamadas en paralelo y espera a que terminen
        return forkJoin(clientRequests).pipe(
          map(clients => 
            // Mapeamos el resultado para combinar la factura original con el nombre del cliente
            invoicesFromApi.map((invoice, index) => ({
              ...invoice,
              clientName: clients[index]?.name || `ID: ${invoice.thirdId}` // Asignamos el nombre del cliente
            }))
          )
        );
      })
    ).subscribe({
      next: (enrichedInvoices) => {
        this.invoices = enrichedInvoices;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar y enriquecer las facturas próximas a vencer', err);
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo cargar la información completa de las facturas'});
        this.loading = false;
      }
    });
  }

  // Abrir Modal
  openReschedule(invoice: Invoice) {
    this.selectedInvoice = invoice;
    this.newDueDate = undefined; // Resetear fecha
    this.displayModal = true;
  }

  // Guardar cambio
  saveNewDate() {
    if (!this.selectedInvoice || !this.newDueDate) return;

    // Convertir Date a String YYYY-MM-DD para el backend
    const dateString = this.newDueDate.toISOString().split('T')[0];

    this.invoiceService.updateDueDate(this.selectedInvoice.id, dateString).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Fecha actualizada correctamente'});
        this.displayModal = false;
        this.loadData(); // Recargar la lista (la factura debería desaparecer si la fecha es lejana)
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar la fecha'});
        console.error(err);
      }
    });
  }
}