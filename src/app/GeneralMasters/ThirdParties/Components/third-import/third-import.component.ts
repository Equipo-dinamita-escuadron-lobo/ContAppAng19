import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-third-import',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule
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

  constructor(private messageService: MessageService) {}

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
   * Descarga la plantilla Excel para importación de terceros
   * Utiliza un enlace temporal para la descarga del archivo
   */
  downloadExcel(): void {
    try {
      const fileUrl = '../../../../../../assets/data/thirds-parties/plantillaThirds.xlsx';
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = 'plantillaThirds.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Mostrar mensaje de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Descarga iniciada',
        detail: 'La plantilla se está descargando...'
      });
      
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de descarga',
        detail: 'No se pudo descargar la plantilla. Intente nuevamente.'
      });
    }
  }

  /**
   * Maneja el evento de visibilidad del diálogo
   */
  onHide(): void {
    this.closePopUp();
  }
}