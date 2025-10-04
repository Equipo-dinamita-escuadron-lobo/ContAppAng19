import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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
    return this.http.post<PortfolioWriteOffResponseDto>(this.apiUrl, request);
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
    console.log('Fetching write-offs for enterprise ID:', enterpriseId);
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
      writeOffDate: new Date(dto.writeOffDate), // Conversión de string a Date
      details: dto.details.map(detailDto => ({
        ...detailDto,
        invoice: {
          ...detailDto.invoice,
          expirationDate: new Date(detailDto.invoice.expirationDate) // Conversión de string a Date
        }
      }))
    };
  }
}
