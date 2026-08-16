import {
  buildAccountCatalogueLookup,
  flattenAccountCatalogueRefs,
  mapAccountingMovementsForView,
  resolveAccountFromLookup,
  resolveMovementAccountDisplay,
} from './treasury-accounting-display';

describe('treasury-accounting-display', () => {
  const lookup = buildAccountCatalogueLookup([
    { id: 21, code: '2105', description: 'Cuentas por pagar', status: true },
    { id: 99, code: '11050101', description: 'Banco menor', status: true },
  ]);

  it('resolves known accountId from catalogue lookup', () => {
    const resolved = resolveMovementAccountDisplay({ accountId: 21 }, lookup);
    expect(resolved.accountCode).toBe('2105');
    expect(resolved.accountName).toBe('Cuentas por pagar');
  });

  it('keeps explicit code and name when already provided', () => {
    const resolved = resolveMovementAccountDisplay({
      accountCode: '11050101',
      accountName: 'Banco menor',
    }, lookup);
    expect(resolved.accountCode).toBe('11050101');
    expect(resolved.accountName).toBe('Banco menor');
  });

  it('falls back when accountId is not resolvable', () => {
    const resolved = resolveAccountFromLookup(404, lookup);
    expect(resolved.accountCode).toBe('—');
    expect(resolved.accountName).toBe('Cuenta 404');
  });

  it('maps each movement with its own resolved account', () => {
    const rows = mapAccountingMovementsForView([
      { accountId: 21, description: 'Pago factura 863170369', debit: 20000, credit: 0 },
      { accountCode: '11050101', accountName: 'Banco menor', description: 'Pago', debit: 0, credit: 20000 },
    ], lookup);

    expect(rows[0].accountCode).toBe('2105');
    expect(rows[0].accountName).toBe('Cuentas por pagar');
    expect(rows[1].accountCode).toBe('11050101');
    expect(rows[1].accountName).toBe('Banco menor');
  });

  it('flattens nested catalogue nodes for lookup', () => {
    const flat = flattenAccountCatalogueRefs([
      {
        id: 1,
        code: '2',
        description: 'Pasivo',
        children: [{ id: 21, code: '2105', description: 'Cuentas por pagar' }],
      },
    ]);
    const nestedLookup = buildAccountCatalogueLookup(flat);
    const resolved = resolveMovementAccountDisplay({ accountId: 21 }, nestedLookup);
    expect(resolved.accountCode).toBe('2105');
    expect(resolved.accountName).toBe('Cuentas por pagar');
  });
});
