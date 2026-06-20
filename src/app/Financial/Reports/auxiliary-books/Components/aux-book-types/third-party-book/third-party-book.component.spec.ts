import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdPartyBookComponent } from './third-party-book.component';

describe('ThirdPartyBookComponent', () => {
  let component: ThirdPartyBookComponent;
  let fixture: ComponentFixture<ThirdPartyBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdPartyBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdPartyBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
