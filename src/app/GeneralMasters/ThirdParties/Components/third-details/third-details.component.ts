import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Models and Services
import { ThirdService } from '../../Services/third.service';
import { Third } from '../../models/Third';
import { TypeId } from '../../models/TypeId';
import { ePersonType } from '../../models/ePersonType';

@Component({
  selector: 'app-third-details',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule
  ],
  templateUrl: './third-details.component.html',
  styleUrl: './third-details.component.css'
})
export class ThirdDetailsComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos recibidos como input en el modal */
  @Input() inputData: any;
  
  /** Evento para cerrar el modal */
  @Output() close = new EventEmitter<void>();

  /** Objeto que almacena los datos del tercero a mostrar */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId: { entId: '0', typeId: 'CC', typeIdname: 'CC', status: true, classification: 'NATURAL_PERSON' },
    thirdTypes: [],
    rutPath: undefined,
    personType: ePersonType.natural,
    names: undefined,
    lastNames: undefined,
    socialReason: undefined,
    gender: undefined,
    idNumber: 0,
    verificationNumber: undefined,
    state: false,
    photoPath: undefined,
    country: '0',
    province: '0',
    city: '0',
    address: 'Calle Principal',
    phoneNumber: '1234567890',
    email: 'email@example.com',
    creationDate: '2024-04-27',
    updateDate: '2024-04-29',
  };

  /** Estado de carga de datos */
  loading: boolean = false;

  /**
   * Constructor del componente
   * @param thirdService Servicio para gestionar terceros
   */
  constructor(
    private thirdService: ThirdService
  ) { }

  /**
   * Inicializa el componente y carga los datos del tercero si existe
   */
  ngOnInit(): void {
    this.loadThirdData();
  }

  /**
   * Se ejecuta cuando cambian los inputs
   */
  ngOnChanges(): void {
    if (this.visible && this.inputData?.thId) {
      this.loadThirdData();
    }
  }

  /**
   * Carga los datos del tercero
   */
  private loadThirdData(): void {
    if (this.inputData?.thId && this.inputData.thId > 0) {
      this.loading = true;
      this.thirdService.getThirdPartie(this.inputData.thId).subscribe({
        next: (third: Third) => {
          this.thirdData = third;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading third data:', error);
          this.loading = false;
        }
      });
    }
  }

  /**
   * Cierra el modal de detalles
   */
  closePopUp(): void {
    this.close.emit();
  }

  /**
   * Se ejecuta cuando se oculta el diálogo
   */
  onHide(): void {
    this.close.emit();
  }

  /**
   * Concatena los nombres de los tipos de terceros
   * @returns String con los nombres de los tipos concatenados
   */
  getThirdTypesNames(): string {
    if (!this.thirdData.thirdTypes || this.thirdData.thirdTypes.length === 0) {
      return 'NO APLICA';
    }
    return this.thirdData.thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Verifica y retorna el género o "NO APLICA" si está vacío
   * @returns String con el género o "NO APLICA"
   */
  getGender(): string {
    return this.thirdData.gender ? this.thirdData.gender : 'NO APLICA';
  }

  /**
   * Verifica y retorna el número de verificación o "NO APLICA" si está vacío
   * @returns String con el número de verificación o "NO APLICA"
   */
  getVerificationNumber(): string {
    return this.thirdData.verificationNumber ? this.thirdData.verificationNumber.toString() : 'NO APLICA';
  }

  /**
   * Obtiene el nombre completo para personas naturales
   * @returns String con el nombre completo o "NO APLICA"
   */
  getFullName(): string {
    if (this.thirdData.personType === ePersonType.natural) {
      const names = this.thirdData.names || '';
      const lastNames = this.thirdData.lastNames || '';
      return `${names} ${lastNames}`.trim() || 'NO APLICA';
    }
    return 'NO APLICA';
  }

  /**
   * Obtiene la razón social para personas jurídicas
   * @returns String con la razón social o "NO APLICA"
   */
  getSocialReason(): string {
    return this.thirdData.socialReason || 'NO APLICA';
  }

  /**
   * Obtiene el estado como texto
   * @returns String con el estado
   */
  getStateText(): string {
    return this.thirdData.state ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la severidad del tag según el estado
   * @returns String con la severidad para el tag
   */
  getStateSeverity(): string {
    return this.thirdData.state ? 'success' : 'danger';
  }

  /**
   * Verifica si es persona natural
   * @returns Boolean indicando si es persona natural
   */
  isNaturalPerson(): boolean {
    return this.thirdData.personType === ePersonType.natural;
  }

  /**
   * Verifica si es persona jurídica
   * @returns Boolean indicando si es persona jurídica
   */
  isJuridicPerson(): boolean {
    return this.thirdData.personType === ePersonType.juridica;
  }

  /**
   * Formatea una fecha para mostrar
   * @param date Fecha a formatear
   * @returns String con la fecha formateada
   */
  formatDate(date: string): string {
    if (!date) return 'NO APLICA';
    try {
      return new Date(date).toLocaleDateString('es-CO');
    } catch {
      return date;
    }
  }
}