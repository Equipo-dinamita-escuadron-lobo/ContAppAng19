import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  ReportPreviewComponent,
  ColumnDefinition,
  ReportStyles,
} from './Components/report-preview/report-preview.component';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
  selector: 'app-export-auxiliary-book',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    ColorPickerModule,
    TooltipModule,
    FieldsetModule,
    ReportPreviewComponent,
  ],
  templateUrl: './export-auxiliary-book.component.html',
})
export class ExportAuxiliaryBookComponent implements OnInit {
  // --- DATOS RECIBIDOS PARA LA PREVISUALIZACIÓN ---
  previewData: any[] = [];
  headerConfig: ColumnDefinition[][] = [];
  reportTitle: string = 'Reporte Auxiliar';
  companyName: string = 'Mi Empresa S.A.S';
  generationDate: Date = new Date();
  criteria: { key: string; value: string }[] = [];
  totals: any = {}; // ✅ NUEVO: Propiedad para almacenar los totales.

  // --- ESTADO DE LAS OPCIONES ---
  formatSelected: 'pdf' | 'excel' = 'pdf';
  styles: ReportStyles = {
    align: 'left',
    color: '#2d3748',
    font: 'Arial',
    fontSize: 12,
  };

  // --- OPCIONES PARA LOS CONTROLES DEL FORMULARIO ---
  formatOptions = [
    { label: 'PDF', icon: 'pi pi-file-pdf', value: 'pdf' },
    { label: 'Excel', icon: 'pi pi-file-excel', value: 'excel' },
  ];
  templates = [{ code: 'default', name: 'Plantilla por defecto' }];
  selectedTemplate: any = null;

  alignOptions = [
    { icon: 'pi pi-align-left', value: 'left', tooltip: 'Izquierda' },
    { icon: 'pi pi-align-center', value: 'center', tooltip: 'Centro' },
    { icon: 'pi pi-align-right', value: 'right', tooltip: 'Derecha' },
  ];

  fonts = [
    { name: 'Arial', value: 'Arial' },
    { name: 'Calibri', value: 'Calibri' },
    { name: 'Roboto', value: 'Roboto' },
  ];

  fontSizes = [
    { label: 'Pequeño (10px)', value: 10 },
    { label: 'Normal (12px)', value: 12 },
    { label: 'Grande (14px)', value: 14 },
  ];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  // ✅ NUEVO: Diccionarios para la traducción de criterios.
  private criteriaKeyMap: { [key: string]: string } = {
    criteriaType: 'Tipo de Nivel',
    criteriaRange: 'Rango de Cuentas',
    thirdPartyId: 'Tercero',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Corte',
  };

  private criteriaValueMap: { [key: string]: string } = {
    NUMBER_CLASS: 'Clase',
    GROUP: 'Grupo',
    ACCOUNT: 'Cuenta',
    SUB_ACCOUNT: 'Subcuenta',
    AUXILIARY_ACCOUNT: 'Auxiliar',
  };

  // --- CICLO DE VIDA ---

  ngOnInit() {
    if (this.config.data) {
      this.reportTitle = this.config.data.reportTitle || this.reportTitle;
      this.headerConfig = this.config.data.headerConfig || [];
      this.previewData = this.config.data.dataTable || [];
      this.companyName = this.config.data.companyName || this.companyName;
      this.generationDate = this.config.data.generationDate || new Date();
      this.totals = this.config.data.totals || {}; // ✅ NUEVO: Recibimos los totales.

      console.log('Data received for preview:', this.previewData);

      // ✅ CORREGIDO: Procesa y traduce los criterios antes de asignarlos.
      if (this.config.data.criteria) {
        this.criteria = this.translateAndFormatCriteria(
          this.config.data.criteria
        );
      }
    }
  }

  /**
   * ✅ NUEVO: Actualiza el objeto de estilos de forma inmutable para
   * disparar la detección de cambios en el componente hijo.
   */
  updateStyles(newStyles: Partial<ReportStyles>) {
    this.styles = { ...this.styles, ...newStyles };
  }

  exportReport() {
    this.ref.close({
      format: this.formatSelected,
      styles: this.styles,
      template: this.selectedTemplate?.code,
    });
  }

  closeModal() {
    this.ref.close(null);
  }

  // --- MÉTODOS DE AYUDA ---

  /**
   * ✅ NUEVO: Traduce y formatea el objeto de criterios para mostrarlo en la UI.
   */
  private translateAndFormatCriteria(
    criteria: any
  ): { key: string; value: string }[] {
    return Object.keys(criteria)
      .filter((key) => criteria[key] != null)
      .map((key) => {
        const translatedKey = this.criteriaKeyMap[key] || key;
        let formattedValue = criteria[key];

        // 1. Traducir el valor de 'criteriaType'
        if (key === 'criteriaType') {
          formattedValue =
            this.criteriaValueMap[criteria[key]] || criteria[key];
        }

        // 2. Formatear el objeto 'criteriaRange'
        if (key === 'criteriaRange' && typeof criteria[key] === 'object') {
          formattedValue = `Desde ${criteria[key].from} hasta ${criteria[key].to}`;
        }

        // 3. Formatear fechas (si son strings en formato YYYY-MM-DD)
        if (
          (key === 'startDate' || key === 'endDate') &&
          typeof criteria[key] === 'string'
        ) {
          const dateParts = criteria[key].split('-');
          if (dateParts.length === 3) {
            formattedValue = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          }
        }

        return {
          key: translatedKey,
          value: formattedValue,
        };
      });
  }
}
