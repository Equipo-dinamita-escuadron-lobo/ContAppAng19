import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProductService } from '../../../BusinessMasters/Products/Services/product.service';
import { Product } from '../../../BusinessMasters/Products/Models/Product';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

interface SelectableProduct extends Product {
  selected?: boolean;
}

@Component({
  selector: 'app-sale-invoice-selected-products',
  standalone: true, 
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

  filterText: string = ''; 
  entId: string = '';

  constructor(
    private productService: ProductService,
    public ref: DynamicDialogRef, 
    public config: DynamicDialogConfig, 
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entId = this.localStorageMethods.getIdEnterprise();
    console.log('Enterprise ID:', this.entId);
    const previouslySelectedProducts: Product[] = this.config.data.products || [];

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
    const selectionAsArray = Array.from(this.selectedProductsMap.values());
    this.ref.close(selectionAsArray);
  }
}