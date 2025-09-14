import { Component } from '@angular/core';
import { ExpenseReceiptDetailsView } from '../../Model/ExpenseReceiptView';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExpenseReceiptService } from '../../Service/expense-receipt.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-expense-receipt-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, MessageModule, DialogModule, FormsModule, ConfirmDialogModule, ToastModule, TableModule],
  templateUrl: './expense-receipt-details.component.html',
  styleUrl: './expense-receipt-details.component.css',
  providers: [ConfirmationService, MessageService]
})
export class ExpenseReceiptDetailsComponent {
  receipt: ExpenseReceiptDetailsView | null = null;
  errorMessage: string | null = null;

  // Propiedades para el diálogo de anulación
  displayAnnulDialog: boolean = false;
  annulReason: string = '';
  isSubmittingAnnulment: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const receiptId = +idParam; // El '+' convierte el string a número
      this.loadReceiptDetails(receiptId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de comprobante.';
    }
  }

  loadReceiptDetails(id: number): void {
    this.errorMessage = null;
    this.expenseReceiptService.getExpenseReceiptById(id).subscribe({
      next: (receipt) => {
        this.receipt = receipt || null;
      },
      error: (error) => {
        console.error('Error al cargar los detalles del comprobante:', error);
        this.errorMessage = 'No se pudo cargar la información del comprobante.';
      }
    });
  }

  openAnnulDialog(): void {
    this.annulReason = '';
    this.displayAnnulDialog = true;
  }

  confirmAnnulment(): void {
    if (!this.receipt || !this.annulReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe proporcionar una razón para la anulación.'
      });
      return;
    }

    this.isSubmittingAnnulment = true;

    this.expenseReceiptService.voidExpenseReceipt(this.receipt.id, this.annulReason).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Comprobante ${response.receiptCode} anulado correctamente.`
        });
        this.displayAnnulDialog = false;
        this.loadReceiptDetails(this.receipt!.id); // Recargar los detalles
      },
      error: (error) => {
        console.error('Error al anular el comprobante:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo anular el comprobante. Intente nuevamente.'
        });
      },
      complete: () => {
        this.isSubmittingAnnulment = false;
      }
    });
  }

  cancelAnnulment(): void {
    this.displayAnnulDialog = false;
    this.annulReason = '';
  }

  viewAccounting(): void {
    if (this.receipt) {
      this.router.navigate(['/financial/treasury/expense-receipts', this.receipt.id, 'accounting']);
    }
  }

  goBackToList(): void {
    this.router.navigate(['/financial/treasury/expense-receipts']);
  }
}
