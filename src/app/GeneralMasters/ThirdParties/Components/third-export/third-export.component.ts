import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';

// Services and Models
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

interface OptionalField {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-third-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    CheckboxModule,
    RadioButtonModule
  ],
  providers: [MessageService],
  templateUrl: './third-export.component.html',
  styleUrl: './third-export.component.css'
})
export class ThirdExportComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Evento emitido al cerrar el modal */
  @Output() close = new EventEmitter<void>();
  
  /** Estado de carga */
  loading: boolean = false;
  
  /** Campos obligatorios */
  requiredFields: string[] = [
    'Tipo persona',
    'Tipos de tercero',
    'Nombre, Apellido / Razón social',
    'Tipo ID',
    'Número de Identificación',
    'Dígito de verificación (DV)',
    'Dirección',
    'Teléfono',
    'Correo'
  ];

  /** Campos opcionales con checkbox */
  optionalFields: OptionalField[] = [
    { label: 'Género', value: 'GENDER', selected: false },
    { label: 'País', value: 'COUNTRY', selected: false },
    { label: 'Departamento', value: 'STATE', selected: false },
    { label: 'Ciudad', value: 'CITY', selected: false }
  ];

  /** Filtro de estado */
  statusFilter: boolean | null = null;

  /** Opciones de estado */
  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ];

  /**
   * Constructor del componente
   * @param thirdService Servicio para gestionar terceros
   * @param messageService Servicio para mostrar mensajes
   * @param localStorageMethods Servicio para manejar localStorage
   */
  constructor(
    private thirdService: ThirdService,
    private messageService: MessageService,
    private localStorageMethods: LocalStorageMethods
  ) { }

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  /**
   * Cierra el modal y emite el evento de cierre
   */
  closeModal(): void {
    this.visible = false;
    this.close.emit();
  }

  /**
   * Maneja el evento de visibilidad del diálogo
   */
  onHide(): void {
    this.closeModal();
  }

  /**
   * Obtiene el ID de la empresa desde localStorage
   * @returns ID de la empresa o cadena vacía si no existe
   */
  private getIdEnterprise(): string {
    return this.localStorageMethods.getIdEnterprise();
  }

  /**
   * Obtiene el nombre de la empresa desde localStorage
   * @returns Nombre de la empresa
   */
  private getCompanyName(): string {
    const entData = this.localStorageMethods.loadEnterpriseData();
    return entData?.name || '';
  }

  /**
   * Obtiene los campos opcionales seleccionados
   * @returns Array con los valores de los campos opcionales seleccionados
   */
  private getSelectedOptionalFields(): string[] {
    return this.optionalFields
      .filter(field => field.selected)
      .map(field => field.value);
  }

  /**
   * Procesa la respuesta HTTP para descargar el archivo
   * @param response La respuesta HTTP que contiene el blob y las cabeceras
   */
  private downloadFile(response: any): void {
    const blob = response.body;
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'terceros.xlsx'; // Nombre por defecto

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
   * Inicia el proceso de exportación
   */
  startExport(): void {
    this.loading = true;
    const enterpriseId = this.getIdEnterprise();
    const companyName = this.getCompanyName();
    const selectedFields = this.getSelectedOptionalFields();

    this.thirdService.exportToExcel(enterpriseId, companyName, this.statusFilter, selectedFields).subscribe({
      next: (response) => {
        if (!response.body) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Exportación',
            detail: 'No se recibió el archivo del servidor'
          });
          this.loading = false;
          return;
        }

        this.downloadFile(response);

        const statusText = this.statusFilter === true ? 'activos' : this.statusFilter === false ? 'inactivos' : 'todos';
        this.messageService.add({
          severity: 'success',
          summary: 'Exportación Exitosa',
          detail: `Se han exportado los terceros ${statusText} correctamente`
        });

        this.loading = false;

        // Cerrar el modal después de la exportación exitosa
        setTimeout(() => {
          this.closeModal();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al exportar terceros:', err);

        // Intentar leer el mensaje de error si es un blob
        if (err.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo exportar los terceros.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: errorMessage
              });
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: 'Ocurrió un error inesperado al exportar terceros.'
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
          reader.readAsText(err.error);
        } else {
          const errorMessage = err.error?.message || 'No se pudo exportar los terceros.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Exportación',
            detail: errorMessage
          });
        }

        this.loading = false;
      }
    });
  }
}