import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextarea } from 'primeng/inputtextarea';
import { ReceiptDetailsView } from '../../Model/view';

@Component({
  selector: 'app-receipt-details',
  imports: [CommonModule, RouterModule, ButtonModule, InputTextarea , MessageModule, DialogModule, FormsModule, ConfirmDialogModule, ToastModule],
  templateUrl: './receipt-details.component.html',
  styleUrl: './receipt-details.component.css',
  providers: [ConfirmationService, MessageService]
})
export class ReceiptDetailsComponent {
  receipt: ReceiptDetailsView | null = null;
  errorMessage: string | null = null;

  // Propiedades para el diálogo de anulación
  displayAnnulDialog: boolean = false;
  annulReason: string = '';
  isSubmittingAnnulment: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashReceiptService: CashReceiptService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService 
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const receiptId = +idParam; // El '+' convierte el string a número
      this.loadReceiptDetails(receiptId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de recibo.';
    }
  }

  loadReceiptDetails(id: number): void {
    this.errorMessage = null;
    this.cashReceiptService.getReceiptById(id).subscribe({
      next: (data) => {
        if (data) {
          this.receipt = data;
        } else {
          this.errorMessage = `No se encontró un recibo con el ID ${id}.`;
        }
      },
      error: (err) => {
        this.errorMessage = 'Ocurrió un error al cargar los detalles del recibo.';
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/financial/wallet/receipts']);
  }

  promptAnnulReceipt(): void {
    this.confirmationService.confirm({
        message: `¿Está seguro de que desea anular el recibo <strong>${this.receipt?.receiptCode}</strong>? Esta acción no se puede deshacer.`,
        header: 'Confirmar Anulación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, anular',
        rejectLabel: 'Cancelar',
        accept: () => {
            this.annulReason = ''; 
            this.displayAnnulDialog = true;
        }
    });
  }

  cancelAnnulment(): void {
    this.displayAnnulDialog = false;
  }

  confirmAnnulment(): void {
    if (!this.annulReason.trim()) {
        this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El motivo de la anulación es requerido.' });
        return;
    }

    if (!this.receipt) return;
    
    this.isSubmittingAnnulment = true;

    this.cashReceiptService.voidReceipt(this.receipt.id, this.annulReason).subscribe({
        next: (updatedReceipt) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'El recibo ha sido anulado correctamente.' });
            if (this.receipt) {
                this.receipt.status = 'Anulado'; // Actualizamos el estado en la vista
            }
            this.displayAnnulDialog = false;
            this.isSubmittingAnnulment = false;
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular el recibo. Intente de nuevo.' });
            console.error('Error al anular el recibo:', err);
            this.isSubmittingAnnulment = false;
        }
    });
  }

  generateAccounting(): void {
    // Lógica para contabilizar
      if (this.receipt?.id) {
      this.router.navigate(['/financial/wallet/receipts', this.receipt.id, 'accounting']);
    } else {
      console.warn('No se puede generar contabilidad: ID de recibo no disponible.');
      this.errorMessage = 'No se puede generar contabilidad: ID de recibo no disponible.';
    }
  }
}
