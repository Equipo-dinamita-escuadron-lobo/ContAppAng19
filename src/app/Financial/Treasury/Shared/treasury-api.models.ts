export type VoucherStatus = 'DRAFT' | 'POSTING' | 'POSTED' | 'FAILED' | 'VOIDING' | 'VOIDED' | 'VOID_FAILED';
export type ScheduleStatus = 'SCHEDULED' | 'PROCESSING' | 'WAITING_ACCOUNTING' | 'EXECUTED' | 'FAILED' | 'CANCELED';

export interface VoucherDetailRequest { supplierId: number; invoiceId: number; amount: number; }
export interface VoucherRequest {
  enterpriseId: string; issueDate: string; paymentMethodId: number; bankAccountId?: number;
  observations?: string; details: VoucherDetailRequest[];
}
export interface VoucherDetail {
  id: number; supplierId: number; invoiceId: number; invoiceReference: string;
  payableAccountId: number; payableAccountCode: string; previousBalance: number;
  amountPaid: number; remainingBalance: number;
}
export interface PaymentVoucher {
  id: number; voucherNumber: string; enterpriseId: string; issueDate: string;
  status: VoucherStatus; paymentMethodId: number; bankAccountId?: number; total: number;
  observations?: string; accountingEntryId?: number; failureReason?: string; voidReason?: string;
  version: number; details: VoucherDetail[];
}
export interface Payable {
  id: number; sourceInvoiceId: number; reference: string; enterpriseId: string; supplierId: number;
  originalAmount: number; paidAmount: number; pendingAmount: number; reservedAmount: number;
  availableAmount: number; issueDate: string; originalDueDate: string; dueDate: string;
  payableAccountId: number; payableAccountCode: string; active: boolean; version: number;
}
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface PaymentSchedule {
  id: number; enterpriseId: string; executionDate: string; status: ScheduleStatus;
  paymentMethodId: number; bankAccountId?: number; total: number; observations?: string;
  retryCount: number; voucherId?: number; failureReason?: string; details: unknown[];
}
export interface AgingLine {
  supplierId: number; invoiceId: number; reference: string; accountCode: string; dueDate: string;
  daysOverdue: number; current: number; days1to30: number; days31to60: number;
  days61to90: number; days91Plus: number;
}
export interface SupplierStatement {
  supplierId: number; invoiced: number; paid: number; pending: number;
  invoices: Payable[]; vouchers: PaymentVoucher[];
}
export interface WriteOffRequest {
  enterpriseId: string; reason: string; counterpartAccountId: number;
  counterpartAccountCode: string; details: VoucherDetailRequest[];
}
