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
import { HelpCenterServiceService } from '../../services/help-center-service.service';
import { DocumentTypesServiceService } from '../../../DocumentTypes/services/document-types-service.service';
import { HelpCenter, HelpCenterList } from '../../models/HelpCenter';
import { DocumentModule } from '../../../DocumentTypes/models/DocumentModule';

@Component({
  selector: 'app-help-center-list',
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
  templateUrl: './help-center-list.component.html',
  styleUrl: './help-center-list.component.css'
})
export class HelpCenterListComponent {
  list: HelpCenterList[] = [];
  moduleIdToName = new Map<number, string>();
  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';

  constructor(
    private service: HelpCenterServiceService,
    private modulesService: DocumentTypesServiceService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadModuleNames();
  }

  private loadModuleNames(): void {
    this.modulesService.getAllModules().subscribe({
      next: (modules) => {
        modules.forEach(m => this.moduleIdToName.set(m.id, m.name));
        this.loadHelpCentersLazy({ first: this.currentPage * this.currentSize, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
      },
      error: (error) => {
        console.error('Error al cargar nombres de módulos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los módulos. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  loadHelpCentersLazy(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;

    if (event.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    this.service.findAll(this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        const content: HelpCenter[] = page.content || [];
        this.list = content.map(hc => ({
          ...hc,
          moduleName: this.getModuleName(hc.moduleId)
        }));
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al cargar centros de ayuda:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los centros de ayuda. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  reloadCurrentPage(): void {
    this.service.findAll(this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        const content: HelpCenter[] = page.content || [];
        this.list = content.map(hc => ({
          ...hc,
          moduleName: this.getModuleName(hc.moduleId)
        }));
        this.totalRecords = page?.totalElements || 0;
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.loadHelpCentersLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
  }

  getModuleName(moduleId?: number): string {
    if (moduleId == null) return '';
    return this.moduleIdToName.get(moduleId) || '';
  }

  createHelpCenter() {
    this.router.navigate(['/gen-masters/help-center/create']);
  }

  editHelpCenter(row: HelpCenter) {
    if (!row?.id) return;
    this.router.navigate(['/gen-masters/help-center/edit', row.id]);
  }

  deleteHelpCenter(row: HelpCenter) {
    if (!row?.id) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar el centro de ayuda "${row.name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteHelpCenter(row)
    });
  }

  changeHelpCenterState(helpCenter: HelpCenter) {
    if (!helpCenter?.id) return;

    const newStatus = !helpCenter.status;

    this.service.changeState(helpCenter.id, newStatus).subscribe({
      next: () => {
        helpCenter.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del centro de ayuda "${helpCenter.name}" cambiado correctamente`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del centro de ayuda.'
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

  private confirmDeleteHelpCenter(row: HelpCenter): void {
    if (!row?.id) return;

    this.service.delete(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Centro de ayuda eliminado correctamente.'
        });
        this.reloadCurrentPage();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el centro de ayuda.'
        });
      }
    });
  }
}
