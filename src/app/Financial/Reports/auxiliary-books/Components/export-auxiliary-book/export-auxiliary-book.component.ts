import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  DynamicDialogConfig,
  DynamicDialogModule,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { SplitterModule } from 'primeng/splitter';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-export-auxiliary-book',
  imports: [
    ButtonModule,
    DynamicDialogModule,
    SplitterModule,
    SelectButtonModule,
    FormsModule,
    SelectModule,
    CommonModule,
    ColorPickerModule,
  ],
  templateUrl: './export-auxiliary-book.component.html',
  styleUrl: './export-auxiliary-book.component.css',
})
export class ExportAuxiliaryBookComponent implements OnInit {
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  // 📌 Formatos de exportación
  formatOptions = [
    { label: 'PDF', icon: 'pi pi-file-pdf', value: 'pdf' },
    { label: 'Excel', icon: 'pi pi-file-excel', value: 'excel' },
  ];
  formatSelected: string = 'pdf';

  // 📌 Alineación de encabezados
  alignOptions: any[] = [
    { icon: 'pi pi-align-left', align: 'Izquierda', value: 'left' },
    { icon: 'pi pi-align-center', align: 'Centro', value: 'center' },
    { icon: 'pi pi-align-right', align: 'Derecha', value: 'right' },
  ];
  selectedAlign: string = 'left';
  selectedColor: string = '#000000';

  // 📌 Plantillas predefinidas
  templates = [
    { code: 'default', name: 'Plantilla por defecto' },
    { code: 'minimal', name: 'Minimalista' },
    { code: 'corporate', name: 'Corporativa' },
    { code: 'modern', name: 'Moderna' },
  ];
  selectedTemplate: any = null;

  // 📌 Fuentes disponibles
  fonts = [
    { name: 'Arial', value: 'Arial' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Calibri', value: 'Calibri' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Roboto', value: 'Roboto' },
  ];
  selectedFont: string = 'Arial';

  // 📌 Tamaños de fuente
  fontSizes = [
    { label: 'Pequeña (10px)', value: 10 },
    { label: 'Normal (12px)', value: 12 },
    { label: 'Grande (14px)', value: 14 },
    { label: 'Muy grande (16px)', value: 16 },
  ];
  selectedFontSize: number = 12;

  ngOnInit() {
    // Access data passed from the parent component
    console.log('Data received:', this.config.data);
  }

  // 📌 Cerrar modal
  closeModal() {
    this.ref.close(null);
  }

  // 📌 Exportar reporte con opciones seleccionadas
  exportReport() {
    const exportConfig = {
      format: this.formatSelected,
      justify: this.selectedAlign,
      template: this.selectedTemplate,
      font: this.selectedFont,
      fontSize: this.selectedFontSize,
    };

    console.log('Exportar con configuración:', exportConfig);
    this.ref.close(exportConfig); // Enviar configuración al padre
  }

  saveConfiguration() {
    const config = {
      format: this.formatSelected,
      justify: this.selectedAlign,
      template: this.selectedTemplate,
      font: this.selectedFont,
      fontSize: this.selectedFontSize,
    };

    console.log('Configuración guardada:', config);
  }
}
