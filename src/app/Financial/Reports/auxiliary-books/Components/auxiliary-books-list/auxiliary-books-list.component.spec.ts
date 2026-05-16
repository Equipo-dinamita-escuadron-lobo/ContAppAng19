import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';

import { AuxiliaryBooksListComponent } from './auxiliary-books-list.component';
import { AuthService } from '../../../../../Core/auth/services/auth.service';

describe('AuxiliaryBooksListComponent', () => {
  let component: AuxiliaryBooksListComponent;
  let fixture: ComponentFixture<AuxiliaryBooksListComponent>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService = jasmine.createSpyObj('AuthService', ['hasRole']);
    dialogService = jasmine.createSpyObj('DialogService', ['open']);

    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksListComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        { provide: DialogService, useValue: dialogService },
      ],
    })
      .overrideComponent(AuxiliaryBooksListComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('contains the 6 supported auxiliary books', () => {
    expect(component.auxiliaryBooks.length).toBe(6);
    const names = component.auxiliaryBooks.map((b) => b.name);
    expect(names).toContain('Libro Diario');
    expect(names).toContain('Libro Mayor');
    expect(names).toContain('Libro Auxiliar por Cuenta');
    expect(names).toContain('Libro Auxiliar por Tercero');
    expect(names).toContain('Movimiento de Contabilidad');
    expect(names).toContain('Libro de Inventarios y Balances');
  });

  it('isAdmin returns true when user has Administrador role', () => {
    authService.hasRole.and.returnValue(true);
    expect(component.isAdmin).toBeTrue();
    expect(authService.hasRole).toHaveBeenCalledWith('Administrador');
  });

  it('isAdmin returns false when user lacks Administrador role', () => {
    authService.hasRole.and.returnValue(false);
    expect(component.isAdmin).toBeFalse();
  });

  it('goTo navigates to the provided route', () => {
    component.goTo('/foo/bar');
    expect(router.navigate).toHaveBeenCalledWith(['/foo/bar']);
  });

  it('goToHistory navigates to the historial route', () => {
    component.goToHistory();
    expect(router.navigate).toHaveBeenCalledWith([
      '/financial/reports/auxiliary-books/historial',
    ]);
  });

  it('goToAuxiliaryBookScheduler opens scheduling dialog', () => {
    component.goToAuxiliaryBookScheduler();
    expect(dialogService.open).toHaveBeenCalled();
    const args = dialogService.open.calls.mostRecent().args as any;
    expect(args[1].data.bookName).toBe('Libros Auxiliares');
    expect(args[1].modal).toBeTrue();
  });
});
