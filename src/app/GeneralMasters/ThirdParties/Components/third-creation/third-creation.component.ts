import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

// Models and Services
import { Third } from '../../models/Third';
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { GeographyService } from '../../Services/geography.service';
import { eThirdGender } from '../../models/eThirdGender';
import { ePersonType } from '../../models/ePersonType';
import { Country } from '../../models/Country';
import { Department } from '../../models/Department';
import { City } from '../../models/City';

// External libraries
import { catchError, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-third-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    RadioButtonModule,
    MultiSelectModule,
    ToastModule,
    CardModule,
    DividerModule,
    TooltipModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule
  ],
  providers: [MessageService, DatePipe, LocalStorageMethods],
  templateUrl: './third-creation.component.html',
  styleUrl: './third-creation.component.css'
})
export class ThirdCreationComponent implements OnInit {

  /** Formulario principal para la creación de terceros */
  createdThirdForm!: FormGroup;

  /** Contenido extraído del PDF RUT */
  contendPDFRUT: string | null = null;

  /** Información del tercero extraída del RUT */
  infoThird: string[] | null = null;

  /** Tipos de tercero seleccionados */
  selectedThirdTypes: ThirdType[] = [];

  /** Indica si el formulario ha sido enviado */
  submitted = false;

  /** Estado del botón de persona jurídica */
  button1Checked = false;

  /** Estado del botón de persona natural */
  button2Checked = false;

  /** Controla la visibilidad de div adicional */
  showAdditionalDiv = false;

  /** Lista de países disponibles */
  countries: any[] = [];

  /** Lista de estados/departamentos disponibles */
  states: any[] = [];

  /** Lista de tipos de tercero disponibles */
  thirdTypes: ThirdType[] = [];

  /** Lista de tipos de identificación disponibles */
  typeIds: TypeId[] = [];

  /** Lista de ciudades disponibles */
  cities: any[] = [];

  /** Código del país seleccionado */
  selectedCountryCode: string = 'COL';

  /** Código del estado/departamento seleccionado */
  selectedStateCode: string = '';

  /** Fecha actual del sistema */
  currentDate = new Date();

  /** ID de la empresa */
  entData: string = '';

  /** Datos del tercero por defecto */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId: { entId: "0", typeId: "CC", typeIdname: "CC", status: true, classification: "NATURAL_PERSON" },
    thirdTypes: [],
    rutPath: undefined,
    personType: ePersonType.natural,
    names: undefined,
    lastNames: undefined,
    socialReason: undefined,
    gender: undefined,
    idNumber: 0,
    verificationNumber: 0,
    state: true,
    photoPath: undefined,
    country: "",
    province: "",
    city: "",
    address: '',
    phoneNumber: '',
    email: '',
    creationDate: '',
    updateDate: ''
  };

  /** Lista de géneros para dropdown */
  genders = [
    { label: 'Masculino', value: eThirdGender.masculino },
    { label: 'Femenino', value: eThirdGender.femenino },
    { label: 'Otro', value: eThirdGender.Otro }
  ];

  /** Estados para radio buttons */
  states_radio = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  /** Tipos de persona para radio buttons */
  personTypes = [
    { label: 'Jurídica', value: ePersonType.juridica },
    { label: 'Natural', value: ePersonType.natural }
  ];

  constructor(
    private fb: FormBuilder,
    private thirdService: ThirdService,
    private thirdServiceConfigurationService: ThirdServiceConfigurationService,
    private geographyService: GeographyService,
    private router: Router,
    private datePipe: DatePipe,
    private messageService: MessageService,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkForRUTData();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initializeForm(): void {
    this.createdThirdForm = this.fb.group({
      personType: [null, Validators.required],
      state: [true, Validators.required],
      thirdTypes: [[], Validators.required],
      typeId: [null, Validators.required],
      idNumber: [null, [Validators.required, Validators.min(1)], [this.thirdExistsValidator(this.thirdService, this.entData)]],
      verificationNumber: [null],
      names: [null],
      lastNames: [null],
      socialReason: [null],
      gender: [null],
      country: [null, Validators.required],
      province: [null, Validators.required],
      city: [null, Validators.required],
      address: [null, Validators.required],
      phoneNumber: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]]
    });

    this.setupDynamicValidations();
  }

  /**
   * Configura validaciones dinámicas según el tipo de persona
   */
  private setupDynamicValidations(): void {
    this.createdThirdForm.get('personType')?.valueChanges.subscribe(value => {
      const namesControl = this.createdThirdForm.get('names');
      const lastNamesControl = this.createdThirdForm.get('lastNames');
      const socialReasonControl = this.createdThirdForm.get('socialReason');
      const genderControl = this.createdThirdForm.get('gender');

      if (value === ePersonType.natural) {
        namesControl?.setValidators([Validators.required]);
        lastNamesControl?.setValidators([Validators.required]);
        socialReasonControl?.clearValidators();
        genderControl?.setValidators([Validators.required]);

        this.button2Checked = true;
        this.button1Checked = false;

        // Limpiar DV para persona natural
        this.createdThirdForm.get('verificationNumber')?.setValue(null);
      } else if (value === ePersonType.juridica) {
        socialReasonControl?.setValidators([Validators.required]);
        namesControl?.clearValidators();
        lastNamesControl?.clearValidators();
        genderControl?.clearValidators();

        this.button1Checked = true;
        this.button2Checked = false;

        // Calcular DV si ya hay número de identificación y el tipo es NIT
        const idNumber = this.createdThirdForm.get('idNumber')?.value;
        if (this.shouldCalculateDV() && idNumber) {
          this.calculateVerificationDigit(idNumber);
        }
      }

      namesControl?.updateValueAndValidity();
      lastNamesControl?.updateValueAndValidity();
      socialReasonControl?.updateValueAndValidity();
      genderControl?.updateValueAndValidity();
    });

    // Calcular DV automáticamente cuando cambie el número de identificación (solo para persona jurídica con NIT)
    this.createdThirdForm.get('idNumber')?.valueChanges.subscribe(idNumber => {
      if (this.shouldCalculateDV()) {
        if (idNumber && idNumber > 0) {
          this.calculateVerificationDigit(idNumber);
        } else {
          // Limpiar DV si no hay número válido
          this.createdThirdForm.get('verificationNumber')?.setValue(null);
        }
      }
    });

    // Calcular DV cuando cambie el tipo de identificación
    this.createdThirdForm.get('typeId')?.valueChanges.subscribe(() => {
      const idNumber = this.createdThirdForm.get('idNumber')?.value;
      if (this.shouldCalculateDV() && idNumber && idNumber > 0) {
        this.calculateVerificationDigit(idNumber);
      } else if (!this.shouldCalculateDV()) {
        // Limpiar DV si cambió a un tipo que no requiere cálculo automático
        this.createdThirdForm.get('verificationNumber')?.setValue(null);
      }
    });
  }

  /**
   * Carga los datos iniciales necesarios
   */
  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.getThirdTypes(),
        this.getTypesID(),
        this.loadCountries(),
        this.loadStates()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos iniciales'
      });
    }
  }

  /**
   * Verifica si hay datos del RUT para prellenar el formulario
   */
  private checkForRUTData(): void {
    this.contendPDFRUT = this.thirdService.getInfoThirdRUT();
    if (this.contendPDFRUT) {
      this.infoThird = this.contendPDFRUT.split(';');
      this.prefillFormWithRUTData();
    }
  }

  /**
   * Prellena el formulario con datos del RUT
   */
  private prefillFormWithRUTData(): void {
    if (this.infoThird && this.infoThird.length >= 12) {
      this.createdThirdForm.patchValue({
        personType: this.infoThird[0] || ePersonType.natural,
        names: this.infoThird[1],
        lastNames: this.infoThird[2],
        socialReason: this.infoThird[3],
        idNumber: parseInt(this.infoThird[4]) || 0,
        verificationNumber: this.infoThird[5],
        address: this.infoThird[6],
        phoneNumber: this.infoThird[7],
        email: this.infoThird[8],
        country: this.infoThird[9] || 'COL',
        province: this.infoThird[10],
        city: this.infoThird[11]
      });

      // Cargar ciudades si hay departamento seleccionado
      if (this.infoThird[10]) {
        const countryCode = this.infoThird[9] || 'COL';
        this.loadCities(this.infoThird[10], countryCode);
      }
    }
  }

  /**
   * Carga los tipos de tercero
   */
  private getThirdTypes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.thirdServiceConfigurationService.getThirdTypes(this.entData).subscribe({
        next: (types: ThirdType[]) => {
          this.thirdTypes = types;
          resolve();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar tipos de tercero'
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Carga los tipos de identificación
   */
  private getTypesID(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.thirdServiceConfigurationService.getTypeIds(this.entData).subscribe({
        next: (types: TypeId[]) => {
          this.typeIds = types;
          resolve();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar tipos de identificación'
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Carga los países desde el backend
   */
  private loadCountries(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.geographyService.getAllCountries().subscribe({
        next: (countries: Country[]) => {
          this.countries = countries.map(country => ({
            label: country.countryName,
            value: country.countryCode
          }));
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading countries:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los países'
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Carga los departamentos/estados desde el backend
   * Por defecto carga los de Colombia (COL)
   */
  private loadStates(countryCode: string = 'COL'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.geographyService.getStatesByCountry(countryCode).subscribe({
        next: (states: Department[]) => {
          this.states = states.map(state => ({
            label: state.stateName,
            value: state.stateCode
          }));
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading states:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los departamentos'
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Carga las ciudades de un departamento desde el backend
   * @param stateCode Código del departamento
   * @param countryCode Código del país (por defecto COL)
   */
  private loadCities(stateCode: string, countryCode: string = 'COL'): void {
    this.geographyService.getCitiesByState(stateCode, countryCode).subscribe({
      next: (cities: City[]) => {
        this.cities = cities.map(city => ({
          label: city.cityName,
          value: city.cityCode
        }));
      },
      error: (error: any) => {
        console.error('Error loading cities:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las ciudades'
        });
        this.cities = [];
      }
    });
  }

  // Tooltips removidos

  /**
   * Maneja el cambio de departamento
   * @param stateCode Código del departamento seleccionado
   */
  onStateChange(stateCode: string): void {
    this.createdThirdForm.get('city')?.setValue('');
    this.cities = [];
    if (stateCode) {
      const countryCode = this.createdThirdForm.get('country')?.value || 'COL';
      this.loadCities(stateCode, countryCode);
    }
  }

  /**
   * Maneja el cambio de tipo de persona
   */
  onCheckChange(buttonNumber: number): void {
    if (buttonNumber === 1) {
      this.createdThirdForm.get('personType')?.setValue(ePersonType.juridica);
    } else {
      this.createdThirdForm.get('personType')?.setValue(ePersonType.natural);
    }
  }

  /**
   * Envía el formulario para crear el tercero
   */
  OnSubmit(): void {
    this.submitted = true;

    if (this.createdThirdForm.valid) {
      const formData = this.createdThirdForm.value;

      const newThird: Third = {
        ...this.thirdData,
        ...formData,
        entId: this.entData,
        creationDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!,
        updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!
      };

      this.thirdService.createThird(newThird).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tercero creado correctamente'
          });

          // Limpiar datos del RUT si existen
          this.thirdService.clearInfoThirdRUT();

          setTimeout(() => {
            this.router.navigate(['/gen-masters/third-parties/list']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error creating third:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear el tercero'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Calcula el dígito de verificación del NIT según el algoritmo módulo 11 de la DIAN
   * @param idNumber Número de identificación (NIT sin DV)
   * @returns El dígito de verificación (0-9)
   */
  private calculateVerificationDigit(idNumber: number): void {
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

    // Actualizar el campo del formulario
    this.createdThirdForm.get('verificationNumber')?.setValue(dv.toString());
  }
  /**
   * Cancela la creación y regresa a la lista
   */
  onCancel(): void {
    this.thirdService.clearInfoThirdRUT();
    this.router.navigate(['/gen-masters/third-parties/list']);
  }

  // Métodos de tooltips removidos

  // Validador asíncrono para verificar si el tercero existe
  thirdExistsValidator(thirdService: ThirdService, entId: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return thirdService.existThird(control.value, entId).pipe(
        map(exists => exists ? { thirdExists: true } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Verifica si es persona natural
   */
  isNaturalPerson(): boolean {
    return this.createdThirdForm.get('personType')?.value === ePersonType.natural;
  }

  /**
   * Verifica si es persona jurídica
   */
  isJuridicPerson(): boolean {
    return this.createdThirdForm.get('personType')?.value === ePersonType.juridica;
  }

  /**
   * Verifica si se debe calcular el DV automáticamente
   * Solo cuando es persona jurídica y el tipo de ID es NIT
   */
  shouldCalculateDV(): boolean {
    const isJuridic = this.isJuridicPerson();
    const typeId = this.createdThirdForm.get('typeId')?.value;
    const isNIT = typeId && typeId.typeId === 'NIT';
    return isJuridic && isNIT;
  }

  /**
   * Verifica si el campo DV debe estar en solo lectura
   * Solo está bloqueado cuando se calcula automáticamente (NIT)
   */
  isDVReadonly(): boolean {
    return this.shouldCalculateDV();
  }

  /**
   * Permite solo la entrada de números (0-9) en el input de DV
   * Filtra cualquier carácter que no sea número
   * @param event Evento del input
   */
  onlyNumbersInput(event: Event): void {
    // Si el campo está en modo readonly, no hacer nada
    if (this.isDVReadonly()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    // Reemplazar cualquier carácter que no sea número (0-9)
    input.value = input.value.replace(/[^0-9]/g, '');
    // Actualizar el valor del formulario
    this.createdThirdForm.get('verificationNumber')?.setValue(input.value);
  }
}







