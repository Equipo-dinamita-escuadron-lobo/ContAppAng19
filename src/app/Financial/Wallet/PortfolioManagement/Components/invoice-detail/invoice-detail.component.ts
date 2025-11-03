import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Invoice } from '../../../CashReceipts/Model';
import { InvoicePortfolioService } from '../../Service/invoice-portfolio.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    CalendarModule,
    ToastModule,
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css',
  providers: [MessageService],
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  isLoading = true;
  showDialog = false;
  isSaving = false;

  dueDateForm: FormGroup;
  minDate = new Date(); // No permitir fechas pasadas

  constructor(
    private route: ActivatedRoute,
    private invoicePortfolioService: InvoicePortfolioService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.dueDateForm = this.fb.group({
      newDueDate: [null, Validators.required],
    });
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    this.loadInvoice();
  }

  loadInvoice(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isLoading = true;
      this.invoicePortfolioService.getInvoiceById(id).subscribe({
        next: (data) => {
          this.invoice = data;
          const currentDueDate = new Date(data.expirationDate + 'T00:00:00');
          this.dueDateForm.patchValue({ newDueDate: currentDueDate });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar la factura', err);
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la factura.' });
        },
      });
    }
  }

  saveNewDueDate(): void {
    if (this.dueDateForm.invalid || !this.invoice) {
      return;
    }

    this.isSaving = true;
    const newDate: Date = this.dueDateForm.value.newDueDate;
    const formattedDate = newDate.toISOString().split('T')[0];

    this.invoicePortfolioService.updateDueDate(this.invoice.id, formattedDate).subscribe({
        next: () => {
          this.isSaving = false;
          this.showDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Fecha de vencimiento actualizada.' });
          this.loadInvoice();
        },
        error: (err) => {
          this.isSaving = false;
          const errorMsg = err.error?.message || 'Ocurrió un error inesperado.';
          this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail: errorMsg });
        },
      });
  }
}
