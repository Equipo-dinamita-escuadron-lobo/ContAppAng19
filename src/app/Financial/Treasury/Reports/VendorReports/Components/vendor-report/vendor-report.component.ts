import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services and Models
import { VendorReportService } from '../../Services/vendor-report.service';
import { VendorReport } from '../../Models/VendorReport';
import { MessageService } from 'primeng/api';

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
    ProgressSpinnerModule
  ],
  templateUrl: './vendor-report.component.html',
  styleUrls: ['./vendor-report.component.css'],
  providers: [MessageService]
})
export class VendorReportComponent implements OnInit {

  vendorReport: VendorReport | null = null;
  loading: boolean = false;
  vendorId: number = 0;
  vendorName: string = '';

  dateRangeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private vendorReportService: VendorReportService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeDateRangeForm();
    this.getRouteParams();
  }

  initializeDateRangeForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.dateRangeForm = this.fb.group({
      startDate: [firstDayOfMonth, Validators.required],
      endDate: [today, Validators.required],
      invoice: [''],
      status: ['']
    });
  }

  getRouteParams(): void {
    this.route.params.subscribe(params => {
      this.vendorId = +params['id'];
    });

    this.route.queryParams.subscribe(queryParams => {
      this.vendorName = queryParams['name'] || 'Proveedor';
    });

    if (this.vendorId) {
      this.loadVendorReport();
    }
  }

  loadVendorReport(): void {
    if (!this.dateRangeForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione un rango de fechas válido'
      });
      return;
    }

    const formValue = this.dateRangeForm.value;
    this.loading = true;

    this.vendorReportService.getVendorReport(
      this.vendorId,
      formValue.startDate,
      formValue.endDate,
      formValue.invoice || undefined,
      formValue.status === '' ? undefined : formValue.status === 'ACTIVE'
    ).subscribe({
      next: (report) => {
        this.vendorReport = report;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el reporte:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el reporte del proveedor'
        });
        this.loading = false;
      }
    });
  }

  onDateRangeChange(): void {
    if (this.dateRangeForm.valid && this.vendorId) {
      this.loadVendorReport();
    }
  }

  goBack(): void {
    this.router.navigate(['/financial/treasury/reports/vendors']);
  }

  exportToPdf(): void {
    if (!this.vendorReport) return;

    const formValue = this.dateRangeForm.value;
    this.vendorReportService.exportToPdf(
      this.vendorId,
      formValue.startDate,
      formValue.endDate
    ).subscribe({
      next: (blob) => {
        // Crear URL temporal para el blob y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_proveedor_${this.vendorName}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Reporte PDF descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al exportar PDF:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo exportar el reporte a PDF'
        });
      }
    });
  }

  exportToExcel(): void {
    if (!this.vendorReport) return;

    const formValue = this.dateRangeForm.value;
    this.vendorReportService.exportToExcel(
      this.vendorId,
      formValue.startDate,
      formValue.endDate
    ).subscribe({
      next: (blob) => {
        // Crear URL temporal para el blob y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_proveedor_${this.vendorName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Reporte Excel descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al exportar Excel:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo exportar el reporte a Excel'
        });
      }
    });
  }

  getTransactionTypeTag(type: 'Bill' | 'Payment'): { severity: 'success' | 'info' | 'warning' | 'danger', text: string } {
    switch (type) {
      case 'Bill':
        return { severity: 'info', text: 'Factura' };
      case 'Payment':
        return { severity: 'success', text: 'Pago' };
      default:
        return { severity: 'info', text: type };
    }
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-red-600 font-semibold';
    if (balance < 0) return 'text-green-600 font-semibold';
    return 'text-gray-600';
  }
}
