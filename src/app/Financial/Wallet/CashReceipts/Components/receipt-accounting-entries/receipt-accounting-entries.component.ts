import { Component, OnInit } from '@angular/core';
import { AccountingEntryView, ReceiptView } from '../../Model/view';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

interface ReceiptAccountingView extends ReceiptView {
  isExpanded: boolean;
  accountingEntry?: AccountingEntryView; // El asiento contable enriquecido
}

@Component({
  selector: 'app-receipt-accounting-entries',
  imports: [ CommonModule,TableModule,ButtonModule,RippleModule],
  templateUrl: './receipt-accounting-entries.component.html',
  styleUrl: './receipt-accounting-entries.component.css'
})
export class ReceiptAccountingEntriesComponent implements OnInit {
  receipts: ReceiptAccountingView[] = [];
  isLoading = false;

  constructor(private cashReceiptService: CashReceiptService) { }

  ngOnInit(): void {
    this.loadInitialReceipts();
  }

  loadInitialReceipts(): void {
    this.isLoading = true;
    this.cashReceiptService.getAllReceipts().subscribe({
      next: (receiptViews) => {
        this.receipts = receiptViews.map(rv => ({
          ...rv,
          isExpanded: false
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la lista de recibos:', err);
        this.isLoading = false;
        // Aquí puedes mostrar un toast de error
      }
    });
  }

  toggleRow(receipt: ReceiptAccountingView): void {
    receipt.isExpanded = !receipt.isExpanded;

    // Cargar los datos solo la primera vez que se expande
    if (receipt.isExpanded && !receipt.accountingEntry) {
      this.cashReceiptService.getAccountingEntryViewByReceiptId(receipt.id).subscribe({
        next: (accountingEntryView) => {
          receipt.accountingEntry = accountingEntryView;
        },
        error: (err) => {
          console.error(`Error al cargar asientos para el recibo ${receipt.receiptCode}:`, err);
          receipt.isExpanded = false; // Opcional: cerrar si hay error
          // Mostrar toast de error
        }
      });
    }
  }

}
