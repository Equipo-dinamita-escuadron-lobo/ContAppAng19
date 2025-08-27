import { Component } from '@angular/core';
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
export class ClassesOfDocumentsListComponent {
  list: DocumentClass[] = [];
  filtered: DocumentClass[] = [];

  constructor(
    private service: ClassesOfDocumentsServiceService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private getEnterpriseId(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      try { return JSON.parse(entData).id; } catch {}
    }
    return '';
  }

  private loadData(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;
    
    this.service.findAll(enterpriseId).subscribe({
      next: (page: any) => {
        const content: DocumentClass[] = page?.content || page || [];
        this.list = content;
        this.filtered = this.list;
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

  filterGlobal(event: Event, table: any) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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
            this.loadData();
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

    const newStatus = !this.isActive(documentClass.status);
    
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

  // Métodos para manejar el estado
  getStateSeverity(status: boolean): 'success' | 'danger' {
    return status ? 'success' : 'danger';
  }

  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  isActive(status: boolean): boolean {
    return status === true;
  }
}
