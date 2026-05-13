import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuxiliaryBooksServiceService } from '../../../../Services/auxiliary-books-service.service';
import { AuxiliaryBooksSchedulingComponent } from '../../../auxiliary-books-scheduling/auxiliary-books-scheduling.component';

@Component({
  selector: 'app-auxiliary-books-details',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, TimelineModule, ButtonModule],
  providers: [DialogService],
  templateUrl: './auxiliary-books-details.component.html',
  styleUrls: ['./auxiliary-books-details.component.css'],
})
export class AuxiliaryBooksDetailsComponent implements OnInit {
  bookDetails: any = null;
  logs: any[] = [];
  refDialog: DynamicDialogRef | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auxiliaryBookService: AuxiliaryBooksServiceService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('publicId');

    if (id) {
      this.loadBookDetails(id);
    }
  }

  loadBookDetails(publicId: string): void {
    this.auxiliaryBookService.getLogsByPublicId(publicId).subscribe({
      next: (response) => {
        this.bookDetails = response?.data?.[0]?.auxiliaryBook ?? null;
        this.logs = response?.data ?? [];
      },
      error: (err) => {
        console.error('Error al cargar los detalles del libro auxiliar', err);
        this.bookDetails = null;
        this.logs = [];
      },
    });
  }

  goToHistory(): void {
    this.router.navigate(['/financial/reports/auxiliary-books/historial']);
  }

  showSchedulingDialog(): void {
    if (!this.bookDetails) {
      return;
    }

    this.refDialog = this.dialogService.open(AuxiliaryBooksSchedulingComponent, {
      data: this.buildSchedulingDialogData(),
      modal: true,
      width: '72rem',
      breakpoints: {
        '1200px': '85vw',
        '768px': '95vw',
      },
    });
  }

  getLastLogStatus(): string {
    if (this.logs && this.logs.length > 0) {
      return this.logs[this.logs.length - 1].etypeEvent ?? 'PENDING';
    }

    return 'PENDING';
  }

  getStatusLabel(status: string | null | undefined): string {
    const normalized = String(status ?? '').toUpperCase();
    const map: { [key: string]: string } = {
      SUCCESS: 'Éxito',
      COMPLETED: 'Completado',
      GENERATING: 'Generando',
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      ERROR: 'Error',
      FAILED: 'Fallido',
      EXPORTED: 'Exportado',
      REGISTERED: 'Registrado',
    };
    return map[normalized] ?? (status ?? 'Sin estado');
  }

  getStatusIcon(status: string | null | undefined): string {
    const normalized = String(status ?? '').toUpperCase();
    if (normalized.includes('SUCCESS') || normalized.includes('COMPLET')) {
      return 'pi pi-check';
    }
    if (
      normalized.includes('GENERATING') ||
      normalized.includes('PENDING') ||
      normalized.includes('PROCESS')
    ) {
      return 'pi pi-spin pi-cog';
    }
    if (normalized.includes('ERROR') || normalized.includes('FAIL')) {
      return 'pi pi-times';
    }
    if (normalized.includes('EXPORT')) {
      return 'pi pi-download';
    }
    if (normalized.includes('REGISTER')) {
      return 'pi pi-bookmark';
    }
    return 'pi pi-info-circle';
  }

  getMarkerClass(status: string | null | undefined): string {
    const severity = this.getStatusSeverity(status);
    return `log-marker log-marker--${severity}`;
  }

  getCardClass(status: string | null | undefined): string {
    const severity = this.getStatusSeverity(status);
    return `log-card log-card--${severity}`;
  }

  getStatusSeverity(
    status: string | null | undefined
  ): 'success' | 'warning' | 'danger' | 'info' {
    const normalizedStatus = String(status ?? '').toUpperCase();

    if (
      normalizedStatus.includes('SUCCESS') ||
      normalizedStatus.includes('COMPLET')
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('GENERATING') ||
      normalizedStatus.includes('PENDING') ||
      normalizedStatus.includes('PROCESS')
    ) {
      return 'info';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'danger';
    }

    return 'warning';
  }

  private buildSchedulingDialogData() {
    return {
      publicId: this.bookDetails?.publicId ?? '',
      bookName: this.bookDetails?.type ?? 'Libro Auxiliar General',
      generationDate: this.bookDetails?.createdAt ?? null,
      user: this.bookDetails?.userId ?? 'Sistema',
      status: this.getLastLogStatus(),
    };
  }
}
