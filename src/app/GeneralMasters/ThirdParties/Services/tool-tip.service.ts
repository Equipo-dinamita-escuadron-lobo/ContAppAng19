/**
 * @fileoverview Servicio para la gestión de tooltips
 *
 * Este servicio permite:
 * - Gestionar tooltips del sistema
 * - Realizar operaciones CRUD sobre tooltips
 * - Manejar la comunicación con el API de tooltips
 *
 * Funcionalidades principales:
 * - Consulta de tooltips
 * - Creación de nuevos tooltips
 * - Actualización de tooltips existentes
 * - Eliminación de tooltips
 * - Búsqueda por ID
 *
 * @author [CONTAPP]
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Tooltip } from '../models/Tooltip';
import { Observable, catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToolTipService {
  /** URL del endpoint para tooltips */
  private tooltipApiUrl = environment.API_URL + 'thirds/tooltip';
  //Cambiar para desarrollo local
  //private tooltipApiUrl = 'http://localhost:8081/api/thirds/tooltip'

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los tooltips disponibles
   * @returns Observable con el array de tooltips
   */
  getAllTooltips(): Observable<Tooltip[]> {
    return this.http.get<Tooltip[]>(this.tooltipApiUrl);
  }

  /**
   * Obtiene un tooltip específico por su ID
   * @param id ID del tooltip a buscar
   * @returns Observable con el tooltip encontrado
   */
  getTooltipById(id: string): Observable<Tooltip> {
    return this.http.get<Tooltip>(`${this.tooltipApiUrl}/${id}`);
  }

  /**
   * Crea un nuevo tooltip
   * @param tooltip Datos del tooltip a crear
   * @returns Observable con el tooltip creado
   */
  createTooltip(tooltip: Tooltip): Observable<Tooltip> {
    return this.http.post<Tooltip>(this.tooltipApiUrl, tooltip);
  }

  /**
   * Crea un nuevo tooltip con manejo de errores
   * @param tooltip Datos del tooltip a crear
   * @returns Observable con el tooltip creado
   */
  createTooltip2(tooltip: Tooltip): Observable<Tooltip> {
    console.log('Request Body:', tooltip);
    return this.http.post<Tooltip>(this.tooltipApiUrl, tooltip).pipe(
      catchError((error) => {
        console.error('Error occurred: ', error);
        return throwError(
          () => new Error('Error occurred while adding a hero')
        );
      })
    );
  }

  /**
   * Actualiza un tooltip existente
   * @param id ID del tooltip a actualizar
   * @param tooltip Nuevos datos del tooltip
   * @returns Observable con el tooltip actualizado
   */
  updateTooltip(id: string, tooltip: Tooltip): Observable<Tooltip> {
    return this.http.put<Tooltip>(`${this.tooltipApiUrl}/${id}`, tooltip);
  }

  /**
   * Elimina un tooltip específico
   * @param id ID del tooltip a eliminar
   * @returns Observable con la respuesta de la eliminación
   */
  deleteTooltip(id: string): Observable<void> {
    return this.http.delete<void>(`${this.tooltipApiUrl}${id}`);
  }
}
