import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';

// Services and Models
import { AgingReportService } from '../../Services/aging-report.service';
import {
  AgingReportFilter,
  AgingReportResponse,
  AccountTypeOption,
} from '../../Models/AgingReport';
import { LocalStorageMethods } from '../../../../../../Shared/Methods/local-storage.method';
import { MessageService } from 'primeng/api';

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

  // Filter form
  filterForm!: FormGroup;

  // Report data
  reportData: AgingReportResponse | null = null;

  // Filter options
  accountTypeOptions: AccountTypeOption[] = [];

  // Loading state
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private agingReportService: AgingReportService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadAccountTypes();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      supplierName: ['Proveedor XYZ'],
      accountTypeStart: [null],
      accountTypeEnd: [null],
      cutoffDate: [new Date()],
      includeDocuments: [false],
    });
  }

  loadAccountTypes(): void {
    const enterpriseId =
      this.localStorageMethods.getIdEnterprise() || 'test-enterprise';

    this.agingReportService.getAccountTypes(enterpriseId).subscribe({
      next: (accountTypes) => {
        this.accountTypeOptions = accountTypes;
      },
      error: (error) => {
        console.error('Error al cargar tipos de cuenta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se pudieron cargar los tipos de cuenta. Intente nuevamente.',
        });
      },
    });
  }

  onGenerateReport(): void {
    this.loading = true;

    const filters: AgingReportFilter = {
      supplierName: this.filterForm.value.supplierName,
      accountTypeStart: this.filterForm.value.accountTypeStart,
      accountTypeEnd: this.filterForm.value.accountTypeEnd,
      cutoffDate: this.filterForm.value.cutoffDate,
      includeDocuments: this.filterForm.value.includeDocuments,
    };

    const enterpriseId =
      this.localStorageMethods.getIdEnterprise() || 'test-enterprise';

    this.agingReportService.getAgingReport(enterpriseId, filters).subscribe({
      next: (report) => {
        this.reportData = report;
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Reporte Generado',
          detail: 'El reporte de vencimiento por edades se generó correctamente.',
        });
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el reporte. Intente nuevamente.',
        });
        this.loading = false;
      },
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      supplierName: '',
      accountTypeStart: null,
      accountTypeEnd: null,
      cutoffDate: new Date(),
      includeDocuments: false,
    });
    this.reportData = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros Limpiados',
      detail: 'Los filtros han sido restablecidos.',
    });
  }

  onExportData(): void {
    if (!this.reportData) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Genere un Reporte',
        detail: 'Primero debe generar un reporte antes de exportarlo.',
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad Pendiente',
      detail: 'La exportación de datos será implementada próximamente.',
    });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }
}
