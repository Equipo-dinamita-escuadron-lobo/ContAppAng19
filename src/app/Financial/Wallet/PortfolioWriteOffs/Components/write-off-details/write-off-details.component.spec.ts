import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteOffDetailsComponent } from './write-off-details.component';

describe('WriteOffDetailsComponent', () => {
  let component: WriteOffDetailsComponent;
  let fixture: ComponentFixture<WriteOffDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WriteOffDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriteOffDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
