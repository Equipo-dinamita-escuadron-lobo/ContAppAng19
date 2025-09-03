import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { AccountingEntryLine } from '../../Model/AccountinEntryLine';
import { TableModule } from 'primeng/table'; // Importa TableModule para futuras mejoras si lo deseas


interface AugmentedAccountingEntryLine extends AccountingEntryLine {
  invoiceCreditDetails?: { invoiceCode: string; amount: number }[];
  isInvoiceCreditLine?: boolean; 
}

@Component({
  selector: 'app-receipt-accounting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MessageModule,
    CurrencyPipe,
    DatePipe,
    TableModule // Puedes añadirlo si decides usar p-table
  ],
  templateUrl: './receipt-accounting.component.html',
  styleUrls: ['./receipt-accounting.component.css']
})
export class ReceiptAccountingComponent implements OnInit {
  receiptId: number | null = null;
  receiptCode: string | null = null;
  issueDate: Date | null = null;
  accountingEntries: AccountingEntryLine[] = [];
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashReceiptService: CashReceiptService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.receiptId = +idParam;
      console.log('Cargando asiento contable para el recibo ID:', this.receiptId);
      this.loadAccountingEntries(this.receiptId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de recibo para la contabilización.';
    }
  }

  loadAccountingEntries(id: number): void {
    this.errorMessage = null;
    this.cashReceiptService.getReceiptById(id).subscribe({
      next: (data) => {
        if (data && data.accountingEntry) {
          this.receiptCode = data.receiptCode || 'N/A';
          this.issueDate = data.issueDate || null;
          this.accountingEntries = data.accountingEntry;
        } else if (data) {
          this.errorMessage = `El recibo ${data.receiptCode} no tiene un asiento contable asociado.`;
          this.receiptCode = data.receiptCode || 'N/A';
          this.issueDate = data.issueDate || null;
          this.accountingEntries = [];
        }
        else {
          this.errorMessage = `No se encontró un recibo con el ID ${id}.`;
          this.accountingEntries = [];
        }
      },
      error: (err) => {
        this.errorMessage = 'Ocurrió un error al cargar el asiento contable del recibo.';
        console.error(err);
        this.accountingEntries = [];
      }
    });
  }

  viewReceiptDetails(): void {
    if (this.receiptId) {
      this.router.navigate(['/financial/wallet/receipts/details/', this.receiptId]);
    } else {
      this.router.navigate(['/financial/wallet/receipts']);
    }
  }

  goBackToList(): void {
    this.router.navigate(['/financial/wallet/receipts']);
  }

  get totalDebit(): number {
    return this.accountingEntries.reduce((total, entry) => total + (entry.debit || 0), 0);
  }

  get totalCredit(): number {
    return this.accountingEntries.reduce((total, entry) => total + (entry.credit || 0), 0);
  }

}