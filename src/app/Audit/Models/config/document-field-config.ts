

//Campos ocultos
export const AUDIT_HIDDEN_FIELDS = new Set<string>([
  'id',
  'entId',
  'documentId',
  'parentId',
]);


 //Traducción de campos
export const AUDIT_FIELD_LABELS: Record<string, string> = {

  // Header
  factCode:              'Código documento',
  factureType:           'Tipo documento',
  thirdPartName:         'Nombre tercero',
  thirdPartyDisplay:     'Tercero',
  expirationDate:        'Fecha vencimiento',
  accountingAccount:     'Cuenta contable',
  createdAt:             'Fecha creación',
  inventoryConfigType:   'Configuración inventario',

  //Returns
  originalFactCode:      'Factura origen',
  returnType:            'Tipo devolución',
  reasonSummary:         'Motivo',

  //Detail
  productId:             'Producto',
  description:           'Descripción',
  amount:                'Cantidad',
  quantity:              'Cantidad',
  unitPrice:             'Precio unitario',
  discount:              'Descuento',
  subtotal:              'Subtotal',
  taxPercentage:         'Impuestos',
  basePrice:             'Base',

  // Totals
  totalValue:            'Valor total',
  totalPay:              'Valor pagado',
  pendingValue:          'Saldo pendiente',
  grossValue:            'Valor bruto',
  taxValue:              'Impuestos',
  discountValue:         'Descuentos',
  netValue:              'Valor neto',

  //Recibos
  receiptType: 'Tipo recibo',
  paymentMethod: 'Método de pago',
  paymentMethodId: 'ID Método de pago',
  observations: 'Observaciones',
  receiptCode: 'Código recibo',
  issueDate: 'Fecha emisión',
  thirdPartyId: 'Id Tercero',
  voidDate: 'Fecha anulación',
  voidReasonDescription: 'Motivo anulación',
  totalAmountReversed: 'Valor anulado',
  INVOICE_PAYMENT: 'Pago de factura',
  totalAmount: 'Valor total',
  status: 'Estado',
  costCenterId: 'Id centro de costo',
  writeOffDate: 'Fecha castigo',
  thirdId: 'Id tercero',

  //Receipt 
  appliedValue:          'Valor aplicado',
  invoiceCode:           'Factura aplicada',

  //Accounting
  debit:                 'Débito',
  credit:                'Crédito',
  account:               'Cuenta',

  //Metadata
  eventVersion:          'Versión evento',
  source:                'Origen',
  generatedBy:           'Generado por',
  affectsInventory:      'Afecta inventario',
  affectsPortfolio:      'Afecta cartera',
};


export const AUDIT_VALUE_LABELS: Record<string, string> = {
  // Facture types
  PURCHASE:               'Compra',
  SALE:                   'Venta',
  RETURN_ON_SALE:         'Devolución en venta',
  RETURN_ON_PURCHASE:     'Devolución en compra',
  NON_COMMERCIAL_ENTRY:   'Entrada no comercial',
  NON_COMMERCIAL_EXIT: 'Salida no comercial',
  PENDING_CONFIRMATION: 'Pendiente',
  CONFIRMED: 'Confirmado',
  VOIDED: 'Anulado',
  PENDING_WRITEN_OFF: 'Pendiente castigo',
  WRITTEN_OFF: 'Castigado',


  //Inventory
  PEPS:                   'PEPS',
  WEIGHTED_AVERAGE:       'Promedio ponderado',

  // Operations
  CREATE:                 'Creación',
  UPDATE:                 'Actualización',
  APPROVE:                'Aprobación',
  VOID:                   'Anulación',
  DELETE:                 'Eliminación',

  //Boolean
  true:                   'Sí',
  false:                  'No',
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