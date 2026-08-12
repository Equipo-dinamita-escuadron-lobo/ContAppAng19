/** Etiquetas en español para estados de Tesorería (uso educativo). */
const VOUCHER_LABELS: Record<string, string> = {
  DRAFT: 'Sin contabilizar',
  POSTING: 'Contabilizando',
  POSTED: 'Contabilizado',
  FAILED: 'No se pudo contabilizar',
  VOIDING: 'Anulando',
  VOIDED: 'Anulado',
  VOID_FAILED: 'No se pudo anular',
};

const SCHEDULE_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  PROCESSING: 'En proceso',
  WAITING_ACCOUNTING: 'Pendiente de contabilizar',
  EXECUTED: 'Realizado',
  FAILED: 'No se pudo ejecutar',
  CANCELED: 'Cancelado',
};

const PAYABLE_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  POSTED: 'Pendiente de pago',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  Bill: 'Factura de compra',
  Payment: 'Pago a proveedor',
};

const ACCOUNTING_ENTRY_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  VOIDED: 'Anulado',
};

export function voucherStatusLabel(status?: string | null): string {
  if (!status) return 'Desconocido';
  return VOUCHER_LABELS[status] ?? status;
}

export function scheduleStatusLabel(status?: string | null): string {
  if (!status) return 'Desconocido';
  return SCHEDULE_LABELS[status] ?? status;
}

export function payableStatusLabel(status?: string | null): string {
  if (!status) return 'Desconocido';
  return PAYABLE_LABELS[status] ?? status;
}

export function transactionTypeLabel(type?: string | null): string {
  if (!type) return '-';
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

export function accountingEntryStatusLabel(status?: string | null): string {
  if (!status) return '-';
  return ACCOUNTING_ENTRY_LABELS[status] ?? status;
}

export function voucherStatusFilterOptions(includeAll = true) {
  const options = Object.entries(VOUCHER_LABELS).map(([value, label]) => ({ label, value }));
  return includeAll ? [{ label: 'Todos los estados', value: '' }, ...options] : options;
}

/** Observaciones de laboratorio → texto educativo para el estudiante. */
const LAB_DESCRIPTION_PATTERNS: Array<{ test: RegExp; label: string }> = [
  { test: /\bvoid\b/i, label: 'Anulación del pago (la deuda vuelve)' },
  { test: /\bmulti\b/i, label: 'Un pago aplicado a varias facturas' },
  { test: /\bbank\b/i, label: 'Pago por transferencia bancaria' },
  { test: /\bpart\b/i, label: 'Abono parcial (pagó solo una parte)' },
  { test: /\bfull\b/i, label: 'Pago total de la factura' },
  { test: /\bover\b/i, label: 'Intento de pago por más del saldo' },
  { test: /\bsched\b/i, label: 'Pago programado' },
];

/**
 * Convierte observaciones técnicas de prueba (VOID, MULTI, PART…)
 * en descripciones claras para uso educativo.
 */
export function educationalDescription(raw?: string | null, fallback = 'Pago a proveedor'): string {
  const text = (raw ?? '').trim();
  if (!text) return fallback;

  for (const { test, label } of LAB_DESCRIPTION_PATTERNS) {
    if (test.test(text)) return label;
  }

  // "Pago de 1 factura(s): 9306" → "Pago de 1 factura: 9306"
  const paymentOfInvoices = text.match(/^Pago de (\d+)\s*factura\(s\):\s*(.+)$/i);
  if (paymentOfInvoices) {
    const count = Number(paymentOfInvoices[1]);
    const refs = paymentOfInvoices[2].trim();
    const noun = count === 1 ? 'factura' : 'facturas';
    return `Pago de ${count} ${noun}: ${refs}`;
  }

  return text;
}
