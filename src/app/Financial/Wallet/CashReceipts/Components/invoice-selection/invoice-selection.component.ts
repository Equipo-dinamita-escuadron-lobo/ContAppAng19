import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Invoice } from '../../Model/Models';


@Component({
  selector: 'app-invoice-selection',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DialogModule
  ],
  templateUrl: './invoice-selection.component.html',
  styleUrl: './invoice-selection.component.css'
})
export class InvoiceSelectionComponent {
  // ENTRADAS: Datos que recibe del componente padre
  @Input() visible: boolean = false;
  @Input() availableInvoices: Invoice[] = [];
  @Input() initiallySelectedInvoices: Invoice[] = [];

  // SALIDAS: Eventos que emite hacia el componente padre
  @Output() selectionConfirmed = new EventEmitter<Invoice[]>();
  @Output() selectionCancelled = new EventEmitter<void>();

  // Estado interno del componente
  selectedInvoicesInDialog: Invoice[] = [];

  // ngOnChanges se dispara cada vez que un @Input cambia.
  // Es perfecto para inicializar el estado del diálogo cuando se abre.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      // Cuando el diálogo se hace visible, inicializamos la selección interna
      // con una copia de las facturas que ya estaban seleccionadas en el padre.
      // Usamos el spread operator `[...]` para evitar mutar el array original del padre.
      this.selectedInvoicesInDialog = [...this.initiallySelectedInvoices];
    }
  }

  confirmSelection(): void {
    // Emitimos la selección final al padre.
    this.selectionConfirmed.emit(this.selectedInvoicesInDialog);
  }

  cancelSelection(): void {
    // Emitimos un evento para que el padre sepa que debe cerrar el diálogo.
    this.selectionCancelled.emit();
  }
}
