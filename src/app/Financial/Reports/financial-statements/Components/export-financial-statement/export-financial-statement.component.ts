import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ColumnDefinition,
  ReportPreviewComponent,
  ReportStyles,
} from '../report-preview/report-preview.component';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { FinancialStatementsService } from '../../Services/financial-statements.service';
import { ExportFinancialStatementEmailRequest } from '../../Models/Requests/ExportFinancialStatementEmailRequest';
import {
  ExportFinancialStatementRequest,
  InfoReportTemplate,
} from '../../Models/Requests/ExportFinancialStatementRequest';
import { UpsertFinancialStatementTemplateRequest } from '../../Models/Requests/UpsertFinancialStatementTemplateRequest';
import { FinancialStatementTemplateResponse } from '../../Models/Responses/FinancialStatementTemplateResponse';

@Component({
  selector: 'app-export-financial-statement',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    ColorPickerModule,
    TooltipModule,
    FieldsetModule,
    InputTextModule,
    ReportPreviewComponent,
  ],
  providers: [MessageService],
  templateUrl: './export-financial-statement.component.html',
})
export class ExportFinancialStatementComponent implements OnInit {
  previewData: any[] = [];
  headerConfig: ColumnDefinition[][] = [];
  financialStatement: any;
  reportTitle = 'Estado Financiero';
  generationDate: Date = new Date();
  criteriaForPreview: { key: string; value: string }[] = [];
  totals: any = {};
  enterpriseData: any = null;

  formatSelected: 'pdf' | 'excel' = 'pdf';
  toEmail = '';
  isSavingTemplate = false;
  styles: ReportStyles = {
    align: 'left',
    color: '#2d3748',
    font: 'Arial',
    fontSize: 12,
  };

  formatOptions = [
    { label: 'PDF', icon: 'pi pi-file-pdf', value: 'pdf' },
    { label: 'Excel', icon: 'pi pi-file-excel', value: 'excel' },
  ];

  templates: Array<{ id?: number; code?: string; name: string }> = [
    { id: 0, code: 'default', name: 'Plantilla por defecto' },
  ];
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

  private readonly criteriaKeyMap: { [key: string]: string } = {
    criteriaType: 'Tipo de Nivel',
    criteriaRange: 'Rango de Cuentas',
    thirdPartyId: 'Tercero',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Corte',
    previousStartDate: 'Fecha de Inicio Periodo Anterior',
    previousEndDate: 'Fecha de Fin Periodo Anterior',
  };

  private readonly criteriaValueMap: { [key: string]: string } = {
    NUMBER_CLASS: 'Clase',
    GROUP: 'Grupo',
    ACCOUNT: 'Cuenta',
    SUB_ACCOUNT: 'Subcuenta',
    AUXILIARY_ACCOUNT: 'Auxiliar',
  };

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (!this.config.data) {
      return;
    }

    this.reportTitle = this.config.data.reportTitle || this.reportTitle;
    this.headerConfig = this.config.data.headerConfig || [];
    this.previewData = this.config.data.dataTable || [];
    this.enterpriseData = this.config.data.enterpriseData || null;
    this.generationDate = this.config.data.generationDate || new Date();
    this.totals = this.config.data.totals || {};
    this.financialStatement = this.config.data.financialStatement;

    if (this.financialStatement?.criteria) {
      this.criteriaForPreview = this.translateAndFormatCriteria(
        this.financialStatement.criteria,
        this.config.data.thirdPartyInfo
      );
    }

    this.loadDefaultTemplate();
  }

  updateStyles(newStyles: Partial<ReportStyles>): void {
    this.styles = { ...this.styles, ...newStyles };
  }

  exportReport(): void {
    const infoTemplate = this.buildInfoTemplate();

    const request: ExportFinancialStatementRequest = {
      reportId: this.financialStatement?.reportId,
      format: this.formatSelected.toUpperCase() as 'PDF' | 'EXCEL',
      entName: this.enterpriseData?.name || 'Empresa',
      financialStatement: this.financialStatement,
      financialStatementData: this.previewData,
      infoReportTemplate: infoTemplate,
    };

    this.financialStatementsService.exportFinancialStatement(request).subscribe({
      next: (blob) => {
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const isCsvBlob = blob.type?.includes('text/csv');
        const extension = isCsvBlob
          ? 'csv'
          : this.formatSelected === 'excel'
          ? 'xlsx'
          : 'pdf';
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
          summary: 'Éxito',
          detail: 'El reporte ha sido generado y descargado.',
        });

        this.ref.close();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el reporte. ' + err.message,
        });
      },
    });
  }

  sendReportByEmail(): void {
    if (!this.toEmail || !this.toEmail.includes('@')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Ingresa un correo valido para el envio.',
      });
      return;
    }

    const infoTemplate = this.buildInfoTemplate();

    const request: ExportFinancialStatementEmailRequest = {
      reportId: this.financialStatement?.reportId,
      format: this.formatSelected.toUpperCase() as 'PDF' | 'EXCEL',
      entName: this.enterpriseData?.name || 'Empresa',
      financialStatement: this.financialStatement,
      financialStatementData: this.previewData,
      infoReportTemplate: infoTemplate,
      toEmail: this.toEmail.trim(),
    };

    this.financialStatementsService
      .exportFinancialStatementByEmail(request)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: `Reporte enviado a ${this.toEmail}.`,
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo enviar el correo. ' + err.message,
          });
        },
      });
  }

  saveAsDefaultTemplate(): void {
    const enterpriseId = String(this.enterpriseData?.id ?? '').trim();
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'No hay empresa seleccionada para guardar la plantilla.',
      });
      return;
    }

    const request: UpsertFinancialStatementTemplateRequest = {
      entId: enterpriseId,
      name: this.selectedTemplate?.name || this.reportTitle || 'Plantilla por defecto',
      pathLogotype: this.enterpriseData?.logo || '',
      alignment: this.styles.align.toUpperCase(),
      font: this.styles.font,
      fontSize: this.styles.fontSize,
      mainColor: this.styles.color,
      isDefault: true,
    };

    this.isSavingTemplate = true;
    this.financialStatementsService.upsertDefaultTemplate(request).subscribe({
      next: (template) => {
        this.isSavingTemplate = false;
        if (template) {
          this.applyTemplate(template);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Plantilla por defecto guardada correctamente.',
        });
      },
      error: (err) => {
        this.isSavingTemplate = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se pudo guardar la plantilla por defecto. ' +
            (err?.error?.message || err?.message || ''),
        });
      },
    });
  }

  closeModal(): void {
    this.ref.close(null);
  }

  private buildInfoTemplate(): InfoReportTemplate {
    return {
      id: this.selectedTemplate?.id || 0,
      name: this.selectedTemplate?.name || this.reportTitle,
      pathLogotype: this.enterpriseData?.logo || '',
      alienation: this.styles.align.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT',
      font: this.styles.font,
      fontSize: this.styles.fontSize,
      mainColor: this.styles.color,
    };
  }

  private loadDefaultTemplate(): void {
    const enterpriseId = String(this.enterpriseData?.id ?? '').trim();
    if (!enterpriseId) {
      return;
    }

    this.financialStatementsService.getDefaultTemplate(enterpriseId).subscribe({
      next: (template) => {
        if (template) {
          this.applyTemplate(template);
        }
      },
      error: () => {
        // Si no existe plantilla por defecto, mantenemos estilos locales.
      },
    });
  }

  private applyTemplate(template: FinancialStatementTemplateResponse): void {
    this.styles = {
      align: this.normalizeAlignment(template.alignment),
      color: template.mainColor || this.styles.color,
      font: template.font || this.styles.font,
      fontSize: template.fontSize || this.styles.fontSize,
    };

    const selected = {
      id: template.id || 0,
      name: template.name || 'Plantilla por defecto',
    };

    this.templates = [selected];
    this.selectedTemplate = selected;
  }

  private normalizeAlignment(value: string | undefined): 'left' | 'center' | 'right' {
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'CENTER') {
      return 'center';
    }

    if (normalized === 'RIGHT') {
      return 'right';
    }

    return 'left';
  }

  private translateAndFormatCriteria(
    criteria: any,
    thirdPartyInfo: any
  ): { key: string; value: string }[] {
    return Object.keys(criteria)
      .filter(
        (key) =>
          criteria[key] !== null &&
          criteria[key] !== undefined &&
          criteria[key] !== ''
      )
      .map((key) => {
        const translatedKey = this.resolveCriteriaLabel(key);
        let formattedValue = criteria[key];

        if (key === 'criteriaType') {
          formattedValue =
            this.criteriaValueMap[criteria[key]] || String(criteria[key]);
        }

        if (key === 'criteriaRange' && typeof criteria[key] === 'object') {
          const from = criteria[key]?.from ?? '-';
          const to = criteria[key]?.to ?? '-';
          formattedValue = `Desde ${from} hasta ${to}`;
        }

        if (key === 'thirdPartyId' && thirdPartyInfo) {
          formattedValue = `${thirdPartyInfo.name} (${thirdPartyInfo.typeId})`;
        }

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
          value: String(formattedValue),
        };
      });
  }

  private resolveCriteriaLabel(key: string): string {
    const statementType = String(this.financialStatement?.type || '').toUpperCase();

    if (statementType === 'INCOME_STATEMENT') {
      const incomeStatementLabels: Record<string, string> = {
        startDate: 'Fecha de Inicio Periodo Actual',
        endDate: 'Fecha de Fin Periodo Actual',
        previousStartDate: 'Fecha de Inicio Periodo Anterior',
        previousEndDate: 'Fecha de Fin Periodo Anterior',
      };

      return incomeStatementLabels[key] || this.criteriaKeyMap[key] || key;
    }

    if (
      statementType === 'STATEMENT_FINANCIAL_POSITION' ||
      statementType === 'STATEMENT_CHANGES_EQUITY'
    ) {
      const comparativeCutoffLabels: Record<string, string> = {
        startDate: 'Fecha de Corte Anterior',
        endDate: 'Fecha de Corte Actual',
      };

      return comparativeCutoffLabels[key] || this.criteriaKeyMap[key] || key;
    }

    return this.criteriaKeyMap[key] || key;
  }
}




