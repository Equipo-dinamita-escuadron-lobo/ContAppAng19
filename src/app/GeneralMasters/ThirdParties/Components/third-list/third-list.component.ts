import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

// Componentes internos
import { ThirdImportComponent } from '../third-import/third-import.component';
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
    ThirdImportComponent,
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
  showDetailView = false;
  globalFilterValue = '';
  
  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;
  
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

  /** Datos para el modal de detalles */
  detailsModalData: any = null;
  createPdfRUT = false;
  
  // Company data
  entData: string = '';

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
   * Carga la lista de terceros
   */
  loadThirds(): void {
    this.loading = true;
    this.thirdService.getThirdList(this.entData).subscribe({
      next: (data: Third[]) => {
        this.thirds = data || [];
        this.totalRecords = this.thirds.length;
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
    this.globalFilterValue = target.value;
    this.dt.filterGlobal(target.value, 'contains');
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
    const action = third.state ? 'desactivar' : 'activar';
    const severity = third.state ? 'warn' : 'info';
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea ${action} este tercero?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.thirdService.changeThirdPartieState(third.thId).subscribe({
          next: () => {
            third.state = !third.state;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Tercero ${action} correctamente`
            });
          },
          error: (error) => {
            console.error('Error changing third state:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al ${action} el tercero`
            });
          }
        });
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
        summary: 'Error',
        detail: 'El archivo debe ser de tipo xlsx'
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
    
    console.log('Iniciando importación de terceros...');
    console.log('Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
    console.log('ID Empresa:', this.entData);
    
    this.thirdService.importFromExcel(this.entData, file).subscribe({
      next: (response) => {
        this.loading = false;
        const importResult = response.body;
        
        if (importResult) {
          const { status, totalRecords, successfulImports, failedImports, duplicatesSkipped, errors } = importResult;
          
          // Si hay errores, mostrar modal de errores
          if (errors && errors.length > 0) {
            this.showImportErrorsModal(errors, importResult.fileName || file.name);
            return;
          }
          
          // Si no hay errores, mostrar resumen de importación
          let severity: 'success' | 'info' | 'warn' | 'error' = 'success';
          let summary = 'Importación Exitosa';
          
          if (status === 'FAILED') {
            severity = 'error';
            summary = 'Error en Importación';
          } else if (status === 'COMPLETED_WITH_ERRORS') {
            severity = 'warn';
            summary = 'Importación Completada con Errores';
          }
          
          // Construir mensaje detallado
          let detail = `Total procesados: ${totalRecords || 0}\n`;
          detail += `Exitosos: ${successfulImports || 0}\n`;
          if (failedImports > 0) {
            detail += `Fallidos: ${failedImports}\n`;
          }
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
        console.error('Error completo:', error);
        this.loading = false;
        
        // Extraer los errores del backend
        if (error.error && typeof error.error === 'object') {
          const errorResponse = error.error;
          const errors = errorResponse.errors || [];
          
          if (errors && errors.length > 0) {
            // Mostrar modal de errores
            this.showImportErrorsModal(errors, errorResponse.fileName || file.name);
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
  private showImportErrorsModal(errors: ImportError[], fileName: string): void {
    this.importErrors = errors;
    this.totalErrors = errors.length;
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

  openCreatePDFRunt(): void {
    this.createPdfRUT = true;
  }

  closeCreatePDFRunt(): void {
    this.createPdfRUT = false;
  }
}