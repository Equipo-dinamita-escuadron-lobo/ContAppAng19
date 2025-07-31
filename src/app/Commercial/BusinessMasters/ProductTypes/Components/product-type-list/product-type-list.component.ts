import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

import { ProductType } from '../../Models/ProductType';
import { ProductTypeService } from '../../Services/product-type.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-product-type-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    InputIcon,
    IconField
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
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.loadProductTypes();
  }

  loadProductTypes(): void {
    this.loading = true;
    this.productTypeService.getProductTypes(this.entData.id).subscribe({
      next: (data: ProductType[]) => {
        this.productTypes = data;
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
    this.router.navigate([`/commercial/business-masters/product-types/edit/${id}`]);
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
}
