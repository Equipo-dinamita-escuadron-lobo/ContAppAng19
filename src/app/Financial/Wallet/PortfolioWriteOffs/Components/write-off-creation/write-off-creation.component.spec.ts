import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteOffCreationComponent } from './write-off-creation.component';

describe('WriteOffCreationComponent', () => {
  let component: WriteOffCreationComponent;
  let fixture: ComponentFixture<WriteOffCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WriteOffCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriteOffCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
