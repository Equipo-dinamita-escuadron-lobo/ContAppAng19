import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// PrimeNG Imports
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Componentes internos
import { ThirdTemplateComponent } from '../third-template/third-template.component';
import { ThirdExportComponent } from '../third-export/third-export.component';
import { ThirdDetailsComponent } from '../third-details/third-details.component';
import { MessageService, ConfirmationService } from 'primeng/api';

// Models and Services
import { Third } from '../../models/Third';
import { ThirdService } from '../../Services/third.service';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

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
  selector: 'app-third-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    FileUploadModule,
    DialogModule,
    TooltipModule,
    PaginatorModule,
    ToggleSwitchModule,
    ThirdTemplateComponent,
    ThirdExportComponent,
    ThirdDetailsComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './third-list.component.html',
  styleUrl: './third-list.component.css'
})
export class ThirdListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // Data properties
  thirds: Third[] = [];
  selectedThirds: Third[] = [];
  thirdTypes: ThirdType[] = [];
  typeIds: TypeId[] = [];
  
  // UI State
  loading = false;
  loadingPdfRut = false;
  showDetailView = false;
  globalFilterValue = '';

  bulkStateToggle = true; // Default to active
  
  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;
  sortField = 'names';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchValue = '';
  
  // Modal states
  showTemplateModal = false;
  showImportModal = false;
  showExportModal = false;
  showErrorModal = false;

  /** Control de visibilidad del modal de detalles */
  showDetailsModal = false;
  
  // Variables para manejar errores de importación
  importErrors: ImportError[] = [];
  totalErrors = 0;
  totalRecordsImported = 0;
  successfulImports = 0;
  failedImportsCount = 0;
  duplicatesOmitted = 0;

  /** Datos para el modal de detalles */
  detailsModalData: any = null;
  
  // Company data
  entData: string = '';

  // Constantes
  private readonly EMPTY_PDF_CONTENT = ';;0;;;;;;;;;0';

  constructor(
    private thirdService: ThirdService,
    private thirdConfigurationService: ThirdServiceConfigurationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
  }

  ngOnInit(): void {
    this.loadThirds();
    this.getThirdTypes();
    this.getTypesID();
  }

  /**
   * Carga la lista de terceros con paginación desde el backend
   */
  loadThirds(): void {
    this.loading = true;
    const pageNumber = Math.floor(this.first / this.rows);

    this.thirdService.getThirdParties(
      this.entData,
      pageNumber,
      this.rows,
      this.sortField,
      this.sortOrder,
      this.searchValue || undefined
    ).subscribe({
      next: (response: any) => {
        this.thirds = response.content || [];
        this.totalRecords = response.page?.totalElements || response.totalElements || 0;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading thirds:', error);
        this.thirds = [];
        this.totalRecords = 0;
        this.loading = false;
        // Only show error if it's not a 404 or empty result
        if (error.status !== 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los terceros'
          });
        }
      }
    });
  }

  /**
   * Obtiene los tipos de tercero
   */
  private getThirdTypes(): void {
    this.thirdConfigurationService.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        this.thirdTypes = response;
      },
      error: (error: any) => {
        console.error('Error loading third types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Tercero Para esta Empresa'
        });
      }
    });
  }

  /**
   * Obtiene los tipos de identificación
   */
  private getTypesID(): void {
    this.thirdConfigurationService.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typeIds = response;
      },
      error: (error: any) => {
        console.error('Error loading ID types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Identificación Para esta Empresa'
        });
      }
    });
  }

  /**
   * Aplica filtro global a la tabla
   */
  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.first = 0;
    this.loadThirds();
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadThirds();
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSort(event: any): void {
    // Evitar llamadas recursivas si el ordenamiento no cambió
    if (this.sortField === event.field && this.sortOrder === (event.order === 1 ? 'asc' : 'desc')) {
      return;
    }

    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.loadThirds();
  }


  /**
   * Alterna entre vista detallada y resumida
   */
  toggleDetailView(): void {
    this.showDetailView = !this.showDetailView;
  }

  /**
   * Navega a la página de creación de terceros
   */
  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/third-parties/create']);
  }

  /**
   * Navega a la página de edición de terceros
   */
  navigateToEdit(thirdId: number): void {
    this.router.navigate(['/gen-masters/third-parties/edit', thirdId]);
  }

  /**
   * Cambia el estado de un tercero
   */
  changeThirdState(third: Third): void {
    const previousState = third.state;

    this.thirdService.changeThirdPartieState(third.thId, this.entData).subscribe({
      next: (response: any) => {
        if (response && typeof response === 'object' && 'state' in response) {
          third.state = response.state;
        } else {
          // El backend no devuelve el tercero, obtener el estado actualizado
          this.thirdService.getThirdPartie(third.thId, this.entData).subscribe({
            next: (fetchedThird: any) => {
              third.state = fetchedThird.state;
            },
            error: (fetchError) => {
              third.state = !previousState;
            }
          });
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del Tercero cambiado correctamente`
        });
      },
      error: (error) => {
        console.error('Error changing third state:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al cambiar el estado del tercero`
        });
      }
    });
  }

  /**
   * Confirma y elimina un tercero
   */
  confirmDelete(third: Third): void {
    const displayName = this.getDisplayName(third);
    
    this.confirmationService.confirm({
      message: `¿Desea eliminar a "${displayName}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => {
        this.thirdService.deleteThird(third.thId, this.entData).subscribe({
          next: () => {
            this.thirds = this.thirds.filter(t => t.thId !== third.thId);
            this.totalRecords--;
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Tercero eliminado correctamente'
            });
          },
        });
      }
    });
  }

  /**
   * Cambia el estado de todos los terceros de forma masiva
   */
  changeBulkState(): void {
    const actionLower = this.bulkStateToggle ? 'activar' : 'inactivar';

    this.confirmationService.confirm({
      message: `¿Desea ${actionLower} todos los terceros? Esta acción no se puede deshacer.`,
      header: 'Confirmar Cambio de Estado Masivo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: `Sí, ${actionLower}`,
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: this.bulkStateToggle ? 'p-button-success' : 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => {
        this.loading = true;
        this.thirdService.changeAllThirdsState(this.entData, this.bulkStateToggle).subscribe({
          next: (response: any) => {
            this.loadThirds();

            this.messageService.add({
              severity: 'success',
              summary: 'Cambio Masivo Exitoso',
              detail: `${response.message}`
            });
          },
          error: (error) => {
            console.error('Error changing bulk state:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al cambiar el estado masivo de los terceros'
            });
          }
        }).add(() => {
          this.loading = false;
        });
      },
      reject: () => {
        this.bulkStateToggle = !this.bulkStateToggle;
      }
    });
  }

  /**
   * Obtiene el nombre completo o razón social
   */
  getDisplayName(third: Third): string {
    return third.names ? `${third.names} ${third.lastNames}` : third.socialReason || '';
  }

  /**
   * Obtiene la severidad del tag según el estado
   */
  getStateSeverity(state: boolean): 'success' | 'danger' {
    return state ? 'success' : 'danger';
  }

  /**
   * Obtiene el texto del estado
   */
  getStateText(state: boolean): string {
    return state ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene los tipos de tercero como string
   */
  getThirdTypesText(thirdTypes: ThirdType[]): string {
    return thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Maneja la selección de archivos para importación
   */
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo inválido',
        detail: 'Por favor, selecciona un archivo EXCEL válido'
      });
      return;
    }

    this.importThirdsFromExcel(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  }

  /**
   * Importa terceros desde un archivo Excel usando el endpoint del backend
   */
  private importThirdsFromExcel(file: File): void {
    this.loading = true;
    
    this.thirdService.importFromExcel(this.entData, file).subscribe({
      next: (response) => {
        this.loading = false;
        const importResult = response.body;
        
        if (importResult) {
          const { status, totalRecords, successfulImports, failedImports, duplicatesSkipped, errors } = importResult;
          
          // Si hay errores, mostrar modal de errores Y notificación de resumen
          if (errors && errors.length > 0) {
           
            let detail = `Total procesados: ${totalRecords || 0}\n`;
            detail += `Exitosos: ${successfulImports || 0}\n`;
            detail += `Fallidos: ${failedImports}\n`;
            if (duplicatesSkipped > 0) {
              detail += `Duplicados omitidos: ${duplicatesSkipped}\n`;
            }
            
            this.messageService.add({
              severity: 'info',
              summary: 'Importación Completada con Errores',
              detail,
              life: 8000
            });
            
            // Mostrar modal con detalles de errores
            this.showImportErrorsModal(errors, importResult.fileName || file.name, totalRecords, failedImports, successfulImports, duplicatesSkipped);
            
            // Recargar lista si hubo importaciones exitosas
            if (successfulImports > 0) {
              this.loadThirds();
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
            this.loadThirds();
          }
        }
      },
      error: (error) => {
        this.loading = false;
        
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
            return;
          }
        }
        
        // Si no hay errores estructurados, intentar extraer mensaje genérico
        let errorMessage = 'Error al procesar el archivo de importación';
        
        if (error.error) {
          if (error.error instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorObj = JSON.parse(reader.result as string);
                this.handleGenericError(errorObj);
              } catch (e) {
                this.showErrorNotification(reader.result as string || errorMessage, '');
              }
            };
            reader.onerror = () => {
              this.showErrorNotification('Error al leer la respuesta del servidor', '');
            };
            reader.readAsText(error.error);
          } else if (typeof error.error === 'object' && error.error !== null) {
            this.handleGenericError(error.error);
          } else if (typeof error.error === 'string') {
            this.showErrorNotification(error.error, '');
          } else {
            this.showErrorNotification(errorMessage, `Código de error: ${error.status || 'desconocido'}`);
          }
        } else if (error.message) {
          this.showErrorNotification(error.message, '');
        } else {
          this.showErrorNotification(errorMessage, `Código de error: ${error.status || 'desconocido'}`);
        }
      }
    });
  }
  
  /**
   * Maneja errores genéricos del servidor
   */
  private handleGenericError(errorObj: any): void {
    const errorMessage = errorObj.message || errorObj.error || errorObj.detail || 'Error al procesar el archivo';
    const errorDetails = errorObj.details || '';
    this.showErrorNotification(errorMessage, errorDetails);
  }

  /**
   * Muestra el modal de errores de importación
   */
  private showImportErrorsModal(errors: ImportError[], fileName: string, totalRecords?: number, failedImports?: number, successfulImports?: number, duplicatesSkipped?: number): void {
    this.importErrors = errors;
    this.totalErrors = errors.length;
    this.totalRecordsImported = totalRecords || 0;
    this.failedImportsCount = failedImports || errors.length;
    this.successfulImports = successfulImports || 0;
    this.duplicatesOmitted = duplicatesSkipped || 0;
    
    this.showErrorModal = true;
  }

  /**
   * Muestra una notificación de error
   */
  private showErrorNotification(message: string, details: string): void {
    const detailMessage = details ? `${message}\n${details}` : message;
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error de Importación',
      detail: detailMessage,
      life: 8000
    });
  }

  // Navigation methods
  openConfigModal(): void {
    this.router.navigate(['/gen-masters/third-parties/configuration']);
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
  }

  openExportModal(): void {
    this.showExportModal = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }
  
  /**
   * Cierra el modal de errores de importación
   */
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.importErrors = [];
    this.totalErrors = 0;
  }
  
  /**
   * Obtiene la etiqueta amigable para el tipo de error
   */
  getErrorTypeLabel(errorType: string): string {
    const labels: { [key: string]: string } = {
      'VALIDATION_ERROR': 'Error de Validación',
      'REFERENCE_ERROR': 'Error de Referencia',
      'BUSINESS_RULE_ERROR': 'Error de Regla de Negocio',
      'DUPLICATE_ERROR': 'Error de Duplicado',
      'PROCESSING_ERROR': 'Error de Procesamiento'
    };
    return labels[errorType] || errorType;
  }

  /**
   * Abre el modal de detalles para un tercero específico
   * @param third Datos del tercero a mostrar
   */
  openDetailsModal(third: Third): void {
    this.detailsModalData = {
      title: `Detalles del Tercero - ${third.names || third.socialReason || 'Sin nombre'}`,
      thId: third.thId
    };
    this.showDetailsModal = true;
  }

  /**
   * Cierra el modal de detalles
   */
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsModalData = null;
  }

  /**
   * Maneja la selección de un archivo PDF RUT
   * Procesa el archivo y redirige a la creación del tercero
   */
  onPdfRutSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      return;
    }

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo inválido',
        detail: 'Por favor, selecciona un archivo PDF válido'
      });
      input.value = '';
      return;
    }

    this.loadingPdfRut = true;
    
    this.thirdService.ExtractInfoPDFRUT(file).subscribe({
      next: (response) => {
        const pdfContent = response.content;
        
        if (pdfContent === this.EMPTY_PDF_CONTENT) {
          this.messageService.add({
            severity: 'error',
            summary: 'Sin información',
            detail: 'No se encontró información para crear un tercero'
          });
          this.loadingPdfRut = false;
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Archivo procesado correctamente'
          });
          
          // Redirigir a la creación del tercero
          this.thirdService.setInfoThirdRUT(pdfContent);
          this.router.navigate(['/gen-masters/third-parties/create']);
        }
        
        // Limpiar el input
        input.value = '';
      },
      error: (err) => {
        this.loadingPdfRut = false;
        const errorMessage = err?.error?.message || 'No se pudo procesar el archivo PDF';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error de procesamiento',
          detail: errorMessage
        });
        
        // Limpiar el input
        input.value = '';
      }
    });
  }

  /**
   * Convierte un número de columna a letra de Excel
   * @param columnNumber Número de columna (1-based: 1=A, 2=B, ..., 26=Z, 27=AA, etc.)
   * @returns Letra(s) de columna correspondiente en Excel
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

  /**
   * Exporta los errores de importación a un archivo Excel
   * Genera un archivo con formato estructurado incluyendo resumen de estadísticas y detalle de errores
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
        ['ERRORES DE IMPORTACIÓN DE TERCEROS'],
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
        ['Duplicados omitidos:', this.duplicatesOmitted],
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
      const fileName = `Errores_Importacion_Terceros_${timestamp}.xlsx`;

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
        detail: `El archivo se ha exportado correctamente.`
      });

    } catch (error) {
      console.error('Error al exportar errores:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Exportación',
        detail: 'No se pudo exportar el archivo de errores. Por favor, intente nuevamente.'
      });
    }
  }
}