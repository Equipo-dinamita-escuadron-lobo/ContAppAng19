import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FinancialStatementsService } from '../../../../Services/financial-statements.service';
import { FinancialStatementAnnotationResponse } from '../../../../Models/Responses/FinancialStatementAnnotationResponse';
import { FinancialStatementLogResponse } from '../../../../Models/Responses/FinancialStatementLogResponse';
import { FinancialStatementMetadataResponse } from '../../../../Models/Responses/FinancialStatementMetadataResponse';
import { FinancialStatementRecordResponse } from '../../../../Models/Responses/FinancialStatementRecordResponse';
import {
  extractApiErrorMessage,
  formatFinancialStatementType,
  getCriteriaLevelLabel as resolveCriteriaLevelLabel,
  getFinancialStatementStatusLabel,
  getFinancialStatementStatusSeverity,
  normalizeFinancialStatementStatus,
  resolveFinancialStatementAnnotations,
  resolveFinancialStatementMetadata,
} from '../../../../Utils/financial-statements.utils';

@Component({
  selector: 'app-financial-statements-details',
  imports: [CommonModule, CardModule, TagModule, TimelineModule, ToastModule],
  providers: [MessageService],
  templateUrl: './financial-statements-details.component.html',
  styleUrl: './financial-statements-details.component.css',
})
export class FinancialStatementsDetailsComponent implements OnInit {
  financialStatementDetails: FinancialStatementMetadataResponse | null = null;
  logs: FinancialStatementLogResponse[] = [];
  annotations: FinancialStatementAnnotationResponse[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('reportId');

    if (reportId) {
      this.loadFinancialStatementDetails(reportId);
    }
  }

  loadFinancialStatementDetails(reportId: string): void {
    forkJoin({
      report: this.financialStatementsService.getFinancialStatementReport(reportId),
      logs: this.financialStatementsService.getLogsByReportId(reportId),
      annotations: this.financialStatementsService.getAnnotations(reportId),
    }).subscribe({
      next: ({ report, logs, annotations }) => {
        this.financialStatementDetails = this.resolveMetadata(report);
        this.logs = Array.isArray(logs) ? logs : [];
        this.annotations =
          annotations?.length > 0
            ? annotations
            : resolveFinancialStatementAnnotations(report);

        if (!this.logs.length) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin actividad',
            detail:
              'No se encontraron eventos de historial para este estado financiero.',
          });
        }
      },
      error: (error) => {
        this.logs = [];
        this.annotations = [];
        this.financialStatementDetails = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: extractApiErrorMessage(
            error,
            'No se pudieron cargar los detalles del estado financiero.'
          ),
        });
      },
    });
  }

  getLastLogStatus(): string {
    if (this.logs.length === 0) {
      return 'PENDING';
    }

    return this.logs[0].eventType || 'PENDING';
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    return getFinancialStatementStatusSeverity(status);
  }

  getStatusLabel(status: string): string {
    return getFinancialStatementStatusLabel(status);
  }

  getStatementTypeLabel(type: string): string {
    return formatFinancialStatementType(type);
  }

  getCriteriaLevelLabel(criteriaType: string | null | undefined): string {
    return resolveCriteriaLevelLabel(criteriaType);
  }

  getEventLabel(eventType: string): string {
    return this.getStatusLabel(eventType);
  }

  getEventMessage(event: FinancialStatementLogResponse): string {
    const rawMessage = String(event?.message ?? '').trim();
    const eventType = normalizeFinancialStatementStatus(event?.eventType);

    if (!rawMessage) {
      return this.getDefaultEventMessage(eventType);
    }

    return this.translateKnownBackendMessage(rawMessage, eventType);
  }

  resolveEventMarkerIcon(event: FinancialStatementLogResponse): string {
    const rawIcon = String(event?.icon || '').trim().toLowerCase();
    const eventType = normalizeFinancialStatementStatus(event?.eventType);

    const iconMap: Record<string, string> = {
      description: 'description',
      download: 'download',
      mail: 'download_done',
      generated: 'task_alt',
      emailed: 'download_done',
      downloaded: 'download',
      exported: 'download_done',
      error: 'error',
      warning: 'warning',
      info: 'info',
      success: 'task_alt',
    };

    if (rawIcon && iconMap[rawIcon]) {
      return iconMap[rawIcon];
    }

    if (
      eventType.includes('EXPORT') ||
      eventType.includes('DOWNLOAD') ||
      eventType === 'EMAILED'
    ) {
      return 'download';
    }

    if (eventType.includes('GENERAT') || eventType.includes('COMPLET')) {
      return 'task_alt';
    }

    if (eventType.includes('ERROR') || eventType.includes('FAIL')) {
      return 'error';
    }

    if (eventType.includes('PEND') || eventType.includes('SCHEDULED')) {
      return 'schedule';
    }

    return 'info';
  }

  resolveEventMarkerColor(event: FinancialStatementLogResponse): string {
    const rawColor = String(event?.color || '').trim();
    const normalizedColor = rawColor.toUpperCase();
    const eventType = normalizeFinancialStatementStatus(event?.eventType);

    if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(rawColor)) {
      return rawColor;
    }

    const colorMap: Record<string, string> = {
      SUCCESS: '#16a34a',
      INFO: '#2563eb',
      WARNING: '#d97706',
      WARN: '#d97706',
      ERROR: '#dc2626',
      DANGER: '#dc2626',
    };

    if (normalizedColor && colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }

    if (eventType.includes('ERROR') || eventType.includes('FAIL')) {
      return '#dc2626';
    }

    if (
      eventType.includes('EXPORT') ||
      eventType.includes('DOWNLOAD') ||
      eventType === 'EMAILED'
    ) {
      return '#2563eb';
    }

    if (eventType.includes('GENERAT') || eventType.includes('COMPLET')) {
      return '#16a34a';
    }

    return '#475569';
  }

  private resolveMetadata(
    report: FinancialStatementRecordResponse
  ): FinancialStatementMetadataResponse | null {
    return resolveFinancialStatementMetadata(report);
  }

  private getDefaultEventMessage(eventType: string): string {
    if (eventType === 'GENERATED') {
      return 'El reporte fue generado correctamente.';
    }

    if (eventType === 'EXPORTED_DOWNLOAD' || eventType === 'DOWNLOADED') {
      return 'El reporte fue exportado por descarga.';
    }

    if (eventType === 'EXPORTED_EMAIL' || eventType === 'EMAILED') {
      return 'El reporte fue exportado correctamente.';
    }

    if (eventType === 'SCHEDULED_EMAIL_SENT') {
      return 'La accion programada fue ejecutada correctamente.';
    }

    if (eventType === 'EMAIL_SCHEDULED') {
      return 'La accion quedo programada correctamente.';
    }

    return 'Evento registrado por el backend.';
  }

  private translateKnownBackendMessage(message: string, eventType: string): string {
    const normalizedMessage = message.trim().toLowerCase();

    if (
      eventType === 'GENERATED' ||
      normalizedMessage.includes('generated successfully')
    ) {
      return 'El reporte fue generado correctamente.';
    }

    if (
      eventType === 'EXPORTED_DOWNLOAD' ||
      eventType === 'DOWNLOADED' ||
      (normalizedMessage.includes('export') &&
        normalizedMessage.includes('descarg'))
    ) {
      return 'El reporte fue exportado por descarga.';
    }

    if (
      eventType === 'EXPORTED_EMAIL' ||
      eventType === 'EMAILED' ||
      normalizedMessage.includes('emailed')
    ) {
      return 'El reporte fue exportado correctamente.';
    }

    if (
      eventType === 'SCHEDULED_EMAIL_SENT' ||
      normalizedMessage.includes('scheduled')
    ) {
      return 'La accion programada fue ejecutada correctamente.';
    }

    if (eventType === 'EMAIL_SCHEDULED') {
      return 'La accion quedo programada correctamente.';
    }

    return message;
  }
}
