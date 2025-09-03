import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { DocumentTypesServiceService } from '../../services/document-types-service.service';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';
import { DocumentType, DocumentTypeList } from '../../models/DocumentTypes';
import { DocumentClass } from '../../models/ClassesOfDocuments';

@Component({
  selector: 'app-document-types-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    TagModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './document-types-list.component.html',
  styleUrl: './document-types-list.component.css'
})
export class DocumentTypesListComponent {
  list: DocumentTypeList[] = [];
  filtered: DocumentTypeList[] = [];
  classIdToName = new Map<number, string>();
  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';

  constructor(
    private service: DocumentTypesServiceService,
    private classesService: ClassesOfDocumentsServiceService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadClassNames(); // Cargar nombres de clases para mapeo
  }

  private getEnterpriseId(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      try { return JSON.parse(entData).id; } catch {}
    }
    return '';
  }

  private loadClassNames(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;
    
    // Cargar todas las clases para mapeo de nombres (usar un size alto pero controlado)
    this.classesService.findAll(enterpriseId, 0, 500).subscribe({
      next: (page: any) => {
        const content: DocumentClass[] = page?.content || page || [];
        content.forEach(c => this.classIdToName.set(c.id, c.name));
        this.loadTypesLazy({ first: this.currentPage * this.currentSize, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 }); // Cargar tipos de documentos después de cargar las clases
      },
      error: (error) => {
        console.error('Error al cargar nombres de clases:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las clases de documentos. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  loadTypesLazy(event: any): void {
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
    
    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder).subscribe({
      next: (page) => {
        const content: DocumentType[] = page.content || [];
        this.list = content.map(dt => ({
          ...dt,
          className: this.getClassName(dt.documentClassId)
        }));
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documentos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los tipos de documentos. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder).subscribe({
      next: (page) => {
        const content: DocumentType[] = page.content || [];
        this.list = content.map(dt => ({
          ...dt,
          className: this.getClassName(dt.documentClassId)
        }));
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al recargar tipos de documentos:', error);
      }
    });
  }

  getClassName(classId?: number): string {
    if (classId == null) return '';
    return this.classIdToName.get(classId) || '';
  }

  filterGlobal(event: Event, table: any) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  createType() {
    this.router.navigate(['/gen-masters/document-types/create']);
  }

  goToClasses() {
    this.router.navigate(['/gen-masters/document-types/classes/list']);
  }

  editType(row: DocumentType) {
    if (!row?.id) return;
    this.router.navigate(['/gen-masters/document-types/edit', row.id]);
  }

  deleteType(row: DocumentType) {
    if (!row?.id) return;
    
    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar el tipo de documento "${row.name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteType(row)
    });
  }

  changeTypeState(documentType: DocumentType) {
    const enterpriseId = this.getEnterpriseId();
    if (!documentType?.id || !enterpriseId) return;

    const newStatus = !documentType.status;
    
    this.service.changeState(documentType.id, enterpriseId, newStatus).subscribe({
      next: () => {
        documentType.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del tipo de documento "${documentType.name}" cambiado correctamente`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del tipo de documento.'
        });
      }
    });
  }

  getStateSeverity(status: boolean): string {
    return status ? 'success' : 'danger';
  }

  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  isActive(status: boolean): boolean {
    return status === true;
  }

  private confirmDeleteType(row: DocumentType): void {
    const enterpriseId = this.getEnterpriseId();
    if (!row?.id || !enterpriseId) return;
    
    this.service.delete(row.id, enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Tipo de documento eliminado correctamente.'
        });
        this.reloadCurrentPage();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el tipo de documento.'
        });
      }
    });
  }
}
