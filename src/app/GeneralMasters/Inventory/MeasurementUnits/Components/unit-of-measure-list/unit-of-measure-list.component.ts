import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

// --- Servicios y Modelos ---
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { UnitOfMeasure } from '../../Models/UnitOfMeasure';
import { UnitOfMeasureService } from '../../Services/unit-of-measure.service';
import { environment } from '../../../../../../environments/environment';

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
    ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './unit-of-measure-list.component.html',
  styleUrls: ['./unit-of-measure-list.component.css']
})
export class UnitOfMeasureListComponent implements OnInit {
  unitOfMeasures: UnitOfMeasure[] = [];
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';

  constructor(
    private unitOfMeasureService: UnitOfMeasureService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (this.entData) {
      this.loadUnitsLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
    } else {
      console.error('No se pudo obtener el ID de la empresa');
    }
  }

  private getEnterpriseId(): string {
    return this.entData || '';
  }

  loadUnitsLazy(event: any): void {
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
    
    this.unitOfMeasureService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.unitOfMeasures = page.content || [];
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error: any) => {
        console.error('Error al obtener las unidades de medida:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las unidades de medida.'
        });
      }
    });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.unitOfMeasureService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        this.unitOfMeasures = page.content || [];
        this.totalRecords = page?.totalElements || 0;
      }
    });
  }

  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
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

  // Método para eliminar unidad
  deleteUnit(unitId: number): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar "${this.unitOfMeasures.find(u => u.id === unitId)?.name || 'seleccionada'}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteUnit(unitId, enterpriseId)
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
        console.error('Error al cambiar el estado de la unidad de medida:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la unidad de medida'
        });
      }
    });
  }

  private confirmDeleteUnit(unitId: number, enterpriseId: string): void {
    this.unitOfMeasureService.deleteUnitOfMeasureId(unitId.toString(), enterpriseId).subscribe({
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
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la unidad de medida.'
        });
      }
    });
  }

  // Métodos para manejar el estado
  getStateSeverity(state: boolean): 'success' | 'danger' {
    return state ? 'success' : 'danger';
  }

  formatState(state: boolean): string {
    return state ? 'Activo' : 'Inactivo';
  }

  isActive(state: boolean): boolean {
    return state;
  }

}
