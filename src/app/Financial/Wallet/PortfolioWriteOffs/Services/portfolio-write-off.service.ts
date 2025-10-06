import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { CreateWriteOffRequestDto, PortfolioWriteOffResponseDto, PortfolioWriteOffView } from '../Models';

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
    console.log('Creating write-off with request:', request);
    const url = `${this.apiUrl}/`;
    return this.http.post<PortfolioWriteOffResponseDto>(url, request);
  }

  /**
   * Confirma un castigo de cartera existente.
   * @param writeOffId El ID del castigo a confirmar.
   * @returns Un Observable que completa cuando la operación es exitosa.
   */
  confirmWriteOff(writeOffId: number): Observable<void> {
    const url = `${this.apiUrl}/${writeOffId}/confirm`;
    return this.http.post<void>(url, {}); // Enviamos un cuerpo vacío
  }

  /**
   * Anula un castigo de cartera que ya fue confirmado.
   * @param writeOffId El ID del castigo a anular.
   * @returns Un Observable que completa cuando la operación es exitosa.
   */
  voidWriteOff(writeOffId: number): Observable<void> {
    const url = `${this.apiUrl}/${writeOffId}/void`;
    return this.http.post<void>(url, {}); // Enviamos un cuerpo vacío
  }

  /**
   * Obtiene un castigo de cartera por su ID.
   * @param writeOffId El ID del castigo a obtener.
   * @returns Un Observable con el castigo en formato de Vista (PortfolioWriteOffView).
   */
  getWriteOffById(writeOffId: number): Observable<PortfolioWriteOffView> {
    const url = `${this.apiUrl}/${writeOffId}`;
    return this.http.get<PortfolioWriteOffResponseDto>(url).pipe(
      map(dto => this.mapDtoToView(dto))
    );
  }

  /**
   * Obtiene la lista de todos los castigos de cartera para una empresa.
   * @param enterpriseId El ID de la empresa.
   * @returns Un Observable con un array de castigos en formato de Vista (PortfolioWriteOffView).
   */
  getWriteOffsByEnterprise(enterpriseId: string): Observable<PortfolioWriteOffView[]> {
    const url = `${this.apiUrl}/by-enterprise/${enterpriseId}`;
    return this.http.get<PortfolioWriteOffResponseDto[]>(url).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToView(dto)))
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
    // ¡AQUÍ ESTÁ LA CORRECIÓN!
    // Comprobamos si dto.details existe antes de mapearlo. Si es null, devolvemos un array vacío.
    details: dto.details ? dto.details.map(detailDto => ({
      ...detailDto,
      invoice: {
        ...detailDto.invoice,
        // También nos aseguramos de que la factura exista antes de acceder a sus propiedades
        expirationDate: detailDto.invoice ? new Date(detailDto.invoice.expirationDate) : new Date()
      }
    })) : []
  };
}
}
