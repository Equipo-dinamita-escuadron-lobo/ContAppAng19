import { Component, OnInit } from '@angular/core';
import { AccountingEntryView, ReceiptView } from '../../../CashReceipts/Model/view';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag'; // Importar TagModule si se usa p-tag
import { AccountingEntriesService } from '../../Service/accounting-entries.service';
import { SourceDocumentView } from '../../Model/SourceDocumentView';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { forkJoin } from 'rxjs';
import { PortfolioWriteOffService } from '../../../PortfolioWriteOffs/Services/portfolio-write-off.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';


@Component({
  selector: 'app-accounting-entries',
  imports: [CommonModule, TableModule, ButtonModule, RippleModule, TagModule, ReactiveFormsModule, DropdownModule], // Añadir TagModule
  templateUrl: './accounting-entries.component.html',
  styleUrls: ['./accounting-entries.component.css'],
  standalone: true
})
export class AccountingEntriesComponent implements OnInit {
  
  allDocuments: SourceDocumentView[] = [];
  filteredDocuments: SourceDocumentView[] = [];
  
  isLoading = false;
  expandedRows: { [key: string]: boolean } = {};

  filterForm!: FormGroup;
  documentTypeOptions: any[];

  constructor(
    private fb: FormBuilder,
    private accountingEntriesService: AccountingEntriesService, 
    private cashReceiptService: CashReceiptService,
    private localStorageMethods: LocalStorageMethods,
    private portfolioWriteOffService: PortfolioWriteOffService // Inyectar servicio de castigos
  ) {
    this.documentTypeOptions = [
      { label: 'Todos', value: null },
      { label: 'Recibos de Caja', value: 'RECEIPT' },
      { label: 'Castigos de Cartera', value: 'PORTFOLIO_WRITEOFF' }
    ];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllDocuments();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      documentType: [null]
    });
  }

  loadAllDocuments(): void {
    this.isLoading = true;
    
    // Hacemos llamadas en paralelo para obtener recibos y castigos
    forkJoin({
      receipts: this.cashReceiptService.getAllReceipts(),
      writeOffs: this.portfolioWriteOffService.getWriteOffsByEnterprise(this.localStorageMethods.getIdEnterprise())
    }).subscribe({
      next: ({ receipts, writeOffs }) => {
        // Mapeamos los recibos a nuestra interfaz unificada
        const receiptDocuments: SourceDocumentView[] = receipts.map(r => ({
          uniqueId: `RECEIPT-${r.id}`,
          id: r.id,
          code: r.receiptCode,
          date: r.issueDate,
          description: `Recibo de caja para ${r.clientName}`,
          totalAmount: r.totalAmount,
          type: 'RECEIPT',
          typeName: 'Recibo de Caja'
        }));

        // Mapeamos los castigos a nuestra interfaz unificada
         const writeOffDocuments: SourceDocumentView[] = writeOffs.map(w => ({
          uniqueId: `PORTFOLIO_WRITEOFF-${w.id}`,
          id: w.id,
          code: w.code,
          date: w.writeOffDate,
          description: `Castigo de cartera para ${w.thirdName}`,
          totalAmount: w.totalAmount,
          type: 'PORTFOLIO_WRITEOFF',
          typeName: 'Castigo de Cartera'

         }));

        // Combinamos y ordenamos por fecha
        this.allDocuments = [...receiptDocuments , ...writeOffDocuments].sort((a, b) => b.date.getTime() - a.date.getTime());
        this.filteredDocuments = this.allDocuments;
        this.isLoading = false;
        console.log('Documentos cargados:', this.allDocuments);
      },
      error: (err) => {
        console.error('Error al cargar los documentos:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    if (filters.documentType) {
      this.filteredDocuments = this.allDocuments.filter(d => d.type === filters.documentType);
    } else {
      this.filteredDocuments = [...this.allDocuments];
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredDocuments = [...this.allDocuments];
  }

  onRowExpand(event: any): void {
    const document: SourceDocumentView = event.data;
    
    if (document.accountingEntry) {
      return;
    }

    document.isDetailLoading = true;
    // Llamamos al servicio con el ID y el TIPO del documento
    this.accountingEntriesService.getAccountingEntryViewBySource(document.id, document.type).subscribe({
      next: (accountingEntryView) => {
        document.accountingEntry = accountingEntryView;
        document.isDetailLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar asientos para el documento ${document.code}:`, err);
        document.accountingEntry = null; 
        document.isDetailLoading = false;
      }
    });
  }

  onRowCollapse(event: any): void {
    // No se necesita lógica aquí por ahora
  }
}