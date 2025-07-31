import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UnitOfMeasure } from '../Models/UnitOfMeasure';

let API_URL = environment.API_URL;

@Injectable({
  providedIn: 'root'
})
export class UnitOfMeasureService {

  constructor(private http: HttpClient) { }
  // GET
  // Método para obtener todas las unidades de medida
  getUnitOfMeasures(enterpriseId: string): Observable<UnitOfMeasure[]> {
    const url = `${API_URL}unit-measures/findAll/${enterpriseId}`;
    return this.http.get<UnitOfMeasure[]>(url);
  }
  // Método para obtener por Id las unidades de medida
  getUnitOfMeasuresId(id: string): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/findById/${id}`;
    return this.http.get<UnitOfMeasure>(url);
  }

  // PUT  
  // Método para actualizar una Unidad de medida existente por ID
  updateUnitOfMeasureId(id: string, unitOfMeasure: UnitOfMeasure): Observable<UnitOfMeasure> {    
    const url = `${API_URL}unit-measures/update/${id}`;
    return this.http.put<UnitOfMeasure>(url, unitOfMeasure);
  }

  // // Método para actualizar una Unidad de medida existente por ID
  unitOfMeasureChangeState(id:string): Observable<UnitOfMeasure> {    
    const url = `${API_URL}unit-measures/changeState/${id}`;
    return this.http.put<UnitOfMeasure>(url,{});
  }

  // POST
  // Método para crear una nueva unidad de medida
  createUnitOfMeasure(unitOfMeasure: UnitOfMeasure): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/create`;
    console.log('unitOfMeasure', unitOfMeasure);
    return this.http.post<UnitOfMeasure>(url, unitOfMeasure);
  }

  // DELETE
  // Método para Eliminar una Unidad de medida existente por ID
  deleteUnitOfMeasureId(id: string): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/delete/${id}`;
    return this.http.delete<UnitOfMeasure>(url );
  }
  // Método para Eliminar todas las Unidades de medida existentes
  deleteUnitOfMeasure(): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/deleteAll`;
    return this.http.delete<UnitOfMeasure>(url );
  }
}
