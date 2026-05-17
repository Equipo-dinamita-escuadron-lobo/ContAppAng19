import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FinancialStatementAnnotationResponse } from '../Models/Responses/FinancialStatementAnnotationResponse';
import { FinancialStatementMetadataResponse } from '../Models/Responses/FinancialStatementMetadataResponse';
import { FinancialStatementRecordResponse } from '../Models/Responses/FinancialStatementRecordResponse';
import { FinancialStatementRowResponse } from '../Models/Responses/FinancialStatementRowResponse';

type FinancialStatementStatusSeverity = 'success' | 'warning' | 'danger' | 'info';

export function normalizeFinancialStatementStatus(
  status: string | null | undefined
): string {
  return String(status || '').trim().toUpperCase();
}

export function isFinancialStatementCompleted(
  status: string | null | undefined
): boolean {
  const normalizedStatus = normalizeFinancialStatementStatus(status);
  return (
    normalizedStatus.includes('COMPLET') ||
    normalizedStatus.includes('SUCCESS') ||
    normalizedStatus === 'GENERATED' ||
    normalizedStatus.includes('EXPORTED') ||
    normalizedStatus.includes('DOWNLOADED') ||
    normalizedStatus === 'EMAILED' ||
    normalizedStatus === 'SCHEDULED_EMAIL_SENT'
  );
}

export function getFinancialStatementStatusSeverity(
  status: string | null | undefined
): FinancialStatementStatusSeverity {
  const normalizedStatus = normalizeFinancialStatementStatus(status);

  if (isFinancialStatementCompleted(normalizedStatus)) {
    return 'success';
  }

  if (
    normalizedStatus.includes('GENERAT') ||
    normalizedStatus.includes('SCHEDULED')
  ) {
    return 'info';
  }

  if (
    normalizedStatus.includes('ERROR') ||
    normalizedStatus.includes('FAIL')
  ) {
    return 'danger';
  }

  return 'warning';
}

export function getFinancialStatementStatusLabel(
  status: string | null | undefined
): string {
  const normalizedStatus = normalizeFinancialStatementStatus(status);

  const labels: Record<string, string> = {
    GENERATED: 'Generado',
    EXPORTED: 'Exportado',
    EXPORTED_DOWNLOAD: 'Exportado (Descarga)',
    EXPORTED_EMAIL: 'Exportado',
    DOWNLOADED: 'Descargado',
    EMAILED: 'Exportado',
    SCHEDULED_EMAIL_SENT: 'Ejecutado',
    EMAIL_SCHEDULED: 'Programado',
    COMPLETED: 'Completado',
  };

  if (labels[normalizedStatus]) {
    return labels[normalizedStatus];
  }

  if (normalizedStatus.includes('GENERAT')) {
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

  return String(status || 'Desconocido');
}

export function formatFinancialStatementType(
  type: string | null | undefined
): string {
  const map: Record<string, string> = {
    STATEMENT_FINANCIAL_POSITION: 'Estado de Situacion Financiera',
    INCOME_STATEMENT: 'Estado de Resultados',
    STATEMENT_CHANGES_EQUITY: 'Estado de Cambios en el Patrimonio',
  };

  return map[String(type || '').trim().toUpperCase()] || 'Estado Financiero';
}

export function getCriteriaLevelLabel(
  criteriaType: string | null | undefined
): string {
  const map: Record<string, string> = {
    NUMBER_CLASS: 'Clase',
    GROUP: 'Grupo',
    ACCOUNT: 'Cuenta',
    SUB_ACCOUNT: 'Subcuenta',
    AUXILIARY_ACCOUNT: 'Auxiliar',
    ACCOUNT_RANGE: 'Rango de cuentas',
  };

  return (
    map[String(criteriaType || '').trim().toUpperCase()] ||
    'Estructura predeterminada'
  );
}

export function resolveFinancialStatementMetadata(
  record: FinancialStatementRecordResponse | null | undefined
): FinancialStatementMetadataResponse | null {
  if (!record) {
    return null;
  }

  if ('financialStatement' in record) {
    return record.financialStatement ?? null;
  }

  return record;
}

export function resolveFinancialStatementRows(
  record: FinancialStatementRecordResponse | null | undefined
): FinancialStatementRowResponse[] {
  if (!record || !('financialStatementData' in record)) {
    return [];
  }

  return Array.isArray(record.financialStatementData)
    ? record.financialStatementData
    : [];
}

export function resolveFinancialStatementAnnotations(
  record: FinancialStatementRecordResponse | null | undefined
): FinancialStatementAnnotationResponse[] {
  if (!record || !('annotations' in record)) {
    return [];
  }

  return Array.isArray(record.annotations) ? record.annotations : [];
}

export function extractResponseFileName(
  response: HttpResponse<Blob>,
  fallbackName: string
): string {
  const disposition = response.headers.get('content-disposition') || '';
  const matchedFileName = disposition.match(/filename=\"?([^\";]+)\"?/i)?.[1];
  return matchedFileName || fallbackName;
}

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof HttpErrorResponse) {
    const directMessage =
      typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.message;

    return String(directMessage || fallbackMessage).trim();
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

export async function extractApiErrorMessageAsync(
  error: unknown,
  fallbackMessage: string
): Promise<string> {
  if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
    try {
      const rawText = await error.error.text();
      const parsed = JSON.parse(rawText) as { message?: string };
      return String(parsed.message || fallbackMessage).trim();
    } catch {
      return fallbackMessage;
    }
  }

  return extractApiErrorMessage(error, fallbackMessage);
}
