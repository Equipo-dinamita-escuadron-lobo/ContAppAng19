import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';


import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Invoice } from '../../../CashReceipts/Model';
import { InvoicePortfolioService } from '../../Service/invoice-portfolio.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

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

  constructor(private invoicePortfolioService: InvoicePortfolioService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoicePortfolioService.getInvoicesByEnterpriseId().subscribe({
      next: (data) => {
        this.invoices = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar las facturas', err);
        this.isLoading = false;
        // Aquí deberías usar un servicio de notificaciones (toast)
        alert('Error al cargar las facturas');
      },
    });
  }
}

