import { Component, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { Third } from '../../models/Third';
import { Router } from '@angular/router';
import { ThirdPartyServiceService } from '../../Services/third-party-service.service';
import { DatePipe } from '@angular/common';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdPartyConfigurationServiceService } from '../../Services/third-party-configuration-service.service';
import { Tooltip } from '../../models/Tooltip';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { CityService } from '../../Services/city.service';
import { DepartmentService } from '../../Services/department.service';
import { eThirdGender } from '../../models/eThirdGender';
import { catchError, map, Observable, of } from 'rxjs';
import { ToolTipService } from '../../Services/tool-tip.service';
import { MessageService } from 'primeng/api';
import { InputNumber } from 'primeng/inputnumber';

@Component({
  selector: 'app-third-parties-create',
  imports: [
    FormsModule,
    RadioButtonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    MessageModule,
    SelectModule,
    MultiSelectModule,
    DialogModule,
    CommonModule,
    InputNumber,
  ],
  providers: [DatePipe],
  templateUrl: './third-parties-create.component.html',
  styleUrl: './third-parties-create.component.css',
})
export class ThirdPartiesCreateComponent {
  /** Formulario principal para la creación de terceros */
  createdThirdForm!: FormGroup;

  /** Contenido extraído del PDF RUT */
  contendPDFRUT: string | null = null;

  /** Información del tercero extraída del RUT */
  infoThird: string[] | null = null;

  /** Tipos de tercero seleccionados */
  thirdTypes: ThirdType[] = [];

  /** Indica si el formulario ha sido enviado */
  submitted = false;

  /** Lista de países disponibles */
  countries: any[] = [];

  /** Lista de estados/departamentos disponibles */
  states: any[] = [];

  /** Lista de tipos de tercero disponibles */
  listThirdTypes: ThirdType[] = [];

  /** Lista de Generos disponibles */
  genderOptions: any[] = [];

  /** Lista de tipos de identificación disponibles */
  typeIds: TypeId[] = [];

  /** Copia de la lista de todos los tipos de identificación disponibles */
  allTypeIds: TypeId[] = [];

  /** Lista de ciudades disponibles */
  cities: any[] = [];

  /** Código del país seleccionado */
  countryCode!: string;

  /** País seleccionado actualmente */
  selectedCountry: any;

  /** Estado/departamento seleccionado actualmente */
  selectedState: any;

  /** Ciudad seleccionada actualmente */
  selectedCity: any;

  /** Dígito de verificación calculado */
  verificationNumber: number | null = null;

  /** Array para almacenar mensajes de error */
  errorMessages: string[] = [];

  /** Instancia de métodos de localStorage */
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  /** Datos de la empresa actual */
  entData: any | null = null;

  /** Indica si el ID está duplicado */
  isDuplicated: boolean = false;

  /**
   * Constructor del componente
   * @param dialogRef Referencia al diálogo de Material
   * @param tooltipService Servicio para gestionar tooltips
   * @param fb Constructor de formularios
   * @param formBuilder Constructor de formularios adicional
   * @param thirdService Servicio para gestionar terceros
   * @param datePipe Pipe para formateo de fechas
   * @param thirdServiceConfiguration Servicio de configuración de terceros
   * @param cityService Servicio para gestionar ciudades
   * @param departmentService Servicio para gestionar departamentos
   * @param router Router para navegación
   * @param data Datos opcionales pasados al componente
   * @param messageService Servicio de PrimeNG para mostrar mensajes
   */
  constructor(
    private formBuilder: FormBuilder,
    private thirdService: ThirdPartyServiceService,
    private datePipe: DatePipe,
    private thirdServiceConfiguration: ThirdPartyConfigurationServiceService,
    private cityService: CityService,
    private departmentService: DepartmentService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }

  /**
   * Inicializa el componente cargando datos necesarios y configurando el formulario
   */
  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.initializeForm();
    this.getCountries();
    this.getTypesID();
    this.getThirdTypes();
    this.genderOptions = Object.values(eThirdGender).map((value, index) => ({
      id: index,
      gender: value,
    }));
    this.updateTypeIds();

    // Se recalcula utomaticamente el digito de verificacion
    this.createdThirdForm.get('idNumber')?.valueChanges.subscribe((value) => {
      const tipoPersona = this.createdThirdForm.get('personType')?.value;
      if (tipoPersona === 'Juridica' && value) {
        this.updateVerificationDigit(Number(value));
      } else {
        this.createdThirdForm.get('verificationNumber')?.setValue(null);
      }
    });

    //verificar si se esta creando apartir del PDF del RUT
    this.contendPDFRUT = this.thirdService.getInfoThirdRUT();
    if (this.contendPDFRUT) {
      this.infoThird = this.contendPDFRUT.split(';');
      console.log('Informacion recibida:', this.infoThird);
      this.thirdService.clearInfoThirdRUT();
      this.initializeFormPDFRUT();
    } else {
      console.log('No se recibe ninguna info PDF RUT');
    }
  }

  /**
   * Inicializa el formulario principal con sus validaciones
   */
  private initializeForm(): void {
    this.createdThirdForm = this.formBuilder.group({
      entId: [''],
      typeId: [null, Validators.required],
      thirdTypes: new FormControl<ThirdType | null>({
        value: null,
        disabled: false,
      }),
      rutPath: [''],
      personType: ['', Validators.required],
      names: [''],
      lastNames: [''],
      socialReason: [''],
      gender: new FormControl<eThirdGender | null>({
        value: null,
        disabled: false,
      }),
      idNumber: [
        null,
        {
          validators: [Validators.required],
          asyncValidators: [this.idDuplicadoAsyncValidator(this.thirdService)],
          updateOn: 'blur',
        },
      ],
      verificationNumber: [{ value: null, disabled: true }],
      state: ['Activo', Validators.required],
      photoPath: [''],
      country: ['', Validators.required],
      province: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], //Validacion requerida para que tenga el formato correcto de correo electronico
      creationDate: [''],
      updateDate: [''],
    });

    this.createdThirdForm.get('idNumber')?.valueChanges.subscribe((value) => {
      if (value) {
        this.updateVerificationDigit(value);
      } else {
        this.verificationNumber = null;
      }
    });
  }

  /**
   * Inicializa el formulario con datos extraídos del PDF RUT
   */
  private initializeFormPDFRUT(): void {
    if (this.infoThird?.[0].includes('Persona jurídica')) {
      this.createdThirdForm.patchValue({ personType: 'Juridica' });
      this.createdThirdForm.patchValue({
        socialReason: this.infoThird?.[3] ?? '',
      });
    } else {
      this.createdThirdForm.patchValue({ personType: 'Natural' });
      this.createdThirdForm.patchValue({
        names: this.infoThird?.[5] ?? '',
        lastNames: this.infoThird?.[4] ?? '',
      });
    }
    this.createdThirdForm.patchValue({
      typeId: this.infoThird?.[1] ?? '',
      address: this.infoThird?.[9] ?? '',
      thirdTypes: '',
      idNumber: this.infoThird?.[2] ?? '',
      email: this.infoThird?.[10] ?? '',
      phoneNumber: this.infoThird?.[11] ?? '',
      country: '',
      province: '',
      city: '',
    });

    this.selectedCountry = this.countries.find(
      (country) =>
        country.name.toLowerCase() === this.infoThird?.[6]?.toLowerCase()
    );
    this.createdThirdForm.patchValue({ country: this.selectedCountry.id });
    this.countryCode = this.selectedCountry.id;
    this.getDepartments(1);
    this.selectedState = this.states.find(
      (state) => state.name.toLowerCase() === this.infoThird?.[7].toLowerCase()
    );
    this.createdThirdForm.patchValue({ province: this.selectedState.id });
    this.getCities(this.selectedState.id);
    this.createdThirdForm.patchValue({ city: this.infoThird?.[8] ?? '' });
    this.onTypeIdChange(this.infoThird?.[1] ?? '');
  }

  /**
   * Obtiene la lista de países disponibles
   */
  private getCountries(): void {
    this.countries = [
      { name: 'Colombia', id: 1 },
      { name: 'Extranjero', id: 2 },
    ];
    //this.countries = [{ name: 'Colombia', id: 1 }];
  }

  /**
   * Obtiene los tipos de identificación disponibles
   */
  private getTypesID(): void {
    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typeIds = response;
        this.allTypeIds = [...response];
      },
      error: (error) => {
        console.log(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se han encontrado Tipos De Identifiacion Para esta Empresa',
        });
      },
    });
  }

  /**
   * Obtiene los tipos de tercero disponibles
   */
  private getThirdTypes(): void {
    this.thirdServiceConfiguration.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        console.log(response);

        this.listThirdTypes = response;
      },
      error: (error) => {
        console.log(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Tercero Para esta Empresa',
        });
      },
    });
  }

  /**
   * Actualiza el dígito de verificación basado en el número de identificación
   * @param idNumber Número de identificación
   */
  private updateVerificationDigit(idNumber: number): void {
    const idNumberStr = idNumber.toString();
    const verificationNumber = this.calculateVerificationDigit(idNumberStr);
    this.verificationNumber = verificationNumber;
    this.createdThirdForm
      .get('verificationNumber')
      ?.setValue(this.verificationNumber, { emitEvent: false });
  }

  /**
   * Calcula el dígito de verificación para un número dado
   * @param number Número para calcular el dígito de verificación
   * @returns Dígito de verificación calculado
   */
  private calculateVerificationDigit(number: string): number {
    const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
    const formattedNumber = number.padStart(15, '0');
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(formattedNumber.charAt(i)) * weights[i];
    }
    const residue = sum % 11;
    let verificationDigit;
    if (residue === 0) {
      verificationDigit = 0;
    } else if (residue === 1) {
      verificationDigit = 1;
    } else {
      verificationDigit = 11 - residue;
    }
    return verificationDigit;
  }

  /**
   * Selecciona entre Colombia o Extranjero
   * @param event Evento del cambio de selección
   */
  onCountryChange(event: any) {
    const id_country = JSON.parse(event.value);
    this.selectedCountry = this.countries.find(
      (country) => country.id === id_country
    );
    console.log(this.selectedCountry);
    this.countryCode = this.selectedCountry.id;
    if (
      this.countries.find((country) => country.id === id_country).name ===
      'Colombia'
    ) {
      this.getDepartments(1);
      this.getCities(this.selectedState.id);
    } else {
      this.getDepartments(2);
      this.getCities(33);
    }
  }

  /**
   * Maneja el cambio de estado/departamento
   * @param event Evento del cambio de selección
   */
  onStateChange(event: any) {
    const id_state = JSON.parse(event.value);
    this.selectedState = this.states.find((state) => state.id == id_state);
    console.log(this.selectedState);
    this.getCities(this.selectedState.id);
  }

  /**
   * Obtiene la lista de ciudades disponibles
   * @param id ID del departamento
   */
  getCities(id: number) {
    this.cityService.getListCitiesByDepartment(id).subscribe((data) => {
      this.cities = data.cities;
    });
  }

  /**
   * Obtiene la lista de departamentos disponibles
   * @param id ID del departamento
   */
  getDepartments(id: number) {
    this.states = this.departmentService.getDepartmentById(id);
  }

  /**
   * Maneja el cambio de tipo de identificación
   * @param value Valor del tipo de identificación
   */
  onTypeIdChange(value: string): void {
    if (value.includes('NIT')) {
      console.log('tipo ID', value, ' Se genera digito de verificacion');
      this.createdThirdForm.get('verificationNumber')?.enable();
    } else {
      console.log('No se genera digito de verificacion');
      this.createdThirdForm.get('verificationNumber')?.disable();
    }
  }

  /**
   * Actualiza los tipos de identificación disponibles
   * @param personType Tipo de persona (Juridica o Natural)
   */
  updateTypeIds(): void {
    this.createdThirdForm.get('personType')?.valueChanges.subscribe((value) => {
      if (value === 'Juridica') {
        this.typeIds = this.typeIds.filter((type) => type.typeIdname === 'NIT');
        this.createdThirdForm.get('identificationType')?.setValue('NIT'); // asigna automáticamente NIT
      } else {
        this.typeIds = [...this.allTypeIds];
        this.createdThirdForm.get('identificationType')?.reset();
      }
    });
  }

  /**
   * Manejo de errores, campos rqueridos
   * @returns Array de mensajes de error
   */
  private getFormErrors(): string[] {
    const errors = [];
    const controls = this.createdThirdForm.controls;

    // Verificar si el formulario fue enviado
    if (this.submitted) {
      for (const name in controls) {
        const control = controls[name];

        if (control.invalid) {
          // Si el control es requerido y esta vacio
          if (control.errors?.['required']) {
            switch (name) {
              case 'typeId':
                errors.push(`Seleccione un Tipo de Identificacion`);
                break;
              case 'thirdTypes':
                errors.push(`Seleccione al menos un Tipo de Tercero`);
                break;
              case 'personType':
                errors.push(`Seleccione un Tipo de Persona`);
                break;
              case 'idNumber':
                errors.push(`Ingrese un numero de Identificacion`);
                break;
              case 'country':
                errors.push(`Seleccione un Pais`);
                break;
              case 'province':
                errors.push(`Seleccione un Departamento`);
                break;
              case 'city':
                errors.push(`Seleccione una Ciudad`);
                break;
              case 'address':
                errors.push(`Ingrese una Direccion `);
                break;
              case 'phoneNumber':
                errors.push(`Ingrese un number de Celular`);
                break;
              case 'email':
                errors.push(`Ingrese un Correo Electronico`);
                break;
              case 'state':
                errors.push(`Seleccione un estado`);
                break;
              case 'names':
                errors.push(`Ingrese un Nombre`);
                break;
              case 'lastNames':
                errors.push(`Ingrese un Apellido`);
                break;
              case 'socialReason':
                errors.push(`Ingrese una Razon Social`);
                break;

              case 'gender':
                errors.push(`Seleccione un Genero`);
                break;
              default:
                errors.push(`${name} es requerido`);
            }
          }
          // Validación del formato de correo electrónico
          if (control.errors?.['email']) {
            errors.push(`El fromato del Correo Electronico es Invalido`);
          }
          //validacion id duplicado
          if (control.errors?.['idDuplicado']) {
            errors.push(`El Número de Identificación ya existe`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Valida el ID duplicado de forma asíncrona
   * @param thirdService Servicio para gestionar terceros
   * @returns Observable para validar el ID duplicado
   */
  idDuplicadoAsyncValidator(
    thirdService: ThirdPartyServiceService
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return thirdService.existThird(control.value, this.entData).pipe(
        map((isDuplicated: any) =>
          isDuplicated ? { idDuplicado: true } : null
        ),
        catchError(() => of(null)) // Manejar errores del servicio
      );
    };
  }

  /**
   * Envía el formulario
   */
  OnSubmit() {
    this.submitted = true;
    // Verifica si el formulario es valido
    if (this.createdThirdForm.invalid) {
      this.errorMessages = this.getFormErrors(); // Obtener los errores
      // Mostrar alerta con los errores
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en el Formulario',
        detail: `\n${this.errorMessages
          .map((error) => `- ${error}\n`)
          .join('')}`,
      });
      return;
    }
    const currentDate = new Date();
    var third: Third = this.createdThirdForm.value;

    third.entId = this.entData;
    third.idNumber = parseInt(this.createdThirdForm.get('idNumber')?.value);
    third.city = this.createdThirdForm.get('city')?.value;
    third.country = this.selectedCountry.name;
    third.province = this.selectedState.name;
    third.state =
      this.createdThirdForm.get('state')?.value === 'Activo' ? true : false;
    third.photoPath = '';
    third.creationDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd')!;
    third.updateDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd')!;
    let typeIdValue = this.typeIds.find(
      (typeId) => typeId.typeId === this.createdThirdForm.get('typeId')?.value
    );
    if (typeIdValue !== null && typeIdValue !== undefined) {
      third.typeId = typeIdValue;
    }
    if (third.typeId.typeIdname.includes('NIT')) {
      third.verificationNumber = this.verificationNumber?.valueOf();
      console.log('Digito de Verificacion', third.verificationNumber);
    }
    console.log('Datos del tercero a crear', third);
    this.thirdService.createThird(third).subscribe({
      next: (response) => {
        console.log(response);

        this.messageService.add({
          severity: 'success',
          summary: 'Creación exitosa',
          detail: 'Se ha creado el Tercero con Exito!',
        });
        this.goToListThirds();
      },
      error: (error) => {
        console.log('Error', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se ha podido crear el Tercero! \nError:' + error.message,
        });
        this.errorMessages = this.getFormErrors();
      },
    });
  }

  /**
   * Restablece el formulario
   */
  OnReset() {
    this.submitted = false;
    this.createdThirdForm.reset();
  }

  goToListThirds() {
    this.router.navigate(['/gen-masters/third-parties/list']);
  }
}
