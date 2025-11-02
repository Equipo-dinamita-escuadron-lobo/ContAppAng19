import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProductService } from '../../Services/product.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-products-template',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './products-template.component.html',
  styleUrl: './products-template.component.css'
})
export class ProductsTemplateComponent implements OnInit {
  @Input() visible: boolean = false;

  @Input() inputData: any = {
    title: 'Plantilla de Importación de Productos'
  };

  /** Evento emitido al cerrar el modal */
  @Output() close = new EventEmitter<void>();

  private entData: string = '';

  downloading: boolean = false;

  /** Lista de campos obligatorios */
  requiredFields: string[] = [
    'Nombre',
    'Unidad de Medida',
    'Tipo de Producto',
    'Categoría'
  ];

  optionalFields: string[] = [
    'Costo',
    'Cantidad'
  ];

  constructor(
    private readonly productService: ProductService,
    private readonly messageService: MessageService,
    private readonly localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
  }

  ngOnInit(): void {
  }

  
  closePopUp(): void {
    this.visible = false;
    this.close.emit();
  }

 
  downloadExcel(): void {
    if (this.downloading) {
      return;
    }

    this.downloading = true;

    this.productService.downloadTemplate(this.entData).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body as Blob;
        const contentDisposition = response.headers.get('content-disposition');

        if (!contentDisposition) {
          throw new Error('No se proporcionó el nombre del archivo en el header Content-Disposition');
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
        this.closePopUp();
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

  onHide(): void {
    this.closePopUp();
  }
}
