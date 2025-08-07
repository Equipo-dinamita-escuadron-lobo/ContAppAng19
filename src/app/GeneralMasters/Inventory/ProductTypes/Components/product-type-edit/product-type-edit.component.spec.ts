import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTypeEditComponent } from './product-type-edit.component';

describe('ProductTypeEditComponent', () => {
  let component: ProductTypeEditComponent;
  let fixture: ComponentFixture<ProductTypeEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductTypeEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductTypeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
