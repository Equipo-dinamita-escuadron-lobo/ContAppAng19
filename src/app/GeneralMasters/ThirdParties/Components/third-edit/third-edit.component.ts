import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

// PrimeNG Imports
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

// Models and Services
import { Third } from '../../models/Third';
import { eTypeId } from '../../models/eTypeId';
import { ePersonType } from '../../models/ePersonType';
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { GeographyService } from '../../Services/geography.service';
import { eThirdGender } from '../../models/eThirdGender';
import { Country } from '../../models/Country';
import { Department } from '../../models/Department';
import { City } from '../../models/City';
// import { buttonColors } from '../../../../Shared/buttonColors';

// External libraries
import { catchError, map, Observable, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-third-edit',
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
    InputNumberModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './third-edit.component.html',
  styleUrl: './third-edit.component.css'
})
export class ThirdEditComponent implements OnInit {
  
  /** Indica si se ha cargado una persona natural */
  PersonaCargadaNatural = false;

  /** Indica si se ha cargado una persona jurídica */
  PersonaCargadaJuridica = false;

  /** Estado guardado del tercero (Activo/Inactivo) */
  EstadoGuardado = '';

  /** Fecha actual del sistema */
  currentDate = new Date();

  /** ID del tercero a editar */
  thirdId: number = 0;

  /** Nombre del país seleccionado */
  CountryName = "";

  /** Nombre de la provincia/departamento seleccionado */
  ProvinceName = "";

  /** Datos del tercero en edición */
  thirdEdit: Third = {} as Third;

  /** Posición actual del mouse */
  mousePosition = { x: 0, y: 0 };

  /** Posición inicial del mouse */
  positionInicial = { x: 0, y: 0 };

  /** Datos iniciales del tercero */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId:  {
      entId: "0",
      typeId: "CC",
      typeIdname: "CC",
      status: true,
      classification: "NATURAL_PERSON"
    },
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
    country: "0",
    province: "0",
    city: "0",
    address: '',
    phoneNumber: '',
    email: '',
    creationDate: '',
    updateDate: ''
  };

  /** Textos de ayuda para los tooltips */
  helpTexts: { [key: string]: string } = {};

  /** Tooltip que está siendo editado */
  editingHelp: string | null = null;

  /** Visibilidad de tooltips */
  helpVisible: { [key: string]: boolean } = {};

  /** Formulario reactivo para edición de terceros */
  createdThirdForm!: FormGroup;

  /** Indica si el formulario ha sido enviado */
  submitted = false;

  /** Estados de los botones de tipo de persona */
  button1Checked = false; // Jurídica
  button2Checked = false; // Natural

  /** Lista de tipos de tercero disponibles */
  thirdTypes: ThirdType[] = [];

  /** Lista de tipos de identificación disponibles */
  typeIds: TypeId[] = [];

  /** Lista de departamentos */
  departments: any[] = [];

  /** Lista de ciudades */
  cities: any[] = [];

  /** Lista de países */
  countries: any[] = [];

  /** Lista de géneros para dropdown */
  genders = [
    { label: 'Masculino', value: eThirdGender.masculino },
    { label: 'Femenino', value: eThirdGender.femenino },
    { label: 'Otro', value: eThirdGender.Otro }
  ];

  /** Estados para radio buttons */
  states = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  /** Tipos de persona para radio buttons */
  personTypes = [
    { label: 'Jurídica', value: ePersonType.juridica },
    { label: 'Natural', value: ePersonType.natural }
  ];

  /** ID de la empresa */
  entData: string = '';

  constructor(
    private fb: FormBuilder,
    private thirdService: ThirdService,
    private thirdConfigurationService: ThirdServiceConfigurationService,
    private geographyService: GeographyService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private http: HttpClient,
    private messageService: MessageService,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.initializeForm();
    this.initializeHelpTexts();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.thirdId = +params['id'];
      if (this.thirdId) {
        this.loadThirdData();
      }
    });
    
    this.loadInitialData();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initializeForm(): void {
    this.createdThirdForm = this.fb.group({
      personType: ['', Validators.required],
      state: [true, Validators.required],
      thirdTypes: [[], Validators.required],
      typeId: ['', Validators.required],
      idNumber: ['', [Validators.required, Validators.min(1)]],
      verificationNumber: [''],
      names: [''],
      lastNames: [''],
      socialReason: [''],
      gender: [''],
      country: ['', Validators.required],
      province: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    // Configurar validaciones dinámicas
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
        // Persona natural: nombres y apellidos requeridos
        namesControl?.setValidators([Validators.required]);
        lastNamesControl?.setValidators([Validators.required]);
        socialReasonControl?.clearValidators();
        genderControl?.setValidators([Validators.required]);
        
        this.button2Checked = true;
        this.button1Checked = false;
        this.PersonaCargadaNatural = true;
        this.PersonaCargadaJuridica = false;
      } else if (value === ePersonType.juridica) {
        // Persona jurídica: razón social requerida
        socialReasonControl?.setValidators([Validators.required]);
        namesControl?.clearValidators();
        lastNamesControl?.clearValidators();
        genderControl?.clearValidators();
        
        this.button1Checked = true;
        this.button2Checked = false;
        this.PersonaCargadaJuridica = true;
        this.PersonaCargadaNatural = false;
      }

      namesControl?.updateValueAndValidity();
      lastNamesControl?.updateValueAndValidity();
      socialReasonControl?.updateValueAndValidity();
      genderControl?.updateValueAndValidity();
    });
  }

  /**
   * Inicializa los textos de ayuda
   */
  private initializeHelpTexts(): void {
    this.helpTexts = {
      'TipoPersona': 'Seleccione si es una persona natural (individual) o jurídica (empresa/organización)',
      'TipoTerceros': 'Seleccione los tipos de tercero que aplican (Cliente, Proveedor, etc.)',
      'TipoIdentificación': 'Seleccione el tipo de documento de identificación',
      'razonSocial': 'Ingrese la razón social para personas jurídicas'
    };
  }

  /**
   * Carga los datos iniciales necesarios
   */
  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadThirdTypes(),
        this.loadTypeIds(),
        this.loadCountries(),
        this.loadDepartments()
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
   * Carga los datos del tercero a editar
   */
  private loadThirdData(): void {
    this.thirdService.getThirdPartie(this.thirdId).subscribe({
      next: (third: Third) => {
        this.thirdEdit = third;
        this.populateForm(third);
      },
      error: (error: any) => {
        console.error('Error loading third data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los datos del tercero'
        });
      }
    });
  }

  /**
   * Llena el formulario con los datos del tercero
   */
  private populateForm(third: Third): void {
    this.createdThirdForm.patchValue({
      personType: third.personType,
      state: third.state,
      thirdTypes: third.thirdTypes,
      typeId: third.typeId,
      idNumber: third.idNumber,
      verificationNumber: third.verificationNumber,
      names: third.names,
      lastNames: third.lastNames,
      socialReason: third.socialReason,
      gender: third.gender,
      country: third.country,
      province: third.province,
      city: third.city,
      address: third.address,
      phoneNumber: third.phoneNumber,
      email: third.email
    });

    // Cargar ciudades del departamento seleccionado
    if (third.province) {
      this.loadCities(third.province);
    }
  }

  /**
   * Carga los tipos de tercero
   */
  private loadThirdTypes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.thirdConfigurationService.getThirdTypes(this.entData).subscribe({
        next: (types: ThirdType[]) => {
          this.thirdTypes = types;
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading third types:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Carga los tipos de identificación
   */
  private loadTypeIds(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.thirdConfigurationService.getTypeIds(this.entData).subscribe({
        next: (types: TypeId[]) => {
          this.typeIds = types;
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading type IDs:', error);
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
   * Carga los departamentos desde el backend
   * Por defecto carga los de Colombia (COL)
   */
  private loadDepartments(countryCode: string = 'COL'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.geographyService.getStatesByCountry(countryCode).subscribe({
        next: (states: Department[]) => {
          this.departments = states.map(state => ({
            label: state.stateName,
            value: state.stateCode
          }));
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading departments:', error);
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

  /**
   * Maneja el cambio de departamento
   * @param stateCode Código del departamento seleccionado
   */
  onDepartmentChange(stateCode: string): void {
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
   * Envía el formulario
   */
  OnSubmit(): void {
    this.submitted = true;

    if (this.createdThirdForm.valid) {
      const formData = this.createdThirdForm.value;
      
      const updatedThird: Third = {
        ...this.thirdEdit,
        ...formData,
      updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!
      };

      this.thirdService.UpdateThird(updatedThird).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tercero actualizado correctamente'
          });
          
          setTimeout(() => {
            this.router.navigate(['/gen-masters/third-parties/list']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error updating third:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el tercero'
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
   * Cancela la edición y regresa a la lista
   */
  onCancel(): void {
    this.router.navigate(['/gen-masters/third-parties/list']);
  }

  // Métodos para manejo de tooltips (conservando funcionalidad original)
  toggleHelp(field: string, event: MouseEvent): void {
    this.mousePosition = { x: event.clientX, y: event.clientY };
    this.helpVisible[field] = !this.helpVisible[field];
  }

  showHelp(field: string): void {
    this.helpVisible[field] = true;
  }

  hideHelp(field: string): void {
    this.helpVisible[field] = false;
  }

  isHelpVisible(field: string): boolean {
    return this.helpVisible[field] || false;
  }

  noisHelpVisible(field: string): boolean {
    return !this.isHelpVisible(field);
  }

  isEditing(field: string): boolean {
    return this.editingHelp === field;
  }

  stopEditing(): void {
    this.editingHelp = null;
  }

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
}