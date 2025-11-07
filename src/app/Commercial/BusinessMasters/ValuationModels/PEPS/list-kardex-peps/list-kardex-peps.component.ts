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
import { ExcelExportService } from '../services/excel-export.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

import { InventoryAdjustmentComponent } from '../inventory-adjustment/inventory-adjustment.component';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-list-kardex-peps',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    AutoCompleteModule,
    FormsModule,
    DatePickerModule,
    InputIconModule,
    CurrencyPipe,
    ToastModule,
    TooltipModule,
    InputTextModule,
    InventoryAdjustmentComponent
  ],
  providers: [MessageService],
  templateUrl: './list-kardex-peps.component.html',
  styleUrl: './list-kardex-peps.component.css'
})
export class ListKardexPepsComponent {

  constructor(
    private kardexPepsService: KardexPepsService,
    private productService: ProductService,
    private excelExportService: ExcelExportService,
    private messageService: MessageService,
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

  //controlar el estado de carga de la exportación
  exportLoading: boolean = false;

  //el diálogo de ajuste de inventario
  showInventoryAdjustment: boolean = false;

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
    
    console.log('Productos filtrados:', this.filteredProducts);
  }

  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    
    if (!this.entData) {
      console.error('No se encontraron datos de empresa en localStorage');
      return;
    }
    
    console.log('Enterprise ID:', this.entData.id);
    
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
    this.selectedProduct = event.value;
    this.productId = event.value.productId;
    console.log('Producto seleccionado:', this.selectedProduct);
    
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

    this.kardexPepsService.getKardexByProduct(this.productId, page, size, sort, this.startDate, this.endDate)
      .subscribe({
        next: (res) => {
          const pageData = res.data;
          
          if (pageData && pageData.content) {
            this.kardexList = pageData.content.map((item: KardexRecordsDTOResponse) => {
              const formattedDate = new Date(item.date).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric'
              }).replace(/ de /g, '-');
              
              return {
                ...item,
                formattedDate,
                outputQuantity: this.calculateOutputQuantity(item.outputDetails),
                outputTotalPrice: this.calculateOutputTotalPrice(item.outputDetails),
                totalBalanceQuantity: this.calculateBalanceQuantity(item.balance),
                totalBalanceValue: this.calculateBalanceValue(item.balance)
              } as KardexRow;
            });

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

  /**
   * Calcula la cantidad total de salida desde outputDetails
   */
  private calculateOutputQuantity(outputDetails: any[] | null): number {
    if (!outputDetails || outputDetails.length === 0) {
      return 0;
    }
    return outputDetails.reduce((sum, detail) => sum + (detail.quantityUsed || 0), 0);
  }

  /**
   * Calcula el precio total de salida desde outputDetails
   */
  private calculateOutputTotalPrice(outputDetails: any[] | null): number {
    if (!outputDetails || outputDetails.length === 0) {
      return 0;
    }
    return outputDetails.reduce((sum, detail) => sum + (detail.totalPrice || 0), 0);
  }

  /**
   * Calcula la cantidad total del balance
   */
  private calculateBalanceQuantity(balance: any[] | null): number {
    if (!balance || balance.length === 0) {
      return 0;
    }
    return balance.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  /**
   * Calcula el valor total del balance
   */
  private calculateBalanceValue(balance: any[] | null): number {
    if (!balance || balance.length === 0) {
      return 0;
    }
    return balance.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }

  /**
   * Verifica si el botón de ajuste de inventario debe estar habilitado
   */
  isInventoryAdjustmentEnabled(): boolean {
    return this.selectedProduct !== undefined && this.productId !== 0;
  }

  /**
   * Abre el diálogo de ajuste de inventario
   */
  openInventoryAdjustment() {
    if (this.isInventoryAdjustmentEnabled()) {
      console.log('Abriendo dialog de ajuste con producto:', this.selectedProduct);
      this.showInventoryAdjustment = true;
    }
  }

  
  onAdjustmentCompleted() {
    console.log('Ajuste completado, recargando kardex...');
    this.showInventoryAdjustment = false;
    
    if (this.startDate && this.endDate && this.productId !== 0) {
      this.loadKardex({ 
        first: this.first, 
        rows: 5, 
        sortField: '', 
        sortOrder: 1 
      });
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'El inventario se ha actualizado correctamente'
    });
  }

  /**
   * Se ejecuta cuando se cierra el diálogo sin completar el ajuste
   */
  onDialogClosed() {
    console.log('Dialog de ajuste cerrado');
    this.showInventoryAdjustment = false;
  }


  exportToExcel() {
    if (!this.isInventoryAdjustmentEnabled()) {
      return;
    }

    this.exportLoading = true;

    const startDateToSend = (this.startDate && this.endDate) ? this.startDate : null;
    const endDateToSend = (this.startDate && this.endDate) ? this.endDate : null;

    this.kardexPepsService.getAllKardexForExport(this.productId, startDateToSend, endDateToSend).subscribe({
      next: (res) => {
        try {
          const rawList = res.data.content;

          this.excelExportService.exportKardexToExcel(
            rawList,
            this.selectedProduct!,
            startDateToSend,
            endDateToSend
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Archivo Excel exportado correctamente'
          });

        } catch (error) {
          console.error('Error al generar el archivo Excel:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al generar el archivo Excel'
          });
        } finally {
          this.exportLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al obtener los datos para exportar:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al obtener los datos para exportar'
        });
        this.exportLoading = false;
      }
    });
  }

 
  
}
