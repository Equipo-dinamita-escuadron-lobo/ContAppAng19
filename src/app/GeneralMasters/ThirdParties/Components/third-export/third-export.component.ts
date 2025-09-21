import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services and Models
import { ThirdService } from '../../Services/third.service';
import { Third } from '../../models/Third';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

// External libraries
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Definir el tipo de archivo y la extensión
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-third-export',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './third-export.component.html',
  styleUrl: './third-export.component.css'
})
export class ThirdExportComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos de entrada para el componente */
  @Input() inputData: any = {
    title: 'Exportar Terceros'
  };
  
  /** Evento emitido al cerrar el modal */
  @Output() close = new EventEmitter<void>();
  
  /** Lista de terceros a exportar */
  private listThirds: Third[] = [];
  
  /** Estado de carga */
  loading: boolean = false;
  
  /** Contador de terceros exportados */
  exportCount: number = 0;

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
   * Descarga el archivo Excel con los terceros
   * Configura el formato y estructura del archivo
   */
  downloadExcel(): void {
    try {
      // Definir las columnas del archivo Excel
      const data: any[] = [
        ['Tipo persona',
          'Tipos de tercero',
          'Nombres',
          'Apellidos',
          'Razon social',
          'Genero',
          'Tipo ID',
          'Identificacion',
          'Numero de verificacion',
          'Estado',
          'Pais',
          'Departamento',
          'Ciudad',
          'Direccion',
          'Telefono',
          'Correo']
      ];
      
      // Recorrer todas las cuentas y sus sub-cuentas
      this.listThirds.forEach(account => {
        this.addThirdToExcel(data, account);
      });
      
      // Crear una hoja de trabajo (worksheet) con los datos
      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
      
      // Ajustar el tamaño de las columnas
      worksheet['!cols'] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
      ];
      
      // Crear un libro de trabajo (workbook)
      const workbook: XLSX.WorkBook = { Sheets: { 'Sheet1': worksheet }, SheetNames: ['Sheet1'] };
      
      // Generar el archivo Excel
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Guardar el archivo
      this.saveAsExcelFile(excelBuffer, 'Terceros');
      
      // Mostrar mensaje de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: `Se exportaron ${this.exportCount} terceros correctamente`
      });
      
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de exportación',
        detail: 'No se pudo generar el archivo Excel'
      });
    }
  }

  /**
   * Función recursiva para agregar terceros al archivo Excel
   * @param data Array de datos para el Excel
   * @param third Tercero a agregar
   * @param level Nivel de profundidad (no usado actualmente)
   */
  addThirdToExcel(data: any[], third: Third, level: number = 0): void {
    // Combinar varios valores de `thirdTypes` en una cadena, si es un array
    const thirdTypes = Array.isArray(third.thirdTypes)
        ? [...new Set(third.thirdTypes.map(type => type.thirdTypeName))].join(', ')
        : third.thirdTypes;
    const thirdThipeId = third.typeId.typeId;
        
    // Convertir el estado booleano a "Activo" o "Inactivo"
    const state = third.state ? 'Activo' : 'Inactivo';
    
    // Agregar el tercero actual como una nueva fila en el Excel
    data.push([
      third.personType,
      thirdTypes,
      third.names || '',
      third.lastNames || '',
      third.socialReason || '',
      third.gender || '',
      thirdThipeId,
      third.idNumber,
      third.verificationNumber || '',
      state,
      third.country,
      third.province,
      third.city,
      third.address,
      third.phoneNumber,
      third.email,
    ]);
  }

  /**
   * Guarda el archivo Excel generado
   * @param buffer Buffer con los datos del Excel
   * @param fileName Nombre del archivo a guardar
   */
  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, fileName + EXCEL_EXTENSION);
  }

  /**
   * Obtiene el ID de la empresa desde localStorage
   * @returns ID de la empresa o cadena vacía si no existe
   */
  getIdEnterprise(): string {
    return this.localStorageMethods.getIdEnterprise();
  }

  /**
   * Obtiene los terceros desde la API y descarga el Excel
   * @returns Promesa que indica si la operación fue exitosa
   */
  async getThirds(): Promise<boolean> {
    this.loading = true;
    console.log('paso 2');
    
    try {
      const thirds = await new Promise<Third[]>((resolve, reject) => {
        this.thirdService.getThirdParties(this.getIdEnterprise(), 0).subscribe({
          next: (thirds) => resolve(thirds),
          error: (error) => reject(error)
        });
      });

      // Validar que se obtuvieron terceros válidos
      if (thirds && thirds.length > 0) {
        this.listThirds = thirds.filter(third => third !== null);
        this.exportCount = this.listThirds.length;
        this.downloadExcel(); // Descargar el Excel automáticamente
        this.loading = false;
        
        // Cerrar el modal después de la exportación exitosa
        setTimeout(() => {
          this.closeModal();
        }, 2000);
        
        return true; // Retorna true si se descargó el Excel
      } else {
        console.error('No se encontraron terceros válidos.');
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin datos',
          detail: 'No se encontraron terceros para exportar'
        });
        this.loading = false;
        return false; // Retorna false si no se encontraron terceros válidos
      }
    } catch (error) {
      console.error('Error al obtener terceros', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al obtener los terceros desde el servidor'
      });
      this.loading = false;
      return false; // Retorna false en caso de error
    }
  }

  /**
   * Inicia el proceso de exportación
   */
  startExport(): void {
    this.getThirds();
  }
}