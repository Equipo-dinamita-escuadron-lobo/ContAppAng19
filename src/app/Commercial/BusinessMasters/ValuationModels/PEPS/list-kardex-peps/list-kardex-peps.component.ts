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
    InputIconModule
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

  filterProducts(event:AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredProducts = this.allProducts.filter(product => {
      return product.name.toLowerCase().includes(query);
    });
  }
  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.productService.getAllProducts().subscribe((response: any) => {
      this.allProducts = response.data;
    });
  }
  onProductSelect(product: ProductResponse) {
    this.selectedProduct = product;
    this.productId = product.idProduct;
    console.log('Producto seleccionado:', this.selectedProduct);
    // Al seleccionar un producto se carga el kardex con la configuración actual de fechas
    this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  loadKardex(event: any) {
    this.loading = true;

    if(this.productId === 0) {
      this.kardexList = [];
      this.totalRecords = 0;
      this.loading = false;
      return;
    }

    const page = event.first / event.rows;
    const size = event.rows;
    this.first = event.first;
    const sort = event.sortField ? `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}` : '';
    
    //Solo enviar fechas si ambas estan seleccionadas, de lo contrario enviar null
    const startDateToSend = (this.startDate && this.endDate) ? this.startDate : null;
    const endDateToSend = (this.startDate && this.endDate) ? this.endDate : null;
   
    this.kardexPepsService.getKardexByProduc(this.productId, page, size, sort, this.startDate, this.endDate).subscribe((res) => {
      const rawList = res.data;

      this.kardexList = rawList.map((item: KardexRecordsDTOResponse) => {
        const formattedDate = new Date(item.date).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).replace(/ de /g, '-');

        return {
          ...item,
          formattedDate
        } as KardexRow;
      });

      this.totalRecords = rawList.length;
      this.loading = false;
    });
  }


}
