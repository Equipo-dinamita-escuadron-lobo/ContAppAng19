import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTypeCreationComponent } from './product-type-creation.component';

describe('ProductTypeCreationComponent', () => {
  let component: ProductTypeCreationComponent;
  let fixture: ComponentFixture<ProductTypeCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductTypeCreationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductTypeCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
