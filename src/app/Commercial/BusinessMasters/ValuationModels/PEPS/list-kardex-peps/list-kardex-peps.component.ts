import { ProductService } from '../services/product.service';
import { KardexPepsService } from './../services/kardex-peps.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { KardexRow } from '../models/KardexRow';
import { ProductResponse } from '../models/ProductResponse';
import { KardexRecordsDTOResponse } from '../models/KardexResponse';
import { ResponseDto } from '../../models/ResponseDto';
import { CurrencyPipe } from '@angular/common';


interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-list-kardex-peps',
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    AutoCompleteModule,
    FormsModule,
    DatePickerModule,
    InputIconModule,
     CurrencyPipe
  ],
  templateUrl: './list-kardex-peps.component.html',
  styleUrl: './list-kardex-peps.component.css'
})
export class ListKardexPepsComponent {

  constructor(private kardexPepsService:KardexPepsService,
              private productService:ProductService
  ){}

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  kardexList: KardexRow[] = [];
  productId: number = 0;
  totalRecords = 0;
  first = 0;
  loading = false;

  allProducts: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  selectedProduct: ProductResponse | undefined;

  startDate: Date | null = null;
  endDate: Date | null = null;

  onStartDateChange() {
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
      this.endDate = null;
    }

    if (this.startDate && this.endDate && this.productId !== 0) {
      this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
    }
  }
  onEndDateChange() {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.startDate = null;
    }
    if (this.startDate && this.endDate && this.productId !== 0) {
      this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
    }
  }

  filterProducts(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    
    if (!this.allProducts || this.allProducts.length === 0) {
      console.log('No hay productos disponibles para filtrar');
      this.filteredProducts = [];
      return;
    }
    
    this.filteredProducts = this.allProducts.filter(product => {
      return product.name.toLowerCase().includes(query) ||
            product.reference.toLowerCase().includes(query);
    });
    
    console.log('Productos filtrados:', this.filteredProducts); // Para debug
  }

  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    
    if (!this.entData) {
      console.error('No se encontraron datos de empresa en localStorage');
      return;
    }
    
    console.log('Enterprise ID:', this.entData.id); // Para debug
    
    this.productService.getAllProducts().subscribe({
      next: (response: ResponseDto<ProductResponse[]>) => {
        console.log('Respuesta completa:', response);
        
        if (response && response.data) {
          this.allProducts = response.data;
          console.log('Productos cargados exitosamente:', this.allProducts.length);
        } else {
          console.warn('La respuesta no contiene datos de productos');
          this.allProducts = [];
        }
      },
      error: (error) => {
        console.error('Error detallado al cargar productos:', error);
        this.allProducts = [];
      }
    });
  }


onProductSelect(event: any) {
  // El valor seleccionado está en event.value
  this.selectedProduct = event.value;
  this.productId = event.value.id;
  console.log('Producto seleccionado:', this.selectedProduct);
  // Al seleccionar un producto se carga el kardex con la configuración actual de fechas
  if (this.startDate && this.endDate) {
    this.loadKardex({ first: 0, rows: 5 });
  }
}


  trackByIndex(index: number, item: any): number {
    return index;
  }

  loadKardex(event: any) {
    this.loading = true;

    if (this.productId === 0 || !this.startDate || !this.endDate) {
      this.kardexList = [];
      this.totalRecords = 0;
      this.loading = false;
      return;
    }

    const page = event.first / event.rows;
    const size = event.rows;
    this.first = event.first;
    const sort = event.sortField ? `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}` : 'date,asc';

    this.kardexPepsService.getKardexByProduc(this.productId, page, size, sort, this.startDate, this.endDate)
      .subscribe({
        next: (res) => {
          // --- CORRECCIÓN AQUÍ ---
          const pageData = res.data; // Objeto Page del backend
          
          if (pageData && pageData.content) {
            // Mapea el contenido de la página
            this.kardexList = pageData.content.map((item: KardexRecordsDTOResponse) => {
              const formattedDate = new Date(item.date).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric'
              }).replace(/ de /g, '-');
              return { ...item, formattedDate } as KardexRow;
            });

            // Asigna el total de elementos para la paginación
            this.totalRecords = pageData.totalElements;
          } else {
            this.kardexList = [];
            this.totalRecords = 0;
          }

          this.loading = false;
        },
        error: (err) => {
          console.error("Error al cargar el Kardex:", err);
          this.loading = false;
          this.kardexList = [];
          this.totalRecords = 0;
        }
      });
  }


}
