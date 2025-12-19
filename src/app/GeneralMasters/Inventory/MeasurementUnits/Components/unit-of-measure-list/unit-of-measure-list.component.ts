import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { UnitOfMeasure } from '../../Models/UnitOfMeasure';
import { UnitOfMeasureService } from '../../Services/unit-of-measure.service';
import { TableEmptyMessageComponent } from '../../../../../Shared/Components/table-empty-message/table-empty-message.component';

@Component({
  selector: 'app-unit-of-measure-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DialogModule,
    TagModule,
    InputIcon,
    IconField,
    ReactiveFormsModule,
    TooltipModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
    TableEmptyMessageComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './unit-of-measure-list.component.html',
  styleUrls: ['./unit-of-measure-list.component.css']
})
export class UnitOfMeasureListComponent implements OnInit {
  unitOfMeasures: UnitOfMeasure[] = [];
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  loading: boolean = false;

  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  first: number = 0;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';

  constructor(
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (this.entData) {
      this.loadUnitsLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
    }
  }

  private getEnterpriseId(): string {
    return this.entData || '';
  }

  loadUnitsLazy(event: any): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;
    this.first = event.first;
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;
    
    // Manejar ordenamiento si está presente
    if (event.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }
    
    this.unitOfMeasureService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.unitOfMeasures = page.content || [];
        this.totalRecords = page.page?.totalElements || 0;
        this.loading = false;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las unidades de medida.'
        });
        this.loading = false;
      }
    });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;
    this.unitOfMeasureService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.unitOfMeasures = page.content || [];
        this.totalRecords = page.page?.totalElements || 0;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
    this.first = 0;
    this.currentPage = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadUnitsLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
  }



  // Método para redirigir a editar
  redirectToEdit(unitId: number): void {
    this.router.navigate(['/gen-masters/inventory/measurement-units/edit/', unitId]);
  }

  // Método para redirigir a crear nueva unidad
  redirectToCreate(): void {
    this.router.navigate(['/gen-masters/inventory/measurement-units/create']);
  }

  // Método para volver al menú de inventory
  goBack(): void {
    this.router.navigate(['/gen-masters/inventory']);
  }

  // Método para eliminar unidad
  deleteUnit(unitId: number): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar la unidad de medida "${this.unitOfMeasures.find(u => u.id === unitId)?.name || 'seleccionada'}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteUnit(this.unitOfMeasures.find(u => u.id === unitId)!, enterpriseId)
    });
  }

  // Método para cambiar el estado de la unidad de medida
  changeUnitState(unit: UnitOfMeasure): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    const newState = unit.state;
    const previousState = !newState;
    
    this.unitOfMeasureService.unitOfMeasureChangeState(unit.id.toString(), enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de la unidad de medida "${unit.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        // Revertir el cambio si hay error
        unit.state = previousState;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la unidad de medida'
        });
      }
    });
  }

  private confirmDeleteUnit(unit: UnitOfMeasure, enterpriseId: string): void {
    this.unitOfMeasureService.deleteUnitOfMeasureId(unit.id.toString(), enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Unidad de medida eliminada correctamente.'
        });
        this.reloadCurrentPage();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Información',
          detail: `No se puede eliminar la unidad "${unit.name}" porque está siendo utilizada por uno o más productos.`
        });
      }
    });
  }

}
