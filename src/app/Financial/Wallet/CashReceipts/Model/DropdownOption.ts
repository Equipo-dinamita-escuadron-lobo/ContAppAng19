/**
 * Modelo genérico para poblar listas desplegables (dropdowns) en la aplicación.
 * Facilita la consistencia en componentes como p-dropdown.
 */
export interface DropdownOption {
    label: string;
    value: any; 
}

export interface AuxiliaryAccountOption{
    label: string;
    codeAccount: string;
    description: string;
    value: number; 
    costCenter?: boolean | null;
}