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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';
import {
  ExportAuxiliaryBookRequest,
  InfoReportTemplate,
} from '../../Models/Requests/ExportAuxiliaryBookRequest';
import { MessageService } from 'primeng/api';

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
    ProgressSpinnerModule,
    ToastModule,
    ReportPreviewComponent,
  ],
  providers: [MessageService],
  templateUrl: './export-auxiliary-book.component.html',
  styleUrls: ['./export-auxiliary-book.component.css'],
})
export class ExportAuxiliaryBookComponent implements OnInit {
  // --- DATOS RECIBIDOS PARA LA PREVISUALIZACIÓN ---
  previewData: any[] = [];
  headerConfig: ColumnDefinition[][] = [];
  auxiliaryBook: any;
  reportTitle: string = 'Reporte Auxiliar';
  generationDate: Date = new Date();
  criteriaForPreview: { key: string; value: string }[] = [];
  totals: any = {}; // ✅ NUEVO: Propiedad para almacenar los totales.
  enterpriseData: any = null;

  isExporting: boolean = false;

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
    { name: 'Sans Serif', value: 'SansSerif' },
    { name: 'Times New Roman', value: 'TimesNewRoman' },
  ];

  fontSizes = [
    { label: 'Pequeño (10px)', value: 10 },
    { label: 'Normal (12px)', value: 12 },
    { label: 'Grande (14px)', value: 14 },
  ];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly auxiliaryBookService: AuxiliaryBooksServiceService,
    private readonly messageService: MessageService
  ) {}

  // ✅ NUEVO: Diccionarios para la traducción de criterios.
  private readonly criteriaKeyMap: { [key: string]: string } = {
    criteriaType: 'Tipo de Nivel',
    criteriaRange: 'Rango de Cuentas',
    thirdPartyId: 'Tercero',
    startDate: 'Fecha Inicial',
    endDate: 'Fecha Final',
  };

  private readonly criteriaValueMap: { [key: string]: string } = {
    NUMBER_CLASS: 'Clase',
    GROUP: 'Grupo',
    ACCOUNT: 'Cuenta',
    SUB_ACCOUNT: 'Subcuenta',
    AUXILIARY_ACCOUNT: 'Auxiliar',
  };

  // --- CICLO DE VIDA ---

  ngOnInit() {
    if (this.config.data) {
      console.log(
        'Informacion de empresa recibida en ExportAuxiliaryBookComponent:',
        this.config.data.enterpriseData
      );

      this.reportTitle = this.config.data.reportTitle || this.reportTitle;
      this.headerConfig = this.config.data.headerConfig || [];
      this.previewData = this.config.data.dataTable || [];
      this.enterpriseData = this.config.data.enterpriseData || null;
      this.generationDate = this.config.data.generationDate || new Date();
      this.totals = this.config.data.totals || {};
      this.auxiliaryBook = this.config.data.auxiliaryBook; // ✅ CORREGIDO: Asigna el objeto del libro auxiliar.
      this.reportTitle = this.config.data.reportTitle;

      // ✅ CORREGIDO: Procesa y traduce los criterios antes de asignarlos.
      if (
        this.config.data.auxiliaryBook &&
        this.config.data.auxiliaryBook.criteria
      ) {
        this.criteriaForPreview = this.translateAndFormatCriteria(
          this.config.data.auxiliaryBook.criteria,
          this.config.data.thirdPartyInfo,
          this.config.data.auxBookType
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
    if (this.isExporting) {
      return;
    }

    if (!this.config.data?.auxiliaryBook) {
      this.messageService.add({
        severity: 'error',
        summary: 'No se puede exportar',
        detail:
          'Falta la informacion del libro auxiliar generado. Vuelve a generarlo antes de exportar.',
      });
      return;
    }

    if (!this.previewData || this.previewData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay información disponible para exportar.',
      });
      return;
    }

    const infoTemplate: InfoReportTemplate = {
      id: this.selectedTemplate?.id ?? 0,
      name: this.reportTitle?.trim() || 'Reporte Auxiliar',
      pathLogotype: this.enterpriseData?.logo ?? '',
      alienation: this.styles.align.toUpperCase() as
        | 'LEFT'
        | 'CENTER'
        | 'RIGHT',
      font: this.styles.font,
      fontSize: this.styles.fontSize,
      mainColor: this.styles.color,
    };

    const request: ExportAuxiliaryBookRequest = {
      format: this.formatSelected.toUpperCase() as 'PDF' | 'EXCEL',
      entName: this.enterpriseData?.name?.trim() || 'Empresa',
      auxiliaryBook: this.config.data.auxiliaryBook,
      auxBookData: this.previewData ?? [],
      infoReportTemplate: infoTemplate,
    };

    this.isExporting = true;

    this.auxiliaryBookService.exportAuxiliaryBook(request).subscribe({
      next: (blob) => {
        try {
          const url = globalThis.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const extension = this.formatSelected.toLowerCase();
          const fileName = `${this.reportTitle.replaceAll(' ', '_')}_${new Date()
            .toISOString()
            .slice(0, 10)}.${extension}`;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          globalThis.URL.revokeObjectURL(url);
          a.remove();

          this.messageService.add({
            severity: 'success',
            summary: 'Reporte generado',
            detail: 'El reporte ha sido generado y descargado correctamente.',
            life: 3000,
          });

          setTimeout(() => {
            this.isExporting = false;
            this.ref.close();
          }, 1200);
        } catch (e: any) {
          this.isExporting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error al descargar',
            detail:
              'No se pudo iniciar la descarga del archivo. ' +
              (e?.message ?? ''),
          });
        }
      },
      error: (err) => {
        this.isExporting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al exportar',
          detail:
            'No se pudo generar el reporte. ' +
            (err?.error?.message || err?.message || 'Intenta nuevamente.'),
          life: 5000,
        });
      },
    });
  }

  closeModal() {
    if (this.isExporting) {
      return;
    }
    this.ref.close(null);
  }

  private translateAndFormatCriteria(
    criteria: any,
    thirdPartyInfo: any,
    auxBookType?: string
  ): { key: string; value: string }[] {
    const isInventoryAndBalances =
      auxBookType === 'INVENTORY_AND_BALANCES' ||
      (this.reportTitle ?? '').toLowerCase().includes('inventarios');

    return Object.keys(criteria)
      .filter((key) => criteria[key] != null)
      .filter((key) => !(isInventoryAndBalances && key === 'startDate'))
      .map((key) => {
        let translatedKey = this.criteriaKeyMap[key] || key;

        if (isInventoryAndBalances && key === 'endDate') {
          translatedKey = 'Fecha de Corte';
        }

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

        // Formatear tercero
        if (key === 'thirdPartyId' && thirdPartyInfo) {
          formattedValue = `${thirdPartyInfo.name} (${thirdPartyInfo.typeId})`;
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
