import { Component, OnInit } from '@angular/core';
import { InvoiceDetailView } from '../../Model/Response/PortfolioView';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InvoicePortfolioService } from '../../../PortfolioManagement/Service/invoice-portfolio.service';
import { CommonModule, CurrencyPipe, DatePipe, NgFor, NgIf, Location } from '@angular/common';
import { InvoiceReceiptsModalComponent } from '../invoice-receipts-modal/invoice-receipts-modal.component';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { Client } from '../../../CashReceipts/Model';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-client-invoice-list',
  standalone: true,
  imports: [  CommonModule,RouterModule,InvoiceReceiptsModalComponent,ButtonModule,TableModule, CardModule, TagModule,CurrencyPipe,DatePipe],
  templateUrl: './client-invoice-list.component.html',
  styleUrls: ['./client-invoice-list.component.css']
})
export class ClientInvoiceListComponent implements OnInit {
  
  public invoices: InvoiceDetailView[] = [];
  public isLoading = true;
  public clientName = '...'; // Placeholder para el nombre del cliente

  // Para las tarjetas de resumen
  public totalPending = 0;
  public totalOverdue = 0;
  public totalDueTo = 0;
  
  // Para controlar el modal
  public selectedInvoiceId: number | null = null;
  private clientId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private invoicePortfolioService: InvoicePortfolioService,
    private cashReceiptService: CashReceiptService, // Inyectar servicio de clientes
    private location: Location // Inyectar Location para el botón de regreso
  ) { }

  ngOnInit(): void {
    const clientIdStr = this.route.snapshot.paramMap.get('id');
    if (clientIdStr) {
      this.clientId = +clientIdStr;
      this.loadClientName(this.clientId);
      this.loadInvoiceData(this.clientId);
    }
  }

  loadClientName(clientId: number): void {
    // Usamos el mock de clientes para obtener el nombre.
    this.cashReceiptService.getClientById(clientId).subscribe((client: Client | undefined) => {
      if(client) {
        this.clientName = client.name;
      }
    });
  }

  loadInvoiceData(clientId: number): void {
    this.isLoading = true;
    this.invoicePortfolioService.getInvoicesByClient(clientId).subscribe(invoices => {
      this.invoices = invoices;
      this.calculateTotals();
      this.isLoading = false;
    });
  }

  calculateTotals(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.totalPending = this.invoices.reduce((sum, inv) => sum + inv.pendingValue, 0);
    
    this.totalOverdue = this.invoices
      .filter(inv => new Date(inv.expirationDate) < today)
      .reduce((sum, inv) => sum + inv.pendingValue, 0);
      
    this.totalDueTo = this.totalPending - this.totalOverdue;
  }

  isOverdue(expirationDate: string | Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(expirationDate) < today;
  }

  viewReceipts(invoiceId: number): void {
    this.selectedInvoiceId = invoiceId;
  }
  
  closeReceiptsModal(): void {
    this.selectedInvoiceId = null;
  }
  
  goBack(): void {
    this.location.back(); // Navega a la página anterior
  }
}
