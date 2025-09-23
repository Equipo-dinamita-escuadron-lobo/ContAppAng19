import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListKardexPepsComponent } from './list-kardex-peps.component';

describe('ListKardexPepsComponent', () => {
  let component: ListKardexPepsComponent;
  let fixture: ComponentFixture<ListKardexPepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListKardexPepsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListKardexPepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
