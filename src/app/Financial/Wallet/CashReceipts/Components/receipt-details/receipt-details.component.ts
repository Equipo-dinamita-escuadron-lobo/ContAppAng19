import { Component } from '@angular/core';
import { ReceiptDetailsView } from '../../Model/ReceiptView';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CashReceiptService } from '../../Service/cash-receipt.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-receipt-details',
  imports: [CommonModule, RouterModule, ButtonModule, MessageModule],
  templateUrl: './receipt-details.component.html',
  styleUrl: './receipt-details.component.css'
})
export class ReceiptDetailsComponent {
  receipt: ReceiptDetailsView | null = null;
  errorMessage: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashReceiptService: CashReceiptService
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

  annulReceipt(): void {
    // Lógica para anular el recibo
    console.log('Anulando recibo:', this.receipt?.id);
    // Aquí llamarías a un método del servicio this.cashReceiptService.annul(id)
  }

  generateAccounting(): void {
    // Lógica para contabilizar
    console.log('Generando contabilidad para el recibo:', this.receipt?.id);
  }
}
