import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { ThirdService } from '../../Services/third.service';

@Component({
  selector: 'app-third-creation-pdf-rut',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    FileUploadModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './third-creation-pdf-rut.component.html',
  styleUrl: './third-creation-pdf-rut.component.css'
})
export class ThirdCreationPdfRUTComponent {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos de entrada del componente */
  @Input() inputData: any = { title: 'Crear Tercero a partir del RUT' };
  
  /** Evento para cerrar el componente */
  @Output() close = new EventEmitter<void>();

  /** Referencia al componente de carga de archivos */
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  /** Archivo PDF seleccionado */
  selectedFile: File | null = null;

  /** Estado de carga durante el procesamiento */
  loading = false;

  /**
   * Constructor del componente
   */
  constructor(
    private thirdService: ThirdService, 
    private router: Router,
    private messageService: MessageService
  ) {}

  /**
   * Se ejecuta cuando se oculta el diálogo
   */
  onHide(): void {
    this.resetComponent();
    this.close.emit();
  }

  /**
   * Maneja el cambio de archivo seleccionado
   * Verifica que sea un PDF y lo carga
   */
  onFileSelect(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo cargado',
          detail: 'PDF seleccionado correctamente'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Archivo inválido',
          detail: 'Por favor, selecciona un archivo PDF válido'
        });
      }
    }
  }

  /**
   * Maneja errores en la carga de archivos
   */
  onFileError(event: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error de carga',
      detail: 'Error al cargar el archivo'
    });
  }

  /**
   * Sube el archivo PDF al servidor y procesa la información
   * Si la extracción es exitosa, redirige a la creación del tercero
   */
  uploadFile(): void {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo requerido',
        detail: 'Por favor selecciona un archivo PDF'
      });
      return;
    }

    this.loading = true;
    
    this.thirdService.ExtractInfoPDFRUT(this.selectedFile).subscribe({
      next: (response) => {
        const pdfContent = response.content;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Archivo procesado correctamente'
        });

        if (pdfContent === ";;0;;;;;;;;;0") {
          this.messageService.add({
            severity: 'error',
            summary: 'Sin información',
            detail: 'No se encontró información para crear un tercero'
          });
          this.loading = false;
        } else {
          this.redirectToCreateThird(pdfContent);
        }
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err?.error?.message || 'No se pudo procesar el archivo PDF';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de procesamiento',
          detail: errorMessage
        });
      }
    });
  }

  /**
   * Cierra el componente y reinicia los valores
   */
  closePopUp(): void {
    this.close.emit();
    this.resetComponent();
  }

  /**
   * Reinicia el estado del componente
   */
  private resetComponent(): void {
    this.selectedFile = null;
    this.loading = false;
    
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  /**
   * Redirige a la página de creación de tercero con la información extraída
   */
  private redirectToCreateThird(infoThird: string): void {
    this.thirdService.setInfoThirdRUT(infoThird); 
    this.router.navigate(['/gen-masters/third-parties/create']);
    this.closePopUp();
  }
}