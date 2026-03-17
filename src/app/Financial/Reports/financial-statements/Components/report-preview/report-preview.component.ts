import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ReportStyles {
  align: 'left' | 'center' | 'right';
  color: string;
  font: string;
  fontSize: number;
}

export interface ColumnDefinition {
  header: string;
  field?: string;
  type?: 'number' | 'percentage' | 'text';
  colspan?: number;
  rowspan?: number;
  children?: ColumnDefinition[];
}

@Component({
  selector: 'app-financial-statement-report-preview',
  imports: [CommonModule],
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportPreviewComponent {
  @Input() enterpriseData: any = null;
  @Input() reportTitle = '';
  @Input() generationDate: Date = new Date();
  @Input() criteria: { key: string; value: string }[] = [];
  @Input() headerConfig: ColumnDefinition[][] = [];
  @Input() previewData: any[] = [];
  @Input() totals: any = {};
  @Input() styles: ReportStyles | null = null;
  @Input() format: 'pdf' | 'excel' = 'pdf';

  get flatColumns(): ColumnDefinition[] {
    const flat: ColumnDefinition[] = [];

    if (!this.headerConfig || this.headerConfig.length === 0) {
      return flat;
    }

    const getLeafNodes = (node: ColumnDefinition): void => {
      if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          getLeafNodes(childNode);
        }
      } else if (node.field) {
        flat.push(node);
      }
    };

    for (const node of this.headerConfig[0]) {
      getLeafNodes(node);
    }

    return flat;
  }

  get leftCriteria(): { key: string; value: string }[] {
    const mid = Math.ceil(this.criteria.length / 2);
    return this.criteria.slice(0, mid);
  }

  get rightCriteria(): { key: string; value: string }[] {
    const mid = Math.ceil(this.criteria.length / 2);
    return this.criteria.slice(mid);
  }

  get hasTotals(): boolean {
    if (!this.totals || Object.keys(this.totals).length === 0) {
      return false;
    }

    return Object.values(this.totals).some(
      (value) => typeof value === 'number'
    );
  }

  get totalColspan(): number {
    if (!this.flatColumns) {
      return 1;
    }

    let numericColsAtEnd = 0;

    for (let i = this.flatColumns.length - 1; i >= 0; i -= 1) {
      if (this.flatColumns[i].type === 'number') {
        numericColsAtEnd += 1;
      } else {
        break;
      }
    }

    return this.flatColumns.length - numericColsAtEnd;
  }

  getNestedValue(obj: any, path: string): any {
    if (!path) {
      return '';
    }

    return path
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
  }

  getHeaderTextColor(hexColor: string): string {
    if (!hexColor) {
      return '#000000';
    }

    const hex = hexColor.replace('#', '');

    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    const luminosity = (r * 299 + g * 587 + b * 114) / 1000;
    return luminosity < 128 ? '#FFFFFF' : '#000000';
  }
}
