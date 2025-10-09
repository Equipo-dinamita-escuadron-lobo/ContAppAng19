import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ListboxModule } from 'primeng/listbox';
import { PanelModule } from 'primeng/panel';

// Services
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-third-import',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    ListboxModule,
    PanelModule
  ],
  providers: [MessageService],
  templateUrl: './third-import.component.html',
  styleUrl: './third-import.component.css'
})
export class ThirdImportComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos de entrada para el componente */
  @Input() inputData: any = {
    title: 'Plantilla de Importación de Terceros'
  };
  
  /** Evento emitido al cerrar el modal */
  @Output() close = new EventEmitter<void>();

  /** ID de la empresa */
  private entData: string = '';

  /** Estado de carga de la descarga */
  downloading: boolean = false;

  /** Lista de campos obligatorios */
  requiredFields: string[] = [
    'Tipo persona',
    'Tipos de tercero',
    'Nombre, Apellido / Razón social',
    'Tipo ID',
    'Número de identificación',
    'Dígito de Verificación (DV)',
    'Dirección',
    'Teléfono',
    'Correo'
  ];

  /** Lista de campos opcionales */
  optionalFields: string[] = [
    'Género',
    'País',
    'Departamento',
    'Ciudad'
  ];

  constructor(
    private thirdService: ThirdService,
    private messageService: MessageService,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
  }

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  /**
   * Cierra el modal y emite el evento de cierre
   */
  closePopUp(): void {
    this.visible = false;
    this.close.emit();
  }

  /**
   * Descarga la plantilla Excel desde el backend
   * La plantilla incluye validaciones de datos según la configuración de la empresa
   */
  downloadExcel(): void {
    if (this.downloading) {
      return;
    }

    this.downloading = true;
    
    this.thirdService.downloadThirdTemplate(this.entData).subscribe({
      next: (blob: Blob) => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plantilla_Terceros_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar recursos
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.downloading = false;
        
        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga exitosa',
          detail: 'La plantilla se ha descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al descargar la plantilla:', error);
        this.downloading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error de descarga',
          detail: 'No se pudo descargar la plantilla. Intente nuevamente.'
        });
      }
    });
  }

  /**
   * Maneja el evento de visibilidad del diálogo
   */
  onHide(): void {
    this.closePopUp();
  }
}