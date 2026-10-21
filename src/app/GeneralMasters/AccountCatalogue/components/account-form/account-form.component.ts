import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../../models/ChartAccount';
import { NatureType } from '../../models/NatureType';
import { FinancialStateType } from '../../models/FinancialStateType';
import { ClasificationType } from '../../models/ClasificationType';
import { ChartAccountService } from '../../services/chart-account.service';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, ButtonModule, CheckboxModule],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.css'
})
export class AccountFormComponent implements OnInit {

  /**
   * Data received from parent component, account category, parent, level
   */
  @Input() currentLevelAccount: string = '';
  @Input() parent?: Account;
  @Input() level: number = 0;

  /**
   * values ​​emitted from child component, new account (created, edited), cancel event
   */
  @Output() newAccount = new EventEmitter<Account>();
  @Output() cancelar = new EventEmitter<void>();

  /**
   * lists containing additional data
   */
  listNature: NatureType[] = [];
  listFinancialState: FinancialStateType[] = [];
  listClasification: ClasificationType[] = [];

  //Form to create a new account
  formNewAccount: FormGroup;

  //Placeholders for select options
  placeNatureType: string = 'Seleccione una opción';
  placeFinancialStateType: string = 'Seleccione una opción';
  placeClassificationType: string = 'Seleccione una opción';

  //message depending on the level
  messageLength: string = '';

  // Propiedades para controlar la visibilidad de los checkboxes
  showCrossingCheckbox: boolean = false;
  showCostCenterCheckbox: boolean = false;

  /**
 * Constructor del componente.
 * Inicializa el formulario reactivo para crear una nueva cuenta y configura las validaciones.
 * @param _accountService Servicio para gestionar las cuentas del plan contable.
 * @param fb Constructor de formularios reactivos.
 */
  constructor(
    private readonly _accountService: ChartAccountService,
    private readonly fb: FormBuilder,
    private readonly localStorage: LocalStorageMethods) {
    this.formNewAccount = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1]+[a-zA-ZÀ-ÿ\u00f1\u00d1\\d,.()\\/\\-+&% ]*$')]],
      selectedNatureType: ['', [Validators.required]],
      selectedFinancialStateType: ['', [Validators.required]],
      selectedClassificationType: ['', [Validators.required]],
      crossing: [false],
      costCenter: [false]
    });
  }

  /**
   * Maneja los cambios en las propiedades de entrada (@Input).
   * Actualiza las validaciones del formulario y establece valores iniciales en función de los cambios detectados.
   * @param changes Objeto que contiene los cambios realizados en las propiedades de entrada.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['level']) {
      const validators = [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.maxLength(this.level),
        Validators.minLength(this.level)
      ]; 
      this.formNewAccount.get('code')?.setValidators(validators);
      this.formNewAccount.get('code')?.updateValueAndValidity();
      
      // Determinar si es una cuenta auxiliar (nivel 4 = 8 dígitos totales)
      this.updateCheckboxVisibility();
    }

    if (changes['parent']) {
      if (this.parent) {
        // Establecer valores por defecto del padre
        this.setDefaultValuesFromParent();
      } else {
        // Si no hay padre, resetear a valores por defecto
        this.formNewAccount.patchValue({
          selectedNatureType: '',
          selectedFinancialStateType: '',
          selectedClassificationType: ''
        });

        this.placeNatureType = 'Seleccione una opción';
        this.placeFinancialStateType = 'Seleccione una opción';
        this.placeClassificationType = 'Seleccione una opción';
      }
    }
  }

  /**
   * Inicializa el componente.
   * Llama a métodos para obtener los tipos de naturaleza, estado financiero, clasificación y asignar mensajes.
   */
  ngOnInit(): void {
    this.getNatureType();
    this.getFinancialStateType();
    this.getClasificationType();
    this.asignMessage();
    
    // Si hay un padre al inicializar, establecer los valores por defecto
    if (this.parent) {
      this.setDefaultValuesFromParent();
    }
    
    // Suscribirse a cambios en el estado financiero para controlar el checkbox de centro de costo
    this.formNewAccount.get('selectedFinancialStateType')?.valueChanges.subscribe(() => {
      this.updateCheckboxVisibility();
    });
  }

  //Asigna el mensaje de longitud del código según el nivel de la cuenta.
  asignMessage() {
    this.messageLength = this.level === 1 ? 'un dígito' : 'dos dígitos';
  }

  /**
   * Actualiza la visibilidad de los checkboxes basándose en el nivel y estado financiero.
   * - Cruce: Se muestra solo para cuentas auxiliares (nivel 4 = 8 dígitos totales)
   * - Centro de costo: Se muestra solo para cuentas auxiliares con estado financiero "Estado de Resultados"
   */
  updateCheckboxVisibility() {
    // Determinar si es una cuenta auxiliar (nivel 4 significa que el código total será de 8 dígitos)
    const isAuxiliaryAccount = this.level === 2 && this.parent !== undefined && this.parent.code.length === 6;
    
    this.showCrossingCheckbox = isAuxiliaryAccount;
    
    // El checkbox de centro de costo se muestra solo si es auxiliar y el estado financiero es "Estado de Resultados"
    const financialStatus = this.formNewAccount.get('selectedFinancialStateType')?.value;
    this.showCostCenterCheckbox = isAuxiliaryAccount && financialStatus === 'Estado de Resultados';
    
    // Si no se debe mostrar el checkbox de centro de costo, resetear su valor
    if (!this.showCostCenterCheckbox) {
      this.formNewAccount.patchValue({ costCenter: false });
    }
  }

  /**
   * Emite el evento newAccount con la nueva cuenta contable creada.
   */
  sendAccount() {
    
    const account: Account = {    
      idEnterprise: this.getIdEnterprise(),
      code: this.formNewAccount.value.code,
      description: this.formNewAccount.value.name,
      nature: this.formNewAccount.value.selectedNatureType,
      classification: this.formNewAccount.value.selectedClassificationType,
      financialStatus: this.formNewAccount.value.selectedFinancialStateType,
      parent: null,
      crossing: this.formNewAccount.value.crossing || false,
      costCenter: this.formNewAccount.value.costCenter || false
    };
    
    this.newAccount.emit(account);
  }

  /**
   * Obtiene el ID de la empresa desde el localStorage.
   * @returns El ID de la empresa, o una cadena vacía si no se encuentra.
   */
  getIdEnterprise(): string {

    return this.localStorage.getIdEnterprise();
    /*const entData = localStorage.getItem('entData');
    return entData ? JSON.parse(entData).entId : '';*/
  }

  /**
   * Obtiene los tipos de naturaleza desde el servicio.
   */
  getNatureType() {
    this.listNature = this._accountService.getNatureType();
  }

  /**
   * Obtiene los tipos de estado financiero desde el servicio.
   */
  getFinancialStateType() {
    this.listFinancialState = this._accountService.getFinancialStateType();
  }

  /**
   * Obtiene los tipos de clasificación desde el servicio.
   */
  getClasificationType() {
    this.listClasification = this._accountService.getClasificationType();
  }

  /**
   * Configura los placeholders del formulario para mostrar "Seleccione una opción"
   * en lugar de establecer valores automáticos del padre.
   */
  private setDefaultValuesFromParent() {
    if (this.parent) {



      // Mantener siempre "Seleccione una opción" como placeholder
      this.placeNatureType = 'Seleccione una opción';
      this.placeFinancialStateType = 'Seleccione una opción';
      this.placeClassificationType = 'Seleccione una opción';
    }
  }

  /**
   * Maneja la selección del tipo de estado financiero.
   * @param event Evento de selección.
   */
  onSelectionFinancialStateType(event: any) {
    this.formNewAccount.get('selectedFinancialStateType')?.setValue(event.name);
    this.placeFinancialStateType = '';
  }

  /**
   * Maneja la selección del tipo de naturaleza.
   * @param event Evento de selección.
   */
  onSelectionNatureType(event: any) {
    this.formNewAccount.get('selectedNatureType')?.setValue(event.name);
    this.placeNatureType = '';
  }

  /**
   * Maneja la selección del tipo de clasificación.
   * @param event Evento de selección.
   */
  onSelectionClasificationType(event: any) {
    this.formNewAccount.get('selectedClassificationType')?.setValue(event.name);
    this.placeClassificationType = '';
  }

  /**
   * Maneja la eliminación de la selección del tipo de estado financiero.
   */
  onSelectionFinancialStateTypeClear() {
    this.formNewAccount.get('selectedFinancialStateType')?.setValue('');
  }

/**
 * Maneja la eliminación de la selección del tipo de naturaleza.
 */
  onSelectionNatureTypeClear() {
    this.formNewAccount.get('selectedNatureType')?.setValue('');
  }

/**
 * Maneja la eliminación de la selección del tipo de clasificación.
 */
  onSelectionClassificationTypeClear() {
    this.formNewAccount.get('selectedClassificationType')?.setValue('');
  }

/**
 * Emite el evento de cancelación.
 */
  cancel() {
    this.cancelar.emit();
  }

  /**
   * Maneja la entrada de teclado en el campo código.
   * Bloquea caracteres que no sean números y limita la longitud según el nivel.
   * @param event Evento de teclado.
   */
  onCodeKeyDown(event: KeyboardEvent) {
    // Permitir teclas de navegación y control
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Permitir teclas de navegación
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Solo permitir números
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Obtener el valor actual del campo
    const target = event.target as HTMLInputElement;
    const currentValue = target.value;
    
    // Limitar longitud según el nivel
    const maxLength = this.level;
    if (currentValue.length >= maxLength && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Maneja la entrada en el campo código para asegurar formato correcto.
   * @param event Evento de entrada.
   */
  onCodeInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    
    // Remover caracteres que no sean números
    value = value.replace(/[^0-9]/g, '');
    
    // Limitar longitud según el nivel
    if (value.length > this.level) {
      value = value.substring(0, this.level);
    }
    
    // Actualizar el valor del campo
    target.value = value;
    this.formNewAccount.get('code')?.setValue(value);
  }

  /**
   * Maneja la entrada de teclado en el campo nombre.
   * Bloquea caracteres que no sean letras, números, espacios y caracteres especiales permitidos.
   * @param event Evento de teclado.
   */
  onNameKeyDown(event: KeyboardEvent) {
    // Permitir teclas de navegación y control
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Permitir teclas de navegación
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', ' '
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Solo permitir letras, números, espacios y caracteres especiales permitidos
    const allowedPattern = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\d,.()\/\-+&%]$/;
    if (!allowedPattern.test(event.key)) {
      event.preventDefault();
    }
  }
}
