import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ePersonType } from '../models/ePersonType';
import { TypeId } from '../models/TypeId';

/**
 * Servicio para manejar la lógica compartida de formularios de terceros
 */
@Injectable({
  providedIn: 'root'
})
export class ThirdFormService {

  constructor() { }

  /**
   * Calcula el dígito de verificación del NIT según el algoritmo módulo 11 de la DIAN
   * @param idNumber Número de identificación (NIT sin DV)
   * @returns El dígito de verificación (0-9)
   */
  calculateVerificationDigit(idNumber: number): number {
    // Convertir el número a string para procesar dígito por dígito
    const idString = idNumber.toString();
    const digits = idString.split('').map(d => parseInt(d, 10)).reverse();
    
    // Multiplicadores según la DIAN: 3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71
    const multipliers = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    
    // 1. Multiplicar cada dígito por su multiplicador correspondiente
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * multipliers[i];
    }
    
    // 2. Calcular el residuo de dividir la suma entre 11
    const remainder = sum % 11;
    
    // 3. Restar el residuo de 11
    let dv = 11 - remainder;
    
    // 4. Si el resultado es 11, el DV es 0. Si es 10, el DV es 1
    if (dv === 11) {
      dv = 0;
    } else if (dv === 10) {
      dv = 1;
    }
    
    return dv;
  }

  /**
   * Filtra los tipos de identificación según el tipo de persona
   * @param typeIds Lista completa de tipos de identificación
   * @param classification Clasificación del tipo de persona: 'NATURAL_PERSON' o 'LEGAL_ENTITY'
   * @returns Lista filtrada de tipos de identificación
   */
  filterTypeIdsByPersonType(
    typeIds: TypeId[], 
    classification: 'NATURAL_PERSON' | 'LEGAL_ENTITY'
  ): TypeId[] {
    return typeIds.filter(typeId => typeId.classification === classification);
  }

  /**
   * Verifica si el tipo de identificación seleccionado es válido para la clasificación dada
   * @param currentTypeId Tipo de identificación actual
   * @param filteredTypeIds Lista de tipos válidos
   * @returns true si el tipo es válido, false en caso contrario
   */
  isValidTypeIdForClassification(
    currentTypeId: any, 
    filteredTypeIds: TypeId[]
  ): boolean {
    if (!currentTypeId) return true;
    
    return filteredTypeIds.some(
      typeId => typeId.typeId === (typeof currentTypeId === 'object' ? currentTypeId.typeId : currentTypeId)
    );
  }

  /**
   * Determina si se debe calcular automáticamente el dígito de verificación
   * @param personType Tipo de persona (natural o jurídica)
   * @param typeId Tipo de identificación seleccionado
   * @returns true si se debe calcular el DV automáticamente
   */
  shouldCalculateDV(personType: ePersonType | null, typeId: TypeId | null): boolean {
    if (!personType || !typeId) {
      return false;
    }
    
    // Solo calcular DV para persona jurídica con NIT
    return personType === ePersonType.juridica && 
           (typeId.typeId === 'NIT' || typeId.typeId === 'Nit');
  }

  /**
   * Determina si el campo de dígito de verificación debe ser de solo lectura
   * @param personType Tipo de persona (natural o jurídica)
   * @param typeId Tipo de identificación seleccionado
   * @returns true si el campo DV debe ser readonly
   */
  isDVReadonly(personType: ePersonType | null, typeId: TypeId | null): boolean {
    return this.shouldCalculateDV(personType, typeId);
  }

  /**
   * Verifica si el tipo de persona es natural
   * @param form Formulario reactivo
   * @returns true si es persona natural
   */
  isNaturalPerson(form: FormGroup): boolean {
    return form.get('personType')?.value === ePersonType.natural;
  }

  /**
   * Verifica si el tipo de persona es jurídica
   * @param form Formulario reactivo
   * @returns true si es persona jurídica
   */
  isJuridicPerson(form: FormGroup): boolean {
    return form.get('personType')?.value === ePersonType.juridica;
  }

  /**
   * Permite solo números en un campo de entrada
   * @param event Evento del input
   */
  onlyNumbersInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }
    
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Obtiene el tipo de persona desde el formulario
   * @param form Formulario reactivo
   * @returns Tipo de persona o null
   */
  getPersonType(form: FormGroup): ePersonType | null {
    return form.get('personType')?.value || null;
  }

  /**
   * Obtiene el tipo de identificación desde el formulario
   * @param form Formulario reactivo
   * @returns Tipo de identificación o null
   */
  getTypeId(form: FormGroup): TypeId | null {
    return form.get('typeId')?.value || null;
  }

  /**
   * Limpia el dígito de verificación en el formulario
   * @param form Formulario reactivo
   */
  clearVerificationDigit(form: FormGroup): void {
    form.get('verificationNumber')?.setValue(null);
  }

  /**
   * Establece el dígito de verificación en el formulario
   * @param form Formulario reactivo
   * @param dv Dígito de verificación
   */
  setVerificationDigit(form: FormGroup, dv: number): void {
    form.get('verificationNumber')?.setValue(dv);
  }
}
