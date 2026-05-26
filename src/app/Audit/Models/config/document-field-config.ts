

//Campos ocultos
export const AUDIT_HIDDEN_FIELDS = new Set<string>([
  'id',
  'entId',
  'documentId',
  'parentId',
]);


export const AUDIT_FIELD_LABELS: Record<string, string> = {

  // Receipt
  receiptCode: 'Código recibo',
  receiptType: 'Tipo recibo',
  paymentMethodId: 'Método de pago',
  paymentMethodAccount: 'Cuenta método de pago',
  thirdPartName: 'Nombre tercero',
  thirdPartyName: 'Nombre tercero',
  thirdPartyId: 'Id tercero',
  thirdId: 'Id tercero',
  issueDate: 'Fecha emisión',
  observations: 'Observaciones',
  ledgerAccountId: 'Cuenta contable',
  centerCostId: 'Id centro de costo',
  costCenterId: 'Id centro de costo',

  // Write off
  code: 'Código',
  justification: 'Justificación',
  writeOffDate: 'Fecha castigo',
  status: 'Estado',
  debitAuxiliaryAccount: 'Cuenta auxiliar débito',

  // Common
  accountingAccount: 'Cuenta contable',
  invoiceId: 'Id factura',
  invoiceCode: 'Código factura',

  // Receipt detail
  amountPaid: 'Valor pagado',
  amountReversed: 'Valor reversado',

  // Write off detail
  amountWrittenOff: 'Valor castigado',

  // Totals
  totalAmount: 'Valor total',
  totalAmountReversed: 'Valor total reversado',
  totalAmountRestored: 'Valor restaurado',

  // Metadata
  operationType: 'Tipo operación',
  documentSubtype: 'Subtipo documento',
  affectsInvoices: 'Afecta facturas',

  // Diff fields
  invoiceStatus: 'Estado factura',
  pendingValue: 'Saldo pendiente',

  factCode: 'Código factura',
  factureType: 'Tipo factura',
  expirationDate: 'Fecha vencimiento',

  // Details
  productId: 'Producto',
  description: 'Descripción',
  amount: 'Cantidad',
  quantity: 'Cantidad',
  unitPrice: 'Precio unitario',
  discount: 'Descuento',
  taxPercentage: 'Impuesto',
  subtotal: 'Subtotal',

  // Totals
  totalValue: 'Valor total',
  totalPay: 'Valor pagado',

  // Returns
  originalFactCode: 'Factura origen',
  returnType: 'Tipo devolución',
  reason: 'Motivo',

  // Void/Delete
  documentCode: 'Código documento',
  voidedDocument: 'Documento anulado',
}


export const AUDIT_VALUE_LABELS: Record<string, string> = {

  // Receipt types
  INVOICE_PAYMENT: 'Pago de factura',
  DIRECT_INCOME: 'Ingreso directo',

  // Write off status
  PENDING_CONFIRMATION: 'Pendiente confirmación',
  CONFIRMED: 'Confirmado',
  VOIDED: 'Anulado',

  // Invoice status
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PENDING_WRITTEN_OFF: 'Pendiente castigo',
  WRITTEN_OFF: 'Castigado',

  // Operations
  CREATE: 'Creación',
  APPROVE: 'Aprobación',
  UPDATE: 'Actualización',
  VOID: 'Anulación',
  DELETE: 'Eliminación',

  PURCHASE: 'Compra',
  SALE: 'Venta',
  RETURN_ON_SALE: 'Devolución en venta',
  RETURN_ON_PURCHASE: 'Devolución en compra',
  NON_COMMERCIAL_ENTRY: 'Entrada no comercial',
  NON_COMMERCIAL_EXIT: 'Salida no comercial',

  PEPS: 'PEPS',
  WEIGHTED_AVERAGE: 'Promedio ponderado',

  // Boolean
  true: 'Sí',
  false: 'No',
};

/** Traduce una clave */
export function getAuditFieldLabel(key: string): string {
  return AUDIT_FIELD_LABELS[key] ?? key;
}

/** Traduce valores */
export function getAuditValueLabel(value: any): string {

  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .map(v => AUDIT_VALUE_LABELS[String(v)] ?? String(v))
      .join(', ');
  }

  return AUDIT_VALUE_LABELS[String(value)] ?? String(value);
}

/** Determina si mostrar campo */
export function isAuditFieldVisible(key: string): boolean {
  return !AUDIT_HIDDEN_FIELDS.has(key);
}