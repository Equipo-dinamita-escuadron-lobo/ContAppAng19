import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { CreateWriteOffRequestDto, PortfolioWriteOffResponseDto, PortfolioWriteOffView } from '../Models';
import { ApiResponse } from '../../../../Core/Model/apiResponseModel';

@Injectable({
  providedIn: 'root'
})
export class PortfolioWriteOffService {
  private apiUrl = environment.API_URL + 'payments/write-offs';

  constructor(private http: HttpClient) { }

  /**
  * Crea un nuevo registro de castigo de cartera.
  * @param request El DTO con los datos para crear el castigo.
  * @returns Un Observable con la respuesta del castigo creado.
  */
  createWriteOff(request: CreateWriteOffRequestDto): Observable<PortfolioWriteOffResponseDto> {
    const url = `${this.apiUrl}/`;
    return this.http.post<ApiResponse<PortfolioWriteOffResponseDto>>(url, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al crear el castigo de cartera.');
        }
      })
    );
  }

  /**
   * Confirma un castigo de cartera existente.
   * @param writeOffId El ID del castigo a confirmar.
   * @returns Un Observable con la respuesta del castigo confirmado.
   */
  confirmWriteOff(writeOffId: number): Observable<PortfolioWriteOffResponseDto> {
    const url = `${this.apiUrl}/${writeOffId}/confirm`;
    return this.http.put<ApiResponse<PortfolioWriteOffResponseDto>>(url, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al confirmar el castigo de cartera.');
        }
      })
    );
  }


  /**
   * Anula un castigo de cartera que ya fue confirmado.
   * @param writeOffId El ID del castigo a anular.
   * @returns Un Observable con la respuesta del castigo anulado.
   */
  voidWriteOff(writeOffId: number): Observable<PortfolioWriteOffResponseDto> {
    const url = `${this.apiUrl}/${writeOffId}/void`;
    return this.http.put<ApiResponse<PortfolioWriteOffResponseDto>>(url, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al anular el castigo de cartera.');
        }
      })
    );
  }

  /**
   * Obtiene un castigo de cartera por su ID.
   * @param writeOffId El ID del castigo a obtener.
   * @returns Un Observable con el castigo en formato de Vista (PortfolioWriteOffView).
   */
  getWriteOffById(writeOffId: number): Observable<PortfolioWriteOffView> {
    const url = `${this.apiUrl}/${writeOffId}`;
    return this.http.get<ApiResponse<PortfolioWriteOffResponseDto>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapDtoToView(response.data);
        } else {
          throw new Error(response.message || 'No se encontró el castigo de cartera.');
        }
      })
    );
  }

  /**
   * Obtiene la lista de todos los castigos de cartera para una empresa.
   * @param enterpriseId El ID de la empresa.
   * @returns Un Observable con un array de castigos en formato de Vista (PortfolioWriteOffView).
   */
  getWriteOffsByEnterprise(enterpriseId: string): Observable<PortfolioWriteOffView[]> {
    const url = `${this.apiUrl}/by-enterprise/${enterpriseId}`;

    return this.http.get<ApiResponse<PortfolioWriteOffResponseDto[]>>(url).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT') {
          return [];
        }
        if (response.success && response.data) {
          return response.data.map(dto => this.mapDtoToView(dto));
        } else {
          throw new Error(response.message || 'Error al obtener los castigos de cartera.');
        }
      })
    );
  }

  /**
   * Obtiene la lista de todos los castigos de cartera confirmados o anulados para una empresa.
   * @param enterpriseId El ID de la empresa.
   * @returns Un Observable con un array de castigos en formato de Vista (PortfolioWriteOffView).
   */
  getWriteOffsConfirmedOrVoidedByEnterprise(enterpriseId: string): Observable<PortfolioWriteOffView[]> {
    const url = `${this.apiUrl}/confirmed-or-voided/by-enterprise/${enterpriseId}`;

    return this.http.get<ApiResponse<PortfolioWriteOffResponseDto[]>>(url).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT') {
          return [];
        }
        if (response.success && response.data) {
          return response.data.map(dto => this.mapDtoToView(dto));
        } else {
          throw new Error(response.message || 'Error al obtener los castigos de cartera.');
        }
      })
    );
  }

  /**
   * Transforma un DTO de respuesta (PortfolioWriteOffResponseDto) a un modelo de vista (PortfolioWriteOffView).
   * @param dto El objeto de transferencia de datos recibido de la API.
   * @returns El modelo de vista listo para ser usado por los componentes.
   */
  private mapDtoToView(dto: PortfolioWriteOffResponseDto): PortfolioWriteOffView {
    return {
      ...dto,
      writeOffDate: new Date(dto.writeOffDate),
      details: dto.details ? dto.details.map(detailDto => ({
        ...detailDto,
        invoice: {
          ...detailDto.invoice,
          expirationDate: detailDto.invoice ? new Date(detailDto.invoice.expirationDate) : new Date()
        }
      })) : []
    };
  }
}
