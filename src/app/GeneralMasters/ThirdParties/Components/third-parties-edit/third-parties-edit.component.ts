import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  OnInit,
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ThirdPartyServiceService } from '../../Services/third-party-service.service';
import { DatePipe } from '@angular/common';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdPartyConfigurationServiceService } from '../../Services/third-party-configuration-service.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { CityService } from '../../Services/city.service';
import { DepartmentService } from '../../Services/department.service';
import { eThirdGender } from '../../models/eThirdGender';
import { catchError, map, Observable, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { InputNumber } from 'primeng/inputnumber';
import { ePersonType } from '../../models/ePersonType';
@Component({
  selector: 'app-third-parties-edit',
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
  templateUrl: './third-parties-edit.component.html',
  styleUrl: './third-parties-edit.component.css',
})
export class ThirdPartiesEditComponent implements OnInit {
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

  /** Lista de tipos de tercero disponibles */
  listThirdTypes: ThirdType[] = [];

  /** Lista de Generos disponibles */
  genderOptions: any[] = [];

  /** Nombre del país seleccionado */
  CountryName = '';

  /** Nombre de la provincia/departamento seleccionado */
  ProvinceName = '';

  /** Datos del tercero en edición */
  thirdEdit: Third = {} as Third;

  /** Datos iniciales del tercero */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId: {
      entId: '0',
      typeId: 'CC',
      typeIdname: 'CC',
    }, // Utiliza uno de los valores definidos en el enum
    thirdTypes: [], // Array vacío o podrías iniciar con valores predeterminados si aplica
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
    country: 0,
    province: 0,
    city: 0,
    address: '',
    phoneNumber: '',
    email: '',
    creationDate: '',
    updateDate: '',
  };

  /** Datos de entrada al componente */
  inputData: any;

  /** Tipos de tercero seleccionados */
  selectedThirdTypes: ThirdType[] = [];

  /** Formulario de edición del tercero */
  createdThirdForm!: FormGroup;

  /** Indica si el formulario ha sido enviado */
  submitted = false;

  /** Lista de países disponibles */
  countries: any[] = [];

  /** Lista de estados/departamentos */
  states: any[] = [];

  /** Lista de tipos de tercero */
  thirdTypes: ThirdType[] = [];

  /** Lista de tipos de identificación */
  typeIds: TypeId[] = [];

  /** Copia de la lista de todos los tipos de identificación disponibles */
  allTypeIds: TypeId[] = [];

  /** Lista de ciudades */
  cities: any[] = [];

  /** Código del país seleccionado */
  countryCode!: string;

  /** País seleccionado */
  selectedCountry: any;

  /** Estado/departamento seleccionado */
  selectedState: any;

  /** Dígito de verificación calculado */
  verificationNumber: number | null = null;

  /** Mensajes de error del formulario */
  errorMessages: string[] = [];

  /** Métodos de localStorage */
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  /** Datos de la empresa */
  entData: any | null = null;

  /** Indica si el ID está duplicado */
  isDuplicated: boolean = false;

  /**
   * Constructor del componente
   * @param http Cliente HTTP
   * @param route Servicio de ruta activa
   * @param formBuilder Constructor de formularios
   * @param thirdService Servicio de terceros
   * @param datePipe Pipe para formateo de fechas
   * @param thirdServiceConfiguration Servicio de configuración
   * @param cityService Servicio de ciudades
   * @param departmentService Servicio de departamentos
   * @param router Router para navegación
   */
  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private thirdService: ThirdPartyServiceService,
    private datePipe: DatePipe,
    private thirdServiceConfiguration: ThirdPartyConfigurationServiceService,
    private cityService: CityService,
    private departmentService: DepartmentService,
    private messageService: MessageService,
    private router: Router
  ) {}

  /**
   * Inicializa el componente y carga datos necesarios
   */
  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.initializeForm();

    this.getCountries();
    this.getTypesID();
    this.getThirdTypes();

    this.route.params.subscribe((params) => {
      this.thirdId = params['id']; // Obtener el ID del producto de los parámetros de ruta
      this.getThirdDetails(); // Llamar a la función para obtener los detalles del producto
    });
  }

  /**
   * Obtiene los detalles del tercero a editar
   */
  getThirdDetails(): void {
    this.thirdService.getThirdPartie(this.thirdId).subscribe(
      (third: Third) => {
        this.thirdEdit = third;
        this.thirdData = third;
        console.log('Los datos cargados son', third);
        let TipoPersona: number = 0; // Asignar un valor al declarar
        if (third.personType === 'Natural') {
          this.PersonaCargadaNatural = true;
          this.PersonaCargadaJuridica = false;
        } else {
          this.PersonaCargadaNatural = false;
          this.PersonaCargadaJuridica = true;
        }

        console.log(
          'los tipos de terceros unicos cargados son',
          this.thirdTypes
        );
        this.selectedCountry = this.countries.find(
          (country) => country.name === third.country
        );

        if (this.selectedCountry.id) {
          this.getDepartments();
        }

        if (third.state) {
          this.EstadoGuardado = 'Activo';
          console.log('Se cargar estado Activo');
        } else {
          this.EstadoGuardado = 'Inactivo';
          console.log('Se cargar estado Inactivo');
        }
        this.selectedState = this.states.find(
          (state) => state.name === third.province
        );
        this.getCities(this.selectedState.id);
        third.thirdTypes = third.thirdTypes.map((dbType) => {
          if (!dbType.entId) {
            const matchedType = this.thirdTypes.find(
              (type) => type.thirdTypeName === dbType.thirdTypeName
            );
            if (matchedType) {
              dbType.entId = matchedType.entId;
            }
          }
          return dbType;
        });
        this.createdThirdForm.patchValue({
          thId: third.thId,
          typeId: third.typeId.typeId,
          address: third.address,
          state: this.EstadoGuardado,
          verificationNumber: third.verificationNumber,
          personType: third.personType,
          thirdTypes: third.thirdTypes,
          idNumber: third.idNumber,
          names: third.names,
          lastNames: third.lastNames,
          gender: third.gender ?? '',
          email: third.email,
          phoneNumber: third.phoneNumber,
          country: third.country,
          province: this.selectedState.id,
          city: third.city,
          socialReason: third.socialReason,
          creationDate: third.creationDate,
          updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!,
        });

        if (this.createdThirdForm.get('typeId')?.value === 'NIT') {
          this.createdThirdForm.get('verificationNumber')?.enable(); // Habilitar
        } else {
          this.createdThirdForm.get('verificationNumber')?.disable(); // Deshabilitar
        }
      },
      (error) => {
        console.error('Error obteniendo detalles del producto:', error);
      }
    );
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private initializeForm(): void {
    this.createdThirdForm = this.formBuilder.group({
      entId: [''],
      typeId: ['', Validators.required],
      thirdTypes: ['', Validators.required],
      rutPath: [''],
      personType: ['Natural', Validators.required],
      names: [''],
      lastNames: [''],
      socialReason: [''],
      gender: [null],
      idNumber: [
        '',
        {
          validators: [Validators.required],
          asyncValidators: [this.idDuplicadoAsyncValidator(this.thirdService)],
          updateOn: 'blur',
        },
      ],
      verificationNumber: [{ value: '', disabled: true }],
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
    console.log(
      'el valor del estado es ',
      this.createdThirdForm.get('state')?.value
    );
    this.createdThirdForm.get('idNumber')?.valueChanges.subscribe((value) => {
      if (value) {
        this.updateVerificationNumber(value);
      } else {
        this.verificationNumber = null;
      }
    });
  }

  /**
   * Obtiene la lista de países disponibles
   */
  private getCountries(): void {
    //this.countries = [ {name: 'Colombia', id: 1}, {name: 'Ecuador', id: 2}, {name: 'Peru', id: 3}, {name: 'Venezuela', id: 4}];
    this.countries = [{ name: 'Colombia', id: 1 }];
  }

  /**
   * Obtiene los tipos de identificación disponibles
   */
  private getTypesID(): void {
    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typeIds = response;
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
        this.thirdTypes = response;
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
   * Maneja la selección de tipos de tercero
   * @param selectedItems Tipos seleccionados
   */
  onThirdTypeSelect(selectedItems: ThirdType[]): void {
    this.selectedThirdTypes = [];
    this.selectedThirdTypes.push(...selectedItems);
    this.createdThirdForm.get('thirdTypes')?.setValue(this.selectedThirdTypes);
    console.log('Tipos seleccionados actualizados:', this.selectedThirdTypes);
  }

  /**
   * Actualiza el dígito de verificación
   * @param idNumber Número de identificación
   */
  private updateVerificationNumber(idNumber: number): void {
    const idNumberStr = idNumber.toString();
    const duplicatedStr = idNumberStr + idNumberStr;
    const duplicatedNumber = parseInt(duplicatedStr, 10);
    const verificationNumber = this.calcularDigitoVerificador(idNumberStr);
    this.verificationNumber = verificationNumber;
    console.log('El numero es', verificationNumber);
    this.createdThirdForm
      .get('verificationNumber')
      ?.setValue(this.verificationNumber, { emitEvent: false });
  }

  /**
   * Calcula el dígito verificador
   * @param rut Número RUT
   * @returns Dígito verificador calculado
   */
  private calcularDigitoVerificador(rut: string): number {
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    if (rut.length < 7) {
      return 0;
    }
    const rutNumeros = rut.split('').map(Number);
    const multiplicadores = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5];
    let suma = 0;
    let j = 0;
    for (let i = rutNumeros.length - 1; i >= 0; i--) {
      suma += rutNumeros[i] * multiplicadores[j];
      j = (j + 1) % multiplicadores.length;
    }
    const residuo = suma % 11;
    const digitoVerificador = 11 - residuo;
    if (digitoVerificador === 10) {
      return 10;
    } else if (digitoVerificador === 11) {
      return 0;
    } else {
      return digitoVerificador;
    }
  }

  /**
   * Maneja el cambio de país
   * @param event Evento de cambio
   */
  onCountryChange(event: any) {
    this.selectedCountry = JSON.parse(event.target.value);
    this.countryCode = this.selectedCountry.id;
    this.getDepartments();
  }

  /**
   * Maneja el cambio de estado/departamento
   * @param event Evento de cambio
   */
  onStateChange(event: any) {
    const id_state = JSON.parse(event.target.value);
    this.selectedState = this.states.find((state) => state.id == id_state);
    console.log(this.selectedState);
    this.getCities(this.selectedState.id);
  }

  /**
   * Obtiene las ciudades de un departamento
   * @param id ID del departamento
   */
  getCities(id: number) {
    this.cityService.getListCitiesByDepartment(id).subscribe((data) => {
      this.cities = data.cities;
    });
  }

  /**
   * Obtiene los departamentos disponibles
   */
  getDepartments() {
    this.states = this.departmentService.getListDepartments();
  }

  /**
   * Maneja el cambio de tipo de identificación
   * @param event Evento de cambio
   */
  onTypeIdChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value; //Obtenemos el valor del evento
    if (value.includes('NIT')) {
      console.log('tipo ID', value, ' Se genera digito de verificacion');
      this.createdThirdForm.get('verificationNumber')?.enable();
    } else {
      console.log('No se genera digito de verificacion');
      this.createdThirdForm.get('verificationNumber')?.disable();
    }
  }

  /**
   * Navega a la lista de terceros
   */
  goToListThirds(): void {
    this.router.navigateByUrl('/gen-masters/third-parties/list');
  }

  /**
   * Asigna los datos del tercero al formulario
   */
  assigndata(): void {
    this.createdThirdForm.patchValue({
      thId: this.thirdData.thId,
      typeId: this.thirdData.typeId.typeId,
      address: this.thirdData.address,
      state: this.EstadoGuardado,
      verificationNumber: this.thirdData.verificationNumber,
      //personType:this.thirdData.personType,
      thirdTypes: this.thirdData.thirdTypes,
      idNumber: this.thirdData.idNumber,
      names: this.thirdData.names,
      lastNames: this.thirdData.lastNames,
      gender: this.thirdData.gender ?? '',
      email: this.thirdData.email,
      phoneNumber: this.thirdData.phoneNumber,
      country: this.thirdData.country,
      province: this.selectedState.id,
      city: this.thirdData.city,
      socialReason: this.thirdData.socialReason,
      creationDate: this.thirdData.creationDate,
      updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!,
    });
    console.log(
      'el valor de tipo de identificacion es ',
      this.thirdData.typeId.typeId
    );
    if (this.createdThirdForm.get('typeId')?.value === 'NIT') {
      this.createdThirdForm.get('verificationNumber')?.enable(); // Habilitar
    } else {
      this.createdThirdForm.get('verificationNumber')?.disable(); // Deshabilitar
    }
  }

  /**
   * Actualiza los tipos de identificación disponibles
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
   * Obtiene los errores del formulario
   * @returns Array de mensajes de error
   */
  private getFormErrors(): string[] {
    const errors = [];
    const controls = this.createdThirdForm.controls;
    console.log('Se actualizara');
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
                errors.push(`Ingrese un Numero de Identificacion`);
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
                errors.push(`Ingrese un numero de Celular`);
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
   * Validador asíncrono para IDs duplicados
   * @param thirdService Servicio de terceros
   * @returns Validador asíncrono
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
   * Procesa el envío del formulario
   */
  OnSubmit() {
    let third: Third = this.createdThirdForm.value;
    third.thId = this.thirdData.thId;
    third.entId = this.entData;
    const selectThirdTypes = this.createdThirdForm.get('thirdTypes')?.value;

    let typeIdValue = this.typeIds.find(
      (typeId) => typeId.typeId === this.createdThirdForm.get('typeId')?.value
    );
    if (typeIdValue) {
      third.typeId = typeIdValue;
    }

    // Depuración para validar campos faltantes
    const missingFields = [];
    if (!third.creationDate) missingFields.push('creationDate');
    if (!third.updateDate) missingFields.push('updateDate');
    if (typeof third.country !== 'string')
      missingFields.push('country (Debe ser una cadena de texto)');
    if (typeof third.province !== 'string')
      missingFields.push('province (Debe ser una cadena de texto)');

    if (missingFields.length > 0) {
      console.warn('Campos faltantes o incorrectos:', missingFields.join(', '));
    } else {
      console.log('Todos los campos requeridos están presentes.');
    }

    let thirdTypes = this.createdThirdForm.get('thirdTypes')?.value;

    // Verificar y asignar "standart" si `entId` es null
    let thirdTypesUpdate = this.createdThirdForm.get('thirdTypes')?.value;

    thirdTypesUpdate = thirdTypesUpdate.map((type: any) => {
      if (type.entId === null || type.entId === '') {
        type.entId = 'standart';
      }
      return type;
    });

    console.log(
      'El genero que se guardara es',
      third.gender ? third.gender.toString() : ''
    );

    console.log(
      'El Nombre que se guardara es',
      third.names ? third.names.toString() : ''
    );

    console.log(
      'El Apellido que se guardara es',
      third.lastNames ? third.lastNames.toString() : ''
    );
    if (third.gender === undefined) {
      //console.log("El genero es nulo", third.gender?toString)
    }

    //Guardado pr defecto
    const TerceroDefecto = {
      thId: third.thId,
      entId: this.entData,
      typeId: third.typeId,
      thirdTypes: thirdTypesUpdate,
      rutPath: '',
      personType: third.personType,
      names: third.names ? third.names.toString() : '',
      lastNames: third.lastNames ? third.lastNames.toString() : '',
      socialReason: third.socialReason,
      gender:
        third.personType === ePersonType.juridica
          ? third.gender?.toString
          : third.gender
          ? third.gender.toString()
          : '',
      idNumber: third.idNumber,
      verificationNumber: third.verificationNumber,
      state:
        this.createdThirdForm.get('state')?.value === 'Activo' ? true : false,
      photoPath: '',
      country: third.country,
      province: this.selectedState.name,
      city: third.city,
      address: third.address,
      phoneNumber: third.phoneNumber,
      email: third.email,
      creationDate: third.creationDate,
      updateDate: third.updateDate,
    };

    console.log('Datos JSON enviados:', JSON.stringify(third, null, 2));
    console.log(
      'Datos JSON enviados por defecto:',
      JSON.stringify(TerceroDefecto, null, 2)
    );
    this.thirdService.UpdateThird(TerceroDefecto).subscribe(
      (response: Third) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Se ha editado el tercero exitosamente.',
        });
      },
      (error) => {
        console.error('Error en la solicitud:', error);
        console.log(
          'Detalles del error:',
          error.message || 'No se especificaron detalles adicionales.'
        );
        console.log('Respuesta del servidor completa:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ha ocurrido un error al editar el tercero.',
        });
      }
    );
  }

  /**
   * Reinicia el formulario
   */
  OnReset() {
    this.submitted = false;
    this.createdThirdForm.reset();
  }
}
