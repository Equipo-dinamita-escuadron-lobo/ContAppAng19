import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ExpenseReceiptService } from '../../Service/expense-receipt.service';
import { AccountingEntryLine } from '../../Model/AccountingEntryLine';
import { TableModule } from 'primeng/table';

interface AugmentedAccountingEntryLine extends AccountingEntryLine {
  invoiceCreditDetails?: { invoiceCode: string; amount: number }[];
  isInvoiceCreditLine?: boolean;
}

@Component({
  selector: 'app-expense-receipt-accounting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MessageModule,
    CurrencyPipe,
    DatePipe,
    TableModule
  ],
  templateUrl: './expense-receipt-accounting.component.html',
  styleUrls: ['./expense-receipt-accounting.component.css']
})
export class ExpenseReceiptAccountingComponent implements OnInit {
  receiptId: number | null = null
  receiptCode: string | null = null;
  issueDate: Date | null = null;
  accountingEntries: AccountingEntryLine[] = [];
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.receiptId = +idParam;
      this.loadAccountingEntries(this.receiptId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de comprobante.';
    }
  }

  loadAccountingEntries(id: number): void {
    this.expenseReceiptService.getExpenseReceiptById(id).subscribe({
      next: (receipt) => {
        if (receipt) {
          this.receiptCode = receipt.receiptCode;
          this.issueDate = receipt.issueDate;
          this.accountingEntries = receipt.accountingEntry || [];
        }
      },
      error: (err) => {
        console.error(err);
        this.accountingEntries = [];
        this.errorMessage = 'No se pudieron cargar los asientos contables.';
      }
    });
  }

  viewReceiptDetails(): void {
    if (this.receiptId) {
      this.router.navigate(['/financial/treasury/expense-receipts/details/', this.receiptId]);
    } else {
      this.router.navigate(['/financial/treasury/expense-receipts']);
    }
  }

  goBackToList(): void {
    this.router.navigate(['/financial/treasury/expense-receipts']);
  }

  getTotalDebit(): number {
    return this.accountingEntries.reduce((sum, entry) => sum + entry.debit, 0);
  }

  getTotalCredit(): number {
    return this.accountingEntries.reduce((sum, entry) => sum + entry.credit, 0);
  }
}
