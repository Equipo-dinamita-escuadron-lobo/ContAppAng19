import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

import { Product, ProductList } from '../../Models/Product';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { TooltipModule } from 'primeng/tooltip';

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
    DialogModule,
    TagModule,
    InputIcon,
    IconField,
    TooltipModule,
    ToggleSwitchModule,
    FormsModule
],
  providers: [MessageService],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  products: ProductList[] = [];

  isDetailsDialogVisible = false;
  selectedProduct: ProductList | null = null


  ref: DynamicDialogRef | undefined; // Para manejar la referencia del modal de detalles

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly localstorageMethods: LocalStorageMethods,
    private readonly messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getProducts();
  }

  getProducts(): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.productService.getProducts(enterpriseId).subscribe({
      next: (data: ProductList[]) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
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
    this.productService.deleteProduct(productId, enterpriseId).subscribe({
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

  // --- MÉTODOS DE FORMATO (puedes moverlos a un pipe si lo prefieres) ---
  formatCost(cost: number): string {
    if (cost === null || cost === undefined) return '$ 0';
    return cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  getStateSeverity(state: boolean): 'success' | 'danger' {
    return state ? 'success' : 'danger';
  }

  formatState(state: boolean): string {
    return state ? 'Activo' : 'Inactivo';
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