import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnitOfMeasure } from '../models/UnitOfMeasure';

let API_URL = environment.API_URL + 'thirds/';

@Injectable({
  providedIn: 'root'
})
export class UnitOfMeasureService {

  constructor(private http: HttpClient) { }

  // Método para obtener por Id las unidades de medida
  getUnitOfMeasuresId(id: string): Observable<UnitOfMeasure> {
    const url = `${environment.API_URL}unit-measures/findById/${id}`;
    return this.http.get<UnitOfMeasure>(url);
  }
}
