import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Enterprise } from '../../models/Enterprise';
import { EnterpriseList } from '../../models/EnterpriseList';
import { EnterpriseType } from '../../models/EnterpriseType';

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