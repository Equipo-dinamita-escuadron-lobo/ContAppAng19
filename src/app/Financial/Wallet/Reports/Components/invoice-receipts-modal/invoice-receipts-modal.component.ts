import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReceiptSummaryView } from '../../Model/Response/PortfolioView';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { CommonModule, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice-receipts-modal',
  standalone: true,
  imports: [CommonModule,DialogModule,ButtonModule,TableModule, ProgressSpinnerModule,CurrencyPipe,DatePipe],
  templateUrl: './invoice-receipts-modal.component.html',
  styleUrls: ['./invoice-receipts-modal.component.css']
})
export class InvoiceReceiptsModalComponent implements OnInit {
  
  @Input() invoiceId!: number; 
  @Output() closeModal = new EventEmitter<void>(); 

  public receipts: ReceiptSummaryView[] = [];
  public isLoading = true;
  public isDialogVisible = true; // Para controlar la visibilidad del p-dialog

  constructor(private cashReceiptService: CashReceiptService, private router: Router) { }

  ngOnInit(): void {
    if (this.invoiceId) {
      this.isLoading = true;
      this.cashReceiptService.getReceiptsByInvoice(this.invoiceId).subscribe(receipts => {
        this.receipts = receipts;
        this.isLoading = false;
      });
    }
  }

   viewReceiptDetails(receiptId: number): void {
    // Es una buena práctica cerrar el modal antes de navegar
    this.close(); 
    
    // Navega a la URL de detalles del recibo
    this.router.navigate(['/financial/wallet/receipts/details', receiptId]);
  }

  // Emite el evento para que el componente padre se encargue de cerrar
  close(): void {
    this.closeModal.emit();
  }
}
