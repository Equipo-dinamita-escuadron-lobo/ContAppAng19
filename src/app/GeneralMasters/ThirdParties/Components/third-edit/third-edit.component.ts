import { Component } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Third } from '../../models/Third';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { eTypeId } from '../../models/eTypeId';
import { ePersonType } from '../../models/ePersonType';
import { HttpHeaders } from '@angular/common/http'; // Importa HttpHeaders aquí
import { ThirdServiceService } from '../../services/third-service.service';
import { DatePipe } from '@angular/common';
import { get } from 'jquery';
import Swal from 'sweetalert2';
import { LocalStorageMethods } from '../../../../../shared/methods/local-storage.method';
import { ThirdServiceConfigurationService } from '../../services/third-service-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { CityService } from '../../services/city.service';
import { DepartmentService } from '../../services/department.service';
import { eThirdGender } from '../../models/eThirdGender';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs'; // Asegúrate de que esta línea esté incluida
import { buttonColors } from '../../../../../shared/buttonColors';

@Component({
  selector: 'app-third-edit',
  imports: [],
  templateUrl: './third-edit.component.html',
  styleUrl: './third-edit.component.css'
})
export class ThirdEditComponent implements OnInit {
  
  //private apiUrl = 'http://http://localhost//api/thirds/update';
  //private apiUrl = 'http://contables.unicauca.edu.co/api/thirds/update';
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
      typeIdname: "CC"
    },  // Utiliza uno de los valores definidos en el enum
    thirdTypes: [],       // Array vacío o podrías iniciar con valores predeterminados si aplica
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
    updateDate: ''
  };

  /** Textos de ayuda para los tooltips */
  helpTexts: { [key: string]: string } = {};

  /** Tooltip que está siendo editado */
  editingHelp: string | null = null;

  /** Tooltip visible actualmente */
  visibleHelp: string | null = null;

  /** Datos de entrada al componente */
  inputData: any;

  /**
   * Actualiza el texto de ayuda para un tooltip específico
   * @param helpId ID del tooltip
   * @param value Nuevo texto de ayuda
   */
  updateHelpText(helpId: string, value: string): void {
    this.helpTexts[helpId] = value; // Actualiza el texto de ayuda
  }

  /**
   * Muestra un tooltip específico
   * @param helpId ID del tooltip a mostrar
   */
  showHelp(helpId: string): void {
    this.visibleHelp = helpId; // Muestra el cuadro de ayuda
  }

  /**
   * Oculta un tooltip específico
   * @param helpId ID del tooltip a ocultar
   */
  hideHelp(helpId: string): void {
    if (this.editingHelp !== helpId) {
      this.visibleHelp = null; // Oculta el cuadro de ayuda
      this.stopEditing(); // Cierra la edición si no se está editando
    }
  }

  /**
   * Alterna la visibilidad de un tooltip
   * @param helpId ID del tooltip
   * @param event Evento del mouse
   */
  toggleHelp(helpId: string, event: MouseEvent): void {
    if (this.editingHelp === helpId) {
      this.stopEditing(); // Cierra el cuadro si ya está editando
    } else {
      this.setEditing(helpId, event); // Abre el cuadro para edición
    }
  }

  /**
   * Establece un tooltip en modo edición
   * @param helpId ID del tooltip
   * @param event Evento del mouse
   */
  setEditing(helpId: string, event: MouseEvent): void {
    this.editingHelp = helpId; // Establece el cuadro actual en edición
    this.visibleHelp = helpId; // Mantiene el cuadro visible mientras se edita
    this.mousePosition = { x: event.clientX +10, y: event.clientY +10 }; 
    /*if (this.mousePosition.x === this.positionInicial.x) { // Captura la posición del mouse
      this.mousePosition = {
        x: event.clientX + 10,
        y: event.clientY + 10
      };
    }*/
    
  }

  /**
   * Detiene la edición del tooltip actual
   */
  stopEditing(): void {
    this.editingHelp = null; // Salir del modo de edición
    this.visibleHelp = null;
    localStorage.setItem('helpTexts', JSON.stringify(this.helpTexts)); // Guarda los textos de ayuda en el almacenamiento local
  }

  /**
   * Verifica si un tooltip está en modo edición
   * @param helpId ID del tooltip
   * @returns Boolean indicando si está en edición
   */
  isEditing(helpId: string): boolean {
    return this.editingHelp === helpId; // Retorna si el cuadro está en edición
  }

  /**
   * Verifica si un tooltip está visible
   * @param helpId ID del tooltip
   * @returns Boolean indicando si está visible
   */
  isHelpVisible(helpId: string): boolean {
    return this.visibleHelp === helpId || this.isEditing(helpId); // Muestra el cuadro si está visible o en edición
  }

  /**
   * Verifica si un tooltip no está visible
   * @param helpId ID del tooltip
   * @returns Boolean indicando si no está visible
   */
  noisHelpVisible(helpId: string): boolean {
    return this.isEditing(helpId); // No Muestra el cuadro si está visible, solo en edición
  }

  /** Tipos de tercero seleccionados */
  selectedThirdTypes: ThirdType[] = [];

  /** Formulario de edición del tercero */
  createdThirdForm!: FormGroup;

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

  /** Lista de estados/departamentos */
  states: any[] = [];

  /** Lista de tipos de tercero */
  thirdTypes: ThirdType[] = [];

  /** Lista de tipos de identificación */
  typeIds: TypeId[] = [];

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
    private http: HttpClient,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private thirdService: ThirdServiceService,
    private datePipe: DatePipe,
    private thirdServiceConfiguration: ThirdServiceConfigurationService,
    private cityService: CityService,
    private departmentService: DepartmentService,
    private router: Router,
  ) { }

  /**
   * Inicializa el componente y carga datos necesarios
   */
  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.initializeForm();
    
    this.getCountries();
    this.getTypesID();
    this.getThirdTypes();
    
    
    // Cargar textos de ayuda del almacenamiento local al iniciar
    const savedHelpTexts = localStorage.getItem('helpTexts');
    if (savedHelpTexts) {
      this.helpTexts = JSON.parse(savedHelpTexts);
    }
    this.route.params.subscribe(params => {
      this.thirdId = params['id']; // Obtener el ID del producto de los parámetros de ruta
      this.getthirdDetails(); // Llamar a la función para obtener los detalles del producto
    });

    
    //this.inputData = this.data;    
  }

  /**
   * Obtiene los detalles del tercero a editar
   */
  getthirdDetails(): void {
    this.thirdService.getThirdPartie(this.thirdId).subscribe(
      (third: Third) => {
        this.thirdEdit = third;
        this.thirdData = third;
        console.log("Los datos cargados son", third)
        let TipoPersona: number = 0;  // Asignar un valor al declarar
        if (third.personType === 'Natural'){
          this.button2Checked = true
          this.button1Checked = false
          this.PersonaCargadaNatural = true
          this.PersonaCargadaJuridica = false
        }else{
          this.button1Checked = true
          this.button2Checked = false
          this.PersonaCargadaNatural = false
          this.PersonaCargadaJuridica = true
        }
        
        console.log("los tipos de terceros unicos cargados son" ,this.thirdTypes);
        this.selectedCountry = this.countries.find(country => country.name === third.country);
        
        
        if(this.selectedCountry.id){
          this.getDepartments()
        }
        
        if(third.state){
          this.EstadoGuardado = 'Activo'
          console.log("Se cargar estado Activo")
        }else{
          this.EstadoGuardado = 'Inactivo'
          console.log("Se cargar estado Inactivo")
        }
        this.selectedState = this.states.find(state => state.name === third.province);
        this.getCities(this.selectedState.id)
        third.thirdTypes = third.thirdTypes.map(dbType => {
          if (!dbType.entId) {
            const matchedType = this.thirdTypes.find(
              type => type.thirdTypeName === dbType.thirdTypeName
            );
            if (matchedType) {
              dbType.entId = matchedType.entId;
            }
          }
          return dbType;
        });
        this.createdThirdForm.patchValue({
          thId:third.thId,
          typeId: third.typeId.typeId,
          address:third.address,
          state:this.EstadoGuardado,
          verificationNumber:third.verificationNumber,
          personType:third.personType, 
          thirdTypes:third.thirdTypes,
          idNumber:third.idNumber,
          names:third.names,
          lastNames:third.lastNames,
          gender: third.gender ?? "",
          email:third.email,
          phoneNumber:third.phoneNumber,
          country:third.country,
          province:this.selectedState.id,
          city:third.city,
          socialReason:third.socialReason,
          creationDate: third.creationDate,
          updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!
        });          
        
        if(this.createdThirdForm.get('typeId')?.value === 'NIT'){
          this.createdThirdForm.get('verificationNumber')?.enable();  // Habilitar
        }else{
          this.createdThirdForm.get('verificationNumber')?.disable();  // Deshabilitar
        }
      },
      error => {
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
      idNumber: ['', {validators: [Validators.required], asyncValidators:[this.idDuplicadoAsyncValidator(this.thirdService)], updateOn: 'blur'}],
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
      updateDate: ['']      
    });
    console.log("el valor del estado es ",this.createdThirdForm.get('state')?.value);
    this.createdThirdForm.get('idNumber')?.valueChanges.subscribe(value => {
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
        console.log(error)
        Swal.fire({
          title: 'Error',
          text: 'No se han encontrado Tipos De Identifiacion Para esta Empresa',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor,
        });
      }
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
        console.log(error)
        Swal.fire({
          title: 'Error',
          text: 'No se han encontrado Tipos De Tercero Para esta Empresa',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor,
        });
      }
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
    console.log("El numero es", verificationNumber)
    this.createdThirdForm.get('verificationNumber')?.setValue(this.verificationNumber, { emitEvent: false });
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
    this.selectedState = this.states.find(state => state.id == id_state);
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
    const value = (event.target as HTMLSelectElement).value;//Obtenemos el valor del evento
    if (value.includes('NIT')) {
      console.log("tipo ID", value, " Se genera digito de verificacion");
      this.createdThirdForm.get('verificationNumber')?.enable();
    } else {
      console.log("No se genera digito de verificacion");
      this.createdThirdForm.get('verificationNumber')?.disable();
    }

  }

  /**
   * Navega a la lista de terceros
   */
  goToListThirds(): void {
    this.router.navigateByUrl('/general/operations/third-parties');
  }

  /**
   * Actualiza los validadores según el tipo de persona
   */
  updateValidator() {
    if (this.button1Checked) {
      this.createdThirdForm.get('socialReason')?.setValidators([Validators.required]);
    } else {
      this.createdThirdForm.get('socialReason')?.clearValidators();
    }

    if (this.button2Checked) {
      this.createdThirdForm.get('names')?.setValidators([Validators.required]);
      this.createdThirdForm.get('lastNames')?.setValidators([Validators.required]);
      this.createdThirdForm.get('gender')?.setValidators([Validators.required]);
    } else {
      this.createdThirdForm.get('names')?.clearValidators();
      this.createdThirdForm.get('lastNames')?.clearValidators();
      this.createdThirdForm.get('gender')?.clearValidators();
    }
    this.createdThirdForm.get('socialReason')?.updateValueAndValidity();
    this.createdThirdForm.get('names')?.updateValueAndValidity();
    this.createdThirdForm.get('lastNames')?.updateValueAndValidity();
    this.createdThirdForm.get('gender')?.updateValueAndValidity();
  }

  /**
   * Maneja el cambio en los botones de tipo de persona
   * @param buttonId ID del botón (1: Jurídica, 2: Natural)
   */
  onCheckChange(buttonId: number): void {
    //this.updateTypeIds();
    if (buttonId === 1 && this.button1Checked) {
      this.button2Checked = false;
      this.createdThirdForm.get('names')?.setValue('');
      this.createdThirdForm.get('lastNames')?.setValue('');
      this.createdThirdForm.get('verificationNumber')?.disable();
      if (this.PersonaCargadaJuridica && this.PersonaCargadaNatural === false){
        console.log("Se cambia de tipo de persona a Juridica")
        this.assigndata()
      }
    } else if (buttonId === 2 && this.button2Checked) {
      this.button1Checked = false;
      this.createdThirdForm.get('socialReason')?.setValue('');
      this.createdThirdForm.get('verificationNumber')?.disable();
      if (this.PersonaCargadaNatural && this.PersonaCargadaJuridica === false){
        console.log("Se cambia de tipo de persona a natural")
        this.assigndata()
      }
    }
    this.updateValidator();
  }

  /**
   * Asigna los datos del tercero al formulario
   */
  assigndata(): void{
    this.createdThirdForm.patchValue({
      thId:this.thirdData.thId,
      typeId: this.thirdData.typeId.typeId,
      address:this.thirdData.address,
      state:this.EstadoGuardado,
      verificationNumber:this.thirdData.verificationNumber,
      //personType:this.thirdData.personType, 
      thirdTypes:this.thirdData.thirdTypes,
      idNumber:this.thirdData.idNumber,
      names:this.thirdData.names,
      lastNames:this.thirdData.lastNames,
      gender: this.thirdData.gender ?? "",
      email:this.thirdData.email,
      phoneNumber:this.thirdData.phoneNumber,
      country:this.thirdData.country,
      province:this.selectedState.id,
      city:this.thirdData.city,
      socialReason:this.thirdData.socialReason,
      creationDate: this.thirdData.creationDate,
      updateDate: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!
    });          
    console.log("el valor de tipo de identificacion es ", this.thirdData.typeId.typeId)
    if(this.createdThirdForm.get('typeId')?.value === 'NIT'){
      this.createdThirdForm.get('verificationNumber')?.enable();  // Habilitar
    }else{
      this.createdThirdForm.get('verificationNumber')?.disable();  // Deshabilitar
    }
  }

  /**
   * Actualiza los tipos de identificación disponibles
   */
  updateTypeIds(): void {
    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        let filteredTypeIds;
        if (this.button1Checked) {
          filteredTypeIds = response.filter(elemento =>
            elemento.typeIdname && elemento.typeIdname.includes('NIT')
          );
        } else {
          filteredTypeIds = response;
        }
        this.typeIds = filteredTypeIds;
        this.createdThirdForm.get('typeId')?.setValue('');
      },
      error: (error) => {
        console.log(error);
        Swal.fire({
          title: 'Error',
          text: 'No se han encontrado Tipos De Identificación Para esta Empresa',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor,
        });
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
console.log("Se actualizara")
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
  idDuplicadoAsyncValidator(thirdService: ThirdServiceService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return thirdService.existThird(control.value, this.entData).pipe(
        map((isDuplicated: any) => (isDuplicated ? { idDuplicado: true } : null)),
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
    const selectThirdTypes = this.createdThirdForm.get("thirdTypes")?.value;

    let typeIdValue = this.typeIds.find(typeId => typeId.typeId === this.createdThirdForm.get('typeId')?.value);
    if (typeIdValue) {
      third.typeId = typeIdValue;
    }
    
    // Depuración para validar campos faltantes
    const missingFields = [];
    if (!third.creationDate) missingFields.push('creationDate');
    if (!third.updateDate) missingFields.push('updateDate');
    if (typeof third.country !== 'string') missingFields.push('country (Debe ser una cadena de texto)');
    if (typeof third.province !== 'string') missingFields.push('province (Debe ser una cadena de texto)');

    if (missingFields.length > 0) {
        console.warn('Campos faltantes o incorrectos:', missingFields.join(', '));
    } else {
        console.log("Todos los campos requeridos están presentes.");
    }

    let thirdTypes = this.createdThirdForm.get("thirdTypes")?.value;

  // Verificar y asignar "standart" si `entId` es null
  let thirdTypesUpdate = this.createdThirdForm.get("thirdTypes")?.value;

  thirdTypesUpdate = thirdTypesUpdate.map((type: any) => {
  if (type.entId === null || type.entId === '') {
    type.entId = 'standart';
  }
    return type;
  });

  console.log("El genero que se guardara es", third.gender ? third.gender.toString() : "");

  console.log("El Nombre que se guardara es", third.names ? third.names.toString() : "");

  console.log("El Apellido que se guardara es", third.lastNames ? third.lastNames.toString() : "");
  if(third.gender === undefined){
    //console.log("El genero es nulo", third.gender?toString)
  }

    //Guardado pr defecto
    const TerceroDefecto = {
      thId: third.thId,
      entId: this.entData,
      typeId: third.typeId,
      thirdTypes: thirdTypesUpdate,
      rutPath: "",
      personType: third.personType,
      names: third.names ? third.names.toString() : "",
      lastNames: third.lastNames ? third.lastNames.toString() : "",
      socialReason: third.socialReason,
      gender: third.personType === ePersonType.juridica 
        ? third.gender?.toString 
        : (third.gender ? third.gender.toString() : ""),
      idNumber: third.idNumber,
      verificationNumber:third.verificationNumber,
      state: this.createdThirdForm.get('state')?.value === 'Activo' ? true : false,
      photoPath: "",
      country: third.country,
      province: this.selectedState.name,
      city: third.city,
      address: third.address,
      phoneNumber: third.phoneNumber,
      email: third.email,
      creationDate: third.creationDate,
      updateDate: third.updateDate
    };

    
    
    
    console.log("Datos JSON enviados:", JSON.stringify(third, null, 2));
    console.log("Datos JSON enviados por defecto:", JSON.stringify(TerceroDefecto, null, 2));
    this.thirdService.UpdateThird(TerceroDefecto).subscribe(
      (response: Third) => {
        Swal.fire({
          title: 'Edición exitosa',
          text: 'Se ha editado el tercero exitosamente.',
          icon: 'success',
          confirmButtonColor: buttonColors.confirmationColor,
        });
      },
      (error) => {
        console.error("Error en la solicitud:", error);
        console.log("Detalles del error:", error.message || "No se especificaron detalles adicionales.");
        console.log("Respuesta del servidor completa:", error);
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al editar el tercero.',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor,
        });
      }
    );
}

  /**
   * Reinicia el formulario
   */
  OnReset() {
    this.submitted = false;
    this.button2Checked = false;
    this.button1Checked = false;
    this.createdThirdForm.reset();
  }
}
