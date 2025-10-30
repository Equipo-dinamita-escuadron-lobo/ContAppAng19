import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';
import { DocumentClass } from '../../models/ClassesOfDocuments';
import { DocumentTypesPresentationService } from '../../services/document-types-presentation.service';

@Component({
  selector: 'app-classes-of-documents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './classes-of-documents-list.component.html',
  styleUrl: './classes-of-documents-list.component.css'
})
export class ClassesOfDocumentsListComponent implements OnInit {
  list: DocumentClass[] = [];
  filtered: DocumentClass[] = [];
  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';
  searchTimeout: any;

  constructor(
    private readonly service: ClassesOfDocumentsServiceService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    public readonly documentTypesPresentationService: DocumentTypesPresentationService
  ) {}
  ngOnInit(): void {
    // Cargar datos iniciales
    this.loadInitialData();
  }

  private loadInitialData(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.service.findAll(enterpriseId, 0, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.list = page?.content || [];
        this.totalRecords = page?.page?.totalElements || page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las clases de documentos. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  private getEnterpriseId(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      try { return JSON.parse(entData).id; } catch {}
    }
    return '';
  }

  loadClassesLazy(event: any): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    // Calcular página y tamaño desde los controles de PrimeNG
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;
    
    // Manejar ordenamiento si está presente
    if (event.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }
    
    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.list = page?.content || [];
        // El backend retorna la estructura: { content: [], page: { totalElements, totalPages, ... } }
        this.totalRecords = page?.page?.totalElements || page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al cargar clases de documentos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las clases de documentos. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.list = page?.content || [];
        // El backend retorna la estructura: { content: [], page: { totalElements, totalPages, ... } }
        this.totalRecords = page?.page?.totalElements || page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al recargar clases de documentos:', error);
      }
    });
  }

  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
    this.currentPage = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadInitialData();
  }

  goToTypes() {
    this.router.navigate(['/gen-masters/document-types/list']);
  }

  createClass() {
    this.router.navigate(['/gen-masters/document-types/classes/create']);
  }

  deleteClass(row: DocumentClass) {
    const enterpriseId = this.getEnterpriseId();
    if (!row?.id || !enterpriseId) return;
    this.confirmationService.confirm({
      message: `¿Desea eliminar la clase "${row.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => {
        this.service.delete(row.id, enterpriseId).subscribe({
          next: () => {
                    this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Clase de documento eliminada correctamente.'
        });
        this.reloadCurrentPage();
          },
          error: (error) => {
            console.error('Error al eliminar clase de documento:', error);
            
            // Verificar si es el error específico de clase en uso
            // Verificamos múltiples formas posibles en que puede venir el error
            const isClassInUseError = 
              error?.error?.errorCode === 'DOCUMENT_CLASS_IN_USE' ||
              error?.error?.message?.includes('está siendo utilizada') ||
              error?.error?.message?.includes('DOCUMENT_CLASS_IN_USE') ||
              (error?.status === 400 && error?.error?.message?.includes('tipo de documento'));
            
            if (isClassInUseError) {
              this.messageService.add({
                severity: 'info',
                summary: 'No se puede eliminar',
                detail: `No se puede eliminar la clase "${row.name}" porque está siendo utilizada por uno o más tipos de documentos activos.`,
                life: 6000
              });
            } else if (error?.error?.message) {
              // Mostrar mensaje específico del backend si está disponible
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error.message,
                life: 5000
              });
            } else {
              // Mensaje genérico para otros errores
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al eliminar la clase de documento. Inténtelo nuevamente.',
                life: 5000
              });
            }
          }
        });
      }
    });
  }

  editClass(row: DocumentClass) {
    if (!row?.id) return;
    this.router.navigate(['/gen-masters/document-types/classes/edit', row.id]);
  }

  // Método para cambiar el estado de la clase de documento
  changeClassState(documentClass: DocumentClass): void {
    const enterpriseId = this.getEnterpriseId();
    if (!documentClass?.id || !enterpriseId) return;

    const newStatus = !this.documentTypesPresentationService.isActive(documentClass.status);
    
    this.service.changeState(documentClass.id, enterpriseId, newStatus).subscribe({
      next: () => {
        // Actualizar el estado localmente
        documentClass.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de la clase "${documentClass.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        console.error('Error al cambiar el estado de la clase de documento:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la clase de documento'
        });
      }
    });
  }
}
