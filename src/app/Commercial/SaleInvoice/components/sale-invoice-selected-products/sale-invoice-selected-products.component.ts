import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de PrimeNG para el nuevo template
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

// Importaciones para el diálogo dinámico de PrimeNG
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProductService } from '../../../BusinessMasters/Products/Services/product.service';
import { Product } from '../../../BusinessMasters/Products/Models/Product';

// Tus modelos y servicios (asegúrate que las rutas sean correctas)

// Interfaz local para manejar el estado de selección
interface SelectableProduct extends Product {
  selected?: boolean;
}

@Component({
  selector: 'app-sale-invoice-selected-products',
  standalone: true, // ¡CLAVE! Hacerlo standalone
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule
  ],
  templateUrl: './sale-invoice-selected-products.component.html',
  styleUrls: ['./sale-invoice-selected-products.component.css']
})
export class SaleInvoiceSelectedProductsComponent implements OnInit {

  allProducts: SelectableProduct[] = []; // Lista completa de productos del servicio
  filteredProducts: SelectableProduct[] = []; // Lista para mostrar en la tabla, después de filtrar
  selectedProductsMap: Map<string, SelectableProduct> = new Map(); // Mapa para manejar selecciones eficientemente

  filterText: string = ''; // Para el input de búsqueda
  entId: string = 'bf4d475f-5d02-4551-b7f0-49a5c426ac0d'; // ID de la empresa recibido

  constructor(
    private productService: ProductService,
    public ref: DynamicDialogRef, // <-- REEMPLAZA a MatDialogRef
    public config: DynamicDialogConfig // <-- REEMPLAZA a MAT_DIALOG_DATA
  ) {
    // Obtenemos los datos pasados al diálogo
    this.entId = this.config.data.entId;
    const previouslySelectedProducts: Product[] = this.config.data.products || [];

    // Pre-populamos el mapa con los productos que ya estaban seleccionados
    previouslySelectedProducts.forEach(p => {
      this.selectedProductsMap.set(p.id, { ...p, selected: true });
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  /**
   * Carga los productos desde el servicio y los marca si ya estaban seleccionados.
   */
  loadProducts(): void {
    if (!this.entId) return;

    this.productService.getProducts(this.entId).subscribe({
      next: (data: Product[]) => {
        this.allProducts = data.map(product => ({
          ...product,
          // Un producto está seleccionado si su ID existe en nuestro mapa de selección
          selected: this.selectedProductsMap.has(product.id)
        }));
        // Inicialmente, la lista filtrada es la lista completa
        this.filteredProducts = [...this.allProducts];
      },
      error: (err) => console.error('Error al obtener los productos:', err)
    });
  }

  /**
   * Filtra los productos de la tabla basándose en el texto de búsqueda.
   */
  onFilter(): void {
    if (!this.filterText) {
      this.filteredProducts = [...this.allProducts];
    } else {
      const lowerCaseFilter = this.filterText.toLowerCase();
      this.filteredProducts = this.allProducts.filter(p =>
        p.code?.toLowerCase().includes(lowerCaseFilter) ||
        p.itemType?.toLowerCase().includes(lowerCaseFilter) ||
        p.description?.toLowerCase().includes(lowerCaseFilter)
      );
    }
  }

  /**
   * Actualiza el mapa de selección cuando se marca/desmarca un checkbox.
   * @param product El producto cuya selección cambió.
   * @param isSelected El nuevo estado del checkbox.
   */
  onSelectionChange(product: SelectableProduct, isSelected: boolean): void {
    if (isSelected) {
      this.selectedProductsMap.set(product.id, product);
    } else {
      this.selectedProductsMap.delete(product.id);
    }
    // Actualizamos el estado 'selected' en la lista principal por si el usuario borra el filtro
    const productInAllList = this.allProducts.find(p => p.id === product.id);
    if (productInAllList) productInAllList.selected = isSelected;
  }

  /**
   * Cierra el diálogo y devuelve los productos seleccionados.
   */
  confirmSelection(): void {
    // Convertimos el mapa de vuelta a un array y lo pasamos al componente padre.
    const selectionAsArray = Array.from(this.selectedProductsMap.values());
    this.ref.close(selectionAsArray);
  }
}