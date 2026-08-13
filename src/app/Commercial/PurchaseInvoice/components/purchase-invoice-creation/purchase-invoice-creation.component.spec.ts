import { fakeAsync, tick } from '@angular/core/testing';
import { NEVER } from 'rxjs';

import { PurchaseInvoiceCreationComponent } from './purchase-invoice-creation.component';

describe('PurchaseInvoiceCreationComponent save state', () => {
  it('releases the loading button when the server does not respond', fakeAsync(() => {
    const component = Object.create(PurchaseInvoiceCreationComponent.prototype) as any;
    component.supplier = { thId: 1 };
    component.lstProducts = [{
      id: 10,
      amount: 1,
      description: 'Producto',
      cost: 100,
      IVA: 0,
      descuentos: [0, 0],
    }];
    component.initialPayment = 0;
    component.total = 100;
    component.pendingTotal = 100;
    component.currentDate = new Date('2026-08-13T12:00:00');
    component.paymentTermDays = 30;
    component.impuestoCheck = true;
    component.localStorageMethods = {
      loadEnterpriseData: () => ({ id: 'enterprise-a' }),
      getInventoryConfigType: () => 'WEIGHTED_AVERAGE',
    };
    component.purchaseInvoiceService = {
      createPurchaseInvoice: () => NEVER,
    };
    component.messageService = { add: jasmine.createSpy() };

    component.saveInvoice();
    expect(component.saving).toBeTrue();

    tick(20_001);

    expect(component.saving).toBeFalse();
    expect(component.messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'warn',
      summary: 'Respuesta demorada',
    }));
  }));
});
