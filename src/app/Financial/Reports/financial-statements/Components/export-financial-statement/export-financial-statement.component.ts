import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FinancialStatementsService } from '../../Services/financial-statements.service';
import { ExportFinancialStatementEmailRequest } from '../../Models/Requests/ExportFinancialStatementEmailRequest';
import {
  ExportFinancialStatementRequest,
  InfoReportTemplate,
  ReportExportFormat,
  SignatureContentType,
  VisualSignatureRequest,
} from '../../Models/Requests/ExportFinancialStatementRequest';
import { UpsertFinancialStatementAnnotationRequest } from '../../Models/Requests/UpsertFinancialStatementAnnotationRequest';
import { UpsertFinancialStatementTemplateRequest } from '../../Models/Requests/UpsertFinancialStatementTemplateRequest';
import { FinancialStatementAnnotationResponse } from '../../Models/Responses/FinancialStatementAnnotationResponse';
import { FinancialStatementRowResponse } from '../../Models/Responses/FinancialStatementRowResponse';
import { FinancialStatementTemplateResponse } from '../../Models/Responses/FinancialStatementTemplateResponse';
import {
  extractApiErrorMessage,
  extractApiErrorMessageAsync,
  extractResponseFileName,
} from '../../Utils/financial-statements.utils';

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
    InputTextarea,
    CheckboxModule,
    ConfirmDialogModule,
    ReportPreviewComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './export-financial-statement.component.html',
})
export class ExportFinancialStatementComponent implements OnInit, OnDestroy {
  @ViewChild('signatureFileInput')
  signatureFileInput?: ElementRef<HTMLInputElement>;

  previewData: FinancialStatementRowResponse[] = [];
  headerConfig: ColumnDefinition[][] = [];
  financialStatement: Record<string, unknown> | null = null;
  reportTitle = 'Estado Financiero';
  generationDate: Date = new Date();
  criteriaForPreview: { key: string; value: string }[] = [];
  totals: Record<string, number | null> = {};
  enterpriseData: Record<string, unknown> | null = null;

  formatSelected: 'pdf' | 'excel' = 'pdf';
  toEmail = '';

  isSavingTemplate = false;
  isExporting = false;
  isSendingEmail = false;
  isSavingAnnotation = false;
  isDeletingAnnotation = false;

  templateName = '';
  isDefaultTemplate = true;
  styles: ReportStyles = {
    align: 'left',
    color: '#2d3748',
    font: 'Arial',
    fontSize: 12,
  };

  annotationDraft = '';
  editingAnnotationId: number | null = null;
  annotations: FinancialStatementAnnotationResponse[] = [];

  signaturePreviewUrl: string | null = null;
  signatureRequest: VisualSignatureRequest | null = null;

  formatOptions = [
    { label: 'PDF', icon: 'pi pi-file-pdf', value: 'pdf' },
    { label: 'Excel', icon: 'pi pi-file-excel', value: 'excel' },
  ];

  templates: FinancialStatementTemplateResponse[] = [];
  selectedTemplate: FinancialStatementTemplateResponse | null = null;
  selectedTemplateIdsForDeletion: number[] = [];

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
    { label: 'Pequeno (10px)', value: 10 },
    { label: 'Normal (12px)', value: 12 },
    { label: 'Grande (14px)', value: 14 },
  ];

  private readonly criteriaKeyMap: Record<string, string> = {
    criteriaType: 'Tipo de Nivel',
    criteriaRange: 'Rango de Cuentas',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Corte',
    previousStartDate: 'Fecha de Inicio Periodo Anterior',
    previousEndDate: 'Fecha de Fin Periodo Anterior',
    previousCutoffDate: 'Fecha de Corte Anterior',
    currentCutoffDate: 'Fecha de Corte Actual',
  };

  private readonly criteriaValueMap: Record<string, string> = {
    NUMBER_CLASS: 'Clase',
    GROUP: 'Grupo',
    ACCOUNT: 'Cuenta',
    SUB_ACCOUNT: 'Subcuenta',
    AUXILIARY_ACCOUNT: 'Auxiliar',
    ACCOUNT_RANGE: 'Rango de cuentas',
  };

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  get reportId(): string | null {
    const reportId = this.financialStatement?.['reportId'];
    return reportId ? String(reportId) : null;
  }

  get templateCountLabel(): string {
    return `${this.templates.length}/3 plantillas`;
  }

  get canCreateAnotherTemplate(): boolean {
    const normalizedName = this.normalizeTemplateName(this.templateName);
    return (
      this.templates.length < 3 ||
      Boolean(this.resolveTemplateToPersist(normalizedName))
    );
  }

  get hasAnnotations(): boolean {
    return this.annotations.length > 0;
  }

  ngOnInit(): void {
    if (!this.config.data) {
      return;
    }

    this.reportTitle = this.config.data.reportTitle || this.reportTitle;
    this.headerConfig = this.config.data.headerConfig || [];
    this.previewData = Array.isArray(this.config.data.dataTable)
      ? this.config.data.dataTable
      : [];
    this.enterpriseData = this.config.data.enterpriseData || null;
    this.generationDate = this.resolveGenerationDate(this.config.data.generationDate);
    this.totals = this.config.data.totals || {};
    this.financialStatement = this.config.data.financialStatement || null;
    this.templateName = this.reportTitle;

    if (this.financialStatement?.['criteria']) {
      this.criteriaForPreview = this.translateAndFormatCriteria(
        this.financialStatement['criteria'] as Record<string, unknown>
      );
    }

    this.loadTemplates();
    this.loadAnnotations();
  }

  ngOnDestroy(): void {
    this.signaturePreviewUrl = null;
  }

  updateStyles(newStyles: Partial<ReportStyles>): void {
    this.styles = { ...this.styles, ...newStyles };
  }

  onTemplateSelected(template: FinancialStatementTemplateResponse | null): void {
    if (!template) {
      this.selectedTemplate = null;
      this.templateName = this.reportTitle;
      this.isDefaultTemplate = false;
      return;
    }

    this.applyTemplate(template);
  }

  async exportReport(): Promise<void> {
    if (this.isExporting) {
      return;
    }

    this.isExporting = true;

    this.financialStatementsService
      .exportFinancialStatement(this.buildExportRequest())
      .subscribe({
        next: (response) => {
          this.isExporting = false;
          const fallbackExtension = this.formatSelected === 'excel' ? 'xlsx' : 'pdf';
          const fallbackName = `${this.reportTitle.replace(/\s+/g, '_')}.${fallbackExtension}`;
          const fileName = extractResponseFileName(response, fallbackName);
          this.downloadBlob(response.body, fileName);

          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: 'El reporte se exporto correctamente.',
          });

          this.ref.close({
            exported: true,
            reportId: this.reportId,
          });
        },
        error: async (error) => {
          this.isExporting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: await extractApiErrorMessageAsync(
              error,
              'No se pudo exportar el reporte.'
            ),
          });
        },
      });
  }

  sendReportByEmail(): void {
    if (this.isSendingEmail) {
      return;
    }

    if (!this.toEmail || !this.toEmail.includes('@')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Ingresa un correo valido para el envio.',
      });
      return;
    }

    this.isSendingEmail = true;

    this.financialStatementsService
      .exportFinancialStatementByEmail(this.buildEmailExportRequest())
      .subscribe({
        next: () => {
          this.isSendingEmail = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: `Reporte enviado a ${this.toEmail.trim()}.`,
          });
        },
        error: (error) => {
          this.isSendingEmail = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: extractApiErrorMessage(
              error,
              'No se pudo enviar el correo.'
            ),
          });
        },
      });
  }

  saveTemplate(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'No hay empresa seleccionada para guardar la plantilla.',
      });
      return;
    }

    const normalizedName = this.normalizeTemplateName(
      this.templateName || this.selectedTemplate?.name || this.reportTitle
    );

    if (!normalizedName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Ingresa un nombre para la plantilla.',
      });
      return;
    }

    const templateToPersist = this.resolveTemplateToPersist(normalizedName);
    if (!templateToPersist && !this.canCreateAnotherTemplate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limite alcanzado',
        detail:
          'La empresa ya tiene 3 plantillas. Edita una existente o elimina alguna antes de crear otra.',
      });
      return;
    }

    const request: UpsertFinancialStatementTemplateRequest = {
      id: templateToPersist?.id,
      enterpriseId,
      name: normalizedName,
      pathLogotype: this.resolveEnterpriseLogo(),
      alignment: this.styles.align.toUpperCase(),
      font: this.styles.font,
      fontSize: this.styles.fontSize,
      mainColor: this.styles.color,
      isDefault: this.isDefaultTemplate,
    };

    const saveRequest = this.isDefaultTemplate
      ? this.financialStatementsService.upsertDefaultTemplate(request)
      : this.financialStatementsService.upsertTemplate(request);

    this.isSavingTemplate = true;
    saveRequest.subscribe({
      next: (template) => {
        this.isSavingTemplate = false;
        this.applyTemplate(template);
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: `Plantilla "${normalizedName}" guardada correctamente.`,
        });
      },
      error: (error) => {
        this.isSavingTemplate = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudo guardar la plantilla.'
          ),
        });
      },
    });
  }

  saveAnnotation(): void {
    const reportId = this.reportId;
    if (!reportId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail:
          'Las anotaciones solo se habilitan cuando el reporte ya tiene un reportId registrado.',
      });
      return;
    }

    const text = this.annotationDraft.trim();
    if (!text) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Debe escribir una anotacion antes de guardar.',
      });
      return;
    }

    this.isSavingAnnotation = true;
    const request: UpsertFinancialStatementAnnotationRequest = { text };
    const operation = this.editingAnnotationId
      ? this.financialStatementsService.updateAnnotation(
          reportId,
          this.editingAnnotationId,
          request
        )
      : this.financialStatementsService.createAnnotation(reportId, request);

    operation.subscribe({
      next: (annotation) => {
        this.isSavingAnnotation = false;
        this.upsertAnnotation(annotation);
        this.annotationDraft = '';
        this.editingAnnotationId = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'La anotacion fue guardada correctamente.',
        });
      },
      error: (error) => {
        this.isSavingAnnotation = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudo guardar la anotacion.'
          ),
        });
      },
    });
  }

  editAnnotation(annotation: FinancialStatementAnnotationResponse): void {
    this.editingAnnotationId = annotation.id;
    this.annotationDraft = annotation.text;
  }

  cancelAnnotationEdition(): void {
    this.editingAnnotationId = null;
    this.annotationDraft = '';
  }

  confirmDeleteAnnotation(annotation: FinancialStatementAnnotationResponse): void {
    this.confirmationService.confirm({
      header: 'Eliminar anotacion',
      message: 'Se eliminara la anotacion seleccionada.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAnnotation(annotation.id),
    });
  }

  triggerSignatureUpload(): void {
    this.signatureFileInput?.nativeElement.click();
  }

  onSignatureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!this.isAllowedSignatureType(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo invalido',
        detail: 'La firma debe ser una imagen PNG o JPG.',
      });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawResult = String(reader.result || '');
      const base64Content = rawResult.split(',')[1];

      if (!base64Content) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo procesar la imagen de la firma.',
        });
        return;
      }

      this.signaturePreviewUrl = rawResult;
      this.signatureRequest = {
        fileName: file.name,
        contentType: file.type as SignatureContentType,
        base64Content,
      };
    };
    reader.readAsDataURL(file);
  }

  removeSignature(): void {
    this.signaturePreviewUrl = null;
    this.signatureRequest = null;

    if (this.signatureFileInput?.nativeElement) {
      this.signatureFileInput.nativeElement.value = '';
    }
  }

  confirmDeleteSelectedTemplates(): void {
    if (!this.selectedTemplateIdsForDeletion.length) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin seleccion',
        detail: 'Selecciona al menos una plantilla para eliminar.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Eliminar plantillas',
      message: 'Se eliminaran las plantillas seleccionadas.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteSelectedTemplates(),
    });
  }

  confirmDeleteAllTemplates(): void {
    if (!this.templates.length) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin plantillas',
        detail: 'No hay plantillas para eliminar.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Eliminar todas las plantillas',
      message: 'Se eliminaran todas las plantillas de la empresa actual.',
      acceptLabel: 'Eliminar todo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAllTemplates(),
    });
  }

  closeModal(): void {
    this.ref.close(null);
  }

  private buildExportRequest(): ExportFinancialStatementRequest {
    return {
      reportId: this.reportId || undefined,
      format: this.resolveExportFormat(),
      entName: this.resolveEnterpriseName(),
      financialStatement: this.financialStatement,
      financialStatementData: this.previewData,
      annotations: this.toAnnotationRequests(),
      signature: this.signatureRequest,
      infoReportTemplate: this.buildInfoTemplate(),
    };
  }

  private buildEmailExportRequest(): ExportFinancialStatementEmailRequest {
    return {
      ...this.buildExportRequest(),
      toEmail: this.toEmail.trim(),
    };
  }

  private buildInfoTemplate(): InfoReportTemplate {
    const resolvedTemplateName =
      this.normalizeTemplateName(this.templateName) ||
      this.selectedTemplate?.name ||
      this.reportTitle;

    return {
      id: this.selectedTemplate?.id,
      name: resolvedTemplateName,
      pathLogotype: this.resolveEnterpriseLogo(),
      alienation: this.styles.align.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT',
      font: this.styles.font,
      fontSize: this.styles.fontSize,
      mainColor: this.styles.color,
    };
  }

  private loadTemplates(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      return;
    }

    this.financialStatementsService.getTemplatesByEnterprise(enterpriseId).subscribe({
      next: (templates) => {
        this.templates = this.sortTemplates(templates ?? []);
        this.pruneSelectedTemplateIds();

        if (!this.templates.length) {
          this.selectedTemplate = null;
          this.templateName = this.reportTitle;
          this.isDefaultTemplate = true;
          return;
        }

        const defaultTemplate =
          this.templates.find((template) => template.isDefault) || this.templates[0];
        this.applyTemplate(defaultTemplate);
      },
      error: (error) => {
        this.selectedTemplate = null;
        this.templateName = this.reportTitle;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudieron cargar las plantillas.'
          ),
        });
      },
    });
  }

  private loadAnnotations(): void {
    const reportId = this.reportId;
    if (!reportId) {
      this.annotations = [];
      return;
    }

    this.financialStatementsService.getAnnotations(reportId).subscribe({
      next: (annotations) => {
        this.annotations = annotations ?? [];
      },
      error: (error) => {
        this.annotations = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudieron cargar las anotaciones.'
          ),
        });
      },
    });
  }

  private applyTemplate(template: FinancialStatementTemplateResponse): void {
    const storedTemplate = this.upsertTemplateInCollection(template);

    this.styles = {
      align: this.normalizeAlignment(storedTemplate.alignment),
      color: storedTemplate.mainColor || this.styles.color,
      font: storedTemplate.font || this.styles.font,
      fontSize: storedTemplate.fontSize || this.styles.fontSize,
    };

    this.selectedTemplate = storedTemplate;
    this.templateName = storedTemplate.name || this.reportTitle;
    this.isDefaultTemplate = Boolean(storedTemplate.isDefault);
  }

  private upsertTemplateInCollection(
    template: FinancialStatementTemplateResponse
  ): FinancialStatementTemplateResponse {
    const mergedTemplates = this.templates.filter((item) => item.id !== template.id);
    mergedTemplates.push(template);
    this.templates = this.sortTemplates(mergedTemplates);
    this.pruneSelectedTemplateIds();

    return this.templates.find((item) => item.id === template.id) || template;
  }

  private sortTemplates(
    templates: FinancialStatementTemplateResponse[]
  ): FinancialStatementTemplateResponse[] {
    return [...templates].sort((left, right) => {
      if (Boolean(left.isDefault) !== Boolean(right.isDefault)) {
        return left.isDefault ? -1 : 1;
      }

      return String(left.name || '').localeCompare(String(right.name || ''));
    });
  }

  private resolveTemplateToPersist(
    templateName: string
  ): FinancialStatementTemplateResponse | undefined {
    if (
      this.selectedTemplate?.id &&
      this.normalizeTemplateName(this.selectedTemplate.name) === templateName
    ) {
      return this.selectedTemplate;
    }

    return this.templates.find(
      (template) => this.normalizeTemplateName(template.name) === templateName
    );
  }

  private normalizeTemplateName(value: string | undefined): string {
    return String(value || '').replace(/\s+/g, ' ').trim();
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
    criteria: Record<string, unknown>
  ): { key: string; value: string }[] {
    const statementType = String(this.financialStatement?.['type'] || '').toUpperCase();
    const usesComparativeCutoffDates =
      (statementType === 'STATEMENT_FINANCIAL_POSITION' ||
        statementType === 'STATEMENT_CHANGES_EQUITY') &&
      (criteria['previousCutoffDate'] || criteria['currentCutoffDate']);

    return Object.keys(criteria)
      .filter((key) => {
        const value = criteria[key];
        if (value === null || value === undefined || value === '') {
          return false;
        }

        if (usesComparativeCutoffDates && (key === 'startDate' || key === 'endDate')) {
          return false;
        }

        return true;
      })
      .map((key) => {
        const translatedKey = this.resolveCriteriaLabel(key);
        let formattedValue: unknown = criteria[key];

        if (key === 'criteriaType') {
          formattedValue =
            this.criteriaValueMap[String(criteria[key])] || String(criteria[key]);
        }

        if (key === 'criteriaRange' && typeof criteria[key] === 'object') {
          const range = criteria[key] as { from?: number | null; to?: number | null };
          const from = range?.from ?? '-';
          const to = range?.to ?? '-';
          formattedValue = `Desde ${from} hasta ${to}`;
        }

        if (
          [
            'startDate',
            'endDate',
            'previousStartDate',
            'previousEndDate',
            'previousCutoffDate',
            'currentCutoffDate',
          ].includes(key)
        ) {
          formattedValue = this.formatDateValue(criteria[key]);
        }

        return {
          key: translatedKey,
          value: String(formattedValue),
        };
      });
  }

  private resolveCriteriaLabel(key: string): string {
    const statementType = String(this.financialStatement?.['type'] || '').toUpperCase();

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

  private resolveEnterpriseId(): string | null {
    const enterpriseId = this.enterpriseData?.['id'];
    return enterpriseId ? String(enterpriseId) : null;
  }

  private resolveEnterpriseName(): string {
    const enterpriseName =
      this.enterpriseData?.['enterpriseName'] ??
      this.enterpriseData?.['businessName'] ??
      this.enterpriseData?.['tradeName'] ??
      this.enterpriseData?.['entName'] ??
      this.enterpriseData?.['name'] ??
      this.financialStatement?.['entId'];

    return String(enterpriseName || 'Empresa').trim();
  }

  private resolveEnterpriseLogo(): string {
    const logoPath =
      this.enterpriseData?.['logo'] ??
      this.enterpriseData?.['logoUrl'] ??
      this.enterpriseData?.['pathLogotype'] ??
      '';

    return String(logoPath || '').trim();
  }

  private resolveExportFormat(): ReportExportFormat {
    return this.formatSelected === 'excel' ? 'EXCEL' : 'PDF';
  }

  private toAnnotationRequests(): UpsertFinancialStatementAnnotationRequest[] {
    return this.annotations.map((annotation) => ({
      text: annotation.text,
    }));
  }

  private deleteAnnotation(annotationId: number): void {
    const reportId = this.reportId;
    if (!reportId || this.isDeletingAnnotation) {
      return;
    }

    this.isDeletingAnnotation = true;
    this.financialStatementsService.deleteAnnotation(reportId, annotationId).subscribe({
      next: () => {
        this.isDeletingAnnotation = false;
        this.annotations = this.annotations.filter(
          (annotation) => annotation.id !== annotationId
        );
        if (this.editingAnnotationId === annotationId) {
          this.cancelAnnotationEdition();
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'La anotacion fue eliminada.',
        });
      },
      error: (error) => {
        this.isDeletingAnnotation = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudo eliminar la anotacion.'
          ),
        });
      },
    });
  }

  private deleteSelectedTemplates(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId || !this.selectedTemplateIdsForDeletion.length) {
      return;
    }

    this.financialStatementsService
      .deleteTemplates({
        enterpriseId,
        templateIds: this.selectedTemplateIdsForDeletion,
      })
      .subscribe({
        next: (deletedCount) => {
          this.selectedTemplateIdsForDeletion = [];
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: `Se eliminaron ${deletedCount} plantilla(s).`,
          });
          this.loadTemplates();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: extractApiErrorMessage(
              error,
              'No se pudieron eliminar las plantillas seleccionadas.'
            ),
          });
        },
      });
  }

  private deleteAllTemplates(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      return;
    }

    this.financialStatementsService.deleteAllTemplates(enterpriseId).subscribe({
      next: (deletedCount) => {
        this.selectedTemplateIdsForDeletion = [];
        this.selectedTemplate = null;
        this.templateName = this.reportTitle;
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: `Se eliminaron ${deletedCount} plantilla(s).`,
        });
        this.loadTemplates();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudieron eliminar todas las plantillas.'
          ),
        });
      },
    });
  }

  private pruneSelectedTemplateIds(): void {
    const availableIds = new Set(
      this.templates
        .map((template) => template.id)
        .filter((templateId): templateId is number => typeof templateId === 'number')
    );

    this.selectedTemplateIdsForDeletion =
      this.selectedTemplateIdsForDeletion.filter((templateId) =>
        availableIds.has(templateId)
      );
  }

  private upsertAnnotation(
    annotation: FinancialStatementAnnotationResponse
  ): void {
    const remainingAnnotations = this.annotations.filter(
      (currentAnnotation) => currentAnnotation.id !== annotation.id
    );

    this.annotations = [...remainingAnnotations, annotation].sort((left, right) =>
      String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
    );
  }

  private isAllowedSignatureType(contentType: string): boolean {
    const normalizedContentType = contentType.trim().toLowerCase();
    return (
      normalizedContentType === 'image/png' ||
      normalizedContentType === 'image/jpeg' ||
      normalizedContentType === 'image/jpg'
    );
  }

  private resolveGenerationDate(value: unknown): Date {
    const parsedDate = value ? new Date(String(value)) : new Date();
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  private formatDateValue(value: unknown): string {
    if (!value) {
      return '-';
    }

    const parsedDate = new Date(String(value));
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private downloadBlob(blob: Blob | null, fileName: string): void {
    if (!blob) {
      return;
    }

    const url = globalThis.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    globalThis.URL.revokeObjectURL(url);
    anchor.remove();
  }
}
