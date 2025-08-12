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

import { ProductType } from '../../Models/ProductType';
import { ProductTypeService } from '../../Services/product-type.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { environment } from '../../../../../../environments/environment';

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
    ToggleSwitchModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-type-list.component.html',
})
export class ProductTypeListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  productTypes: ProductType[] = [];
  loading: boolean = false;

  constructor(
    private productTypeService: ProductTypeService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.loadProductTypes();
  }

  loadProductTypes(): void {
    this.loading = true;
    
    this.productTypeService.getProductTypes(this.entData).subscribe({
      next: (data: ProductType[]) => {
        // Asignar estado por defecto si no viene del backend
        this.productTypes = data.map(productType => ({
          ...productType,
          state: productType.state !== undefined ? productType.state : true
        }));
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar los tipos de producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los tipos de producto.'
        });
        this.loading = false;
      }
    });
  }

  redirectTo(route: string): void {
    this.router.navigate([route]);
  }

  redirectToEdit(id: number): void {
    this.router.navigate([`/gen-masters/inventory/product-types/edit/${id}`]);
  }

  deleteProductType(id: number): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este tipo de producto?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.productTypeService.deleteProductType(id.toString()).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tipo de producto eliminado correctamente'
            });
            this.loadProductTypes();
          },
          error: (error: any) => {
            console.error('Error al eliminar el tipo de producto:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el tipo de producto'
            });
          }
        });
      }
    });
  }

  // Método para cambiar el estado del tipo de producto
  changeProductTypeState(productType: ProductType): void {
    this.productTypeService.changeProductTypeState(productType.id).subscribe({
      next: () => {
        // El estado ya se actualiza automáticamente por el ngModel
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del tipo de producto "${productType.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        // Revertir el cambio si hay error
        productType.state = !productType.state;
        console.error('Error al cambiar el estado del tipo de producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del tipo de producto'
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
}
