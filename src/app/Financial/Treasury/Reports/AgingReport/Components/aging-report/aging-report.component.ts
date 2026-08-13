import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';

import { AgingReportService } from '../../Services/aging-report.service';
import {
  AgingReportFilter,
  AgingReportResponse,
  AccountTypeOption,
  SupplierOption,
  DocumentOption,
} from '../../Models/AgingReport';
import { LocalStorageMethods } from '../../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-aging-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    CardModule,
    ToastModule,
    InputSwitchModule,
  ],
  templateUrl: './aging-report.component.html',
  styleUrls: ['./aging-report.component.css'],
  providers: [MessageService],
})
export class AgingReportComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();

  filterForm!: FormGroup;
  reportData: AgingReportResponse | null = null;
  accountTypeOptions: AccountTypeOption[] = [];
  supplierOptions: SupplierOption[] = [];
  documentOptions: DocumentOption[] = [];
  allDocuments: DocumentOption[] = [];
  loading = false;
  exporting = false;

  constructor(
    private fb: FormBuilder,
    private agingReportService: AgingReportService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadFilterOptions();
    this.filterForm.get('supplierId')?.valueChanges.subscribe(() => this.onSupplierFilterChange());
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      supplierId: [null],
      document: [null],
      accountCode: [null],
      cutoffDate: [new Date(), Validators.required],
      includeDocuments: [true],
    });
  }

  loadFilterOptions(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empresa requerida',
        detail: 'Seleccione una empresa activa para generar el reporte.',
      });
      return;
    }

    this.agingReportService.getFilterOptions(enterpriseId).subscribe({
      next: (options) => {
        this.supplierOptions = options.suppliers;
        this.allDocuments = options.documents;
        this.documentOptions = options.documents;
        this.accountTypeOptions = options.accounts;
        this.onGenerateReport();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los filtros del reporte.',
        });
      },
    });
  }

  onSupplierFilterChange(): void {
    const supplierId = this.filterForm.value.supplierId;
    this.documentOptions = supplierId == null
      ? this.allDocuments
      : this.allDocuments.filter((d) => d.supplierId === Number(supplierId));

    const selectedDoc = this.filterForm.value.document;
    if (selectedDoc && !this.documentOptions.some((d) => d.value === selectedDoc)) {
      this.filterForm.patchValue({ document: null }, { emitEvent: false });
    }
  }

  onGenerateReport(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empresa requerida',
        detail: 'Seleccione una empresa activa.',
      });
      return;
    }

    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Filtros incompletos',
        detail: 'La fecha de corte es obligatoria.',
      });
      return;
    }

    this.loading = true;
    const supplierId = this.filterForm.value.supplierId;
    const supplier = this.supplierOptions.find((s) => s.id === supplierId);

    const filters: AgingReportFilter = {
      supplierId,
      supplierName: supplier?.name,
      document: this.filterForm.value.document || undefined,
      accountCode: this.filterForm.value.accountCode,
      cutoffDate: this.filterForm.value.cutoffDate,
      includeDocuments: this.filterForm.value.includeDocuments,
    };

    this.agingReportService.getAgingReport(enterpriseId, filters).subscribe({
      next: (report) => {
        this.reportData = report;
        this.loading = false;
        this.messageService.add({
          severity: report.lines.length ? 'success' : 'info',
          summary: report.lines.length ? 'Reporte generado' : 'Sin resultados',
          detail: report.lines.length
            ? `Se encontraron ${report.lines.length} obligación(es) pendientes.`
            : 'No hay obligaciones pendientes con esos filtros.',
        });
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'No se pudo generar el reporte.',
        });
      },
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      supplierId: null,
      document: null,
      accountCode: null,
      cutoffDate: new Date(),
      includeDocuments: true,
    });
    this.documentOptions = this.allDocuments;
    this.onGenerateReport();
  }

  onExportData(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId || !this.reportData) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Genere un reporte',
        detail: 'Primero genere el reporte antes de exportarlo.',
      });
      return;
    }

    this.exporting = true;
    const supplierId = this.filterForm.value.supplierId;
    const supplier = this.supplierOptions.find((s) => s.id === supplierId);
    const filters: AgingReportFilter = {
      supplierId,
      supplierName: supplier?.name,
      document: this.filterForm.value.document || undefined,
      accountCode: this.filterForm.value.accountCode,
      cutoffDate: this.filterForm.value.cutoffDate,
      includeDocuments: this.filterForm.value.includeDocuments,
    };

    this.agingReportService.exportAgingReport(enterpriseId, filters).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vencimiento-edades-${this.formatDate(this.reportData!.reportDate).replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Exportado',
          detail: 'Se descargó el CSV del reporte.',
        });
      },
      error: () => {
        this.exporting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo exportar el reporte.',
        });
      },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  supplierName(supplierId: number): string {
    return this.supplierOptions.find((s) => s.id === supplierId)?.name || `Proveedor ${supplierId}`;
  }
}
