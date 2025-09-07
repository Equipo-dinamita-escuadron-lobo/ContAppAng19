import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

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
import { CheckboxModule } from 'primeng/checkbox';

// Models and Services
import { Third } from '../../models/Third';
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { CityService } from '../../Services/city.service';
import { DepartmentService } from '../../Services/department.service';
import { eThirdGender } from '../../models/eThirdGender';
import { ePersonType } from '../../models/ePersonType';

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
    CheckboxModule
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
  selectedCountryCode: string = '';
  
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
    typeId: { entId: "0", typeId: "CC", typeIdname: "CC", status: true },
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
    private cityService: CityService,
    private departmentService: DepartmentService,
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
      personType: ['', Validators.required],
      state: [true, Validators.required],
      thirdTypes: [[], Validators.required],
      typeId: ['', Validators.required],
      idNumber: ['', [Validators.required, Validators.min(1)], [this.thirdExistsValidator(this.thirdService, this.entData)]],
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
      } else if (value === ePersonType.juridica) {
        socialReasonControl?.setValidators([Validators.required]);
        namesControl?.clearValidators();
        lastNamesControl?.clearValidators();
        genderControl?.clearValidators();
        
        this.button1Checked = true;
        this.button2Checked = false;
      }

      namesControl?.updateValueAndValidity();
      lastNamesControl?.updateValueAndValidity();
      socialReasonControl?.updateValueAndValidity();
      genderControl?.updateValueAndValidity();
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
        country: parseInt(this.infoThird[9]) || 0,
        province: parseInt(this.infoThird[10]) || 0,
        city: parseInt(this.infoThird[11]) || 0
      });

      // Cargar ciudades si hay departamento seleccionado
      if (this.infoThird[10]) {
        this.loadCities(parseInt(this.infoThird[10]));
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
   * Carga los países
   */
  private loadCountries(): Promise<void> {
    return new Promise((resolve) => {
      this.countries = [
        { label: 'Colombia', value: 1 },
        { label: 'Estados Unidos', value: 2 },
        { label: 'México', value: 3 }
      ];
      resolve();
    });
  }

  /**
   * Carga los departamentos/estados
   */
  private loadStates(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const departments = this.departmentService.getListDepartments();
        this.states = departments.map(dept => ({
          label: dept.name,
          value: dept.id
        }));
        resolve();
      } catch (error) {
        console.error('Error loading departments:', error);
        reject(error);
      }
    });
  }

  /**
   * Carga las ciudades de un departamento
   */
  private loadCities(departmentId: number): void {
    this.cityService.getListCitiesByDepartment(departmentId).subscribe({
      next: (cities: any) => {
        if (Array.isArray(cities)) {
          this.cities = cities.map((city: any) => ({
            label: city.name,
            value: city.id
          }));
    } else {
          this.cities = [];
        }
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
   */
  onStateChange(departmentId: number): void {
    this.createdThirdForm.get('city')?.setValue('');
    this.cities = [];
    if (departmentId) {
      this.loadCities(departmentId);
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
}







