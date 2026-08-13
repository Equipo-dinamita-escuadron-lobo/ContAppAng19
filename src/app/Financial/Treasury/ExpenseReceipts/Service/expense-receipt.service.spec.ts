import { firstValueFrom, of } from 'rxjs';

import { ExpenseReceiptService } from './expense-receipt.service';

describe('ExpenseReceiptService payable accounts', () => {
  it('builds unique options from pending obligations', async () => {
    const api = {
      pending: jasmine.createSpy().and.returnValue(of([
        { payableAccountId: 20, payableAccountCode: '2205' },
        { payableAccountId: 20, payableAccountCode: '2205' },
        { payableAccountId: 30, payableAccountCode: '2335' },
      ])),
    };
    const storage = { getIdEnterprise: () => 'enterprise-a' };
    const service = new ExpenseReceiptService(
      api as any,
      null as any,
      null as any,
      null as any,
      storage as any,
    );

    const result = await firstValueFrom(service.getPayableAccounts());

    expect(api.pending).toHaveBeenCalledWith('enterprise-a');
    expect(result).toEqual([
      { id: 20, code: '2205', name: 'Cuenta por pagar', fullName: '2205 - Cuenta por pagar' },
      { id: 30, code: '2335', name: 'Cuenta por pagar', fullName: '2335 - Cuenta por pagar' },
    ]);
  });
});
