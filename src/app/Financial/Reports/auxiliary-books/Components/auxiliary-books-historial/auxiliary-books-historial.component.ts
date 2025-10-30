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

interface AuxiliaryBookHistory {
  id: number;
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
    AuxiliaryBooksSchedulingComponent, // Asegúrate de que esta línea esté presente
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './auxiliary-books-historial.component.html',
  styleUrls: ['./auxiliary-books-historial.component.css'],
})
export class AuxiliaryBooksHistorialComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  history: AuxiliaryBookHistory[] = [];

  // Control del modal de programación
  displaySchedulingModal = false;
  selectedHistoryItem: AuxiliaryBookHistory | null = null;

  // Paginación
  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'generationDate';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchValue = '';

  constructor(
    private auxiliaryBookService: AuxiliaryBooksServiceService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Se llama a loadHistory() para cargar los datos iniciales.
    this.loadHistory();
  }

  loadHistory(event?: any): void {
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

    // Simulación de llamada a servicio
    // Reemplazar con: this.auxiliaryBookService.getHistory(...)
    setTimeout(() => {
      const mockData: AuxiliaryBookHistory[] = [
        {
          id: 1,
          bookName: 'Libro Diario',
          generationDate: new Date(),
          user: 'admin@contapp.com',
          status: 'Completado',
        },
        {
          id: 2,
          bookName: 'Libro Mayor',
          generationDate: new Date(Date.now() - 3600000),
          user: 'auditor@contapp.com',
          status: 'Generando',
        },
        {
          id: 3,
          bookName: 'Libro de Inventarios y Balances',
          generationDate: new Date(Date.now() - 86400000),
          user: 'admin@contapp.com',
          status: 'Error',
        },
      ];

      this.history = mockData;
      this.totalRecords = mockData.length;
    }, 1000);
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

  confirmDelete(item: AuxiliaryBookHistory): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar el registro del libro "${item.bookName}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Lógica para eliminar el registro
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'El registro ha sido eliminado.',
        });
        // Volver a cargar la tabla
        this.loadHistory();
      },
    });
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
