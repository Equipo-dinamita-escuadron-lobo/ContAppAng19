import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { InvoicePortfolioService } from '../../Service/invoice-portfolio.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { InvoiceSummaryResponseDto } from '../../../PortfolioWriteOffs/Models';

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

  invoices: InvoiceSummaryResponseDto[] = [];
  loading: boolean = true;
  
  // Variables para el Modal de Reprogramación
  displayModal: boolean = false;
  selectedInvoice: InvoiceSummaryResponseDto | null = null;
  newDueDate: Date | undefined;
  minDate: Date = new Date(); // Para no permitir fechas pasadas

  constructor(
    private invoiceService: InvoicePortfolioService,
    private localStorageMethods: LocalStorageMethods,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const entId = this.localStorageMethods.getIdEnterprise();
    
    if(!entId) return; // Manejo de error si no hay empresa

    this.invoiceService.getExpiringInvoices(entId).subscribe({
      next: (data) => {
        this.invoices = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // Abrir Modal
  openReschedule(invoice: InvoiceSummaryResponseDto) {
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