import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { KardexRow } from '../models/KardexRow';
import { KardexService } from '../services/kardex.service';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../models/ProductResponse';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

@Component({
  selector: 'app-list-kardex-weighted-average',
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    AutoCompleteModule,
    FormsModule,
    DatePickerModule,
    InputTextModule
  ],
  templateUrl: './list-kardex-weighted-average.component.html',
  styleUrl: './list-kardex-weighted-average.component.css'
})
export class ListKardexWeightedAverageComponent {

  constructor(
    private kardexService: KardexService,
    private productService: ProductService
  ) {}

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

    // Verificar si ambas fechas están establecidas para recargar datos
    if (this.startDate && this.endDate && this.productId !== 0) {
      this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
    }
  }

  onEndDateChange() {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.endDate = null;
      console.warn('La fecha de finalización no puede ser menor a la fecha de inicio');
      return;
    }

    // Verificar si ambas fechas están establecidas para recargar datos
    if (this.startDate && this.endDate && this.productId !== 0) {
      this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
    }
  }

  filterProducts(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.filteredProducts = this.allProducts.filter(product => {
      // La propiedad `name` es la que se usa para la búsqueda.
      return product.name.toLowerCase().includes(query);
    });
  }

  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.productService.getAllProducts().subscribe(response => {
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

    // Solo enviar fechas si ambas están seleccionadas, de lo contrario enviar null
    const startDateToSend = (this.startDate && this.endDate) ? this.startDate : null;
    const endDateToSend = (this.startDate && this.endDate) ? this.endDate : null;

    this.kardexService.getKardexByProductId(this.productId, page, size, sort, startDateToSend, endDateToSend).subscribe((res) => {
      const rawList = res.data.content;

      this.kardexList = rawList.map((item: {
        quantity: any;
        unitPrice: any;
        date: string | number | Date;
        type: string | 'PURCHASE' | 'SALE' | 'SALESRETURN' | 'PURCHASERETURN' | 'ADJUSTMENT';
        details: string;
        balanceQuantity: any;
        balanceUnitPrice: any;
        totalBalance?: any;
        entryQuantity?: any;
        entryUnitPrice?: any;
        entryTotal?: any;
        exitQuantity?: any;
        exitUnitPrice?: any;
        exitTotal?: any;
       }, index: number) => {

        const previousBalance = rawList[index - 1]?.balanceQuantity || 0;
        const balanceQuantity = item.quantity + previousBalance;
        const balanceUnitPrice = item.unitPrice;
        const balanceTotal = item.totalBalance

        if (item.type === 'PURCHASE') {
          item.entryQuantity = item.quantity;
          item.entryUnitPrice = parseFloat(item.unitPrice);
          item.entryTotal = item.entryQuantity * item.entryUnitPrice;
        }
        if (item.type === 'PURCHASERETURN') {
          item.entryQuantity = -item.quantity;
          item.entryUnitPrice = parseFloat(item.unitPrice);
          item.entryTotal = (item.entryQuantity * item.entryUnitPrice);
        }
        if (item.type === 'SALE') {
          item.exitQuantity = item.quantity;
          item.exitUnitPrice = parseFloat(item.unitPrice);
          item.exitTotal = item.exitQuantity * item.exitUnitPrice;
        }
        if (item.type === 'SALESRETURN') {
          item.exitQuantity = -item.quantity;
          item.exitUnitPrice = parseFloat(item.unitPrice);
          item.exitTotal = (item.exitQuantity * item.exitUnitPrice);
        }



        const formattedDate = new Date(item.date).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).replace(/ de /g, '-');

        return {
          ...item,
          balanceQuantity,
          balanceUnitPrice,
          balanceTotal,
          formattedDate
        };
      });

      this.totalRecords = res.data.totalElements;
      this.loading = false;
    });
  }



}
