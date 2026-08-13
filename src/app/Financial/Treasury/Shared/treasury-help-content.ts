/** Textos iniciales del popover ? para pantallas de Tesorería (editable en Centro de Ayuda). */
export const TREASURY_HELP = {
  operations: {
    title: 'Operaciones de Tesorería',
    summary:
      'Consolida obligaciones por pagar, comprobantes de egreso, programaciones y bajas de CxP. ' +
      'Los métodos de pago activos se vinculan a cuentas contables del catálogo; si un método exige cuenta bancaria, debe seleccionarse antes de pagar.',
    slug: 'tesoreria',
  },
  expenseReceipts: {
    title: 'Comprobantes de egreso',
    summary:
      'Registro de pagos a proveedores. Solo aparecen proveedores con facturas pendientes (CxP). ' +
      'Un abono parcial reduce el saldo; la anulación revierte el comprobante contabilizado.',
    slug: 'tesoreria',
  },
  makePayment: {
    title: 'Efectuar pago',
    summary:
      'Genera un comprobante de egreso aplicado a una o varias facturas del proveedor. ' +
      'Seleccione método de pago y, si aplica, la cuenta bancaria exigida por el método.',
    slug: 'tesoreria',
  },
  paymentSchedule: {
    title: 'Programación de pagos',
    summary:
      'Consulta obligaciones sincronizadas desde Facturación con saldo pendiente. ' +
      'Permite filtrar por proveedor, estado y vencimiento para planificar pagos.',
    slug: 'tesoreria',
  },
  agingReport: {
    title: 'Antigüedad de saldos',
    summary:
      'Clasifica las obligaciones pendientes por días de vencimiento (corriente, 1-30, 31-60, 61-90 y 91+). ' +
      'Los filtros de proveedor provienen de cuentas por pagar activas.',
    slug: 'tesoreria',
  },
  vendorReports: {
    title: 'Estado de proveedores',
    summary:
      'Resume débitos, créditos y saldo pendiente por proveedor con CxP. ' +
      'El detalle muestra movimientos del período y antigüedad de saldos.',
    slug: 'tesoreria',
  },
} as const;

export const ACCOUNT_CATALOGUE_HELP = {
  title: 'Catálogo de Cuentas PUC',
  summary:
    'El Plan Único de Cuentas (PUC) es una herramienta contable que organiza y clasifica sistemáticamente las cuentas según su naturaleza y función. ' +
    'Permite estructurar la información financiera de manera jerárquica mediante clases, grupos, cuentas y subcuentas para un registro contable preciso y estandarizado.',
  slug: 'configuracion',
} as const;

export const PAYMENT_METHODS_HELP = {
  title: 'Métodos de pago',
  summary:
    'Cada método se asocia a una cuenta contable del catálogo. La opción «Requiere cuenta bancaria al pagar» obliga a seleccionar una cuenta bancaria en Tesorería al efectuar el pago.',
  slug: 'configuracion',
} as const;
