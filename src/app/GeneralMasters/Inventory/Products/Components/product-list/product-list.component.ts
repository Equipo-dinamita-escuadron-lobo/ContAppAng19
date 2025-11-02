import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

import { Product, ProductList, Page } from '../../Models/Product';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { TooltipModule } from 'primeng/tooltip';
import { CurrencyFormatPipe } from '../../Pipes/currency-format.pipe';
import { ProductsTemplateComponent } from '../products-template/products-template.component';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TagModule,
    InputIcon,
    IconField,
    TooltipModule,
    ToggleSwitchModule,
    FormsModule,
    CurrencyFormatPipe,
    ProductsTemplateComponent,
    RadioButtonModule
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: Record<string, any> | null = null;
  productsPage: Page<ProductList> = {
    content: [],
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0
    }
  };
  products: ProductList[] = []; 

  // Propiedades para paginación y búsqueda
  currentPage = 0;
  pageSize = 10;
  first = 0;
  sortField = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';

  isDetailsDialogVisible = false;
  selectedProduct: ProductList | null = null;
  showDetailView = false;
  showTemplateModal = false;

  // Estado de exportación
  isExporting = false;

  /**
   * Propiedades para el modal de exportación
   */
  exportStatusFilter: string | null = null;
  exportDialogMessage = '¿Qué tipo de productos desea exportar?';
  exportStatusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
  ];

  ref: DynamicDialogRef | undefined; // Para manejar la referencia del modal de detalles

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly localstorageMethods: LocalStorageMethods,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getProducts();
  }

  getProducts(): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.productService.getProducts(
      enterpriseId,
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortOrder,
      this.searchTerm || undefined
    ).subscribe({
      next: (data: Page<ProductList>) => {
        this.productsPage = data;
        this.products = data.content;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
  }

  // Método para manejar cambios de página
  onPageChange(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
    this.currentPage = Math.floor(this.first / this.pageSize);
    this.getProducts();
  }

  // Método para manejar búsqueda
  onSearchChange(): void {
    this.first = 0; 
    this.currentPage = 0; 
    this.getProducts();
  }

  // Método para manejar ordenamiento
  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.getProducts();
  }

  // Método para limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 0;
    this.getProducts();
  }

  // Método para alternar entre vista detallada y resumida
  toggleDetailView(): void {
    this.showDetailView = !this.showDetailView;
  }

  // Método para volver al menú de inventory
  goBack(): void {
    this.router.navigate(['/gen-masters/inventory']);
  }

  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  redirectToEdit(productId: number): void {
    this.router.navigate(['/gen-masters/inventory/products/edit/', productId.toString()]);
  }


  deleteProduct(productId: number): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar el producto "${product.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteProduct(product, enterpriseId)
    });
  }


  private confirmDeleteProduct(product: ProductList, enterpriseId: string): void {
    this.productService.deleteProduct(product.id, enterpriseId).subscribe({
      next: (data: Product) => {
        this.getProducts();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El producto se ha eliminado correctamente.'
        });
      },
      error: (error: any) => {
        console.error('Error al eliminar el producto: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ha ocurrido un error al intentar eliminar el producto.'
        });
      }
    });
  }


  openDetailsModal(product: ProductList): void {
    this.selectedProduct = product;
    this.isDetailsDialogVisible = true;
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
  }

  changeProductState(product: ProductList): void {
    const newState = product.state;
    const previousState = !newState; // El estado anterior es el opuesto al actual
    
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.productService.changeProductState(product.id, enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del producto "${product.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        product.state = previousState;
        console.error('Error al cambiar el estado del producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del producto'
        });
      }
    });
  }

  /**
   * Muestra el modal de confirmación para exportar productos
   */
  showExportConfirmDialog() {
    this.exportStatusFilter = null; // "Todos" por defecto
    
    this.confirmationService.confirm({
      key: 'exportDialog',
      header: 'Exportar',
      acceptLabel: 'Exportar',
      acceptIcon: 'pi pi-download',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        const status = this.exportStatusFilter === 'active' ? true : this.exportStatusFilter === 'inactive' ? false : undefined;
        this.exportProducts(status);
      }
    });
  }

  /**
   * Exporta productos a formato Excel.
   */
  exportProducts(status: boolean | undefined): void {
    const entData = this.localStorageMethods.loadEnterpriseData();
    const entId = entData?.id || this.localstorageMethods.getIdEnterprise();
    const companyName = entData?.name || '';

    this.isExporting = true; // Activar estado de carga

    this.productService.exportProducts(entId, companyName, status).subscribe({
      next: (response) => {
        this.isExporting = false; // Desactivar estado de carga
        if (!response.body) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Exportación',
            detail: 'No se recibió el archivo del servidor'
          });
          return;
        }

        this.downloadFile(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Exportación Exitosa',
          detail: `Se ha exportado el catálogo de productos correctamente`
        });
      },
      error: (error) => {
        this.isExporting = false; // Desactivar estado de carga en caso de error
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo exportar los productos.';

              // Verificar si es un mensaje informativo sobre productos no disponibles
              const isNoProductsMessage = this.isNoProductsAvailableMessage(errorMessage);

              if (isNoProductsMessage) {
                // Mostrar como información en lugar de error
                this.messageService.add({
                  severity: 'info',
                  summary: 'Información',
                  detail: this.getNoProductsMessage(status)
                });
              } else {
                // Mostrar como error para otros casos
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error de Exportación',
                  detail: errorMessage
                });
              }
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: 'Ocurrió un error inesperado.'
              });
            }
          };
          reader.onerror = () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: 'No se pudo leer el mensaje de error.'
            });
          };
          reader.readAsText(error.error);
        } else {
          const errorMessage = error.error?.message || error.message || 'Error desconocido al exportar productos';

          // Verificar si es un mensaje informativo sobre productos no disponibles
          const isNoProductsMessage = this.isNoProductsAvailableMessage(errorMessage);

          if (isNoProductsMessage) {
            // Mostrar como información en lugar de error
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: this.getNoProductsMessage(status)
            });
          } else {
            // Mostrar como error para otros casos
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: errorMessage
            });
          }
        }
      }
    });
  }

  /**
   * Verifica si el mensaje de error indica que no hay productos disponibles para exportar.
   */
  private isNoProductsAvailableMessage(message: string): boolean {
    const noProductsPatterns = [
      'no hay productos',
      'no existen productos',
      'no se encontraron productos',
      'no hay registros',
      'empty',
      'sin productos'
    ];

    return noProductsPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Retorna el mensaje informativo apropiado según el filtro de estado aplicado.
   */
  private getNoProductsMessage(status: boolean | undefined): string {
    switch (status) {
      case true:
        return 'No hay productos activos para exportar';
      case false:
        return 'No hay productos inactivos para exportar';
      case undefined:
      default:
        return 'No hay productos para exportar';
    }
  }

  /**
   * Procesa la respuesta HTTP para descargar el archivo.
   */
  private downloadFile(response: any): void {
    const blob = response.body;
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'productos.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

}