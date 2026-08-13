import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { saveAs } from 'file-saver';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

import { VendorReportService } from '../../Services/vendor-report.service';
import { VendorReport } from '../../Models/VendorReport';
import { MessageService } from 'primeng/api';
import { transactionTypeLabel } from '../../../../Shared/treasury-status-labels';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-vendor-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    CalendarModule,
    CardModule,
    ToastModule,
    TagModule,
    TooltipModule,
    DividerModule,
    ProgressSpinnerModule,
    DropdownModule,
    InputTextModule,
  ],
  templateUrl: './vendor-report.component.html',
  styleUrls: ['./vendor-report.component.css'],
  providers: [MessageService],
})
export class VendorReportComponent implements OnInit {
  vendorReport: VendorReport | null = null;
  loading = false;
  exportingPdf = false;
  exportingExcel = false;
  vendorId = 0;
  vendorName = '';

  dateRangeForm!: FormGroup;
  invoiceOptions: FilterOption[] = [];

  statusOptions: FilterOption[] = [
    { label: 'Todos los documentos', value: '' },
    { label: 'Solo vigentes', value: 'ACTIVE' },
    { label: 'Solo anulados', value: 'VOIDED' },
  ];

  periodOptions: { label: string; value: string; days?: number }[] = [
    { label: 'Personalizado', value: '' },
    { label: 'Este mes', value: 'THIS_MONTH' },
    { label: 'Últimos 7 días', value: 'LAST_7', days: 7 },
    { label: 'Últimos 30 días', value: 'LAST_30', days: 30 },
    { label: 'Últimos 90 días', value: 'LAST_90', days: 90 },
    { label: 'Año en curso', value: 'YTD' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private vendorReportService: VendorReportService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.initializeDateRangeForm();
    this.getRouteParams();
  }

  initializeDateRangeForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.dateRangeForm = this.fb.group({
      periodPreset: ['THIS_MONTH'],
      startDate: [firstDayOfMonth, Validators.required],
      endDate: [today, Validators.required],
      invoice: [null],
      status: [''],
    });

    this.dateRangeForm.get('periodPreset')?.valueChanges.subscribe((preset) => {
      if (preset) this.applyPeriodPreset(preset);
    });
  }

  getRouteParams(): void {
    this.route.params.subscribe((params) => {
      this.vendorId = +params['id'];
      if (this.vendorId) {
        this.loadInvoiceOptions();
        this.loadVendorReport();
      }
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.vendorName = queryParams['name'] || 'Proveedor';
    });
  }

  loadInvoiceOptions(): void {
    this.vendorReportService.getInvoiceOptions(this.vendorId).subscribe({
      next: (options) => {
        this.invoiceOptions = options;
      },
    });
  }

  applyPeriodPreset(preset: string): void {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let start = new Date(today);

    switch (preset) {
      case 'THIS_MONTH':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'YTD':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default: {
        const option = this.periodOptions.find((o) => o.value === preset);
        if (option?.days) {
          start.setDate(today.getDate() - option.days);
        } else {
          return;
        }
      }
    }

    start.setHours(0, 0, 0, 0);
    this.dateRangeForm.patchValue(
      { startDate: start, endDate: today },
      { emitEvent: false },
    );
  }

  loadVendorReport(): void {
    if (!this.dateRangeForm.valid || !this.vendorId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione un rango de fechas válido',
      });
      return;
    }

    const formValue = this.dateRangeForm.value;
    this.loading = true;

    this.vendorReportService
      .getVendorReport(
        this.vendorId,
        formValue.startDate,
        formValue.endDate,
        formValue.invoice || undefined,
        formValue.status === '' ? undefined : formValue.status === 'ACTIVE',
        this.vendorName,
      )
      .subscribe({
        next: (report) => {
          this.vendorReport = report;
          this.loading = false;
          if (!this.invoiceOptions.length && report.transactions.length) {
            this.invoiceOptions = [...new Set(report.transactions.map((t) => t.reference).filter(Boolean))]
              .map((ref) => ({ label: ref, value: ref }))
              .sort((a, b) => a.label.localeCompare(b.label));
          }
        },
        error: (error) => {
          console.error('Error al cargar el reporte:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el reporte del proveedor',
          });
          this.loading = false;
        },
      });
  }

  clearFilters(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateRangeForm.reset({
      periodPreset: 'THIS_MONTH',
      startDate: firstDayOfMonth,
      endDate: today,
      invoice: null,
      status: '',
    });
    this.loadVendorReport();
  }

  goBack(): void {
    this.router.navigate(['/financial/treasury/reports/vendors']);
  }

  exportToPdf(): void {
    if (!this.vendorReport) return;
    this.exportingPdf = true;
    try {
      const blob = this.vendorReportService.exportToPdf(this.vendorReport);
      saveAs(blob, this.exportFileName('pdf'));
      this.messageService.add({
        severity: 'success',
        summary: 'PDF exportado',
        detail: 'El estado de cuenta se descargó en PDF',
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo exportar el reporte a PDF',
      });
    } finally {
      this.exportingPdf = false;
    }
  }

  exportToExcel(): void {
    if (!this.vendorReport) return;
    this.exportingExcel = true;
    try {
      const blob = this.vendorReportService.exportToExcel(this.vendorReport);
      saveAs(blob, this.exportFileName('xlsx'));
      this.messageService.add({
        severity: 'success',
        summary: 'Excel exportado',
        detail: 'El estado de cuenta se descargó en Excel',
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo exportar el reporte a Excel',
      });
    } finally {
      this.exportingExcel = false;
    }
  }

  private exportFileName(ext: string): string {
    const safeName = this.vendorName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `estado_cuenta_${safeName}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  }

  getTransactionTypeTag(type: 'Bill' | 'Payment'): {
    severity: 'success' | 'info' | 'warning' | 'danger';
    text: string;
  } {
    const text = transactionTypeLabel(type);
    const severity = type === 'Payment' ? 'success' : 'info';
    return { severity, text };
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-red-600 font-semibold';
    if (balance < 0) return 'text-green-600 font-semibold';
    return 'text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }
}
