import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule, FileSelectEvent, FileUploadErrorEvent } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { ThirdService } from '../../Services/third.service';

// Constantes
const DIALOG_TITLE = 'Crear Tercero a partir del RUT';
const EMPTY_PDF_CONTENT = ';;0;;;;;;;;;0';
const MAX_FILE_SIZE = 50000000; // 50 MB

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
  
  /** Evento para cerrar el componente */
  @Output() close = new EventEmitter<void>();

  /** Referencia al componente de carga de archivos */
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  /** Archivo PDF seleccionado */
  selectedFile: File | null = null;

  /** Estado de carga durante el procesamiento */
  loading = false;

  /** Título del diálogo (constante para el template) */
  readonly dialogTitle = DIALOG_TITLE;

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
  onFileSelect(event: FileSelectEvent): void {
    const files = event.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        
        this.showSuccessMessage('Archivo cargado', 'PDF seleccionado correctamente');
      } else {
        this.handleInvalidFileType();
      }
    }
  }

  /**
   * Maneja errores en la carga de archivos
   */
  onFileError(event: FileUploadErrorEvent): void {
    this.messageService.clear();
    
    if (event.error) {
      this.showErrorMessage('Archivo inválido', 'Por favor, selecciona un archivo PDF válido');
    } else {
      this.showErrorMessage('Error de carga', 'Error al cargar el archivo');
    }
  }

  /**
   * Maneja el caso de tipo de archivo inválido
   */
  private handleInvalidFileType(): void {
    this.messageService.clear();
    this.showErrorMessage('Archivo inválido', 'Por favor, selecciona un archivo PDF válido');
    this.selectedFile = null;
    
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  /**
   * Sube el archivo PDF al servidor y procesa la información
   * Si la extracción es exitosa, redirige a la creación del tercero
   */
  uploadFile(): void {
    if (!this.selectedFile) {
      this.showWarningMessage('Archivo requerido', 'Por favor selecciona un archivo PDF');
      return;
    }

    this.loading = true;
    
    this.thirdService.ExtractInfoPDFRUT(this.selectedFile).subscribe({
      next: (response) => {
        const pdfContent = response.content;

        if (pdfContent === EMPTY_PDF_CONTENT) {
          this.showErrorMessage('Sin información', 'No se encontró información para crear un tercero');
          this.loading = false;
        } else {
          // Navegar inmediatamente a la página de creación (la notificación se mostrará allí)
          this.redirectToCreateThird(pdfContent);
        }
      },
      error: (err) => {
        this.loading = false;        
        const errorMessage = err?.error?.message || 'No se pudo procesar el archivo PDF';        
        this.showErrorMessage('Error de procesamiento', errorMessage);
      }
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  private showSuccessMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail
    });
  }

  /**
   * Muestra un mensaje de error
   */
  private showErrorMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  private showWarningMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail
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