import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CategoryValidationMessagesService {

  private readonly messages: { [key: string]: { [key: string]: string } } = {
    name: {
      required: 'El nombre es requerido.',
      maxlength: 'El nombre no puede exceder los 100 caracteres.'
    },
    description: {
      required: 'La descripción es requerida.',
      maxlength: 'La descripción no puede exceder los 255 caracteres.'
    },
    inventory: {
      required: 'Debe seleccionar una cuenta de inventario.'
    },
    cost: {
      required: 'Debe seleccionar una cuenta de costo.'
    },
    sale: {
      required: 'Debe seleccionar una cuenta de venta.'
    },
    return: {
      required: 'Debe seleccionar una cuenta de devolución.'
    },
    taxes: {
      required: 'Debe seleccionar al menos un impuesto.'
    }
  };

  constructor() { }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName Nombre del campo
   * @param errors Objeto de errores de Angular
   * @returns Mensaje de error o null si no hay errores
   */
  getErrorMessage(fieldName: string, errors: any): string | null {
    if (!errors) return null;

    const fieldMessages = this.messages[fieldName];
    if (!fieldMessages) return null;

    // Retorna el primer error encontrado
    for (const errorKey of Object.keys(errors)) {
      if (fieldMessages[errorKey]) {
        return fieldMessages[errorKey];
      }
    }

    return null;
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   * @param control Control del formulario
   * @returns true si tiene errores y ha sido tocado
   */
  hasFieldError(control: any): boolean {
    return control?.invalid && control?.touched;
  }

  /**
   * Obtiene el mensaje de error para un control de formulario
   * @param control Control del formulario
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o null
   */
  getFieldErrorMessage(control: any, fieldName: string): string | null {
    if (!this.hasFieldError(control)) return null;
    return this.getErrorMessage(fieldName, control.errors);
  }

  getActiveStateSeverity(): 'success' {
    return 'success';
  }

  getInactiveStateSeverity(): 'danger' {
    return 'danger';
  }

  getActiveStateText(): string {
    return 'Activo';
  }

  getInactiveStateText(): string {
    return 'Inactivo';
  }
}