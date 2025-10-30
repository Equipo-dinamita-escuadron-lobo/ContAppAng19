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

@Component({
  selector: 'app-product-list',
  standalone: true,
  // --- AHORA: Importa todos los módulos necesarios aquí ---
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
    CurrencyFormatPipe
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
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true
  };
  products: ProductList[] = []; // Mantener para compatibilidad con la plantilla

  // Propiedades para paginación y búsqueda
  currentPage = 0;
  pageSize = 10;
  sortField = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';

  isDetailsDialogVisible = false;
  selectedProduct: ProductList | null = null;

  // Control de vista completa/resumida
  showDetailView = false;


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
        this.products = data.content; // Mantener para compatibilidad con la plantilla
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
  }

  // Método para manejar cambios de página
  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.getProducts();
  }

  // Método para manejar búsqueda
  onSearchChange(): void {
    this.currentPage = 0; // Resetear a la primera página al buscar
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

  // --- AHORA: El filtro se maneja en la plantilla directamente con una referencia de PrimeNG ---
  // No se necesita el método applyFilter(event: Event)

  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  redirectToEdit(productId: number): void {
    this.router.navigate(['/gen-masters/inventory/products/edit/', productId.toString()]);
  }

  // --- MÉTODO PARA ELIMINAR UN PRODUCTO ---
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

  // Método privado para confirmar la eliminación del producto
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

  // --- MÉTODO PARA ABRIR EL MODAL ---
  openDetailsModal(product: ProductList): void {
    this.selectedProduct = product;
    this.isDetailsDialogVisible = true;
  }

  // Método para cambiar el estado del producto
  changeProductState(product: ProductList): void {
    // Guardar el estado actual
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
        // Revertir el cambio si hay error
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

}