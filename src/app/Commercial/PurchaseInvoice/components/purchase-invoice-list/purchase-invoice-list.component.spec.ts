import { of, throwError } from 'rxjs';
import { PurchaseInvoiceListComponent } from './purchase-invoice-list.component';

describe('PurchaseInvoiceListComponent', () => {
  function createComponent(options?: { summaries?: any[]; details?: Record<number, any>; error?: boolean }) {
    const factureService = {
      getAllFactures: jasmine.createSpy().and.returnValue(
        options?.error ? throwError(() => new Error('backend unavailable')) : of(options?.summaries ?? []),
      ),
      getFactureById: jasmine.createSpy().and.callFake((id: number) => of(options?.details?.[id])),
    };
    const thirdService = {
      getThirdsByType: jasmine.createSpy().and.returnValue(of({
        content: [{ thId: 7, personType: 'Juridica', socialReason: 'Proveedor PP8' }],
      })),
    };
    const router = { navigate: jasmine.createSpy() };
    const component = new PurchaseInvoiceListComponent(factureService as any, thirdService as any, router as any);
    (component as any).localStorageMethods = { getIdEnterprise: () => 'enterprise-pp8' };
    return { component, factureService, router };
  }

  it('lists PURCHASE invoices with supplier, balances, due date and status', () => {
    const { component, factureService } = createComponent({
      summaries: [
        { id: 1, entId: 'enterprise-pp8', factureType: 'PURCHASE' },
        { id: 2, entId: 'enterprise-pp8', factureType: 'SALE' },
      ],
      details: {
        1: {
          id: 1,
          factCode: 103,
          entId: 'enterprise-pp8',
          factureType: 'PURCHASE',
          thId: 7,
          totalValue: '1250000.00',
          totalPay: '250000.00',
          pendingValue: '1000000.00',
          createdAt: '2026-08-17T10:00:00',
          expirationDate: '2099-09-16',
          purchaseStatus: 'ACTIVE',
        },
      },
    });

    component.loadInvoices();

    expect(factureService.getFactureById).toHaveBeenCalledOnceWith(1);
    expect(component.invoices).toEqual([jasmine.objectContaining({
      reference: '#103',
      supplier: 'Proveedor PP8',
      total: 1_250_000,
      paid: 250_000,
      pending: 1_000_000,
      dueDate: '2099-09-16',
      status: 'Pendiente',
    })]);
    expect(component.loadError).toBe('');
  });

  it('shows a normal empty result when there are no PURCHASE invoices', () => {
    const { component, factureService } = createComponent({
      summaries: [{ id: 2, entId: 'enterprise-pp8', factureType: 'SALE' }],
    });

    component.loadInvoices();

    expect(component.invoices).toEqual([]);
    expect(component.loadError).toBe('');
    expect(factureService.getFactureById).not.toHaveBeenCalled();
  });

  it('exposes the real load error instead of replacing it with an empty list', () => {
    const { component } = createComponent({ error: true });
    component.invoices = [{ id: 99 } as any];

    component.loadInvoices();

    expect(component.loadError).toContain('No se pudieron cargar');
    expect(component.invoices).toEqual([{ id: 99 } as any]);
  });

  it('navigates to the existing purchase creation form', () => {
    const { component, router } = createComponent();

    component.createInvoice();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/commercial/purchase-invoice/new']);
  });
});
