import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Invoice } from '../../Model';


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

  /**
   * Metodo del ciclo de vida que se ejecuta cuando cambian las entradas.
   * @param changes Objeto que contiene los cambios en las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.selectedInvoicesInDialog = [...this.initiallySelectedInvoices];
    }
  }

  /**
   * Confirma la selección y emite el evento con las facturas seleccionadas.
   * Este método se llama cuando el usuario confirma su selección en el diálogo.
   */
  confirmSelection(): void {
    this.selectionConfirmed.emit(this.selectedInvoicesInDialog);
  }

  /**
   * Cancela la selección y emite el evento de cancelación.
   */
  cancelSelection(): void {
    this.selectionCancelled.emit();
  }
}
