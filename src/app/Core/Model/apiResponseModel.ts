/**
 * Representa la estructura estandarizada de todas las respuestas de la API.
 * Es el equivalente en TypeScript de la clase ApiResponse<T> del backend.
 *
 * @template T El tipo de dato contenido en el campo 'data' (el payload).
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: string;
  data: T; // El payload de la respuesta. Será null en errores o respuestas vacías.

  // Estos campos solo estarán presentes en respuestas de error.
  status?: number;
  path?: string;
}