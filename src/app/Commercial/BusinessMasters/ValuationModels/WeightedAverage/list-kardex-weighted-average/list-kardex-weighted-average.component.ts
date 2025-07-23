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
    private kardexService: KardexService
  ) {}

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  productId: number = 1;
  totalRecords = 0;
  first = 0;
  loading = false;

  selectedItem: any;
  filteredItems: any[] = [];
  items: any[] | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;

selectedProduct: any;

//products: ProductResponse[] = [];

  filterItems(event: AutoCompleteCompleteEvent) {
      let filtered: any[] = [];
      let query = event.query;

      for (let i = 0; i < (this.items as any[]).length; i++) {
          let item = (this.items as any[])[i];
          if (item.label.toLowerCase().indexOf(query.toLowerCase()) == 0) {
              filtered.push(item);
          }
      }

      this.filteredItems = filtered;
  }



  ngOnInit() {
    this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
    this.entData = this.localStorageMethods.loadEnterpriseData();
      // this.items = [];
      //   for (let i = 0; i < 100; i++) {
      //       this.items.push({ label: 'Item ' + i, value: 'Item ' + i });
      //   }
  }

  kardexList: KardexRow[] = [];

  loadKardex(event: any) {
    this.loading = true;

    const page = event.first / event.rows;
    const size = event.rows;
    this.first = event.first;
    const sort = event.sortField ? `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}` : '';

    this.kardexService.getKardexByProductId(this.productId, page, size, sort).subscribe((res) => {
      const rawList = res.data.content;



      this.kardexList = rawList.map((item: {
        quantity: any;
        unitPrice: any;
        date: string | number | Date;
        type: string | 'PURCHASE' | 'SALE' | 'SALESRETURN' | 'PURCHASERETURN' | 'ADJUSTMENT';
        details: string;
        balanceQuantity: any;
        balanceUnitPrice: any;
        balanceTotal?: any;
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
        const balanceTotal = balanceQuantity * balanceUnitPrice;

        if (item.type === 'PURCHASE' || item.type === 'PURCHASERETURN') {
          item.entryQuantity = item.quantity;
          item.entryUnitPrice = parseFloat(item.unitPrice);
          item.entryTotal = item.entryQuantity * item.entryUnitPrice;
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
