import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TypeId } from '../models/TypeId';
import { ePersonType } from '../models/ePersonType';

/**
 * Servicio para manejar validaciones de formularios de terceros
 */
@Injectable({
  providedIn: 'root'
})
export class ThirdValidationService {

  constructor() { }

  /**
   * Validador para NITs
   * Verifica que el NIT comience con 8 o 9 y tenga exactamente 9 dígitos
   * @returns Función validadora
   */
  nitValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const nitString = control.value.toString();
      
      // Verificar que tenga exactamente 9 dígitos
      if (nitString.length !== 9) {
        return { nitLength: { value: control.value, requiredLength: 9 } };
      }

      // Verificar que comience con 8 o 9
      const firstDigit = nitString[0];
      if (firstDigit !== '8' && firstDigit !== '9') {
        return { nitStart: { value: control.value, requiredStart: '8 o 9' } };
      }

      return null;
    };
  }


  /**
   * Actualiza las validaciones del número de identificación según el tipo seleccionado
   * @param form Formulario reactivo
   * @param typeId Tipo de identificación
   * @param personType Tipo de persona
   */
  updateIdNumberValidations(
    form: FormGroup,
    typeId: TypeId | null,
    personType: ePersonType | null
  ): void {
    const idNumberControl = form.get('idNumber');
    
    if (!idNumberControl || !typeId) {
      return;
    }

    // Validaciones base: requerido y mínimo
    const validators = [Validators.required, Validators.min(1)];

    // Si es persona jurídica con NIT, agregar validación de NIT
    if (personType === ePersonType.juridica && 
        (typeId.typeId === 'NIT' || typeId.typeId === 'Nit')) {
      validators.push(this.nitValidator());
    }

    // Aplicar validaciones síncronas
    idNumberControl.setValidators(validators);

    // Limpiar validaciones asíncronas
    idNumberControl.clearAsyncValidators();

    idNumberControl.updateValueAndValidity();
  }

  /**
   * Obtiene el mensaje de error para un campo del formulario
   * @param form Formulario reactivo
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o null
   */
  getErrorMessage(form: FormGroup, fieldName: string): string | null {
    const control = form.get(fieldName);
    
    if (!control || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['email']) {
      return 'Ingrese un correo electrónico válido';
    }

    if (control.errors['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }

    if (control.errors['nitLength']) {
      return `El NIT debe tener ${control.errors['nitLength'].requiredLength} dígitos`;
    }

    if (control.errors['nitStart']) {
      return `El NIT debe comenzar con ${control.errors['nitStart'].requiredStart}`;
    }

    if (control.errors['thirdExists']) {
      return 'Ya existe un tercero con este número de identificación';
    }

    return 'Campo inválido';
  }

  /**
   * Verifica si un campo tiene errores y debe mostrarlos
   * @param form Formulario reactivo
   * @param fieldName Nombre del campo
   * @param submitted Indica si el formulario fue enviado
   * @returns true si debe mostrar errores
   */
  shouldShowError(form: FormGroup, fieldName: string, submitted: boolean): boolean {
    const control = form.get(fieldName);
    
    if (!control) {
      return false;
    }

    return (submitted || control.touched) && control.invalid;
  }
}
