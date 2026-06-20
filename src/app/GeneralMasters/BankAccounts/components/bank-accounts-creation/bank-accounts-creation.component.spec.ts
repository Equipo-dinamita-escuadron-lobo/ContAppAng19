import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAccountsCreationComponent } from './bank-accounts-creation.component';

describe('BankAccountsCreationComponent', () => {
  let component: BankAccountsCreationComponent;
  let fixture: ComponentFixture<BankAccountsCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankAccountsCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAccountsCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
