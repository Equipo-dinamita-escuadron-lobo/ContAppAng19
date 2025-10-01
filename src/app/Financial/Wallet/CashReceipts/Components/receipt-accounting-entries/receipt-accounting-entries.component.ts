import { Component, OnInit } from '@angular/core';
import { AccountingEntryView, ReceiptView } from '../../Model/view';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag'; // Importar TagModule si se usa p-tag

// Extiende la interfaz para incluir opcionalmente los detalles y el estado de carga
interface ReceiptViewWithDetails extends ReceiptView {
  accountingEntry?: AccountingEntryView | null;
  isDetailLoading?: boolean;
}

@Component({
  selector: 'app-receipt-accounting-entries',
  imports: [CommonModule, TableModule, ButtonModule, RippleModule, TagModule], // Añadir TagModule
  templateUrl: './receipt-accounting-entries.component.html',
  styleUrls: ['./receipt-accounting-entries.component.css'],
  standalone: true
})
export class ReceiptAccountingEntriesComponent implements OnInit {
  
  receipts: ReceiptViewWithDetails[] = [];
  isLoading = false;
  expandedRows: { [key: string]: boolean } = {};

  constructor(private cashReceiptService: CashReceiptService) { }

  ngOnInit(): void {
    this.loadInitialReceipts();
  }

  loadInitialReceipts(): void {
    this.isLoading = true;
    this.cashReceiptService.getAllReceipts().subscribe({
      next: (receiptViews) => {
        this.receipts = receiptViews;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la lista de recibos:', err);
        this.isLoading = false;
      }
    });
  }

  onRowExpand(event: any): void {
    const receipt: ReceiptViewWithDetails = event.data;
    
    // Si ya tiene los datos, no los volvemos a cargar
    if (receipt.accountingEntry) {
      return;
    }

    receipt.isDetailLoading = true;
    this.cashReceiptService.getAccountingEntryViewByReceiptId(receipt.id).subscribe({
      next: (accountingEntryView) => {
        receipt.accountingEntry = accountingEntryView;
        receipt.isDetailLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar asientos para el recibo ${receipt.receiptCode}:`, err);
        // Opcional: manejar el error, por ejemplo, asignando un valor que indique el fallo
        receipt.accountingEntry = null; 
        receipt.isDetailLoading = false;
      }
    });
  }

  onRowCollapse(event: any): void {
    // Lógica adicional si se necesita al colapsar una fila (generalmente no es necesario)
    const receipt = event.data;
    // console.log('Collapsed:', receipt.receiptCode);
  }

  // Si usas p-tag en la tabla de detalles, necesitarás una función como esta
  getStatusSeverity(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }
}