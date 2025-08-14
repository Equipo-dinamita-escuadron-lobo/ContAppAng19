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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';
import { DocumentClass } from '../../models/ClassesOfDocuments';

@Component({
  selector: 'app-classes-of-documents-list',
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
  templateUrl: './classes-of-documents-list.component.html',
  styleUrl: './classes-of-documents-list.component.css'
})
export class ClassesOfDocumentsListComponent {
  loading = false;
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
    this.loading = true;
    this.service.findAll(enterpriseId).subscribe({
      next: (page: any) => {
        const content: DocumentClass[] = page?.content || page || [];
        this.list = content;
        this.filtered = this.list;
      },
      complete: () => this.loading = false,
      error: () => this.loading = false
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
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.service.delete(row.id, enterpriseId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Clase eliminada.' });
            this.loadData();
          }
        });
      }
    });
  }

  editClass(row: DocumentClass) {
    if (!row?.id) return;
    this.router.navigate(['/gen-masters/document-types/classes/edit', row.id]);
  }
}
