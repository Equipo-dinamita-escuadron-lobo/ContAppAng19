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
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, ButtonModule],
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

  /**
 * Constructor del componente.
 * Inicializa el formulario reactivo para crear una nueva cuenta y configura las validaciones.
 * @param _accountService Servicio para gestionar las cuentas del plan contable.
 * @param fb Constructor de formularios reactivos.
 */
  constructor(
    private _accountService: ChartAccountService,
    private fb: FormBuilder, 
    private localStorage: LocalStorageMethods) {
    this.formNewAccount = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1]+[a-zA-ZÀ-ÿ\u00f1\u00d1\\d,.()\\/\\-+&% ]*$')]],
      selectedNatureType: ['', [Validators.required]],
      selectedFinancialStateType: ['', [Validators.required]],
      selectedClassificationType: ['', [Validators.required]]
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
    }

    if (changes['parent'] && this.parent) {
      const nature = this.parent.nature === 'Por defecto' ? '' : this.parent.nature;
      const financialStatus = this.parent.financialStatus === 'Por defecto' ? '' : this.parent.financialStatus;
      const classification = this.parent.classification === 'Por defecto' ? '' : this.parent.classification;

      this.formNewAccount.patchValue({
        selectedNatureType: nature || '',
        selectedFinancialStateType: financialStatus || '',
        selectedClassificationType: classification || ''
      });

      this.placeNatureType = this.parent.nature === 'Por defecto' ? 'Seleccione una opción' : '';
      this.placeFinancialStateType = this.parent.financialStatus === 'Por defecto' ? 'Seleccione una opción' : '';
      this.placeClassificationType = this.parent.classification === 'Por defecto' ? 'Seleccione una opción' : '';
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
  }

  //Asigna el mensaje de longitud del código según el nivel de la cuenta.
  asignMessage() {
    this.messageLength = this.level === 1 ? 'un dígito' : 'dos dígitos';
  }

  /**
   * Emite el evento newAccount con la nueva cuenta contable creada.
   */
  sendAccount() {
    const account: Account = {
      //idEnterprise: 'bf4d475f-5d02-4551-b7f0-49a5c426ac0d',
      idEnterprise: this.getIdEnterprise(), //Descomentar esta línea si tienes un método para obtener el ID de la empresa
      code: this.formNewAccount.value.code,
      description: this.formNewAccount.value.name,
      nature: this.formNewAccount.value.selectedNatureType,
      classification: this.formNewAccount.value.selectedClassificationType,
      financialStatus: this.formNewAccount.value.selectedFinancialStateType,
      parent: 0,

    };
    console.log(account);
    this.newAccount.emit(account);
  }

  /**
   * Obtiene el ID de la empresa desde el localStorage.
   * @returns El ID de la empresa, o una cadena vacía si no se encuentra.
   */
  getIdEnterprise(): string {
    console.log('Fetching Enterprise ID from LocalStorage'+ this.localStorage.getIdEnterprise());
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
}
