// C:/.../app/Commercial/BusinessMasters/Products/components/product-list/product-list.component.ts

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

import { Product } from '../../Models/Product';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TagModule } from 'primeng/tag';

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
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  products: Product[] = [];
  isLoading = true; // Variable para controlar el estado de carga de la tabla

  // --- VARIABLES PARA EL MODAL ---
  isDetailsDialogVisible = false;
  selectedProduct: Product | null = null

  // --- ANTES: No se necesita MatTableDataSource ni MatPaginator ---
  // dataSource = new MatTableDataSource<Product>(this.products);
  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  ref: DynamicDialogRef | undefined; // Para manejar la referencia del modal de detalles

  constructor(
    private productService: ProductService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    /*if (this.entData) {
      this.getProducts();
    }*/
    this.getProducts();
    console.log('Productos obtenidos:', this.products);
  }

  getProducts(): void {
    this.isLoading = true;
    this.productService.getProducts("ce1417a7-dd71-41f8-a2ec-91b2000fa30b").subscribe({
      next: (data: Product[]) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
        this.isLoading = false;
        //this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos.' });
      }
    });
  }

  // --- AHORA: El filtro se maneja en la plantilla directamente con una referencia de PrimeNG ---
  // No se necesita el método applyFilter(event: Event)

  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  // --- AHORA: Simplificado. El routing se hace con un botón dedicado ---
  redirectToEdit(productId: string): void {
    this.router.navigate(['/commercial/masters/products/edit/', productId]);
  }

  // --- AHORA: Usando ConfirmationService de PrimeNG ---
  /*deleteProduct(product: Product): void {
    this.confirmationService.confirm({
        target: event?.target as EventTarget,
        message: `¿Estás seguro de que deseas eliminar el producto "${product.description}"?`,
        header: 'Confirmación de Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        accept: () => {
            this.productService.deleteProduct(product.id).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Producto eliminado con éxito' });
                    this.getProducts(); // Recargar la lista
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el producto' });
                    console.error(err);
                }
            });
        }
    });
  }*/

  // --- MÉTODO PARA ABRIR EL MODAL ---
  openDetailsModal(product: Product): void {
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

  getStateSeverity(state: string): 'success' | 'danger' | 'info' | 'warning' {
    return state && state.toLowerCase() === 'activo' ? 'success' : 'danger';
  }

  
}