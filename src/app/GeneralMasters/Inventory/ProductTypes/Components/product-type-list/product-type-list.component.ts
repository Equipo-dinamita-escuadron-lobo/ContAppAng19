import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableEmptyMessageComponent } from '../../../../../Shared/Components/table-empty-message/table-empty-message.component';

import { ProductType } from '../../Models/ProductType';
import { ProductTypeService } from '../../Services/product-type.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { AuthService } from '../../../../../Core/auth/services/auth.service';

@Component({
  selector: 'app-product-type-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    InputIcon,
    IconField,
    TagModule,
    ToggleSwitchModule,
    TableEmptyMessageComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-type-list.component.html',
})
export class ProductTypeListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: string | null = null;
  productTypes: ProductType[] = [];
  loading: boolean = false;

  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  first: number = 0;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';
  canToggleState = false;

  constructor(
    private readonly productTypeService: ProductTypeService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    const perms = this.authService.getCurrentUserPermissions();
    this.canToggleState = perms.includes('PT#CS');
    if (this.entData) {
      this.loadProductTypesLazy({
        first: 0,
        rows: this.currentSize,
        sortField: this.currentSortField,
        sortOrder: this.currentSortOrder === 'asc' ? 1 : -1,
      });
    }
  }

  private getEnterpriseId(): string {
    return this.entData || '';
  }

  loadProductTypesLazy(event: any): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;
    // Actualizar first y calcular página
    this.first = event.first;
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;

    // Manejar ordenamiento si está presente
    if (event.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    this.productTypeService
      .findAll(
        enterpriseId,
        this.currentPage,
        this.currentSize,
        this.currentSortField,
        this.currentSortOrder,
        this.searchTerm,
      )
      .subscribe({
        next: (page: any) => {
          this.productTypes = page.content || [];
          this.totalRecords = page.page?.totalElements || 0;
          this.loading = false;
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los tipos de producto.',
          });
          this.loading = false;
        },
      });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;
    this.productTypeService
      .findAll(
        enterpriseId,
        this.currentPage,
        this.currentSize,
        this.currentSortField,
        this.currentSortOrder,
        this.searchTerm,
      )
      .subscribe({
        next: (page: any) => {
          this.productTypes = page.content || [];
          this.totalRecords = page.page?.totalElements || 0;
          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;
        },
      });
  }

  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
    this.first = 0;
    this.currentPage = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadProductTypesLazy({
      first: 0,
      rows: this.currentSize,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder === 'asc' ? 1 : -1,
    });
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory']);
  }

  redirectToCreate(): void {
    this.router.navigate(['/gen-masters/inventory/product-types/create']);
  }

  redirectToEdit(id: number): void {
    this.router.navigate([`/gen-masters/inventory/product-types/edit/${id}`]);
  }

  deleteProductType(productType: ProductType): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;
    if (!this.authService.requireAnyPermission(['PT#D'])) return;

    this.confirmationService.confirm({
      message: `¿Desea eliminar el tipo de producto "${productType.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.productTypeService
          .deleteProductType(productType.id.toString(), enterpriseId)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Tipo de producto eliminado correctamente',
              });
              this.reloadCurrentPage();
            },
            error: (error: any) => {
              console.error('Error al eliminar el tipo de producto:', error);
              this.messageService.add({
                severity: 'info',
                summary: 'Información',
                detail: `No se puede eliminar el tipo "${productType.name}" porque está siendo utilizado por uno o más productos.`,
              });
            },
          });
      },
    });
  }

  // Método para cambiar el estado del tipo de producto
  changeProductTypeState(productType: ProductType): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    const newState = productType.state;
    const previousState = !newState;

    this.productTypeService
      .changeProductTypeState(productType.id, enterpriseId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Estado del tipo de producto "${productType.name}" cambiado correctamente`,
          });
        },
        error: (error: any) => {
          // Revertir el cambio si hay error
          productType.state = previousState;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cambiar el estado del tipo de producto',
          });
        },
      });
  }
}
