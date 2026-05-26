
/** Campos a ocultar pues son ids de base de datos sin valor al usuario  */
export const HIDDEN_FIELDS = new Set<string>([
  'id', 'entId',
  'parentId', 'documentClassId', 'moduleId',
  'accountingAccountId', 'AccountCatalogueId',
  'salesTaxId', 'purchaseTaxId',
  'inventoryId', 'costId', 'saleId', 'returnId',
  'unitOfMeasureId', 'categoryId', 'productTypeId',
  'typeIdId',
  'salesTaxesCount', 'purchaseTaxesCount',
  'crossing', 'costCenter',
  'children',
]);

/** Traducción de claves (nombres y campos) */
export const FIELD_LABELS: Record<string, string> = {
  // Comunes
  code:               'Código',
  name:               'Nombre',
  description:        'Descripción',
  state:              'Estado',
  prefix:             'Prefijo',
  reference:          'Referencia',
  presentation:       'Presentación',
  abbreviation:       'Abreviatura',
  title:              'Título',
  taxes:              'Impuestos',
  quantity:           'Cantidad',
  cost:               'Costo',

  // Contabilidad
  nature:             'Naturaleza',
  financialStatus:    'Estado financiero',
  classification:     'Clasificación',
  parentCode:         'Código cuenta padre',
  interest:           'Interés (%)',
  salesTaxCode:       'Código impuesto ventas',
  purchaseTaxCode:    'Código impuesto compras',
  accountingAccount:  'Cuenta contable',

  // Bancos
  bank:               'Banco',
  accountNumber:      'Número de cuenta',
  accountType:        'Tipo de cuenta',
  currencies:         'Monedas',

  // Terceros
  idNumber:           'Número de identificación',
  verificationNumber: 'Dígito de verificación',
  personType:         'Tipo de persona',
  names:              'Nombres',
  lastNames:          'Apellidos',
  socialReason:       'Razón social',
  gender:             'Género',
  email:              'Correo electrónico',
  phoneNumber:        'Teléfono',
  address:            'Dirección',
  typeId:             'Tipo de identificación',
  typeIdname:         'Nombre tipo de identificación',
  thirdTypeName:      'Nombre tipo de tercero',
  country:            'País',
  province:           'Departamento',
  city:               'Ciudad',
};

/** Traducción de valores  (enums y booleanos) */
export const VALUE_LABELS: Record<string, string> = {
  // NatureEnum
  DEBIT:                        'Débito',
  CREDIT:                       'Crédito',

  // FinancialStatusEnum
  STATEMENTFINANCIALPOSITION:   'Estado de situación financiera',
  INCOMESTATEMENT:              'Estado de resultados',

  // ClassificationEnum
  CURRENTASSETS:                'Activo corriente',
  NONCURRENTASSETS:             'Activo no corriente',
  CURRENTLIABILITIES:           'Pasivo corriente',
  NONCURRENTLIABILITIES:        'Pasivo no corriente',
  EQUITY:                       'Patrimonio',
  OPERATINGREVENUES:            'Ingresos operacionales',
  NONOPERATINGINCOME:           'Ingresos no operacionales',
  OPERATINGEXPENSES:            'Gastos operacionales',

  // AccountType (BankAccount)
  AHORROS:                      'Cuenta de ahorros',
  CORRIENTE:                    'Cuenta corriente',

  // PersonClassification / ePersonType
  NATURAL_PERSON:               'Persona natural',
  LEGAL_ENTITY:                 'Persona jurídica',
  NATURAL:                      'Persona natural',
  JURIDICA:                     'Persona jurídica',

  // eThirdGender
  M:                            'Masculino',
  F:                            'Femenino',
  O:                            'Otro / Prefiere no decir',
};

export const MODULE_LABELS: Record<string, string | undefined> = {
  ACCOUNTING:             'Contabilidad',
  BANKS:                  'Bancos',
  PAYMENT_METHODS:        'Métodos de pago',
  CLASSES_OF_DOCUMENTS:   'Clases de documentos',
  INVENTORY:              'Inventario',
  THIRDS:                 'Terceros',
  COST_CENTERS:           'Centros de costo',
  TYPE_OF_DOCUMENTS:      'Tipos de documento',
  NO_COMMERCIAL_TAGS: 'Etiquetas',
  TAXES: 'Impuestos',
  ENTERPRISES: 'Empresas',
  CONFIGURATION: 'Configuración',
};

export const TABLE_LABELS: Record<string, string | undefined> = {
  ACCOUNT_CATALOGUE:  'Catálogo de cuentas',
  BANK:               'Banco',
  BANK_ACCOUNT:       'Cuenta bancaria',
  PAYMENT_METHOD:     'Método de pago',
  DOCUMENT_CLASS:     'Clase de documento',
  DOCUMENT_TYPE:      'Tipo de documento',
  TAX:                'Impuesto',
  THIRD:              'Tercero',
  THIRD_TYPE:         'Tipo de tercero',
  TYPE_ID:            'Tipo de identificación',
  COST_CENTER:        'Centro de costo',
  PRODUCT:            'Producto',
  PRODUCT_TYPE:       'Tipo de producto',
  CATEGORY:           'Categoría',
  UNIT_OF_MEASURE:    'Unidad de medida',
  NO_COMMERCIAL_TAG: 'Etiqueta no comercial',
  ENTERPRISE: 'Empresa',
  SUBJECT: 'Materia',
  USER: 'Usuario',
  PROFILE: 'Perfil',
  PERMISSION: 'Permiso',
};


/** Traduce una clave de campo al español */
export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** Traduce un valor: booleanos, arrays, enums */
export function getValueLabel(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean')            return value ? 'Activo' : 'Inactivo';
  if (Array.isArray(value))                  return value.map(v => VALUE_LABELS[String(v)] ?? String(v)).join(', ');
  return VALUE_LABELS[String(value)] ?? String(value);
}

/** Indica si un campo debe mostrarse u ocultarse */
export function isVisible(key: string): boolean {
  return !HIDDEN_FIELDS.has(key);
}
