// src/app/GeneralMasters/Inventory/Products/Components/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

// --- Servicios y Modelos (asegúrate de que las rutas sean correctas) ---

import { Product, ProductList } from '../../Models/Product';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { TooltipModule } from 'primeng/tooltip';
import Swal from 'sweetalert2';

// --- Componente de Detalles (debe ser standalone también) ---
// import { ProductDetailsComponent } from '../product-details/product-details.component';

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
    TooltipModule
],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  products: ProductList[] = [];

  // --- VARIABLES PARA EL MODAL ---
  isDetailsDialogVisible = false;
  selectedProduct: ProductList | null = null

  // --- ANTES: No se necesita MatTableDataSource ni MatPaginator ---
  // dataSource = new MatTableDataSource<Product>(this.products);
  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  ref: DynamicDialogRef | undefined; // Para manejar la referencia del modal de detalles

  constructor(
    private productService: ProductService,
    private router: Router,
    private localstorageMethods: LocalStorageMethods,

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
    // Utilizando SweetAlert para mostrar un cuadro de diálogo de confirmación
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar este producto?',
      icon: 'warning',
      confirmButtonColor: '#000066', // Color del botón de confirmación
      cancelButtonColor: '#9D0311', // Color del botón de cancelación
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      // Si el usuario confirma la eliminación
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe(
          (data: Product) => {
            this.getProducts();
            // Mostrar cuadro de diálogo de éxito
            Swal.fire({
              title: 'Eliminado con éxito',
              text: 'El producto se ha eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#000066',
              confirmButtonText: 'Aceptar'
            });
            //this.router.navigate(['/general/operations/products']);
          },
          (error) => {
            console.error('Error al eliminar el producto: ', error);
            // Mostrar cuadro de diálogo de error
            Swal.fire({
              title: 'Error al eliminar',
              text: 'Ha ocurrido un error al intentar eliminar el producto.',
              icon: 'error',
              confirmButtonColor: '#000066',
              confirmButtonText: 'Aceptar'
            });
          }
        );
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

}