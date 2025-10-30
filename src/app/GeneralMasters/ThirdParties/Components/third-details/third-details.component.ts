import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Componentes compartidos
import { FormPanelComponent } from '../shared/form-panel.component';
import { FormFieldLabelComponent } from '../shared/form-field-label.component';

// Models and Services
import { ThirdService } from '../../Services/third.service';
import { Third } from '../../models/Third';
import { ePersonType } from '../../models/ePersonType';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-third-details',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    FormPanelComponent,
    FormFieldLabelComponent
  ],
  providers: [LocalStorageMethods],
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
    country: null,
    province: null,
    city: null,
    address: 'Calle Principal',
    phoneNumber: '1234567890',
    email: 'email@example.com'
  };

  /** Estado de carga de datos */
  loading: boolean = false;

  /**
   * Constructor del componente
   * @param thirdService Servicio para gestionar terceros
   * @param localStorageMethods Métodos para acceder al local storage
   */
  constructor(
    private readonly thirdService: ThirdService,
    private readonly localStorageMethods: LocalStorageMethods
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
      const entId = this.localStorageMethods.getIdEnterprise();
      this.thirdService.getThirdPartie(this.inputData.thId, entId).subscribe({
        next: (third: Third) => {
          this.thirdData = third;
          this.loading = false;
        },
        error: (error: any) => {
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
   * Obtiene el título del modal con el nombre del tercero
   * @returns String con el título formateado
   */
  getModalTitle(): string {
    if (this.thirdData.personType === ePersonType.natural) {
      const names = this.thirdData.names || '';
      const lastNames = this.thirdData.lastNames || '';
      const fullName = `${names} ${lastNames}`.trim();
      return fullName ? `Detalles - ${fullName}` : 'Detalles del Tercero';
    } else {
      const socialReason = this.thirdData.socialReason || '';
      return socialReason ? `Detalles - ${socialReason}` : 'Detalles del Tercero';
    }
  }

  /**
   * Concatena los nombres de los tipos de terceros
   * @returns String con los nombres de los tipos concatenados
   */
  getThirdTypesNames(): string {
    if (!this.thirdData.thirdTypes || this.thirdData.thirdTypes.length === 0) {
      return 'N/A';
    }
    return this.thirdData.thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Obtiene el tipo de ID
   * @returns String con el tipo de ID o "N/A"
   */
  getTypeId(): string {
    return this.thirdData.typeId?.typeId || 'N/A';
  }

  /**
   * Verifica y retorna el género o "N/A" si está vacío
   * @returns String con el género o "N/A"
   */
  getGender(): string {
    return this.thirdData.gender || 'N/A';
  }

  /**
   * Verifica y retorna el número de verificación o "N/A" si está vacío
   * @returns String con el número de verificación o "N/A"
   */
  getVerificationNumber(): string {
    return this.thirdData.verificationNumber ? this.thirdData.verificationNumber.toString() : 'N/A';
  }

  /**
   * Obtiene el nombre completo para personas naturales
   * @returns String con el nombre completo o "N/A"
   */
  getFullName(): string {
    if (this.thirdData.personType === ePersonType.natural) {
      const names = this.thirdData.names || '';
      const lastNames = this.thirdData.lastNames || '';
      return `${names} ${lastNames}`.trim() || 'N/A';
    }
    return 'N/A';
  }

  /**
   * Obtiene la razón social para personas jurídicas
   * @returns String con la razón social o "N/A"
   */
  getSocialReason(): string {
    return this.thirdData.socialReason || 'N/A';
  }

  /**
   * Obtiene el país
   * @returns String con el nombre del país o "N/A"
   */
  getCountry(): string {
    return this.thirdData.country?.countryName || 'N/A';
  }

  /**
   * Obtiene el departamento
   * @returns String con el nombre del departamento o "N/A"
   */
  getDepartment(): string {
    return this.thirdData.province?.stateName || 'N/A';
  }

  /**
   * Obtiene la ciudad
   * @returns String con el nombre de la ciudad o "N/A"
   */
  getCity(): string {
    return this.thirdData.city?.cityName || 'N/A';
  }

  /**
   * Obtiene la dirección
   * @returns String con la dirección o "N/A"
   */
  getAddress(): string {
    return this.thirdData.address || 'N/A';
  }

  /**
   * Obtiene el teléfono
   * @returns String con el teléfono o "N/A"
   */
  getPhoneNumber(): string {
    return this.thirdData.phoneNumber || 'N/A';
  }

  /**
   * Obtiene el email
   * @returns String con el email o "N/A"
   */
  getEmail(): string {
    return this.thirdData.email || 'N/A';
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
}