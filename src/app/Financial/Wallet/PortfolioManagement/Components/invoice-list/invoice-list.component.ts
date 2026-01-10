import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Invoice } from '../../../CashReceipts/Model';
import { InvoicePortfolioService } from '../../Service/invoice-portfolio.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule, 
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css'
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  isLoading = true;

  constructor(
    private invoicePortfolioService: InvoicePortfolioService, 
    private cashReceiptService: CashReceiptService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoicePortfolioService.getPendingInvoices().pipe(
      switchMap(invoicesFromApi => {
        if (!invoicesFromApi || invoicesFromApi.length === 0) {
          return of([]);
        }

        const clientRequests = invoicesFromApi.map(invoice =>
          this.cashReceiptService.getClientById(invoice.thirdId)
        );

        return forkJoin(clientRequests).pipe(
          map(clients => 
            invoicesFromApi.map((invoice, index) => ({
              ...invoice,
              clientName: clients[index]?.name || `ID: ${invoice.thirdId}`
            }))
          )
        );
      })
    ).subscribe({
      next: (enrichedInvoices) => {
        this.invoices = enrichedInvoices;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar las facturas', err);
        this.isLoading = false;
        alert('Error al cargar la información completa de las facturas.');
      },
    });
  }
}

