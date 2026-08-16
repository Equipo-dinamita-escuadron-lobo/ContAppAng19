import { PaymentSchedule } from './treasury-api.models';
import { translatePaymentMethodName } from './treasury-status-labels';
import { resolveSupplierName } from './treasury-third-party.integration';

export function scheduleTotal(item: PaymentSchedule): number {
  if (item.total != null && !Number.isNaN(Number(item.total))) {
    return Number(item.total);
  }
  return (item.details ?? []).reduce((sum, detail) => sum + Number(detail.amount ?? 0), 0);
}

export function scheduleSuppliersLabel(
  item: PaymentSchedule,
  supplierNames: Map<number, string>,
): string {
  const supplierIds = [...new Set((item.details ?? []).map((detail) => detail.supplierId))];
  if (!supplierIds.length) {
    return '—';
  }
  if (supplierIds.length === 1) {
    return resolveSupplierName(supplierNames, supplierIds[0]);
  }
  return supplierIds.map((id) => resolveSupplierName(supplierNames, id)).join(', ');
}

export function scheduleInvoicesLabel(
  item: PaymentSchedule,
  payableReferenceById: Map<number, string>,
  formatMoney: (amount: number) => string,
): string {
  const details = item.details ?? [];
  if (!details.length) {
    return '—';
  }
  return details
    .map((detail) => {
      const reference = payableReferenceById.get(detail.invoiceId) ?? `ID ${detail.invoiceId}`;
      return `${reference} (${formatMoney(Number(detail.amount ?? 0))})`;
    })
    .join(', ');
}

export function scheduleMethodLabel(
  item: PaymentSchedule,
  methods: Array<{ id: number; name?: string }>,
): string {
  const method = methods.find((entry) => entry.id === Number(item.paymentMethodId));
  return method ? translatePaymentMethodName(method.name) : `#${item.paymentMethodId}`;
}

export function scheduleTypeLabel(item: PaymentSchedule): string {
  const details = item.details ?? [];
  if (details.length <= 1) {
    return 'Individual';
  }
  const supplierIds = new Set(details.map((detail) => detail.supplierId));
  return supplierIds.size <= 1 ? 'Agrupada' : 'Agrupada multi-proveedor';
}

export function formatTreasuryInstant(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function scheduleVoucherLabel(
  item: PaymentSchedule,
  voucherNumberById?: Map<number, string>,
): string {
  const fromApi = item.voucherNumber?.trim();
  if (fromApi) {
    return fromApi;
  }
  if (item.voucherId != null && voucherNumberById?.has(item.voucherId)) {
    return voucherNumberById.get(item.voucherId)!;
  }
  return '—';
}
