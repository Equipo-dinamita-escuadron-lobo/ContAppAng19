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
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-aging-porfolio-report',
  imports: [CommonModule, ReactiveFormsModule, TreeTableModule, ButtonModule, AutoCompleteModule, CalendarModule, InputSwitchModule, TooltipModule, CurrencyPipe],
  templateUrl: './aging-porfolio-report.component.html',
  styleUrl: './aging-porfolio-report.component.css'
})
export class AgingPorfolioReportComponent implements OnInit {

  public filterForm!: FormGroup;
  public clientSuggestions: Client[] = [];
  public reportData: TreeNode[] = [];
  public isLoading = false;
  private rawReportData: PortfolioAgingAccount[] = []; // Guardar datos sin procesar
  private selectedClientName?: string; // Guardar nombre del cliente

  constructor(
    private fb: FormBuilder,
    private portfolioReportsService: PortfolioReportsService,
    private cashReceiptService: CashReceiptService
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      client: [null],
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

    const selectedClient: Client | null = this.filterForm.value.client;
    const cutoffDate: Date = this.filterForm.value.cutoffDate;
    const includeDocuments: boolean = this.filterForm.value.includeDocuments;

    const clientId = selectedClient ? selectedClient.id : null;

    this.portfolioReportsService.getPortfolioAgingReport(clientId, cutoffDate, includeDocuments)
      .subscribe({
        next: (data: PortfolioAgingAccount[]) => {
          // p-treeTable requiere un formato de datos específico (TreeNode).
          // Necesitamos transformar la respuesta del API.
          this.rawReportData = data;
          this.reportData = this.mapToTreeNode(data, selectedClient ? selectedClient.name : undefined);
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
   * Exporta el reporte a Excel
   */
  exportToExcel(): void {
    if (this.rawReportData.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    const cutoffDate: Date = this.filterForm.value.cutoffDate;
    const includeDocuments: boolean = this.filterForm.value.includeDocuments;
    
    // Crear el array de datos planos para Excel
    const excelData = this.flattenReportData(this.rawReportData, includeDocuments);

    // Crear worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar anchos de columna
    const columnWidths = [
      { wch: 15 }, // Código Cuenta
      { wch: 40 }, // Nombre Cuenta
      { wch: 20 }, // Código Factura
      { wch: 15 }, // Fecha Vencimiento
      { wch: 15 }, // Días Vencidos
      { wch: 18 }, // Total Adeudado
      { wch: 15 }, // Corriente
      { wch: 15 }, // 1-30 días
      { wch: 15 }, // 31-60 días
      { wch: 15 }, // 61-90 días
      { wch: 15 }  // +90 días
    ];
    ws['!cols'] = columnWidths;

    // Crear workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Antigüedad');

    // Generar nombre de archivo
    const fileName = this.generateFileName(cutoffDate);
    
    // Guardar archivo
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Aplana la estructura jerárquica para Excel
   */
   private flattenReportData(accounts: PortfolioAgingAccount[], includeDocuments: boolean, level: number = 0): any[] {
    const result: any[] = [];

    accounts.forEach(account => {
      // Agregar la cuenta
      const accountRow: any = {
        'Código Cuenta': account.accountCode || '',
        'Nombre Cuenta': '  '.repeat(level) + account.accountName,
        'Código Factura': '',
        'Fecha Vencimiento': '',
        'Días Vencidos': '',
        'Total Adeudado': account.totalAdeudado,
        'Corriente': account.corriente,
        '1-30 días': account.dias1a30,
        '31-60 días': account.dias31a60,
        '61-90 días': account.dias61a90,
        '+90 días': account.masDe90dias
      };
      result.push(accountRow);

      // Si incluye documentos y hay documentos, agregarlos
      if (includeDocuments && account.documents && account.documents.length > 0) {
        account.documents.forEach(doc => {
          const docRow: any = {
            'Código Cuenta': '',
            'Nombre Cuenta': '  '.repeat(level + 1) + '└─ Documento',
            'Código Factura': doc.factCode,
            'Fecha Vencimiento': this.formatDate(doc.expirationDate),
            'Días Vencidos': doc.daysInArrears > 0 ? doc.daysInArrears : '',
            'Total Adeudado': doc.pendingValue,
            'Corriente': '',
            '1-30 días': '',
            '31-60 días': '',
            '61-90 días': '',
            '+90 días': ''
          };
          result.push(docRow);
        });
      }

      // Procesar cuentas hijas recursivamente
      if (account.children && account.children.length > 0) {
        const childrenData = this.flattenReportData(account.children, includeDocuments, level + 1);
        result.push(...childrenData);
      }
    });
    return result;
  }

  /**
   * Genera el nombre del archivo
   */
  private generateFileName(cutoffDate: Date): string {
    const formattedDate = cutoffDate.toISOString().split('T')[0];
    const clientPart = this.selectedClientName ? `_${this.selectedClientName.replace(/\s+/g, '_')}` : '';
    return `Reporte_Antigüedad${clientPart}_${formattedDate}.xlsx`;
  }

  /**
   * Formatea una fecha para Excel
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO');
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
  return accounts.map(account => {
    const childrenNodes: TreeNode[] = account.children ? this.mapChildren(account.children) : [];

    if (account.documents && account.documents.length > 0) {
      const documentNodes: TreeNode[] = account.documents.map(doc => ({
        data: {
          isDocument: true,
          factCode: doc.factCode,
          expirationDate: doc.expirationDate,
          daysInArrears: doc.daysInArrears,
          totalAdeudado: doc.pendingValue,
        },
        leaf: true
      }));
      childrenNodes.unshift(...documentNodes);
    }

    return {
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
      children: childrenNodes,
      expanded: true
    };
  });
}
}
