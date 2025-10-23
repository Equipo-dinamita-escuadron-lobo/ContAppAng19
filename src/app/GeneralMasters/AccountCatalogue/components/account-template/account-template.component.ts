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
import { ChartAccountService } from '../../services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-account-template',
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
  templateUrl: './account-template.component.html',
  styleUrl: './account-template.component.css'
})
export class AccountTemplateComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;

  /** Datos de entrada para el componente */
  @Input() inputData: any = {
    title: 'Plantilla de Importación de Catálogo de Cuentas'
  };

  /** Evento emitido al cerrar el modal */
  @Output() close = new EventEmitter<void>();

  /** ID de la empresa */
  private entData: string = '';

  /** Estado de carga de la descarga */
  downloading: boolean = false;

  /** Lista de campos obligatorios */
  requiredFields: string[] = [
    'Código',
    'Nombre',
    'Naturaleza',
    'Estado Financiero',
    'Clasificación'
  ];

  /** Lista de campos opcionales */
  optionalFields: string[] = [
    'Cruce',
    'Centro de Costo'
  ];

  constructor(
    private chartAccountService: ChartAccountService,
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
   * Descarga la plantilla Excel
   */
  downloadExcel(): void {
    if (this.downloading) {
      return;
    }

    this.downloading = true;

    this.chartAccountService.downloadTemplate(this.entData).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body as Blob;
        const contentDisposition = response.headers.get('content-disposition');

        if (!contentDisposition) {
          throw new Error('El backend no proporcionó el nombre del archivo en el header Content-Disposition');
        }

        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (!filenameMatch || !filenameMatch[1]) {
          throw new Error('No se pudo extraer el nombre del archivo del header Content-Disposition');
        }

        const filename = filenameMatch[1].replace(/['"]/g, '');

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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