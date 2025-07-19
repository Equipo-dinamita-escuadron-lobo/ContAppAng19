import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { KardexRow } from '../models/KardexRow';
import { KardexService } from '../services/kardex.service';


@Component({
  selector: 'app-list-kardex-weighted-average',
  imports: [
    TableModule,
    CommonModule
  ],
  templateUrl: './list-kardex-weighted-average.component.html',
  styleUrl: './list-kardex-weighted-average.component.css'
})
export class ListKardexWeightedAverageComponent {

  constructor(private kardexService: KardexService) {}

  productId: number = 1;
  totalRecords = 0;
  first = 0;
  loading = false;

  ngOnInit() {
    this.loadKardex({ first: 0, rows: 5, sortField: '', sortOrder: 1 });
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

      this.kardexList = rawList.map((item: { quantity: any; unitPrice: any; date: string | number | Date; }, index: number) => {
        const previousBalance = rawList[index - 1]?.balanceQuantity || 0;
        const balanceQuantity = item.quantity + previousBalance;
        const balanceUnitPrice = item.unitPrice;
        const balanceTotal = balanceQuantity * balanceUnitPrice;

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
