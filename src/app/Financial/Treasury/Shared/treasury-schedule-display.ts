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
