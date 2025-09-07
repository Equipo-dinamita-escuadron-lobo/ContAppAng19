import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interfaces locales para el mock
interface Enterprise {
  id: number;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

interface EnterpriseList {
  id: number;
  name: string;
  nit: string;
}

interface EnterpriseType {
  id: number;
  name: string;
}

@Injectable()
export class MockEnterpriseService {
  logoDefault: string = "../../../../../../assets/Iconos/enterprise/icon-default.png";

  enterpriseTypes: EnterpriseType[] = [
    { id: 1, name: 'Privada' },
    { id: 2, name: 'Oficial' },
    { id: 3, name: 'Mixta' }
  ];

  getEnterprises(): Observable<EnterpriseList[]> {
    return of([]);
  }

  getEnterpriseById(id: number): Observable<Enterprise> {
    return of({} as Enterprise);
  }

  createEnterprise(enterprise: Enterprise): Observable<Enterprise> {
    return of(enterprise);
  }

  getTypesEnterprise(): EnterpriseType[] {
    return this.enterpriseTypes;
  }
}