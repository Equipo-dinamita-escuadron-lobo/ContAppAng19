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
import { InventoryAdjustmentComponent } from '../inventory-adjustment/inventory-adjustment.component';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ExcelExportService } from '../services/excel-export.service';

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
    InputTextModule,
    InventoryAdjustmentComponent,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './list-kardex-weighted-average.component.html',
  styleUrl: './list-kardex-weighted-average.component.css'
})
export class ListKardexWeightedAverageComponent {

  constructor(
    private kardexService: KardexService,
    private productService: ProductService,
    private messageService: MessageService,
    private excelExportService: ExcelExportService
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

  // Variables para el diálogo de ajuste de inventario
  showInventoryAdjustment: boolean = false;
  lastKardexRecord: KardexRow | null = null;

  // Variable para controlar el estado de carga de la exportación
  exportLoading: boolean = false;

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
    this.productId = product.productId;
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
          balanceTotal,
          formattedDate
        };
      });

      this.totalRecords = res.data.totalElements;
      this.loading = false;
    });
  }

  /**
   * Verifica si el botón de ajuste de inventario debe estar habilitado
   */
  isInventoryAdjustmentEnabled(): boolean {
    return this.selectedProduct !== undefined && this.productId !== 0;
  }

  /**
   * Abre el diálogo de ajuste de inventario
   * Obtiene el último registro real del backend antes de abrir el modal
   */
  openInventoryAdjustment() {
    if (this.isInventoryAdjustmentEnabled()) {
      this.loading = true;
      
      // Obtener el último registro real del backend
      this.kardexService.getLatestKardexByProductId(this.productId).subscribe({
        next: (response) => {
          if (response.data) {
            // Procesar el registro obtenido
            const item = response.data;
            
            const balanceTotal = item.totalBalance;

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

            this.lastKardexRecord = {
              ...item,
              balanceTotal,
              formattedDate
            };
          } else {
            // No hay registros previos
            this.lastKardexRecord = null;
          }
          
          this.loading = false;
          this.showInventoryAdjustment = true;
        },
        error: (error) => {
          console.error('Error al obtener el último registro del kardex:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener el último registro del kardex'
          });
        }
      });
    }
  }

  /**
   * Maneja el evento cuando se completa un ajuste de inventario
   */
  onAdjustmentCompleted() {
    this.showInventoryAdjustment = false;
    // Recargar el kardex para mostrar los cambios
    this.loadKardex({ first: this.first, rows: 5, sortField: '', sortOrder: 1 });

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Ajuste de inventario completado. Los datos se han actualizado.'
    });
  }

  /**
   * Maneja el evento cuando se cierra el diálogo sin completar el ajuste
   */
  onAdjustmentDialogClosed() {
    this.showInventoryAdjustment = false;
  }

  /**
   * Exporta todos los registros del kardex a un archivo Excel
   */
  exportToExcel() {
    if (!this.isInventoryAdjustmentEnabled()) {
      return;
    }

    this.exportLoading = true;

    // Solo enviar fechas si ambas están seleccionadas
    const startDateToSend = (this.startDate && this.endDate) ? this.startDate : null;
    const endDateToSend = (this.startDate && this.endDate) ? this.endDate : null;

    this.kardexService.getAllKardexForExport(this.productId, startDateToSend, endDateToSend).subscribe({
      next: (res) => {
        try {
          const rawList = res.data.content;

          // Procesar los datos usando el servicio
          const processedData = this.excelExportService.processKardexData(rawList);

          // Exportar usando el servicio
          this.excelExportService.exportKardexToExcel(
            processedData,
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
