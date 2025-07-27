import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { UnitOfMeasure } from '../../Products/Models/UnitOfMeasure';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnitOfMeasureService {

  constructor(private http: HttpClient) { }

  // Método para obtener todas las unidades de medida
  getUnitOfMeasures(enterpriseId: string): Observable<UnitOfMeasure[]> {
    const url = `${environment.API_URL}unit-measures/findAll/${enterpriseId}`;
    return this.http.get<UnitOfMeasure[]>(url);
  }
}
