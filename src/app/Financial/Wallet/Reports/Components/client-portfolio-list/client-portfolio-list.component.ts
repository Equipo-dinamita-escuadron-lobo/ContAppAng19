import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { map, of, switchMap } from 'rxjs';
import { Client } from '../../../CashReceipts/Model';
import { InvoicePortfolioService } from '../../../PortfolioManagement/Service/invoice-portfolio.service';
import { ClientPortfolioView } from '../../Model/Response/PortfolioView';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';

@Component({
  selector: 'app-client-portfolio-list',
  standalone: true,
  imports: [ CommonModule,FormsModule,TableModule,ButtonModule,InputTextModule,TagModule, InputIcon,IconField],
  templateUrl: './client-portfolio-list.component.html',
  styleUrls: ['./client-portfolio-list.component.css']
})
export class ClientPortfolioListComponent implements OnInit {
 public clientPortfolio: ClientPortfolioView[] = [];
  public isLoading = true;
  public globalFilterValue: string = ''; // Para el campo de búsqueda de la tabla

  constructor(
    private cashReceiptService: CashReceiptService,
    private invoicePortfolioService: InvoicePortfolioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.isLoading = true;
    this.cashReceiptService.getClients("").pipe(
      switchMap((clients: Client[]) => {
        if (!clients || clients.length === 0) {
          return of({ clients: [], summaries: [] });
        }
        const clientIds = clients.map(c => c.id);
        
        // Esta llamada ahora funcionará gracias a la corrección en el servicio
        return this.invoicePortfolioService.getClientPortfolioSummary(clientIds).pipe(
          map(summaries => ({ clients, summaries }))
        );
      })
    ).subscribe(({ clients, summaries }) => {
      const summariesMap = new Map(summaries.map(s => [s.clientId, s]));

      this.clientPortfolio = clients
        .map(client => {
          const summary = summariesMap.get(client.id);
          return {
            clientId: client.id,
            clientIdentification: client.identification || 'N/A',
            clientName: client.name,
            totalDebt: summary?.totalDebt ?? 0,
            overdueAmount: summary?.overdueAmount ?? 0,
            dueToAmount: summary?.dueToAmount ?? 0,
          };
        })
        .filter(c => c.totalDebt > 0);
      
      this.isLoading = false;
    });
  }

  // Método para limpiar los filtros de la tabla de PrimeNG
  clear(table: Table): void {
    table.clear();
    this.globalFilterValue = '';
  }

  // Navegación al hacer clic en una fila
  viewClientDetail(clientId: number): void {
    this.router.navigate(['/financial/wallet/reports/client-invoices', clientId]);
  }

}
