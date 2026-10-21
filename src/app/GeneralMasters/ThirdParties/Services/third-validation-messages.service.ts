import { Injectable } from '@angular/core';
import { Third } from '../models/Third';
import { ePersonType } from '../models/ePersonType';

@Injectable({
  providedIn: 'root'
})
export class ThirdValidationMessagesService {

  constructor() { }

  /**
   * Obtiene el título del modal con el nombre del tercero
   * @param thirdData Datos del tercero
   * @returns String con el título formateado
   */
  getModalTitle(thirdData: Third): string {
    if (thirdData.personType === ePersonType.natural) {
      const names = thirdData.names || '';
      const lastNames = thirdData.lastNames || '';
      const fullName = `${names} ${lastNames}`.trim();
      return fullName ? `Detalles - ${fullName}` : 'Detalles del Tercero';
    } else {
      const socialReason = thirdData.socialReason || '';
      return socialReason ? `Detalles - ${socialReason}` : 'Detalles del Tercero';
    }
  }

  /**
   * Concatena los nombres de los tipos de terceros
   * @param thirdTypes Lista de tipos de tercero
   * @returns String con los nombres concatenados
   */
  getThirdTypesNames(thirdTypes: any[]): string {
    if (!thirdTypes || thirdTypes.length === 0) {
      return 'N/A';
    }
    return thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Obtiene el tipo de ID
   * @param typeId Objeto del tipo de identificación
   * @returns String con el tipo de ID o "N/A"
   */
  getTypeId(typeId: any): string {
    return typeId?.typeId || 'N/A';
  }

  /**
   * Verifica y retorna el género o "N/A" si está vacío
   * @param gender Género del tercero
   * @returns String con el género o "N/A"
   */
  getGender(gender: any): string {
    return gender || 'N/A';
  }

  /**
   * Verifica y retorna el número de verificación o "N/A" si está vacío
   * @param verificationNumber Número de verificación
   * @returns String con el número de verificación o "N/A"
   */
  getVerificationNumber(verificationNumber: any): string {
    return verificationNumber ? verificationNumber.toString() : 'N/A';
  }

  /**
   * Obtiene el nombre completo para personas naturales
   * @param thirdData Datos del tercero
   * @returns String con el nombre completo o "N/A"
   */
  getFullName(thirdData: Third): string {
    if (thirdData.personType === ePersonType.natural) {
      const names = thirdData.names || '';
      const lastNames = thirdData.lastNames || '';
      return `${names} ${lastNames}`.trim() || 'N/A';
    }
    return 'N/A';
  }

  /**
   * Obtiene la razón social para personas jurídicas
   * @param socialReason Razón social del tercero
   * @returns String con la razón social o "N/A"
   */
  getSocialReason(socialReason: any): string {
    return socialReason || 'N/A';
  }

  /**
   * Obtiene el país
   * @param country Objeto del país
   * @returns String con el nombre del país o "N/A"
   */
  getCountry(country: any): string {
    return country?.countryName || 'N/A';
  }

  /**
   * Obtiene el departamento
   * @param province Objeto del departamento
   * @returns String con el nombre del departamento o "N/A"
   */
  getDepartment(province: any): string {
    return province?.stateName || 'N/A';
  }

  /**
   * Obtiene la ciudad
   * @param city Objeto de la ciudad
   * @returns String con el nombre de la ciudad o "N/A"
   */
  getCity(city: any): string {
    return city?.cityName || 'N/A';
  }

  /**
   * Obtiene la dirección
   * @param address Dirección del tercero
   * @returns String con la dirección o "N/A"
   */
  getAddress(address: any): string {
    return address || 'N/A';
  }

  /**
   * Obtiene el teléfono
   * @param phoneNumber Teléfono del tercero
   * @returns String con el teléfono o "N/A"
   */
  getPhoneNumber(phoneNumber: any): string {
    return phoneNumber || 'N/A';
  }

  /**
   * Obtiene el email
   * @param email Email del tercero
   * @returns String con el email o "N/A"
   */
  getEmail(email: any): string {
    return email || 'N/A';
  }

  /**
   * Obtiene el estado como texto
   * @param state Estado del tercero
   * @returns String con el estado
   */
  getStateText(state: boolean): string {
    return state ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la severidad del tag según el estado
   * @param state Estado del tercero
   * @returns String con la severidad para el tag
   */
  getStateSeverity(state: boolean): string {
    return state ? 'success' : 'danger';
  }

  /**
   * Verifica si es persona natural
   * @param personType Tipo de persona
   * @returns Boolean indicando si es persona natural
   */
  isNaturalPerson(personType: ePersonType): boolean {
    return personType === ePersonType.natural;
  }

  /**
   * Verifica si es persona jurídica
   * @param personType Tipo de persona
   * @returns Boolean indicando si es persona jurídica
   */
  isJuridicPerson(personType: ePersonType): boolean {
    return personType === ePersonType.juridica;
  }

  /**
   * Convierte un número de columna a letra de Excel (A, B, C, ..., Z, AA, AB, etc.)
   * @param columnNumber Número de columna (1-based)
   * @returns Letra de columna de Excel
   */
  getExcelColumnLetter(columnNumber: number): string {
    let result = '';
    let num = columnNumber;

    while (num > 0) {
      num--; // Ajustar para base 0
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }

    return result || 'A';
  }
}