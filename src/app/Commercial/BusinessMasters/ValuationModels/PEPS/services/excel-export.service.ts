import { Injectable } from '@angular/core';
import { ProductResponse } from '../models/ProductResponse';
import { KardexRecordsDTOResponse, Balance, SaleDetail } from '../models/KardexResponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Procesa los datos del kardex PEPS con lotes apilados en una sola fila
   */
  processKardexData(rawList: KardexRecordsDTOResponse[]): any[][] {
    const exportData: any[][] = [];

    rawList.forEach((record) => {
      const formattedDate = this.formatDate(record.date);

  
      let salidaCantidad = '';
      let salidaVrUnitario = '';
      let salidaVrTotal = '';

      if (record.outputDetails && record.outputDetails.length > 0) {
        const cantidades = record.outputDetails.map(o => o.quantityUsed.toString());
        const vrUnitarios = record.outputDetails.map(o => this.formatCurrencyValue(o.unitPrice));
        const vrTotales = record.outputDetails.map(o => this.formatCurrencyValue(o.totalPrice));

        salidaCantidad = cantidades.join('\n');
        salidaVrUnitario = vrUnitarios.join('\n');
        salidaVrTotal = vrTotales.join('\n');
      }

      // Procesar SALDOS
      let saldoCantidad = '';
      let saldoVrUnitario = '';
      let saldoVrTotal = '';

      if (record.balance && record.balance.length > 0) {
        const cantidades = record.balance.map(b => b.quantity.toString());
        const vrUnitarios = record.balance.map(b => this.formatCurrencyValue(b.unitPrice));
        const vrTotales = record.balance.map(b => this.formatCurrencyValue(b.totalPrice));

        saldoCantidad = cantidades.join('\n');
        saldoVrUnitario = vrUnitarios.join('\n');
        saldoVrTotal = vrTotales.join('\n');
      } else {
        saldoCantidad = '0';
        saldoVrUnitario = '-';
        saldoVrTotal = '$0.00';
      }

      const outputQuantity = this.calculateOutputQuantity(record.outputDetails);

      let valorUnitario: any;
      let cantidad: any;

      if (record.entryQuantity) {
        cantidad = record.entryQuantity;
        valorUnitario = record.entryUnitPrice 
          ? { v: record.entryUnitPrice, t: 'n', z: '$#,##0.00' }
          : '-';
      } else if (outputQuantity > 0) {
        cantidad = outputQuantity;
        valorUnitario = '-';
      } else {
        cantidad = '';
        valorUnitario = '-';
      }

      const row = [
        formattedDate,
        record.detail,
        cantidad,
        valorUnitario,
        record.entryQuantity || '',
        record.entryUnitPrice ? { v: record.entryUnitPrice, t: 'n', z: '$#,##0.00' } : '',
        record.entryTotalPrice ? { v: record.entryTotalPrice, t: 'n', z: '$#,##0.00' } : '',
        salidaCantidad,
        salidaVrUnitario,
        salidaVrTotal,
        saldoCantidad,
        saldoVrUnitario,
        saldoVrTotal
      ];

      exportData.push(row);
    });

    return exportData;
  }

  /**
   * Exporta el kardex con formato profesional y bonito
   */
  exportKardexToExcel(
    rawList: KardexRecordsDTOResponse[],
    product: ProductResponse,
    startDate: Date | null,
    endDate: Date | null
  ): void {
    const processedData = this.processKardexData(rawList);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    const productName = product?.name || 'Producto no especificado';
    const productReference = product?.reference || 'N/A';
    const productPresentation = product?.presentation || 'N/A';
    const dateRange = (startDate && endDate)
      ? `${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`
      : 'Todos los registros';

    // Encabezado con información del producto
    const headerInfo = [
      ['KARDEX - MÉTODO PEPS (FIFO)'],
      [''],
      ['Producto:', productName],
      ['Referencia:', productReference],
      ['Presentación:', productPresentation],
      ['Rango de fechas:', dateRange],
      ['Fecha de exportación:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['']
    ];

    XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });

    // Encabezados de la tabla
    const tableHeadersGroup = [
      ['Fecha', 'Detalle', 'Cant', 'VR Unit', 'Entradas', '', '', 'Salidas', '', '', 'Saldo', '', '']
    ];

    const tableHeadersSub = [
      ['', '', '', '', 'Cant', 'Vr Unit', 'Vr Total', 'Cant', 'Vr Unit', 'Vr Total', 'Cant', 'Vr Unit', 'Vr Total']
    ];

    XLSX.utils.sheet_add_aoa(ws, tableHeadersGroup, { origin: 'A10' });
    XLSX.utils.sheet_add_aoa(ws, tableHeadersSub, { origin: 'A11' });
    XLSX.utils.sheet_add_aoa(ws, processedData, { origin: 'A12' });

    const totalRows = headerInfo.length + 3 + processedData.length;
    ws['!ref'] = `A1:M${totalRows}`;

    ws['!cols'] = [
      { wch: 15 }, { wch: 35 }, { wch: 8 }, { wch: 12 },
      { wch: 8 }, { wch: 12 }, { wch: 15 },
      { wch: 8 }, { wch: 12 }, { wch: 15 },
      { wch: 8 }, { wch: 12 }, { wch: 15 }
    ];

    // ✨ APLICAR ESTILOS BONITOS ✨

    // Estilo para el título principal (fila 1)
    const titleCell = ws['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { name: 'Arial', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }

    // Estilo para información del producto (filas 3-7)
    for (let row = 2; row <= 6; row++) {
      ['A', 'B'].forEach(col => {
        const cell = ws[`${col}${row + 1}`];
        if (cell) {
          cell.s = {
            font: { name: 'Arial', sz: 10, bold: col === 'A' },
            alignment: { horizontal: col === 'A' ? 'right' : 'left', vertical: 'center' }
          };
        }
      });
    }

  
    for (let col = 0; col < 13; col++) {
      const colLetter = XLSX.utils.encode_col(col);
      
      
      const headerCell1 = ws[`${colLetter}11`];
      if (headerCell1) {
        headerCell1.s = {
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2F5496' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }

      const headerCell2 = ws[`${colLetter}12`];
      if (headerCell2) {
        headerCell2.s = {
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '5B9BD5' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }


    const dataStartRow = 11;
    for (let i = 0; i < processedData.length; i++) {
      const rowIndex = dataStartRow + i;
      const isEvenRow = i % 2 === 0;

      for (let col = 0; col < 13; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const cellAddress = `${colLetter}${rowIndex + 1}`;
        
        if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
        
        ws[cellAddress].s = {
          font: { name: 'Arial', sz: 10 },
          fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'F2F2F2' } },
          alignment: { 
            horizontal: col <= 1 ? 'left' : 'center', 
            vertical: 'top', 
            wrapText: col >= 7  
          },
          border: {
            top: { style: 'thin', color: { rgb: 'D3D3D3' } },
            bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
            left: { style: 'thin', color: { rgb: 'D3D3D3' } },
            right: { style: 'thin', color: { rgb: 'D3D3D3' } }
          }
        };
      }
    }

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } });
    ws['!merges'].push({ s: { r: 9, c: 0 }, e: { r: 10, c: 0 } });
    ws['!merges'].push({ s: { r: 9, c: 1 }, e: { r: 10, c: 1 } });
    ws['!merges'].push({ s: { r: 9, c: 2 }, e: { r: 10, c: 2 } });
    ws['!merges'].push({ s: { r: 9, c: 3 }, e: { r: 10, c: 3 } });
    ws['!merges'].push({ s: { r: 9, c: 4 }, e: { r: 9, c: 6 } });
    ws['!merges'].push({ s: { r: 9, c: 7 }, e: { r: 9, c: 9 } });
    ws['!merges'].push({ s: { r: 9, c: 10 }, e: { r: 9, c: 12 } });

    XLSX.utils.book_append_sheet(wb, ws, 'Kardex PEPS');

    const fileName = `Kardex_PEPS_${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }



  private calculateOutputQuantity(outputDetails: SaleDetail[] | null): number {
    if (!outputDetails || outputDetails.length === 0) return 0;
    return outputDetails.reduce((sum, detail) => sum + detail.quantityUsed, 0);
  }

  private calculateOutputTotalPrice(outputDetails: SaleDetail[] | null): number {
    if (!outputDetails || outputDetails.length === 0) return 0;
    return outputDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).replace(/ de /g, '-');
  }

  private formatCurrencyValue(value: number): string {
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
