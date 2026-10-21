/**
 * Representa la entidad Cliente con su información esencial.
 * Utilizado para la selección de clientes y la obtención de datos básicos.
 */
export interface Client {
    id: number;
    name: string;
    identification?: string;
}