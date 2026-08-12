import { NEVER } from 'rxjs';
import { TreasuryOperationsComponent } from './treasury-operations.component';

describe('TreasuryOperationsComponent PP8', () => {
  function component() {
    const api = { createVoucher: jasmine.createSpy('createVoucher').and.returnValue(NEVER) };
    const storage = { getIdEnterprise: () => 'enterprise-a' };
    const value = new TreasuryOperationsComponent(api as any, storage as any, {} as any, {} as any, {} as any);
    value.payables = [{
      id: 11, sourceInvoiceId: 50, reference: 'FC-50', enterpriseId: 'enterprise-a', supplierId: 7,
      originalAmount: 100, paidAmount: 0, pendingAmount: 100, reservedAmount: 0, availableAmount: 100,
      issueDate: '2026-08-01', originalDueDate: '2026-08-30', dueDate: '2026-08-30',
      payableAccountId: 2205, payableAccountCode: '2205', active: true, version: 0
    }];
    value.selected.add(11);
    value.amounts[11] = 25;
    value.paymentMethodId = 1;
    value.methods = [{ id: 1, requiresBankAccount: true }];
    return { value, api };
  }

  it('does not submit when the payment method requires a bank and none was selected', () => {
    const { value, api } = component();
    value.createVoucher();
    expect(api.createVoucher).not.toHaveBeenCalled();
    expect(value.error).toContain('exige una cuenta bancaria');
  });

  it('submits supplier, invoice and selected bank when the rule is satisfied', () => {
    const { value, api } = component();
    value.bankAccountId = 33;
    value.createVoucher();
    expect(api.createVoucher).toHaveBeenCalledWith(jasmine.objectContaining({
      enterpriseId: 'enterprise-a', paymentMethodId: 1, bankAccountId: 33,
      details: [{ supplierId: 7, invoiceId: 11, amount: 25 }]
    }));
  });
});
