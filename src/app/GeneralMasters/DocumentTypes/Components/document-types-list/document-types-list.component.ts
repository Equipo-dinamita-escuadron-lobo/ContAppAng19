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
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './document-types-list.component.html',
  styleUrl: './document-types-list.component.css'
})
export class DocumentTypesListComponent {
  list: DocumentTypeList[] = [];
  filtered: DocumentTypeList[] = [];
  classIdToName = new Map<number, string>();

  constructor(
    private service: DocumentTypesServiceService,
    private classesService: ClassesOfDocumentsServiceService,
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
    
    this.classesService.findAll(enterpriseId).subscribe({
      next: (page: any) => {
        const content: DocumentClass[] = page?.content || page || [];
        content.forEach(c => this.classIdToName.set(c.id, c.name));
      },
      complete: () => {
        this.service.findAll(enterpriseId).subscribe({
          next: (page) => {
            const content: DocumentType[] = page.content || [];
            this.list = content.map(dt => ({
              ...dt,
              className: this.getClassName(dt.documentClassId)
            }));
            this.filtered = this.list;
          }
        });
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
      accept: () => this.confirmDeleteType(row)
    });
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
        this.loadData();
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
