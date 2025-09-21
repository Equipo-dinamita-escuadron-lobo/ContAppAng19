/**
 * Interfaz para manejar respuestas paginadas de Spring Data con serialización VIA_DTO
 */
export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/**
 * Interfaz simplificada para compatibilidad con el código existente
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Función utilitaria para convertir PageResponse a Page
 */
export function convertToSimplePage<T>(pageResponse: PageResponse<T>): Page<T> {
  return {
    content: pageResponse.content,
    totalElements: pageResponse.page.totalElements,
    totalPages: pageResponse.page.totalPages,
    number: pageResponse.page.number,
    size: pageResponse.page.size
  };
}
