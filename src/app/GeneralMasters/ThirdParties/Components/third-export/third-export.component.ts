import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ThirdServiceService } from '../../services/third-service.service';
import { Third } from '../../models/Third';
// Definir el tipo de archivo y la extensión
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-third-export',
  imports: [],
  templateUrl: './third-export.component.html',
  styleUrl: './third-export.component.css'
})

export class ThirdExportComponent {
  /** Lista de terceros a exportar */
  private listThirds: Third[] = [];
  /**
   * Constructor del componente
   * @param thirdService Servicio para gestionar terceros
   */
  constructor(private thirdService: ThirdServiceService) { }
  /**
   * Descarga el archivo Excel con los terceros
   * Configura el formato y estructura del archivo
   */
  downloadExcel() {
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
    const entData = localStorage.getItem('entData');
    return entData ? JSON.parse(entData).entId : '';
  }
  /**
   * Obtiene los terceros desde la API y descarga el Excel
   * @returns Promesa que indica si la operación fue exitosa
   */
  getThirds(): Promise<boolean> {
    console.log('paso 2')
    return new Promise((resolve) => {
      this.thirdService.getThirdParties(this.getIdEnterprise(), 0).subscribe({
        next: (thirds) => {
          // Validar que se obtuvieron terceros válidos
          if (thirds && thirds.length > 0) {
            this.listThirds = thirds.filter(third => third !== null);
            this.downloadExcel(); // Descargar el Excel automáticamente
            resolve(true); // Retorna true si se descargó el Excel
          } else {
            console.error('No se encontraron terceros válidos.');
            resolve(false); // Retorna false si no se encontraron terceros válidos
          }
        },
        error: (error) => {
          console.error('Error al obtener terceros', error);
          resolve(false); // Retorna false en caso de error
        }
      });
    });
  }
}