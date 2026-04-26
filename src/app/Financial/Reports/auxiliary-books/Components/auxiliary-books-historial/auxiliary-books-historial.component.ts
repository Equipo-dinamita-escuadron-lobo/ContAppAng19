import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

// Services
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';
// Components
import { AuxiliaryBooksSchedulingComponent } from '../auxiliary-books-scheduling/auxiliary-books-scheduling.component';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-auxiliary-books-historial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    RippleModule,
    DialogModule,
  ],
  providers: [MessageService, ConfirmationService, DialogService],
  templateUrl: './auxiliary-books-historial.component.html',
  styleUrls: ['./auxiliary-books-historial.component.css'],
})
export class AuxiliaryBooksHistorialComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  refDialog: DynamicDialogRef | undefined;

  history: any[] = [];
  isLoading = false; // Estado de carga

  selectedHistoryItem: any | null = null;

  // Paginación
  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'auxiliaryBook.createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchValue = '';

  private enterpriseId: string | null = null;

  constructor(
    private auxiliaryBookService: AuxiliaryBooksServiceService,
    protected enterpriseService: EnterpriseService,
    private router: Router,
    private messageService: MessageService,
    protected dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.enterpriseId =
      this.enterpriseService.getSelectedEnterprise()?.id ?? null;

    if (!this.enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empresa no seleccionada',
        detail:
          'Selecciona una empresa para ver el historial de libros auxiliares.',
      });
      return;
    }

    this.loadHistory();
  }

  loadHistory(event?: any): void {
    if (!this.enterpriseId) {
      return;
    }

    this.isLoading = true;

    // Si el evento existe (paginación, orden), actualizamos los valores
    if (event) {
      this.first = event.first;
      this.rows = event.rows;
      this.sortField = event.sortField || this.sortField;
      const sortOrderValue = event.sortOrder === 1 ? 'asc' : 'desc';
      if (this.sortOrder !== sortOrderValue) {
        this.sortOrder = sortOrderValue;
      }
    }

    const pageable = {
      page: this.first / this.rows,
      size: this.rows,
      sort: `${this.sortField},${this.sortOrder}`,
    };

    // --- Llamada real al servicio ---
    this.auxiliaryBookService
      .getHistoryByEnterprise(this.enterpriseId, pageable)
      .subscribe({
        next: (response) => {
          if (response && response.data && response.data.content) {
            const pageData = response.data;

            // APLICAR ESTE CAMBIO
            this.history = pageData.content.map((item: any) => ({
              id: Number(item.id),
              publicId: item.auxiliaryBook.publicId,
              bookName: item.auxiliaryBook.type,
              generationDate: new Date(item.auxiliaryBook.createdAt),
              user: item.auxiliaryBook.userId,
              status: item.state,
              type: item.auxiliaryBook.type,
              createdAt: item.auxiliaryBook.createdAt,
              userId: item.auxiliaryBook.userId,
              state: item.state,
              criteria: item.auxiliaryBook.criteria ?? null,
              deliveryWay:
                item.deliveryWay ?? item.auxiliaryBook.deliveryWay ?? null,
              frequency: item.frequency ?? item.auxiliaryBook.frequency ?? null,
              scheduleDate:
                item.scheduleDate ??
                item.nextExecutionAt ??
                item.eventAt ??
                null,
              startAt:
                item.startAt ??
                item.scheduleDate ??
                item.nextExecutionAt ??
                item.eventAt ??
                item.auxiliaryBook.startAt ??
                null,
              endAt: item.endAt ?? item.auxiliaryBook.endAt ?? null,
              weekday: item.weekday ?? item.auxiliaryBook.weekday ?? null,
              monthDay: item.monthDay ?? item.auxiliaryBook.monthDay ?? null,
              email: item.email ?? item.auxiliaryBook.email ?? null,
              scheduleId:
                item.scheduleId ?? item.auxiliaryBook.scheduleId ?? null,
            }));

            // Esto debería funcionar si 'totalElements' está en 'response.data'
            this.totalRecords = pageData.totalElements;
          } else {
            // Manejar respuesta inesperada
            this.history = [];
            this.totalRecords = 0;
            this.messageService.add({
              severity: 'warn',
              summary: 'Atención',
              detail: 'La respuesta del servidor no tuvo el formato esperado.',
            });
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar el historial:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el historial. Intente de nuevo.',
          });
          this.history = [];
          this.totalRecords = 0;
          this.isLoading = false;
        },
      });
  }

  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    // Aquí se podría agregar un debounce para no llamar al servicio en cada tecleo
    this.dt.first = 0; // Reset paginator
    this.loadHistory();
  }

  onPageChange(event: any): void {
    this.loadHistory(event);
  }

  onSort(event: any): void {
    this.loadHistory(event);
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const normalizedStatus = String(status ?? '').toUpperCase();

    if (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS')
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'danger';
    }

    if (
      normalizedStatus.includes('GENER') ||
      normalizedStatus.includes('PENDING') ||
      normalizedStatus.includes('SCHEDULE') ||
      normalizedStatus.includes('PROCESS')
    ) {
      return 'info';
    }

    return 'warning';
  }

  /**
   * Navega a la página de detalles de un registro del historial.
   * @param item El registro del historial a visualizar.
   */
  showDetails(item: any): void {
    this.router.navigate([
      '/financial/reports/auxiliary-books/historial/details', // Esta ruta ahora es correcta
      item.publicId,
    ]);
  }

  showSchedulingDialog(item: any) {
    this.selectedHistoryItem = item;

    this.refDialog = this.dialogService.open(
      AuxiliaryBooksSchedulingComponent,
      {
        data: this.selectedHistoryItem,
      }
    );
  }
}
