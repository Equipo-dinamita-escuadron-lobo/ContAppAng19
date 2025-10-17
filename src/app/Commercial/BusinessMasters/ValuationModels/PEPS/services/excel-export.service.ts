import { Injectable } from '@angular/core';
import { ProductResponse } from '../models/ProductResponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


export interface KardexExportData {
  Fecha: string;
  Detalle: string;
  Cantidad: number;
  'Valor Unitario': number;
  'Entrada - Cantidad': number | string;
  'Entrada - Valor Unitario': number | string;
  'Entrada - Valor Total': number | string;
  'Salida - Cantidad': number | string;
  'Salida - Valor Unitario': number | string;
  'Salida - Valor Total': number | string;
  'Saldo - Cantidad': number;
  'Saldo - Valor Unitario': number;
  'Saldo - Valor Total': number;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Procesa los datos crudos del kardex para el formato de exportación
   */
  processKardexData(rawList: any[]): KardexExportData[] {
    return rawList.map((item: any) => {
      const balanceTotal = item.totalBalance;
      let entryQuantity: number | string = '';
      let entryUnitPrice: number | string = '';
      let entryTotal: number | string = '';
      let exitQuantity: number | string = '';
      let exitUnitPrice: number | string = '';
      let exitTotal: number | string = '';

      if (item.type === 'PURCHASE') {
        entryQuantity = item.quantity;
        entryUnitPrice = parseFloat(item.unitPrice);
        entryTotal = Number(entryQuantity) * Number(entryUnitPrice);
      }
      if (item.type === 'PURCHASERETURN') {
        entryQuantity = -item.quantity;
        entryUnitPrice = parseFloat(item.unitPrice);
        entryTotal = Number(entryQuantity) * Number(entryUnitPrice);
      }
      if (item.type === 'SALE') {
        exitQuantity = item.quantity;
        exitUnitPrice = parseFloat(item.unitPrice);
        exitTotal = Number(exitQuantity) * Number(exitUnitPrice);
      }
      if (item.type === 'SALESRETURN') {
        exitQuantity = -item.quantity;
        exitUnitPrice = parseFloat(item.unitPrice);
        exitTotal = Number(exitQuantity) * Number(exitUnitPrice);
      }

      const formattedDate = new Date(item.date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).replace(/ de /g, '-');

      return {
        Fecha: formattedDate,
        Detalle: item.details,
        Cantidad: item.quantity,
        'Valor Unitario': item.unitPrice,
        'Entrada - Cantidad': entryQuantity,
        'Entrada - Valor Unitario': entryUnitPrice,
        'Entrada - Valor Total': entryTotal,
        'Salida - Cantidad': exitQuantity,
        'Salida - Valor Unitario': exitUnitPrice,
        'Salida - Valor Total': exitTotal,
        'Saldo - Cantidad': item.balanceQuantity,
        'Saldo - Valor Unitario': item.balanceUnitPrice,
        'Saldo - Valor Total': balanceTotal
      };
    });
  }

  /**
     * Exporta los datos del kardex a un archivo Excel
     */
    exportKardexToExcel(
      processedData: KardexExportData[],
      product: ProductResponse,
      startDate: Date | null,
      endDate: Date | null
    ): void {
      // Crear el workbook y worksheet vacío
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = {};
  
      // Agregar metadatos en las primeras filas
      const productName = product?.name || 'Producto no especificado';
      const productReference = product?.reference || 'N/A';
      const dateRange = (startDate && endDate)
        ? `${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`
        : 'Todos los registros';
  
      // Información del encabezado
      const headerInfo = [
        ['KARDEX - PROMEDIO PONDERADO'],
        [''],
        ['Producto:', productName],
        ['Referencia:', productReference],
        ['Rango de fechas:', dateRange],
        ['Fecha de exportación:', new Date().toLocaleDateString('es-CO')],
        [''],
        ['']
      ];
  
      // Agregar la información del encabezado
      XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });
  
      // Crear encabezados de la tabla con estructura jerárquica
      // Primera fila de encabezados (grupos principales)
      const tableHeadersGroup = [
        ['Fecha', 'Detalle', 'Cantidad', 'Valor Unitario', 'Entradas', '', '', 'Salidas', '', '', 'Saldo', '', '']
      ];
  
      // Segunda fila de encabezados (sub-columnas)
      const tableHeadersSub = [
        ['', '', '', '', 'Cantidad', 'Valor Unitario', 'Valor Total', 'Cantidad', 'Valor Unitario', 'Valor Total', 'Cantidad', 'Valor Unitario', 'Valor Total']
      ];
  
      // Agregar encabezados de la tabla en las filas 9 y 10
      XLSX.utils.sheet_add_aoa(ws, tableHeadersGroup, { origin: 'A9' });
      XLSX.utils.sheet_add_aoa(ws, tableHeadersSub, { origin: 'A10' });
  
      // Agregar los datos de la tabla
      const tableData = processedData.map((item: any) => [
        item.Fecha,
        item.Detalle,
        item.Cantidad,
        { v: item['Valor Unitario'], t: 'n', z: '$#,##0.00' },
        item['Entrada - Cantidad'],
        item['Entrada - Valor Unitario'] !== '' ? { v: item['Entrada - Valor Unitario'], t: 'n', z: '$#,##0.00' } : '',
        item['Entrada - Valor Total'] !== '' ? { v: item['Entrada - Valor Total'], t: 'n', z: '$#,##0.00' } : '',
        item['Salida - Cantidad'],
        item['Salida - Valor Unitario'] !== '' ? { v: item['Salida - Valor Unitario'], t: 'n', z: '$#,##0.00' } : '',
        item['Salida - Valor Total'] !== '' ? { v: item['Salida - Valor Total'], t: 'n', z: '$#,##0.00' } : '',
        item['Saldo - Cantidad'],
        { v: item['Saldo - Valor Unitario'], t: 'n', z: '$#,##0.00' },
        { v: item['Saldo - Valor Total'], t: 'n', z: '$#,##0.00' }
      ]);
  
      XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A11', cellDates: true });
  
      // Establecer el rango de la hoja
      const totalRows = headerInfo.length + 2 + tableData.length; // +2 por las dos filas de encabezados
      const totalCols = 13; // M (13 columnas)
      ws['!ref'] = `A1:${XLSX.utils.encode_col(totalCols - 1)}${totalRows}`;
  
      // Configurar anchos de columnas
      ws['!cols'] = [
        { wch: 15 }, // A - Fecha
        { wch: 30 }, // B - Detalle
        { wch: 12 }, // C - Cantidad
        { wch: 15 }, // D - Valor Unitario
        { wch: 12 }, // E - Entrada Cantidad
        { wch: 18 }, // F - Entrada Valor Unitario
        { wch: 18 }, // G - Entrada Valor Total
        { wch: 12 }, // H - Salida Cantidad
        { wch: 18 }, // I - Salida Valor Unitario
        { wch: 18 }, // J - Salida Valor Total
        { wch: 12 }, // K - Saldo Cantidad
        { wch: 18 }, // L - Saldo Valor Unitario
        { wch: 18 }  // M - Saldo Valor Total
      ];
  
      // Combinar celdas para el título y encabezados de grupos
      if (!ws['!merges']) ws['!merges'] = [];
  
      // Título principal
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }); // A1:M1
  
      // Combinar celdas para los encabezados individuales que no tienen subcolumnas
      ws['!merges'].push({ s: { r: 8, c: 0 }, e: { r: 9, c: 0 } }); // Fecha (A9:A10)
      ws['!merges'].push({ s: { r: 8, c: 1 }, e: { r: 9, c: 1 } }); // Detalle (B9:B10)
      ws['!merges'].push({ s: { r: 8, c: 2 }, e: { r: 9, c: 2 } }); // Cantidad (C9:C10)
      ws['!merges'].push({ s: { r: 8, c: 3 }, e: { r: 9, c: 3 } }); // Valor Unitario (D9:D10)
  
      // Combinar celdas para los grupos principales
      ws['!merges'].push({ s: { r: 8, c: 4 }, e: { r: 8, c: 6 } }); // Entradas (E9:G9)
      ws['!merges'].push({ s: { r: 8, c: 7 }, e: { r: 8, c: 9 } }); // Salidas (H9:J9)
      ws['!merges'].push({ s: { r: 8, c: 10 }, e: { r: 8, c: 12 } }); // Saldo (K9:M9)
  
      XLSX.utils.book_append_sheet(wb, ws, 'Kardex');
  
      // Generar el nombre del archivo
      const fileName = `Kardex_${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
      // Guardar el archivo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    }


}
