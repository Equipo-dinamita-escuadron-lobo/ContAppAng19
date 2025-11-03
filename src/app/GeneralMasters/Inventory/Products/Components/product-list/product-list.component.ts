import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

import { Product, ProductList, Page } from '../../Models/Product';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { TooltipModule } from 'primeng/tooltip';
import { CurrencyFormatPipe } from '../../Pipes/currency-format.pipe';
import { ProductsTemplateComponent } from '../products-template/products-template.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FileUploadModule } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Interfaces para manejo de errores de importación
interface ImportError {
  rowNumber: number;
  columnNumber: number;
  columnName: string;
  fieldValue: any;
  errorCode: string;
  errorMessage: string;
  errorType: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TagModule,
    InputIcon,
    IconField,
    TooltipModule,
    ToggleSwitchModule,
    FormsModule,
    CurrencyFormatPipe,
    ProductsTemplateComponent,
    RadioButtonModule,
    FileUploadModule
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: Record<string, any> | null = null;
  productsPage: Page<ProductList> = {
    content: [],
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0
    }
  };
  products: ProductList[] = []; 

  // Propiedades para paginación y búsqueda
  currentPage = 0;
  pageSize = 10;
  first = 0;
  sortField = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';

  isDetailsDialogVisible = false;
  selectedProduct: ProductList | null = null;
  showDetailView = false;
  showTemplateModal = false;

  // Estado de exportación
  isExporting = false;

  // Estado de importación
  isImporting = false;
  importErrors: ImportError[] = [];
  totalErrors = 0;
  totalRecordsImported = 0;
  failedImportsCount = 0;
  successfulImports = 0;
  duplicatesSkipped = 0;
  showErrorModal = false;

  /**
   * Propiedades para el modal de exportación
   */
  exportStatusFilter: string | null = null;
  exportDialogMessage = '¿Qué tipo de productos desea exportar?';
  exportStatusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
  ];

  ref: DynamicDialogRef | undefined; // Para manejar la referencia del modal de detalles

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly localstorageMethods: LocalStorageMethods,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getProducts();
  }

  getProducts(): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.productService.getProducts(
      enterpriseId,
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortOrder,
      this.searchTerm || undefined
    ).subscribe({
      next: (data: Page<ProductList>) => {
        this.productsPage = data;
        this.products = data.content;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
  }

  // Método para manejar cambios de página
  onPageChange(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
    this.currentPage = Math.floor(this.first / this.pageSize);
    this.getProducts();
  }

  // Método para manejar búsqueda
  onSearchChange(): void {
    this.first = 0; 
    this.currentPage = 0; 
    this.getProducts();
  }

  // Método para manejar ordenamiento
  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.getProducts();
  }

  // Método para limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 0;
    this.getProducts();
  }

  // Método para alternar entre vista detallada y resumida
  toggleDetailView(): void {
    this.showDetailView = !this.showDetailView;
  }

  // Método para volver al menú de inventory
  goBack(): void {
    this.router.navigate(['/gen-masters/inventory']);
  }

  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  redirectToEdit(productId: number): void {
    this.router.navigate(['/gen-masters/inventory/products/edit/', productId.toString()]);
  }


  deleteProduct(productId: number): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar el producto "${product.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeleteProduct(product, enterpriseId)
    });
  }


  private confirmDeleteProduct(product: ProductList, enterpriseId: string): void {
    this.productService.deleteProduct(product.id, enterpriseId).subscribe({
      next: (data: Product) => {
        this.getProducts();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El producto se ha eliminado correctamente.'
        });
      },
      error: (error: any) => {
        console.error('Error al eliminar el producto: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ha ocurrido un error al intentar eliminar el producto.'
        });
      }
    });
  }


  openDetailsModal(product: ProductList): void {
    this.selectedProduct = product;
    this.isDetailsDialogVisible = true;
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
  }

  changeProductState(product: ProductList): void {
    const newState = product.state;
    const previousState = !newState; // El estado anterior es el opuesto al actual
    
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.productService.changeProductState(product.id, enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del producto "${product.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        product.state = previousState;
        console.error('Error al cambiar el estado del producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del producto'
        });
      }
    });
  }

  /**
   * Muestra el modal de confirmación para exportar productos
   */
  showExportConfirmDialog() {
    this.exportStatusFilter = null; // "Todos" por defecto
    
    this.confirmationService.confirm({
      key: 'exportDialog',
      header: 'Exportar',
      acceptLabel: 'Exportar',
      acceptIcon: 'pi pi-download',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        const status = this.exportStatusFilter === 'active' ? true : this.exportStatusFilter === 'inactive' ? false : undefined;
        this.exportProducts(status);
      }
    });
  }

  /**
   * Exporta productos a formato Excel.
   */
  exportProducts(status: boolean | undefined): void {
    const entData = this.localStorageMethods.loadEnterpriseData();
    const entId = entData?.id || this.localstorageMethods.getIdEnterprise();
    const companyName = entData?.name || '';

    this.isExporting = true; // Activar estado de carga

    this.productService.exportProducts(entId, companyName, status).subscribe({
      next: (response) => {
        this.isExporting = false; // Desactivar estado de carga
        if (!response.body) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Exportación',
            detail: 'No se recibió el archivo del servidor'
          });
          return;
        }

        this.downloadFile(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Exportación Exitosa',
          detail: `Se ha exportado el catálogo de productos correctamente`
        });
      },
      error: (error) => {
        this.isExporting = false; // Desactivar estado de carga en caso de error
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo exportar los productos.';

              // Verificar si es un mensaje informativo sobre productos no disponibles
              const isNoProductsMessage = this.isNoProductsAvailableMessage(errorMessage);

              if (isNoProductsMessage) {
                // Mostrar como información en lugar de error
                this.messageService.add({
                  severity: 'info',
                  summary: 'Información',
                  detail: this.getNoProductsMessage(status)
                });
              } else {
                // Mostrar como error para otros casos
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error de Exportación',
                  detail: errorMessage
                });
              }
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: 'Ocurrió un error inesperado.'
              });
            }
          };
          reader.onerror = () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: 'No se pudo leer el mensaje de error.'
            });
          };
          reader.readAsText(error.error);
        } else {
          const errorMessage = error.error?.message || error.message || 'Error desconocido al exportar productos';

          // Verificar si es un mensaje informativo sobre productos no disponibles
          const isNoProductsMessage = this.isNoProductsAvailableMessage(errorMessage);

          if (isNoProductsMessage) {
            // Mostrar como información en lugar de error
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: this.getNoProductsMessage(status)
            });
          } else {
            // Mostrar como error para otros casos
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: errorMessage
            });
          }
        }
      }
    });
  }

  /**
   * Verifica si el mensaje de error indica que no hay productos disponibles para exportar.
   */
  private isNoProductsAvailableMessage(message: string): boolean {
    const noProductsPatterns = [
      'no hay productos',
      'no existen productos',
      'no se encontraron productos',
      'no hay registros',
      'empty',
      'sin productos'
    ];

    return noProductsPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Retorna el mensaje informativo apropiado según el filtro de estado aplicado.
   */
  private getNoProductsMessage(status: boolean | undefined): string {
    switch (status) {
      case true:
        return 'No hay productos activos para exportar';
      case false:
        return 'No hay productos inactivos para exportar';
      case undefined:
      default:
        return 'No hay productos para exportar';
    }
  }

  /**
   * Procesa la respuesta HTTP para descargar el archivo.
   */
  private downloadFile(response: any): void {
    const blob = response.body;
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'productos.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Maneja la selección de archivo para importar productos.
   * @param event Evento del selector de archivos.
   */
  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (!file) return;

    const entId = this.localstorageMethods.getIdEnterprise();
    this.isImporting = true;

    this.productService.importProducts(entId, file).subscribe({
      next: (response) => {
        this.isImporting = false;
        const importResult = response;

        if (importResult) {
          const { status, totalRecords, successfulImports, failedImports, duplicatesSkipped, errors } = importResult;
        
          if (errors && errors.length > 0) {
            // Mostrar modal con detalles de errores
            this.showImportErrorsModal(errors, importResult.fileName || file.name, totalRecords, failedImports, successfulImports, duplicatesSkipped);

            // Recargar lista si hubo importaciones exitosas
            if (successfulImports > 0) {
              this.getProducts();
            }
            return;
          }

          // Si no hay errores, mostrar resumen de importación exitosa
          let severity: 'success' | 'info' | 'warn' | 'error' = 'success';
          let summary = 'Importación Exitosa';

          if (status === 'FAILED') {
            severity = 'error';
            summary = 'Error en Importación';
          }

          // Construir mensaje detallado
          let detail = `Total procesados: ${totalRecords || 0}\n`;
          detail += `Exitosos: ${successfulImports || 0}\n`;
          if (duplicatesSkipped > 0) {
            detail += `Duplicados omitidos: ${duplicatesSkipped}\n`;
          }

          this.messageService.add({
            severity,
            summary,
            detail,
            life: 8000
          });

          // Recargar lista si hubo importaciones exitosas
          if (successfulImports > 0) {
            this.getProducts();
          }
        }
      },
      error: (error) => {
        this.isImporting = false;
        // Extraer los errores del backend
        if (error.error && typeof error.error === 'object') {
          const errorResponse = error.error;
          const errors = errorResponse.errors || [];

          if (errors && errors.length > 0) {
            // Mostrar modal de errores
            this.showImportErrorsModal(
              errors,
              errorResponse.fileName || file.name,
              errorResponse.totalRecords,
              errorResponse.failedImports,
              errorResponse.successfulImports,
              errorResponse.duplicatesSkipped
            );
          } else {
            // Error general sin detalles específicos
            const errorMessage = errorResponse.message || 'Error desconocido durante la importación';
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Importación',
              detail: errorMessage
            });
          }
        } else if (error.error instanceof Blob) {
          // Manejar errores que vienen como Blob
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo importar los productos.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Importación',
                detail: errorMessage
              });
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Importación',
                detail: 'Ocurrió un error inesperado.'
              });
            }
          };
          reader.onerror = () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Importación',
              detail: 'No se pudo leer el mensaje de error.'
            });
          };
          reader.readAsText(error.error);
        } else {
          // Error que no es Blob
          const errorMessage = error.error?.message || error.message || 'Error desconocido al importar productos';
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Importación',
            detail: errorMessage
          });
        }
      }
    });
  }

  /**
   * Muestra el modal con los detalles de errores de importación.
   */
  private showImportErrorsModal(errors: ImportError[], fileName: string, totalRecords?: number, failedImports?: number, successfulImports?: number, duplicatesSkipped?: number): void {
    this.importErrors = errors;
    this.totalErrors = errors.length;
    this.totalRecordsImported = totalRecords || 0;
    this.failedImportsCount = failedImports || errors.length;
    this.successfulImports = successfulImports || 0;
    this.duplicatesSkipped = duplicatesSkipped || 0;
    this.showErrorModal = true;
  }

  /**
   * Cierra el modal de errores de importación.
   */
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.importErrors = [];
    this.totalErrors = 0;
    this.totalRecordsImported = 0;
    this.failedImportsCount = 0;
    this.successfulImports = 0;
    this.duplicatesSkipped = 0;
  }

  /**
   * Exporta los errores de importación a un archivo Excel
   */
  exportImportErrors(): void {
    try {
      // Validar que existan errores para exportar
      if (!this.importErrors || this.importErrors.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin Errores',
          detail: 'No hay errores para exportar'
        });
        return;
      }

      // Crear el workbook y worksheet
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = {};

      // Información del encabezado
      const headerInfo = [
        ['ERRORES DE IMPORTACIÓN DE PRODUCTOS'],
        [''],
        ['Fecha de exportación:', new Date().toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })],
        ['Hora:', new Date().toLocaleTimeString('es-CO')],
        [''],
        ['RESUMEN DE IMPORTACIÓN'],
        ['Total procesados:', this.totalRecordsImported],
        ['Exitosos:', this.successfulImports],
        ['Fallidos:', this.failedImportsCount],
        ['Duplicados omitidos:', this.duplicatesSkipped],
        [''],
        ['DETALLE DE ERRORES']
      ];

      // Agregar la información del encabezado
      XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });

      // Encabezados de la tabla
      const tableHeaders = [
        ['Fila', 'Columna', 'Campo', 'Valor', 'Error']
      ];

      // Agregar encabezados de la tabla
      XLSX.utils.sheet_add_aoa(ws, tableHeaders, { origin: 'A14' });

      // Preparar los datos de la tabla
      const tableData = this.importErrors.map(error => [
        error.rowNumber,
        this.getExcelColumnLetter(error.columnNumber),
        error.columnName,
        error.fieldValue || '(vacío)',
        error.errorMessage
      ]);

      // Agregar los datos de la tabla
      XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A15' });

      // Establecer el rango de la hoja
      const totalRows = headerInfo.length + 2 + tableData.length;
      ws['!ref'] = `A1:E${totalRows}`;

      // Configurar anchos de columnas
      ws['!cols'] = [
        { wch: 8 },  // A - Fila
        { wch: 10 }, // B - Columna
        { wch: 25 }, // C - Campo
        { wch: 25 }, // D - Valor
        { wch: 60 }  // E - Error
      ];

      // Combinar celdas para el título
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }); // A1:E1 (Título)

      // Agregar el worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Errores Importación');

      // Generar el nombre del archivo con fecha local
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day}`;
      const fileName = `Errores_Importacion_Productos_${timestamp}.xlsx`;

      // Generar el archivo y descargarlo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);

      // Cerrar el modal
      this.closeErrorModal();

      // Mostrar notificación de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: 'El archivo se ha exportado correctamente.'
      });

    } catch (error) {
      console.error('Error al exportar errores:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error en Exportación',
        detail: 'Ocurrió un error al exportar los errores.'
      });
    }
  }

  /**
   * Convierte un número de columna a letra de Excel (1=A, 2=B, 27=AA, etc.)
   */
  getExcelColumnLetter(columnNumber: number): string {
    let columnLetter = '';
    let temp = columnNumber;

    while (temp > 0) {
      const remainder = (temp - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      temp = Math.floor((temp - 1) / 26);
    }

    return columnLetter;
  }

}