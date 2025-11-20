import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PortfolioAgingAccount } from '../../Model/Response/PortfolioAgingAccount';
import { Client } from '../../../CashReceipts/Model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { PortfolioReportsService } from '../../Service/portfolio-reports.service';

@Component({
  selector: 'app-aging-porfolio-report',
  imports: [CommonModule,ReactiveFormsModule,TreeTableModule,ButtonModule,AutoCompleteModule,CalendarModule,InputSwitchModule,TooltipModule,CurrencyPipe],
  templateUrl: './aging-porfolio-report.component.html',
  styleUrl: './aging-porfolio-report.component.css'
})
export class AgingPorfolioReportComponent implements OnInit {

  public filterForm!: FormGroup;
  public clientSuggestions: Client[] = [];
  public reportData: TreeNode[] = [];
  public isLoading = false;

  constructor(
    private fb: FormBuilder,
    private portfolioReportsService: PortfolioReportsService,
    private cashReceiptService: CashReceiptService
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      client: [null, Validators.required],
      cutoffDate: [new Date(), Validators.required],
      includeDocuments: [false] // Placeholder para la funcionalidad futura
    });
  }

  /**
   * Busca clientes para el autocompletado.
   */
  searchClient(event: any): void {
    this.cashReceiptService.getClients(event.query).subscribe(clients => {
      this.clientSuggestions = clients;
    });
  }

  /**
   * Genera el reporte llamando al servicio.
   */
  generateReport(): void {
    if (this.filterForm.invalid) {
      // Marcar campos como tocados para mostrar errores si es necesario
      this.filterForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.reportData = []; // Limpiar datos anteriores

    const selectedClient: Client = this.filterForm.value.client;
    const cutoffDate: Date = this.filterForm.value.cutoffDate;

    this.portfolioReportsService.getPortfolioAgingReport(selectedClient.id, cutoffDate)
      .subscribe({
        next: (data: PortfolioAgingAccount[]) => {
          // p-treeTable requiere un formato de datos específico (TreeNode).
          // Necesitamos transformar la respuesta del API.
          this.reportData = this.mapToTreeNode(data, selectedClient.name);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al generar el reporte:', err);
          this.isLoading = false;
          // Aquí podrías mostrar un mensaje de error al usuario (p-toast)
        }
      });
  }
  
  /**
   * Limpia los filtros y resetea la tabla.
   */
  clearFilters(): void {
    this.filterForm.reset({
      cutoffDate: new Date(),
      includeDocuments: false
    });
    this.reportData = [];
  }
  
  /**
   * Función recursiva para transformar los datos del API al formato TreeNode
   * que p-treeTable necesita.
   */
  private mapToTreeNode(accounts: PortfolioAgingAccount[], clientName?: string): TreeNode[] {
    // Si es el nivel superior, añadimos una fila para el cliente
    const initialNodes = clientName ? [{
      data: { 
        accountName: clientName, 
        totalAdeudado: accounts.reduce((sum, acc) => sum + acc.totalAdeudado, 0),
        corriente: accounts.reduce((sum, acc) => sum + acc.corriente, 0),
        dias1a30: accounts.reduce((sum, acc) => sum + acc.dias1a30, 0),
        dias31a60: accounts.reduce((sum, acc) => sum + acc.dias31a60, 0),
        dias61a90: accounts.reduce((sum, acc) => sum + acc.dias61a90, 0),
        masDe90dias: accounts.reduce((sum, acc) => sum + acc.masDe90dias, 0)
      },
      children: this.mapChildren(accounts),
      expanded: true // Expandir el nodo del cliente por defecto
    }] : this.mapChildren(accounts);

    return initialNodes;
  }
  
  private mapChildren(accounts: PortfolioAgingAccount[]): TreeNode[] {
      return accounts.map(account => ({
          data: {
              accountCode: account.accountCode,
              accountName: account.accountName,
              totalAdeudado: account.totalAdeudado,
              corriente: account.corriente,
              dias1a30: account.dias1a30,
              dias31a60: account.dias31a60,
              dias61a90: account.dias61a90,
              masDe90dias: account.masDe90dias
          },
          children: account.children ? this.mapChildren(account.children) : [],
          expanded: true // Expandir todos los nodos por defecto
      }));
  }
}
