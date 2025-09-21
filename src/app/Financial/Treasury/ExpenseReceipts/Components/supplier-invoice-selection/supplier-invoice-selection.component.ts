import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { PurchaseInvoice } from '../../Model/Models';

@Component({
  selector: 'app-supplier-invoice-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    MessageModule
  ],
  templateUrl: './supplier-invoice-selection.component.html',
  styleUrl: './supplier-invoice-selection.component.css'
})
export class SupplierInvoiceSelectionComponent {
  @Input() availableInvoices: PurchaseInvoice[] = [];
  @Output() invoicesSelected = new EventEmitter<PurchaseInvoice[]>();

  selectedInvoices: PurchaseInvoice[] = [];

  onInvoiceSelectionChange(invoice: PurchaseInvoice, isSelected: boolean): void {
    if (isSelected) {
      if (!this.selectedInvoices.find(inv => inv.id === invoice.id)) {
        this.selectedInvoices.push({ ...invoice, selectedForPayment: true, amountToPay: invoice.pendingValue });
      }
    } else {
      this.selectedInvoices = this.selectedInvoices.filter(inv => inv.id !== invoice.id);
    }
  }

  onAmountChange(invoice: PurchaseInvoice, amount: number | string | null): void {
    const selectedInvoice = this.selectedInvoices.find(inv => inv.id === invoice.id);
    if (selectedInvoice) {
      const numericAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
      selectedInvoice.amountToPay = Math.min(numericAmount, invoice.pendingValue);
    }
  }

  confirmSelection(): void {
    const validInvoices = this.selectedInvoices.filter(inv =>
      inv.selectedForPayment && inv.amountToPay && inv.amountToPay > 0
    );
    this.invoicesSelected.emit(validInvoices);
  }

  cancelSelection(): void {
    this.selectedInvoices = [];
    this.invoicesSelected.emit([]);
  }

  isInvoiceSelected(invoice: PurchaseInvoice): boolean {
    return this.selectedInvoices.some(inv => inv.id === invoice.id);
  }

  getSelectedInvoiceAmount(invoice: PurchaseInvoice): number {
    const selectedInvoice = this.selectedInvoices.find(inv => inv.id === invoice.id);
    return selectedInvoice?.amountToPay || 0;
  }
}
