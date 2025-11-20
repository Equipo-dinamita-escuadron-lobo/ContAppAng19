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

interface AuxiliaryBookHistory {
  id: number; // CAMBIADO: De vuelta a 'number' para evitar el error de tipos
  bookName: string;
  generationDate: Date;
  user: string;
  status: 'Generando' | 'Completado' | 'Error';
}

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
    AuxiliaryBooksSchedulingComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './auxiliary-books-historial.component.html',
  styleUrls: ['./auxiliary-books-historial.component.css'],
})
export class AuxiliaryBooksHistorialComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  history: AuxiliaryBookHistory[] = [];
  isLoading = false; // Estado de carga

  // Control del modal de programación
  displaySchedulingModal = false;
  selectedHistoryItem: AuxiliaryBookHistory | null = null;

  // Paginación
  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'auxiliaryBook.createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchValue = '';

  // --- ¡PENDIENTE! ---
  // Debes obtener el ID de la empresa actual.
  // Probablemente de un servicio de autenticación o de contexto.
  private enterpriseId: string = 'bf4d475f-5d02-4551-b7f0-49a5c426ac0d';
  // -------------------

  constructor(
    private auxiliaryBookService: AuxiliaryBooksServiceService,
    protected enterpriseService: EnterpriseService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    //this.enterpriseId = this.enterpriseService.getSelectedEnterprise()?.id || 'YOUR_ENTERPRISE_ID_HERE';
  }

  loadHistory(event?: any): void {
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
              id: Number(item.id), // 'id' está en el nivel superior

              // Accede a los datos dentro de 'auxiliaryBook' y 'state'
              bookName: item.auxiliaryBook.type,
              generationDate: new Date(item.auxiliaryBook.createdAt),
              user: item.auxiliaryBook.userId,
              status: item.state,
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
    switch (status) {
      case 'Completado':
        return 'success';
      case 'Generando':
        return 'info';
      case 'Error':
        return 'danger';
      default:
        return 'warning';
    }
  }

  /**
   * Muestra el modal para programar un reporte.
   * @param item El registro del historial a programar.
   */
  showSchedulingModal(item: AuxiliaryBookHistory): void {
    this.selectedHistoryItem = item;
    this.displaySchedulingModal = true;
  }

  /**
   * Navega a la página de detalles de un registro del historial.
   * @param item El registro del historial a visualizar.
   */
  showDetails(item: AuxiliaryBookHistory): void {
    this.router.navigate([
      '/financial/reports/auxiliary-books/historial/details', // Esta ruta ahora es correcta
      item.id,
    ]);
  }
}
