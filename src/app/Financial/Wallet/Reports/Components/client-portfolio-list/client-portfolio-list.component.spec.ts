import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientPortfolioListComponent } from './client-portfolio-list.component';

describe('ClientPortfolioListComponent', () => {
  let component: ClientPortfolioListComponent;
  let fixture: ComponentFixture<ClientPortfolioListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientPortfolioListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientPortfolioListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
