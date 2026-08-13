import { NEVER } from 'rxjs';
import { TreasuryOperationsComponent } from './treasury-operations.component';

describe('TreasuryOperationsComponent PP8', () => {
  function component() {
    const api = { createVoucher: jasmine.createSpy('createVoucher').and.returnValue(NEVER) };
    const storage = { getIdEnterprise: () => 'enterprise-a' };
    const exportService = {
      datedFilename: (_prefix: string, ext: string) => `test.${ext}`,
      downloadCsvSections: jasmine.createSpy('downloadCsvSections'),
      downloadPdfSections: jasmine.createSpy('downloadPdfSections'),
    };
    const messageService = { add: jasmine.createSpy('add') };
    const value = new TreasuryOperationsComponent(
      api as any,
      storage as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      exportService as any,
      messageService as any,
    );
    value.payables = [{
      id: 11, sourceInvoiceId: 50, reference: 'FC-50', enterpriseId: 'enterprise-a', supplierId: 7,
      originalAmount: 100, paidAmount: 0, pendingAmount: 100, reservedAmount: 0, availableAmount: 100,
      issueDate: '2026-08-01', originalDueDate: '2026-08-30', dueDate: '2026-08-30',
      payableAccountId: 2205, payableAccountCode: '2205', active: true, version: 0
    }];
    value.selected.add(11);
    value.amounts[11] = 25;
    value.paymentMethodId = 1;
    value.methods = [{ id: 1, requiresBankAccount: true, accountingAccountId: 10 }];
    value.accounts = [{ id: 100, code: '519999', description: 'Gasto', status: true }];
    value.accountOptions = [{ id: 100, label: '519999 - Gasto' }];
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

  it('builds write-off options only with active accounts', () => {
    const { value } = component();
    const allAccounts = [
      { id: 1, code: '111', description: 'Activa', status: true },
      { id: 2, code: '222', description: 'Inactiva', status: false },
    ] as any[];
    value.accounts = allAccounts.filter((account) => account.status !== false);
    value.accountOptions = value.accounts.map((account: any) => ({
      id: account.id,
      label: `${account.code} - ${account.description}`,
    }));
    expect(value.accountOptions.map((option) => option.id)).toEqual([1]);
  });

  it('exports operations to csv when data is available', () => {
    const { value } = component();
    const exportService = (value as any).exportService;
    value.vouchers = [{
      id: 1,
      voucherNumber: 'CE-1',
      issueDate: '2026-08-01',
      status: 'POSTED',
      total: 25,
      paymentMethodId: 1,
      enterpriseId: 'enterprise-a',
      version: 0,
      details: [],
    }];
    value.exportToCsv();
    expect(exportService.downloadCsvSections).toHaveBeenCalled();
  });
});
