import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// INTERFACES (Definen el "contrato" del componente)
export interface ReportStyles {
  align: 'left' | 'center' | 'right';
  color: string;
  font: string;
  fontSize: number;
}

export interface ColumnDefinition {
  header: string;
  field?: string; // El campo en el objeto de datos
  type?: 'number' | 'text';
  colspan?: number;
  rowspan?: number;
  children?: ColumnDefinition[]; // Para cabeceras anidadas
}

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [CommonModule],
  providers: [],
  templateUrl: './report-preview.component.html',
  styleUrls: ['./report-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimización de rendimiento
})
export class ReportPreviewComponent {
  // --- ENTRADAS DEL COMPONENTE ---
  @Input() enterpriseData: any = null;
  @Input() reportTitle: string = '';
  @Input() generationDate: Date = new Date();
  @Input() criteria: { key: string; value: string }[] = [];

  @Input() headerConfig: ColumnDefinition[][] = []; // Acepta una estructura de múltiples filas
  @Input() previewData: any[] = [];
  @Input() totals: any = {}; // ✅ NUEVO: Input para recibir los totales.

  @Input() styles: ReportStyles | null = null;
  @Input() format: 'pdf' | 'excel' = 'pdf';

  get flatColumns(): ColumnDefinition[] {
    const flat: ColumnDefinition[] = [];
    if (this.headerConfig && this.headerConfig.length > 0) {
      const getLeafNodes = (node: ColumnDefinition) => {
        if (node.children && node.children.length > 0) {
          for (let childNode of node.children) {
            getLeafNodes(childNode);
          }
        } else if (node.field) {
          flat.push(node);
        }
      };
      for (let node of this.headerConfig[0]) {
        getLeafNodes(node);
      }
    }
    return flat;
  }

  // Lógica para alinear el encabezado principal
  get headerAlignClass() {
    if (!this.styles) return 'justify-between'; // Comportamiento por defecto
    switch (this.styles.align) {
      case 'left':
        return 'justify-between';
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-between flex-row-reverse';
      default:
        return 'justify-between';
    }
  }

  /**
   * ✅ NUEVO: Getters para dividir los criterios en dos columnas.
   * Esto mantiene la lógica fuera del template.
   */
  get leftCriteria(): { key: string; value: string }[] {
    const mid = Math.ceil(this.criteria.length / 2);
    return this.criteria.slice(0, mid);
  }

  get rightCriteria(): { key: string; value: string }[] {
    const mid = Math.ceil(this.criteria.length / 2);
    return this.criteria.slice(mid);
  }

  /**
   * ✅ NUEVO: Verifica si hay totales válidos para mostrar en el footer.
   * Devuelve true si el objeto 'totals' tiene al menos una clave con un valor numérico.
   */
  get hasTotals(): boolean {
    if (!this.totals || Object.keys(this.totals).length === 0) {
      return false;
    }
    return Object.values(this.totals).some(
      (value) => typeof value === 'number'
    );
  }

  /**
   * ✅ NUEVO: Calcula el colspan para la celda de texto "TOTAL" en el footer.
   * Se basa en el número de columnas que no son numéricas al final.
   */
  get totalColspan(): number {
    if (!this.flatColumns) return 1;

    let numericColsAtEnd = 0;
    for (let i = this.flatColumns.length - 1; i >= 0; i--) {
      if (this.flatColumns[i].type === 'number') numericColsAtEnd++;
      else break;
    }
    return this.flatColumns.length - numericColsAtEnd;
  }
  // --- FUNCIONES DE AYUDA (MOVIMOS LA LÓGICA AQUÍ) ---

  getNestedValue(obj: any, path: string): any {
    if (!path) return '';
    return path
      .split('.')
      .reduce((o, key) => (o && o[key] !== undefined ? o[key] : ''), obj);
  }

  getHeaderTextColor(hexColor: string): string {
    if (hexColor.length === 0) return '#000000';
    else {
      const hex = hexColor.replace('#', '');
      const r = Number.parseInt(hex.substring(0, 2), 16);
      const g = Number.parseInt(hex.substring(2, 4), 16);
      const b = Number.parseInt(hex.substring(4, 6), 16);
      const luminosity = (r * 299 + g * 587 + b * 114) / 1000;
      return luminosity < 128 ? '#FFFFFF' : '#000000';
    }
  }
}
