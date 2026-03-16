import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FinancialStatementsService } from '../../../../Services/financial-statements.service';

@Component({
  selector: 'app-financial-statements-details',
  imports: [CommonModule, CardModule, TagModule, TimelineModule, ToastModule],
  providers: [MessageService],
  templateUrl: './financial-statements-details.component.html',
  styleUrl: './financial-statements-details.component.css',
})
export class FinancialStatementsDetailsComponent implements OnInit {
  financialStatementDetails: any = null;
  logs: any[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly financialStatementsService: FinancialStatementsService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    const publicId = this.route.snapshot.paramMap.get('publicId');

    if (publicId) {
      this.loadFinancialStatementDetails(publicId);
    }
  }

  loadFinancialStatementDetails(publicId: string): void {
    this.financialStatementsService.getLogsByPublicId(publicId).subscribe({
      next: (response: any) => {
        const logs = response?.data || [];
        this.logs = logs;
        this.financialStatementDetails = logs[0]?.financialStatement ?? null;

        if (!logs.length) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin actividad',
            detail:
              'No se encontraron eventos de historial para este estado financiero.',
          });
        }
      },
      error: () => {
        this.logs = [];
        this.financialStatementDetails = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los detalles del estado financiero.',
        });
      },
    });
  }

  getLastLogStatus(): string {
    if (this.logs.length === 0) {
      return 'PENDING';
    }

    return this.logs[this.logs.length - 1].etypeEvent || 'PENDING';
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const normalizedStatus = this.normalizeStatus(status);

    if (
      normalizedStatus === 'GENERATED' ||
      normalizedStatus.includes('EXPORTED') ||
      normalizedStatus === 'SCHEDULED_EMAIL_SENT' ||
      (normalizedStatus.includes('EMAIL') && normalizedStatus.includes('SENT'))
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS')
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('GENERAT') ||
      normalizedStatus.includes('GENERAND') ||
      normalizedStatus.includes('SCHEDULED')
    ) {
      return 'info';
    }

    if (normalizedStatus.includes('ERROR') || normalizedStatus.includes('FAIL')) {
      return 'danger';
    }

    return 'warning';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = this.normalizeStatus(status);

    if (normalizedStatus === 'GENERATED') {
      return 'Generado';
    }

    if (normalizedStatus === 'EXPORTED_DOWNLOAD') {
      return 'Exportado (Descarga)';
    }

    if (normalizedStatus === 'EXPORTED_EMAIL') {
      return 'Exportado (Correo)';
    }

    if (normalizedStatus === 'SCHEDULED_EMAIL_SENT') {
      return 'Correo programado enviado';
    }

    if (normalizedStatus === 'EMAIL_SCHEDULED') {
      return 'Correo programado';
    }

    if (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS')
    ) {
      return 'Completado';
    }

    if (
      normalizedStatus.includes('GENERAT') ||
      normalizedStatus.includes('GENERAND')
    ) {
      return 'Generando';
    }

    if (normalizedStatus.includes('ERROR') || normalizedStatus.includes('FAIL')) {
      return 'Error';
    }

    if (normalizedStatus.includes('PEND')) {
      return 'Pendiente';
    }

    if (normalizedStatus.includes('SCHEDULED')) {
      return 'Programado';
    }

    return status || 'Desconocido';
  }

  getStatementTypeLabel(type: string): string {
    const map: Record<string, string> = {
      STATEMENT_FINANCIAL_POSITION: 'Estado de Situacion Financiera',
      INCOME_STATEMENT: 'Estado de Resultados',
      STATEMENT_CHANGES_EQUITY: 'Estado de Cambios en el Patrimonio',
      BALANCE_SHEET: 'Balance General',
    };

    return map[type] || type || 'Estado Financiero';
  }

  getEventLabel(eventType: string): string {
    return this.getStatusLabel(eventType);
  }

  getEventMessage(event: any): string {
    const rawMessage = String(event?.message ?? '').trim();
    const eventType = this.normalizeStatus(event?.etypeEvent);

    if (!rawMessage) {
      return this.getDefaultEventMessage(eventType);
    }

    return this.translateKnownBackendMessage(rawMessage, eventType);
  }

  private getDefaultEventMessage(eventType: string): string {
    if (eventType === 'GENERATED') {
      return 'El reporte fue generado correctamente.';
    }

    if (eventType === 'EXPORTED_DOWNLOAD') {
      return 'El reporte fue exportado por descarga.';
    }

    if (eventType === 'EXPORTED_EMAIL') {
      return 'El reporte fue exportado por correo.';
    }

    if (eventType === 'SCHEDULED_EMAIL_SENT') {
      return 'El correo programado fue enviado correctamente.';
    }

    if (eventType === 'EMAIL_SCHEDULED') {
      return 'El envio por correo quedo programado.';
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
      (normalizedMessage.includes('exported') &&
        normalizedMessage.includes('download'))
    ) {
      return 'El reporte fue exportado por descarga.';
    }

    if (
      eventType === 'EXPORTED_EMAIL' ||
      (normalizedMessage.includes('exported') &&
        normalizedMessage.includes('email'))
    ) {
      return 'El reporte fue exportado por correo.';
    }

    if (
      eventType === 'SCHEDULED_EMAIL_SENT' ||
      (normalizedMessage.includes('scheduled') &&
        normalizedMessage.includes('email') &&
        normalizedMessage.includes('sent'))
    ) {
      return 'El correo programado fue enviado correctamente.';
    }

    if (
      eventType === 'EMAIL_SCHEDULED' ||
      (normalizedMessage.includes('scheduled') &&
        normalizedMessage.includes('email'))
    ) {
      return 'El envio por correo quedo programado.';
    }

    return message;
  }

  private normalizeStatus(status: string): string {
    return status?.trim().toUpperCase() || '';
  }
}



