import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Account } from '../../models/ChartAccount';
import { FinancialStateType } from '../../models/FinancialStateType';
import { NatureType } from '../../models/NatureType';
import { ClasificationType } from '../../models/ClasificationType';
import { ChartAccountService } from '../../services/chart-account.service';
import { firstValueFrom } from 'rxjs';
import { AccountFormComponent } from '../account-form/account-form.component';
import { AccountTemplateComponent } from '../account-template/account-template.component';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { RadioButtonModule } from 'primeng/radiobutton';

// Interfaces para manejo de errores de importación
interface ImportError {
  rowNumber: number;
  columnNumber: number;
  columnName: string;
  fieldValue: any;
  errorCode: string;
  errorMessage: string;
  errorType: string;
}

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    AccountFormComponent,
    AccountTemplateComponent,
    ButtonModule, FileUploadModule, DropdownModule, DialogModule,
    IconFieldModule, InputIconModule, InputTextModule, CheckboxModule,
    RadioButtonModule,
    ToggleSwitchModule, TagModule, ToastModule, ConfirmDialogModule,
    TableModule, PaginatorModule
  ],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class AccountListComponent implements OnInit {
  /**
  * Formulario reactivo que contiene los campos de entrada para la gestión de cuentas contables.
  */
  accountForm: FormGroup;

  /**
  * Formulario reactivo que contiene los selectores para los tipos de naturaleza,
  * estado financiero y clasificación.
  */
  formTransactional: FormGroup;

  /**
   * Cuenta seleccionada y estado de conmutación para la interfaz de usuario.
   */
  accountSelected?: Account;
  toggle: boolean = false;

  /**
  * Variables para almacenar la información relacionada con una cuenta contable.
  */
  num: number = 0;
  code: string = '';
  name: string = '';
  parentId: string = '';

  /**
  * Variables para controlar la visibilidad de los formularios en la interfaz de usuario.
  */
  showPrincipalForm: boolean = false;
  showFormTransactional: boolean = false;

  /**
   * Variable que indica si una cuenta ha sido seleccionada.
   */
  selectedAccount: boolean = false;

  /**
   * Valores originales de la cuenta seleccionada para comparar cambios reales.
   */
  private originalAccountValues: any = null;

  /**
  * Variables para controlar la visibilidad de los botones en la interfaz de usuario.
  */
  showButton = false;
  showUpdateButton = false;
  showAddNewClass: boolean = false;
  showButtonDelete: boolean = false;

  /**
   * Controla la visibilidad del modal de plantilla
   */
  showTemplateModal: boolean = false;

  /**
   * Variables para la funcionalidad de búsqueda
   */
  searchTerm: string = '';
  searchResults: Account[] = [];
  isLoading: boolean = false;
  hasActiveSearch: boolean = false;

  /**
   * Variables para controlar la visibilidad de los checkboxes en la edición
   */
  showCrossingCheckboxEdit: boolean = false;
  showCostCenterCheckboxEdit: boolean = false;

  /**
   * Controla si los inputs deben estar bloqueados cuando no hay cambios reales
   */
  inputsLocked: boolean = false;    /**
   * Variables determinadas según el nivel de la cuenta.
   * Estas variables gestionan el tipo de cuenta y si se deben agregar subcuentas o hijos.
   */
  private _currentLevelAccount: 'Grupo' | 'Cuenta' | 'Subcuenta' | 'Auxiliar' | 'Clase' = 'Clase';
  addChild: boolean = false;

  /**
   * Getter que devuelve el valor de currentLevelAccount (ya capitalizado)
   */
  get currentLevelAccount(): string {
    return this._currentLevelAccount;
  }

  /**
   * Setter para currentLevelAccount
   */
  set currentLevelAccount(value: 'Grupo' | 'Cuenta' | 'Subcuenta' | 'Auxiliar' | 'Clase') {
    this._currentLevelAccount = value;
  }

  /**
  * Variables para almacenar los nombres de las diferentes cuentas contables.
  */
  className = '';
  groupName = '';
  accountName = '';
  subAccountName = '';
  auxiliaryName = '';

  /**
  * Determina qué campos de entrada deben ser bloqueados según el nivel seleccionado de la cuenta.
  */
  inputAccess = {
    class: true,
    group: true,
    account: true,
    subAccount: true,
    auxiliary: true
  };

  /**
  * Arreglos que almacenan la información de los servicios relacionados con los tipos de estado financiero,
  * cuentas, naturaleza, clasificación, y otras cuentas relacionadas con reembolsos y depósitos.
  */
  listFinancialState: FinancialStateType[] = [];
  listAccounts: Account[] = [];
  listAccountsAux: Account[] = [];
  listNature: NatureType[] = [];
  listClasification: ClasificationType[] = [];
  listRefundAccount: string[] = [];
  listDepositAccount: string[] = [];

  /**
  * Propiedades del componente para gestionar los valores y datos relacionados con los tipos de naturaleza,
  * estado financiero, clasificación y otros datos de la aplicación.
  */
  placeNatureType: string = '';
  placeFinancialStateType: string = '';
  placeClasificationType: string = '';
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: unknown | null = null;

  // Propiedades para el modal de errores de importación
  importErrors: ImportError[] = [];
  totalErrors = 0;
  totalRecordsImported = 0;
  failedImportsCount = 0;
  successfulImports = 0;
  duplicatesSkipped = 0;
  showErrorModal = false;

  /**
   * Propiedades para el modal de exportación
   */
  exportStatusFilter: boolean | undefined = undefined;
  selectedExportStatus: boolean | undefined = undefined; // Variable para el modal
  exportDialogMessage = '¿Qué tipo de cuentas desea exportar?';
  exportStatusOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ];

  /**
  * Constructor del componente.
  * Inicializa los formularios reactivos para la gestión de cuentas y transacciones,
  * y provee la inyección de dependencias necesarias para la exportación de cuentas,
  * servicios de cuenta, impuestos y manejo de diálogos.
  *
  * @param accountExportComponent Componente para exportar cuentas.
  * @param fb Constructor de formularios reactivos.
  * @param _accountService Servicio para gestionar las cuentas contables.
  * @param dialog Servicio para manejar diálogos modales.
  * @param taxService Servicio para gestionar los impuestos.
  */
  constructor(
    private readonly fb: FormBuilder,
    private readonly _accountService: ChartAccountService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
 
  ) {

    this.accountForm = this.fb.group({})
    this.formTransactional = this.fb.group({
      selectedNatureType: [''],
      selectedFinancialStateType: [''],
      selectedClasificationType: [''],
      crossing: [false],
      costCenter: [false]
    });
  }

  /**
  * Muestra el formulario para agregar una nueva clase de cuenta.
  * Establece el estado de visibilidad y oculta otros formularios y opciones.
  */
  showFormAddNewClass() {
    this.showAddNewClass = true;
    this.noAddNewChild();
    this.noShowPrincipalAndTransactionalForm();
  }

  /**
  * Oculta el formulario para agregar una nueva clase de cuenta.
  * Dependiendo de si se ha seleccionado una cuenta, muestra u oculta otros formularios.
  */
  noShowFormAddNewClass() {
    this.showAddNewClass = false;
    if (this.selectedAccount) {
      this.showPrincipalAndTransactionalForm();
    } else {
      this.noShowPrincipalAndTransactionalForm();
    }
  }

  /**
  * Permite mostrar el formulario para agregar una nueva subcuenta.
  * Oculta los botones y formularios relacionados con la cuenta seleccionada.
  */
  addNewChild() {
    this.addChild = true;
    this.showButton = false;
    this.showButtonDelete = false;
    this.showFormTransactional = false;
    this.showUpdateButton = false;
    if (this.accountSelected) {
      this.updateInputAccess(Number.parseInt(this.accountSelected.code));
    }
  }

  /**
  * Impide mostrar el formulario para agregar una nueva subcuenta.
  * Restaura la visibilidad de los botones y formularios relacionados con la cuenta seleccionada.
  */
  noAddNewChild() {
    this.addChild = false;
    this.showButton = true;
    this.showButtonDelete = true;
    this.showFormTransactional = true;
    this.updateInputAccess(this.num);
  }

  /**
  * Permite mostrar el formulario principal y el formulario transaccional.
  * También habilita los botones relacionados con las acciones de la cuenta.
  */
  showPrincipalAndTransactionalForm() {
    this.showPrincipalForm = true;
    this.showFormTransactional = true;
    this.showButton = true;
    this.showButtonDelete = true;
  }

  /**
  * Impide mostrar el formulario principal y el formulario transaccional.
  * También oculta los botones relacionados con las acciones de la cuenta.
  */
  noShowPrincipalAndTransactionalForm() {
    this.showPrincipalForm = false;
    this.showFormTransactional = false;
    this.showButton = false;
    this.showButtonDelete = false;
  }

  /**
   * Abre el modal de plantilla de catálogo de cuentas.
   */
  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  /**
   * Cierra el modal de plantilla de catálogo de cuentas.
   */
  closeTemplateModal(): void {
    this.showTemplateModal = false;
  } 
  
  /**
   * Inicializa el componente obteniendo datos desde los servicios.
   */
  ngOnInit(): void {
    this.getAccounts();


    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getNatureType();
    this.getFinancialStateType();
    this.getClasificationType();

    this.accountForm.valueChanges.subscribe(() => {
      this.showUpdateButton = this.shouldShowUpdateButton();
    });
  }



  /**
  * Alterna la visibilidad de las subcuentas de una cuenta específica.
  * @param account La cuenta para la cual se desea alternar la visibilidad de las subcuentas.
  */
  toggleSubAccounts(account: Account) {
    account.showSubAccounts = !account.showSubAccounts;
  }

  /**
  * Selecciona una cuenta y actualiza el formulario con sus datos.
  * @param account La cuenta que se desea seleccionar.
  */
  selectAccount(account: Account) {
    this.noShowFormAddNewClass();
    this.noAddNewChild();
    this.accountHasInformation(account);
    this.createForm(account.code, account.description);
    this.selectedAccount = true;
    this.accountSelected = account;

    // Almacenar los valores originales para comparar cambios reales
    this.storeOriginalValues(account);

    this.showUpdateButton = false;
    this.updateCheckboxVisibilityEdit();
  }

  /**
   * Almacena los valores originales de la cuenta para comparar cambios reales.
   * @param account La cuenta seleccionada.
   */
  private storeOriginalValues(account: Account) {
    // Extraer el código y descripción según el nivel de la cuenta
    let originalCode = '';
    let originalDescription = '';

    switch (account.code.length) {
      case 1:
        originalCode = account.code.slice(0, 1);
        originalDescription = account.description;
        break;
      case 2:
        originalCode = account.code.slice(1, 2);
        originalDescription = account.description;
        break;
      case 4:
        originalCode = account.code.slice(2, 4);
        originalDescription = account.description;
        break;
      case 6:
        originalCode = account.code.slice(4, 6);
        originalDescription = account.description;
        break;
      case 8:
        originalCode = account.code.slice(6, 8);
        originalDescription = account.description;
        break;
    }

    this.originalAccountValues = {
      code: originalCode,
      description: originalDescription,
      nature: account.nature,
      financialStatus: account.financialStatus,
      classification: account.classification,
      crossing: account.crossing,
      costCenter: account.costCenter
    };
  }

  /**
   * Crea el formulario de cuenta basado en el código y la descripción de la cuenta seleccionada.
   * @param code El código de la cuenta seleccionada.
   * @param description La descripción de la cuenta seleccionada.
   */
  createForm(code: string, description: string) {
    this.accountForm = this.fb.group({});
    this.showPrincipalAndTransactionalForm();
    this.assignName(code, description);
    this.updateInputAccess(code.length);
    this.code = '';
    this.name = '';
    this.parentId = '';

    if (code.length >= 1) {
      this.accountForm.addControl('className', new FormControl({ value: this.className, disabled: this.inputAccess.class }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('classCode', new FormControl({ value: code.slice(0, 1), disabled: this.inputAccess.class }, [Validators.maxLength(1), Validators.minLength(1)]));
      this.currentLevelAccount = 'Grupo';
      this.num = 1;
      this.code = 'classCode';
      this.name = 'className';
    }

    if (code.length >= 2) {
      this.accountForm.addControl('groupName', new FormControl({ value: this.groupName, disabled: this.inputAccess.group }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('groupCode', new FormControl({ value: code.slice(0, 1), disabled: this.inputAccess.group }));
      this.accountForm.addControl('codeGroup', new FormControl({ value: code.slice(1, 2), disabled: this.inputAccess.group }, [Validators.maxLength(1), Validators.minLength(1)]));
      this.currentLevelAccount = 'Cuenta';
      this.num = 2;
      this.code = 'codeGroup';
      this.name = 'groupName';
      this.parentId = code.slice(0, 1);
    }

    if (code.length >= 4) {
      this.accountForm.addControl('accountName', new FormControl({ value: this.accountName, disabled: this.inputAccess.account }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('accountCode', new FormControl(code.slice(0, 2)));
      this.accountForm.addControl('codeAccount', new FormControl({ value: code.slice(2, 4), disabled: this.inputAccess.account }, [Validators.maxLength(2), Validators.minLength(2)]));
      this.currentLevelAccount = 'Subcuenta';
      this.num = 4;
      this.code = 'codeAccount';
      this.name = 'accountName';
      this.parentId = code.slice(0, 2);
    }

    if (code.length >= 6) {
      this.accountForm.addControl('subAccountName', new FormControl({ value: this.subAccountName, disabled: this.inputAccess.subAccount }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('subAccountCode', new FormControl(code.slice(0, 4)));
      this.accountForm.addControl('codeSubAccount', new FormControl({ value: code.slice(4, 6), disabled: this.inputAccess.subAccount }, [Validators.maxLength(2), Validators.minLength(2)]));
      this.currentLevelAccount = 'Auxiliar';
      this.num = 6;
      this.code = 'codeSubAccount';
      this.name = 'subAccountName';
      this.parentId = code.slice(0, 4);
    }

    if (code.length >= 8) {
      this.accountForm.addControl('auxiliaryName', new FormControl({ value: this.auxiliaryName, disabled: this.inputAccess.auxiliary }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('auxiliaryCode', new FormControl(code.slice(0, 6)));
      this.accountForm.addControl('codeAuxiliary', new FormControl({ value: code.slice(6, 8), disabled: this.inputAccess.auxiliary }, [Validators.maxLength(2), Validators.minLength(2)]));
      this.num = 8;
      this.code = 'codeAuxiliary';
      this.name = 'auxiliaryName';
      this.parentId = code.slice(0, 6);
    }

    this.accountForm.valueChanges.subscribe(() => {
      this.showUpdateButton = this.shouldShowUpdateButton();
    });

    this.formTransactional.valueChanges.subscribe(() => {
      this.showUpdateButton = this.shouldShowUpdateButton();
    });

  }

  /**
  * Determina si se debe mostrar el botón de "Actualizar" basado en los cambios reales en los formularios
  * comparados con los valores originales. También controla si los inputs deben estar bloqueados.
  * @returns Si el botón de "Actualizar" debe mostrarse.
  */
  shouldShowUpdateButton(): boolean {
    if (!this.originalAccountValues || !this.accountSelected) {
      this.inputsLocked = true;
      return false;
    }

    // Comparar valores actuales con valores originales
    const hasChanges = this.hasRealChanges();
    this.inputsLocked = !hasChanges; // Bloquear inputs cuando no hay cambios

    return hasChanges;
  }

  /**
  * Verifica si hay cambios reales comparando los valores actuales con los valores originales.
  * @returns Si hay cambios reales en los formularios.
  */
  private hasRealChanges(): boolean {
    if (!this.originalAccountValues) {
      return false;
    }

    const currentAccountValues = this.getCurrentAccountValues();
    const currentTransactionalValues = this.formTransactional.value;

    // Comparar código y descripción
    if (currentAccountValues.code !== this.originalAccountValues.code ||
        currentAccountValues.description !== this.originalAccountValues.description) {
      return true;
    }

    // Comparar valores transaccionales
    const natureChanged = this.compareNatureValues(currentTransactionalValues.selectedNatureType);
    const financialStatusChanged = this.compareFinancialStatusValues(currentTransactionalValues.selectedFinancialStateType);
    const classificationChanged = this.compareClassificationValues(currentTransactionalValues.selectedClasificationType);
    const crossingChanged = currentTransactionalValues.crossing !== this.originalAccountValues.crossing;
    const costCenterChanged = currentTransactionalValues.costCenter !== this.originalAccountValues.costCenter;

    return natureChanged || financialStatusChanged || classificationChanged || crossingChanged || costCenterChanged;
  }

  /**
  * Obtiene los valores actuales del formulario de cuenta.
  * @returns Los valores actuales del código y descripción.
  */
  private getCurrentAccountValues(): { code: string, description: string } {
    const codeValue = this.accountForm.get(this.code)?.value || '';
    const descriptionValue = this.accountForm.get(this.name)?.value || '';

    return {
      code: codeValue,
      description: descriptionValue
    };
  }

  /**
  * Compara el valor de naturaleza actual con el original.
  * @param currentValue Valor actual del selector de naturaleza.
  * @returns Si el valor cambió.
  */
  private compareNatureValues(currentValue: any): boolean {
    const currentName = currentValue?.name || null;
    return currentName !== this.originalAccountValues.nature;
  }

  /**
  * Compara el valor de estado financiero actual con el original.
  * @param currentValue Valor actual del selector de estado financiero.
  * @returns Si el valor cambió.
  */
  private compareFinancialStatusValues(currentValue: any): boolean {
    const currentName = currentValue?.name || null;
    return currentName !== this.originalAccountValues.financialStatus;
  }

  /**
  * Compara el valor de clasificación actual con el original.
  * @param currentValue Valor actual del selector de clasificación.
  * @returns Si el valor cambió.
  */
  private compareClassificationValues(currentValue: any): boolean {
    const currentName = currentValue?.name || null;
    return currentName !== this.originalAccountValues.classification;
  }

  /**
   * Asigna nombres de cuentas según el código y la descripción.
   * @param code El código de la cuenta.
   * @param name La descripción de la cuenta.
   */
  assignName(code: string, name: string) {
    this.className = '';
    this.groupName = '';
    this.accountName = '';
    this.subAccountName = '';
    this.auxiliaryName = '';

    this.className = this.findAccountByCode(this.listAccounts, code.slice(0, 1));
    this.groupName = this.findAccountByCode(this.listAccounts, code.slice(0, 2));
    this.accountName = this.findAccountByCode(this.listAccounts, code.slice(0, 4));
    this.subAccountName = this.findAccountByCode(this.listAccounts, code.slice(0, 6));
    this.auxiliaryName = this.findAccountByCode(this.listAccounts, code.slice(0, 8));

    switch (code.length) {
      case 1:
        this.className = name;
        break;
      case 2:
        this.groupName = name;
        break;
      case 4:
        this.accountName = name;
        break;
      case 6:
        this.subAccountName = name;
        break;
      case 8:
        this.auxiliaryName = name;
        break;
    }
  }

  /**
   * Exporta cuentas a un archivo Excel.
   */
  /**
  * Ordena las cuentas recursivamente por código.
  */
  sortAccountsRecursively(accounts: Account[]): Account[] {
    // Ordenamos la lista actual numéricamente
    accounts.sort((a, b) => Number.parseInt(a.code) - Number.parseInt(b.code));

    // Iteramos sobre cada cuenta para ordenar sus hijos recursivamente
    for (const account of accounts) {
      if (account.children && account.children.length > 0) {
        // Si la cuenta tiene hijos, aplicamos la función recursiva
        account.children = this.sortAccountsRecursively(account.children);
      }
    }

    return accounts;
  }

  /**
   * Cambia el tipo de estado financiero de las cuentas según el código de la cuenta.
   * Solo asigna valores por defecto si la cuenta no tiene un estado financiero definido.
   * Recorre las cuentas y, según el primer carácter del código, asigna un tipo de estado financiero.
   * Si la cuenta tiene elementos hijos, se aplica recursivamente la misma lógica a esos hijos.
   *
   * @param accounts - Lista de cuentas a las que se les cambiará el estado financiero.
   * @returns Un arreglo de cuentas con los tipos de estados financieros actualizados.
   */
  changeFinancialStateType(accounts: Account[]): Account[] {
    for (const account of accounts) {
      // Solo asignar valor por defecto si no tiene un estado financiero definido
      if (!account.financialStatus || account.financialStatus.trim() === '') {
        const code = account.code[0];
        if (code === "1" || code === "2" || code === "3") {
          account.financialStatus = "Estado de situacion financiero";
        }
        if (code === "4" || code === "5" || code === "6") {
          account.financialStatus = "Estado de resultados";
        }
      }
      if (account.children) { // Verificamos que children no sea undefined
        account.children = this.changeFinancialStateType(account.children);
      }
    }
    return accounts;
  }

  /**
   * Cambia el tipo de naturaleza de las cuentas según el código de la cuenta.
   * Solo asigna valores por defecto si la cuenta no tiene una naturaleza definida.
   * Asigna "Débito" o "Crédito" a la propiedad 'nature' de cada cuenta según el primer carácter del código.
   * Además, verifica los primeros 4 caracteres del código para asignar "Crédito" en ciertos casos.
   * Si la cuenta tiene elementos hijos, se aplica recursivamente la misma lógica a esos hijos.
   *
   * @param accounts - Lista de cuentas a las que se les cambiará el tipo de naturaleza.
   * @returns Un arreglo de cuentas con el tipo de naturaleza actualizado.
   */
  changeNatureType(accounts: Account[]): Account[] {
    for (const account of accounts) {
      // Solo asignar valor por defecto si no tiene una naturaleza definida
      if (!account.nature || account.nature.trim() === '') {
        const code = account.code[0];
        const codeAccount = account.code.slice(0, 4);
        if (code === "1" || code === "5" || code === "6") {
          account.nature = "Debito";
        }
        if (code === "2" || code === "3" || code === "4") {
          account.nature = "Credito";
        }
        if (codeAccount === "1592" || codeAccount === "1399" || codeAccount === "1499") {
          account.nature = "Credito";
        }
      }
      if (account.children) { // Verificamos que children no sea undefined
        account.children = this.changeNatureType(account.children);
      }
    }
    return accounts;
  }

  /**
   * Filtra los datos basados en la longitud del código en la primera columna.
   * Solo se incluyen las filas cuyo código tenga una longitud de 1, 2, 4, 6 o 8 caracteres.
   *
   * @param data - Arreglo de datos (matriz) que se filtrará según la longitud del código en la primera columna.
   * @returns Un arreglo de datos filtrado, donde solo se incluyen las filas con códigos de longitud específica.
   */
  filterByCodeLength(data: any[][]): any[][] {
    return data.filter(row => {
      const code = row[0]; // Toma el valor de la primera columna (código)
      const codeStr = String(code); // Convertir a cadena en caso de que sea un número
      const codeLength = codeStr.length; // Obtener la longitud del código
      return (codeLength === 1 || codeLength === 2 || codeLength === 4 || codeLength === 6 || codeLength === 8);
    });
  }

  /**
   * Busca una cuenta por su código y devuelve su descripción.
   * Si la cuenta no se encuentra en el nivel actual, busca de manera recursiva en los hijos de la cuenta.
   *
   * @param accounts - El arreglo de cuentas en el que se realizará la búsqueda.
   * @param code - El código de la cuenta que se desea encontrar.
   * @returns La descripción de la cuenta encontrada, o una cadena vacía si no se encuentra.
   */
  findAccountByCode(accounts: Account[], code: string): string {
    for (const account of accounts) {
      if (account.code === code) {
        return account.description;
      }
      if (account.children) {
        const foundAccount = this.findAccountByCode(account.children, code);
        if (foundAccount !== '') {
          return foundAccount;
        }
      }
    }
    return '';
  }

  /**
   * Actualiza el acceso a los campos de entrada según el nivel de la cuenta.
   * Dependiendo del código del nivel de cuenta proporcionado, se habilitan o deshabilitan los accesos a los diferentes niveles (Clase, Grupo, Cuenta, Subcuenta, Auxiliar).
   *
   * @param code - El código del nivel de la cuenta que determina qué accesos se deben habilitar o deshabilitar (opcional).
   */
  updateInputAccess(code?: number) {
    this.inputAccess = {
      class: true,
      group: true,
      account: true,
      subAccount: true,
      auxiliary: true
    };
    this.inputAccess = {
      class: code != 1,
      group: code != 2,
      account: code != 4,
      subAccount: code != 6,
      auxiliary: code != 8
    };
  }

  /**
   * Obtiene la lista de tipos de naturaleza desde el servicio de cuentas.
   */
  getNatureType() {
    this.listNature = this._accountService.getNatureType();
  }

  /**
   * Obtiene la lista de tipos de estado financiero desde el servicio de cuentas.
   */
  getFinancialStateType() {
    this.listFinancialState = this._accountService.getFinancialStateType();
  }

  /**
   * Obtiene la lista de tipos de clasificación desde el servicio de cuentas.
   */
  getClasificationType() {
    this.listClasification = this._accountService.getClasificationType();
  }

  /**
   * Maneja la selección de un tipo de estado financiero y establece el valor correspondiente en el formulario.
   *
   * @param event - El evento de selección que contiene el nombre del tipo de estado financiero seleccionado.
   */
  onSelectionFinancialStateType(event: any) {
    this.formTransactional.get('selectedFinancialStateType')?.setValue(event.name);
    this.placeFinancialStateType = '';
    // Actualizar la visibilidad de los checkboxes cuando cambie el estado financiero
    this.updateCheckboxVisibilityEditDynamic(event.name);
  }

  /**
   * Maneja la selección de un tipo de naturaleza y establece el valor correspondiente en el formulario.
   *
   * @param event - El evento de selección que contiene el nombre del tipo de naturaleza seleccionado.
   */
  onSelectionNatureType(event: any) {
    this.formTransactional.get('selectedNatureType')?.setValue(event.name);
    this.placeNatureType = '';
  }

  /**
   * Maneja la selección de un tipo de clasificación y establece el valor correspondiente en el formulario.
   *
   * @param event - El evento de selección que contiene el nombre del tipo de clasificación seleccionado.
   */
  onSelectionClasificationType(event: any) {
    this.formTransactional.get('selectedClasificationType')?.setValue(event.name);
    this.placeClasificationType = '';
  }

  /**
   * Maneja la eliminación de la selección del tipo de estado financiero, limpiando el valor en el formulario.
   */
  onSelectionFinancialStateTypeClear() {
    this.formTransactional.get('selectedFinancialStateType')?.setValue('');
  }

  /**
   * Maneja la eliminación de la selección del tipo de naturaleza, limpiando el valor en el formulario.
   */
  onSelectionNatureTypeClear() {
    this.formTransactional.get('selectedNatureType')?.setValue('');
  }

  /**
   * Maneja la eliminación de la selección del tipo de clasificación, limpiando el valor en el formulario.
   */
  onSelectionClasificationTypeClear() {
    this.formTransactional.get('selectedClasificationType')?.setValue('');
  }


  /**
   * Establece la información de la cuenta seleccionada en el selector y actualiza los valores del formulario.
   * @param selectedAccount - La cuenta seleccionada de la lista que contiene la información a establecer en el formulario.
   */
  // account-list.component.ts

  /**
   * Actualiza la visibilidad de los checkboxes para la edición basándose en el tipo de cuenta y estado financiero.
   */
  updateCheckboxVisibilityEdit() {
    if (this.accountSelected) {
      // Determinar si es una cuenta auxiliar (8 dígitos)
      const isAuxiliaryAccount = this.accountSelected.code.length === 8;
      
      this.showCrossingCheckboxEdit = isAuxiliaryAccount;
      
      // El checkbox de centro de costo se muestra solo si es auxiliar y el estado financiero es "Estado de Resultados"
      const financialStatus = this.accountSelected.financialStatus;
      this.showCostCenterCheckboxEdit = isAuxiliaryAccount && financialStatus === 'Estado de Resultados';
      
      
    } else {
      this.showCrossingCheckboxEdit = false;
      this.showCostCenterCheckboxEdit = false;
    }
  }

  /**
   * Actualiza dinámicamente la visibilidad del checkbox de centro de costo cuando cambia el estado financiero.
   */
  updateCheckboxVisibilityEditDynamic(newFinancialStatus: string) {
    if (this.accountSelected) {
      // Determinar si es una cuenta auxiliar (8 dígitos)
      const isAuxiliaryAccount = this.accountSelected.code.length === 8;
      
      // El checkbox de centro de costo se muestra solo si es auxiliar y el estado financiero es "Estado de Resultados"
      this.showCostCenterCheckboxEdit = isAuxiliaryAccount && newFinancialStatus === 'Estado de Resultados';
      
      // Si no se debe mostrar el checkbox de centro de costo, resetear su valor
      if (!this.showCostCenterCheckboxEdit) {
        this.formTransactional.patchValue({ costCenter: false });
      }
    }
  }

  /**
   * Establece la información de la cuenta seleccionada en el formulario transaccional.
   * @param selectedAccount La cuenta seleccionada.
   */
  accountHasInformation(selectedAccount: Account) {
    // Normalizamos los valores que vienen de la cuenta seleccionada UNA SOLA VEZ
    const normalizedNature = this.normalizeString(selectedAccount.nature);
    const normalizedFinancialStatus = this.normalizeString(selectedAccount.financialStatus);
    const normalizedClassification = this.normalizeString(selectedAccount.classification);

    // 1. Buscamos los objetos correspondientes usando la comparación normalizada
    const natureObject = this.listNature.find(
      n => this.normalizeString(n.name) === normalizedNature
    );

    const financialStateObject = this.listFinancialState.find(
      f => this.normalizeString(f.name) === normalizedFinancialStatus
    );

    const clasificationObject = this.listClasification.find(
      c => this.normalizeString(c.name) === normalizedClassification
    );

    // 2. Resetea el formulario a un estado "limpio" con los objetos encontrados.
    const crossingValue = selectedAccount.crossing === true;
    const costCenterValue = selectedAccount.costCenter === true;
    
    this.formTransactional.reset({
      selectedNatureType: natureObject || null,
      selectedFinancialStateType: financialStateObject || null,
      selectedClasificationType: clasificationObject || null,
      crossing: crossingValue,
      costCenter: costCenterValue
    });

    // 3. Ajustamos los placeholders visualmente.
    this.placeNatureType = natureObject ? '' : 'Seleccione una opción';
    this.placeFinancialStateType = financialStateObject ? '' : 'Seleccione una opción';
    this.placeClasificationType = clasificationObject ? '' : 'Seleccione una opción';
  }

  /**
   * Normaliza un string: lo convierte a minúsculas y le quita los acentos.
   * @param str El string a normalizar.
   * @returns El string normalizado.
   */
  private normalizeString(str: string | null | undefined): string {
    if (!str) {
      return '';
    }
    return str
      .toLowerCase() // 1. Convertir a minúsculas
      .normalize("NFD") // 2. Descomponer caracteres (ej. 'é' se convierte en 'e' + '´')
      .replaceAll(/[\u0300-\u036f]/g, ""); // 3. Eliminar los diacríticos (acentos)
  }




  /**
   * Oculta el formulario y restaura el estado en el que estaba antes.
   */
  cancel() {
    if (this.showAddNewClass) {
      this.noShowFormAddNewClass();
    }
    if (this.addChild) {
      this.noAddNewChild();
    }
  }

  /**
   * Si se agrega una cuenta hija, se concatena el código del padre, y si es una clase, se agrega normalmente.
   * @param $event Cuenta con la información que fue completada en el formulario de la cuenta hija.
   */
  addNewAccount($event: Account) {
    if (this.showAddNewClass) {
      this.saveNewAccountType($event);
    }
    if (this.addChild) {
      if (this.accountSelected) {
        const account: Account = {
          idEnterprise: this.getIdEnterprise(),
          code: this.accountSelected?.code + $event.code,
          description: $event.description,
          nature: $event.nature,
          financialStatus: $event.financialStatus,
          classification: $event.classification,
          parent: this.accountSelected.id,
          crossing: $event.crossing,
          costCenter: $event.costCenter
        }
        this.saveNewAccountType(account);
      }
    }
  }

  /**
   * Obtiene el ID de la empresa desde el localStorage.
   * @returns El ID de la empresa.
   */
  getIdEnterprise(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      return JSON.parse(entData).id;
    }
    return '';
  }

  /**
   * Obtiene todas las cuentas.
   * @returns Una promesa que se resuelve cuando las cuentas son obtenidas correctamente, o se rechaza con un error en caso de fallo.
   */
  getAccounts(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._accountService.getListAccounts(this.getIdEnterprise()).subscribe({
        next: (accounts) => {
          this.listAccounts = accounts.filter(account => account !== null);
          this.listAccounts = this.changeNatureType(this.listAccounts);
          this.listAccounts = this.changeFinancialStateType(this.listAccounts);
          this.listAccounts = this.sortAccountsRecursively(this.listAccounts);
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Realiza la búsqueda de cuentas por código o descripción.
   */
  searchAccounts(): void {
    // Evitar múltiples llamadas simultáneas
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Realizar búsqueda general por código o descripción
    this.performGeneralSearch(this.searchTerm.trim());
  }


  /**
   * Realiza búsqueda general por código o descripción.
   */
  private performGeneralSearch(searchValue: string): void {
    this._accountService.searchAccounts(
      this.getIdEnterprise(),
      searchValue
    ).subscribe({
      next: (results: Account[]) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda general:', error);
        this.searchResults = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Maneja el cambio en el campo de búsqueda.
   * Realiza búsqueda automática cuando cambia el valor.
   */
  onSearchChange(): void {
    // Si el campo está vacío, resetear búsqueda y mostrar todas las cuentas
    if (!this.searchTerm.trim()) {
      this.hasActiveSearch = false;
      this.searchResults = [];
      this.isLoading = false;
      return;
    }

    // Marcar que hay una búsqueda activa
    this.hasActiveSearch = true;

    // Realizar búsqueda si hay al menos 1 carácter
    if (this.searchTerm.trim().length >= 1) {
      this.searchAccounts();
    } else {
      // Si no hay texto, limpiar resultados
      this.searchResults = [];
      this.isLoading = false;
    }
  }

  /**
   * Verifica si una cuenta existe usando el cache local de cuentas cargadas.
   * Si no está en cache, hace la búsqueda pero de forma silenciosa.
   * 
   * @param account El objeto cuenta que contiene el código a buscar.
   * @returns Una promesa que se resuelve con un valor booleano que indica si la cuenta existe o no.
   */
  async getAccountByCode(account: Account): Promise<boolean> {
    try {
      // Primero verificar en el cache local (listAccounts)
      const existsInCache = this.findAccountInCache(account.code);
      if (existsInCache) {
        return true;
      }

      // Si no está en cache, hacer búsqueda silenciosa
      const cuenta = await firstValueFrom(
        this._accountService.getAccountByCode(account.code, this.getIdEnterprise())
      );
      
      return !!cuenta;
    } catch (error) {
      // Cualquier error se considera como cuenta no existente
      return false;
    }
  }

  /**
   * Busca una cuenta en el cache local (listAccounts) de forma recursiva.
   * 
   * @param code Código de la cuenta a buscar.
   * @returns La cuenta si existe en cache, null si no existe.
   */
  private findAccountInCache(code: string): Account | null {
    const searchInAccounts = (accounts: Account[]): Account | null => {
      for (const account of accounts) {
        if (account.code === code) {
          return account;
        }
        if (account.children && account.children.length > 0) {
          const found = searchInAccounts(account.children);
          if (found) return found;
        }
      }
      return null;
    };

    return searchInAccounts(this.listAccounts || []);
  }

  /**
   * Guarda una cuenta llamando al servicio.
   * @param account La cuenta que contiene la información a guardar.
   */
  async saveNewAccountType(account: Account) {
    try {
      this._accountService.createAccount(account).subscribe(
        (response) => {
          this.getAccounts()
            .then(() => {
              this.expandAccounts(response);
              this.selectAccount(response);
              this.noShowFormAddNewClass();
              this.noAddNewChild();
              this.messageService.add({
                severity: 'success',
                summary: 'Registro exitoso',
                detail: 'La cuenta se ha creado correctamente'
              });
            });
        },
        (error) => {
          const errorMessage = error?.error?.message || 'Ha ocurrido un error al crear la cuenta!.';
          const errorCode = error?.error?.code;
          const errorTitle = this.getErrorTitle(errorCode);

          this.messageService.add({
            severity: 'error',
            summary: errorTitle,
            detail: errorMessage
          });
        }
      );
    } catch (error) {
      console.error('Error al guardar el tipo de cuenta:', error);
    }
  }

  /**
   * Elimina una cuenta llamando al servicio.
   * Antes de eliminar, valida si la cuenta está asociada a algún impuesto. Si está vinculada, muestra un mensaje de error.
   * Si no está vinculada, pide confirmación al usuario para proceder con la eliminación.
   * Luego de la eliminación, actualiza la lista de cuentas y expande la cuenta padre si es necesario.
   */
  deleteAccount() {
    // Validate if the account is linked to any tax
    if (this.accountSelected?.id) {
      const isLinked = this.searchIfAccountIsLinked(this.accountSelected.code);
      if (isLinked) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al eliminar',
          detail: 'No es posible eliminar porque está asociado a un impuesto.'
        });
        return
      }
      try {
        this.confirmationService.confirm({
          message: '¿Desea eliminar esta cuenta?',
          header: 'Confirmar eliminación',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Sí, Eliminar',
          rejectLabel: 'Cancelar',
          accept: () => {
            if (this.accountSelected?.id) {
              this._accountService.deleteAccount(this.accountSelected.id.toString(), this.getIdEnterprise()).subscribe(
                () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminada',
                    detail: 'La cuenta se ha eliminado correctamente'
                  });
                this.getAccounts()
                  .then(() => {
                    if (this.accountSelected?.parent) {
                      this._accountService.getAccountByCode(this.accountSelected?.parent, this.getIdEnterprise()).subscribe({
                        next: (account) => {
                          if (account) {
                            this.expandAccounts(account);
                            this.selectAccount(account);
                            this.noShowFormAddNewClass();
                            this.noAddNewChild();
                          } else {
                            // Si la cuenta es null (no existe)
                            this.noShowPrincipalAndTransactionalForm();
                          }
                        }
                      });
                    } else {
                      this.noShowPrincipalAndTransactionalForm();
                    }
                  });
                },
                (error) => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Ha ocurrido un error al eliminar la cuenta!.'
                  });
                }
              );
            }
          }
        });

      } catch (error) {
        console.error('Error al eliminar el tipo de cuenta: ', error);
      }
    }
  }

  // Flag para prevenir múltiples actualizaciones simultáneas
  private isUpdating = false;

  // Flag para prevenir múltiples cambios de estado simultáneos
  private isChangingState = false;

  /**
   * Actualiza la información de una cuenta seleccionada.
   * Si los datos han cambiado, actualiza la cuenta llamando al servicio correspondiente.
   * Si no hay cambios, el botón permanece inactivo y no se realiza ninguna acción.
   */
  async updateAccount() {
    // Prevenir múltiples actualizaciones simultáneas
    if (this.isUpdating) {
      return;
    }
    this.isUpdating = true;

    try {
      if (this.accountSelected) {
        const transactionalValues = this.formTransactional.value;

        // Construir el código correctamente según el nivel de cuenta
        let newCode = '';
        const codeValue = this.accountForm.get(this.code)?.value || '';
        
        // Asegurar que el código mantenga la longitud correcta según el nivel
        if (this.num === 1) {
          newCode = codeValue.padStart(1, '0');
        } else if (this.num === 2) {
          newCode = this.parentId + codeValue.padStart(1, '0');
        } else if (this.num === 4) {
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else if (this.num === 6) {
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else if (this.num === 8) {
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else {
          // Fallback: usar la construcción original
          newCode = this.parentId + codeValue;
        }

        const account: Account = {
          idEnterprise: this.getIdEnterprise(),
          code: newCode,
          description: this.accountForm.get(this.name)?.value,

          nature: transactionalValues.selectedNatureType ? transactionalValues.selectedNatureType.name : null,
          financialStatus: transactionalValues.selectedFinancialStateType ? transactionalValues.selectedFinancialStateType.name : null,
          classification: transactionalValues.selectedClasificationType ? transactionalValues.selectedClasificationType.name : null,
          crossing: transactionalValues.crossing || false,
          costCenter: transactionalValues.costCenter || false
        };

        // Verificar si realmente hay cambios en los datos
        const hasChanges = (
          this.accountSelected.code !== account.code ||
          this.accountSelected.description !== account.description ||
          this.accountSelected.nature !== account.nature ||
          this.accountSelected.financialStatus !== account.financialStatus ||
          this.accountSelected.classification !== account.classification ||
          this.accountSelected.crossing !== account.crossing ||
          this.accountSelected.costCenter !== account.costCenter
        );
        
        if (hasChanges) {
          // Verificar que tenemos un ID válido
          if (!this.accountSelected?.id) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo identificar la cuenta a actualizar. Por favor, recargue la página.'
            });
            return;
          }

          this.update(this.accountSelected.id, account);
        }
      }
    } catch (error) {
      console.error('Error al actualizar la cuenta:', error);
    } finally {
      // Restablecer el flag
      this.isUpdating = false;
    }
  }

  /**
   * Actualiza la cuenta con el ID y la información proporcionados llamando al servicio correspondiente.
   * Si la actualización es exitosa, obtiene la lista de cuentas, expande la cuenta actualizada y selecciona la cuenta actualizada.
   * Además, cierra los formularios correspondientes y muestra un mensaje de éxito.
   * Si ocurre un error durante la actualización, muestra un mensaje de error.
   * @param id El ID de la cuenta a actualizar.
   * @param account La cuenta con la nueva información para actualizar.
   */
  update(id?: number, account?: Account) {
    this._accountService.updateAccount(id, account).subscribe(
      (response) => {
        this.getAccounts()
          .then(() => {
            this.expandAccounts(response);
            this.selectAccount(response);
            this.noShowFormAddNewClass();
            this.noAddNewChild();
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización exitosa',
              detail: 'La cuenta se ha actualizado correctamente'
            });
          });
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Ha ocurrido un error al actualizar la cuenta!.';
        const errorCode = error?.error?.code;
        const errorTitle = this.getErrorTitle(errorCode);

        this.messageService.add({
          severity: 'error',
          summary: errorTitle,
          detail: errorMessage
        });
      }
    );
  }

  /**
   * Determina el título del error basado en el código de error
   * @param errorCode Código de error del backend
   * @returns Título apropiado para el error
   */
  private getErrorTitle(errorCode?: string): string {
    switch (errorCode) {
      case 'ACCOUNT_DESCRIPTION_ALREADY_EXISTS':
      case 'ACCOUNT_ALREADY_EXISTS':
        return 'Registro Duplicado';

      case 'INVALID_ACCOUNT_CODE':
      case 'INVALID_ACCOUNT_CODE_LENGTH':
      case 'INVALID_ACCOUNT_CODE_FORMAT':
        return 'Error de Validación';

      case 'ACCOUNT_NOT_FOUND':
        return 'Cuenta No Encontrada';

      case 'ACCOUNT_HAS_CHILDREN':
        return 'Operación No Permitida';

      default:
        return 'Error';
    }
  }

  /**
   * Determina el título del error de importación basado en el código de error
   * @param errorCode Código de error del backend
   * @returns Título apropiado para el error de importación
   */
  private getImportErrorTitle(errorCode?: string): string {
    switch (errorCode) {
      case 'FILE_SIZE_EXCEEDED':
        return 'Archivo muy grande';

      case 'EXCEL_VALIDATION_ERROR':
      case 'EXCEL_CODE_VALIDATION_ERROR':
      case 'EXCEL_DROPDOWN_VALIDATION_ERROR':
      case 'EXCEL_CONDITIONAL_VALIDATION_ERROR':
        return 'Error en el archivo';

      case 'ACCOUNT_IMPORT_ERROR':
        return 'Error de importación';

      case 'ACCOUNT_IMPORT_NO_DATA':
        return 'Archivo vacío';

      case 'ACCOUNT_HIERARCHY_ERROR':
        return 'Error de jerarquía';

      default:
        return 'Error de importación';
    }
  }

  /**
   * Expands the parent accounts of the selected account
   * @param account Account to expand
   * @returns A Promise that resolves to void
   */
  expandAccounts(account: Account): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const code = account.code;

        const stack: Account[] = [...this.listAccounts];

        while (stack.length > 0) {
          const currentAccount = stack.pop();

          if (!currentAccount) continue;

          if (currentAccount.code === code.slice(0, currentAccount.code.length)) {
            currentAccount.showSubAccounts = true;

            if (currentAccount.code.length < code.length) {
              const nextCodeSegment = code.slice(0, currentAccount.code.length + 2);
              if (currentAccount.children) {
                for (let child of currentAccount.children) {
                  if (child.code === nextCodeSegment) {
                    stack.push(child);
                    break;
                  }
                }
              }
            }
          }

          if (currentAccount.children) {
            stack.push(...currentAccount.children);
          }
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
 * Verifica si una cuenta está asociada a algún impuesto, buscando si su código se encuentra en las listas de cuentas de reembolso o de depósito.
 * @param accountCode El código de la cuenta a verificar.
 * @returns `true` si el código de la cuenta está presente en alguna de las listas, `false` en caso contrario.
 */
  searchIfAccountIsLinked(accountCode: string) {
    return this.listRefundAccount.includes(accountCode) || this.listDepositAccount.includes(accountCode)
  }

  /**
   * Maneja la entrada de teclado en los campos de código.
   * Bloquea caracteres que no sean números y limita la longitud según el nivel.
   * @param event Evento de teclado.
   * @param maxLength Longitud máxima permitida.
   */
  onCodeKeyDown(event: KeyboardEvent, maxLength: number) {
    // Permitir teclas de navegación y control
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Permitir teclas de navegación
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ]);
    
    if (allowedKeys.has(event.key)) {
      return;
    }

    // Solo permitir números
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Obtener el valor actual del campo
    const target = event.target as HTMLInputElement;
    const currentValue = target.value;
    
    // Limitar longitud según el nivel
    if (currentValue.length >= maxLength && !allowedKeys.has(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Maneja la entrada en los campos de código para asegurar formato correcto.
   * @param event Evento de entrada.
   * @param maxLength Longitud máxima permitida.
   */
  onCodeInput(event: Event, maxLength: number) {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    
    // Remover caracteres que no sean números
    value = value.replaceAll(/\D/g, '');
    
    // Limitar longitud según el nivel
    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    
    // Actualizar el valor del campo
    target.value = value;
    
    // Actualizar el FormControl correspondiente
    const formControlName = target.getAttribute('formControlName');
    if (formControlName) {
      this.accountForm.get(formControlName)?.setValue(value);
    }
  }

  /**
   * Maneja la entrada de teclado en los campos de nombre.
   * Bloquea caracteres que no sean letras, números, espacios y caracteres especiales permitidos.
   * @param event Evento de teclado.
   */
  onNameKeyDown(event: KeyboardEvent) {
    // Permitir teclas de navegación y control
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Permitir teclas de navegación
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', ' '
    ]);

    if (allowedKeys.has(event.key)) {
      return;
    }

    // Solo permitir letras, números, espacios y caracteres especiales permitidos
    const allowedPattern = /^[a-zA-ZÀ-ÿ\d,.()/\-+&%]$/;
    if (!allowedPattern.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Obtiene la lista de códigos de cuentas que están expandidas actualmente.
   * @returns Array de códigos de cuentas expandidas.
   */
  private getExpandedAccounts(): string[] {
    const expandedCodes: string[] = [];

    const collectExpanded = (accounts: Account[]) => {
      for (const account of accounts) {
        if (account.showSubAccounts) {
          expandedCodes.push(account.code);
        }
        if (account.children && account.children.length > 0) {
          collectExpanded(account.children);
        }
      }
    };

    collectExpanded(this.listAccounts);
    return expandedCodes;
  }

  /**
   * Restaura el estado de expansión de las cuentas basado en la lista de códigos proporcionada.
   * @param expandedCodes Array de códigos de cuentas que deben estar expandidas.
   */
  private restoreExpandedAccounts(expandedCodes: string[]): void {
    const expandAccounts = (accounts: Account[]) => {
      for (const account of accounts) {
        if (expandedCodes.includes(account.code)) {
          account.showSubAccounts = true;
        }
        if (account.children && account.children.length > 0) {
          expandAccounts(account.children);
        }
      }
    };

    expandAccounts(this.listAccounts);
  }

  /**
   * Actualiza recursivamente el estado de todas las cuentas hijas en la UI.
   * @param parent La cuenta padre.
   * @param status El nuevo estado a aplicar.
   */
  private updateChildrenStatusRecursively(parent: Account, status: boolean): void {
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        child.status = status;
        // Actualizar recursivamente los hijos de este hijo
        this.updateChildrenStatusRecursively(child, status);
      }
    }
  }

  /**
   * Activa recursivamente toda la jerarquía de padres de una cuenta en la UI.
   * @param child La cuenta hija desde donde se inicia la activación ascendente.
   */
  private activateParentHierarchy(child: Account): void {
    // Función auxiliar para encontrar el padre en la jerarquía
    const findParentInHierarchy = (accounts: Account[], targetCode: string): Account | null => {
      for (const account of accounts) {
        if (account.code === targetCode) {
          return account;
        }
        if (account.children && account.children.length > 0) {
          const found = findParentInHierarchy(account.children, targetCode);
          if (found) return found;
        }
      }
      return null;
    };

    // Obtener el código del padre
    const parentCode = this.getParentCode(child.code);
    if (parentCode) {
      const parent = findParentInHierarchy(this.listAccounts, parentCode);
      if (parent && !parent.status) {
        // Si el padre no está activo, activarlo
        parent.status = true;
        // Continuar activando recursivamente hacia arriba
        this.activateParentHierarchy(parent);
      }
    }
  }

  /**
   * Desactiva recursivamente la jerarquía de padres que fueron activados durante una operación fallida.
   * @param child La cuenta hija desde donde se inicia la desactivación ascendente.
   */
  private deactivateParentHierarchy(child: Account): void {
    // Función auxiliar para encontrar el padre en la jerarquía
    const findParentInHierarchy = (accounts: Account[], targetCode: string): Account | null => {
      for (const account of accounts) {
        if (account.code === targetCode) {
          return account;
        }
        if (account.children && account.children.length > 0) {
          const found = findParentInHierarchy(account.children, targetCode);
          if (found) return found;
        }
      }
      return null;
    };

    // Obtener el código del padre
    const parentCode = this.getParentCode(child.code);
    if (parentCode) {
      const parent = findParentInHierarchy(this.listAccounts, parentCode);
      if (parent?.status) {
        // Si el padre está activo y no tiene otros hijos activos, desactivarlo
        const hasActiveChildren = this.hasActiveChildren(parent);
        if (!hasActiveChildren) {
          parent.status = false;
          // Continuar desactivando recursivamente hacia arriba
          this.deactivateParentHierarchy(parent);
        }
      }
    }
  }

  /**
   * Obtiene el código del padre para una cuenta dada.
   * @param code El código de la cuenta.
   * @returns El código del padre o null si no tiene padre.
   */
  private getParentCode(code: string): string | null {
    switch (code.length) {
      case 1: return null; // Clase, no tiene padre
      case 2: return code.substring(0, 1); // Grupo -> Clase
      case 4: return code.substring(0, 2); // Cuenta -> Grupo
      case 6: return code.substring(0, 4); // Subcuenta -> Cuenta
      case 8: return code.substring(0, 6); // Auxiliar -> Subcuenta
      default: return null;
    }
  }

  /**
   * Verifica si una cuenta tiene hijos activos.
   * @param account La cuenta a verificar.
   * @returns true si tiene al menos un hijo activo, false en caso contrario.
   */
  private hasActiveChildren(account: Account): boolean {
    if (account.children && account.children.length > 0) {
      for (const child of account.children) {
        if (child.status) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Cambia el estado de una cuenta y actualiza recursivamente el estado de sus hijos.
   * @param account La cuenta cuyo estado se va a cambiar.
   */
  changeAccountState(account: Account) {
    if (this.isChangingState) {
      return;
    }
    this.isChangingState = true;

    if (!account?.id || account.status == null) {
      if (account.status != null) {
        account.status = !account.status;
      }
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan datos para cambiar el estado de la cuenta.'
      });
      this.isChangingState = false;
      return;
    }

    const enterpriseId = this.getIdEnterprise();
    const newStatus = account.status;

    this._accountService.changeState(account.id, enterpriseId, newStatus).subscribe({
      next: () => {
        if (newStatus) {
          this.activateParentHierarchy(account);
        } else {
          this.updateChildrenStatusRecursively(account, newStatus);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de la cuenta "${account.description}" cambiado correctamente`
        });
        this.isChangingState = false;
      },
      error: () => {
        account.status = !newStatus;
        if (newStatus) {
          this.deactivateParentHierarchy(account);
        } else {
          this.updateChildrenStatusRecursively(account, !newStatus);
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la cuenta.'
        });
        this.isChangingState = false;
      }
    });
  }

  /**
   * Muestra el modal de confirmación para exportar cuentas
   */
  showExportConfirmDialog() {
    this.selectedExportStatus = undefined; // "Todos" por defecto

    this.confirmationService.confirm({
      key: 'exportDialog',
      header: 'Exportar',
      acceptLabel: 'Aceptar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.exportAccounts(this.selectedExportStatus);
      }
    });
  }

  /**
   * Exporta el catálogo de cuentas a formato Excel.
   */
  exportAccounts(status: boolean | undefined): void {
    const entData = this.localStorageMethods.loadEnterpriseData();
    const entId = entData?.id || this.getIdEnterprise();
    const companyName = entData?.name || '';

    this._accountService.exportAccounts(entId, companyName, status).subscribe({
      next: (response) => {
        if (!response.body) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Exportación',
            detail: 'No se recibió el archivo del servidor'
          });
          return;
        }

        this.downloadFile(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Exportación Exitosa',
          detail: `Se ha exportado el catálogo de cuentas correctamente`
        });
      },
      error: (error) => {
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo exportar las cuentas.';

              // Verificar si es un mensaje informativo sobre cuentas no disponibles
              const isNoAccountsMessage = this.isNoAccountsAvailableMessage(errorMessage);

              if (isNoAccountsMessage) {
                // Mostrar como información en lugar de error
                this.messageService.add({
                  severity: 'info',
                  summary: 'Información',
                  detail: this.getNoAccountsMessage(status)
                });
              } else {
                // Mostrar como error para otros casos
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error de Exportación',
                  detail: errorMessage
                });
              }
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: 'Ocurrió un error inesperado.'
              });
            }
          };
          reader.onerror = () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: 'No se pudo leer el mensaje de error.'
            });
          };
          reader.readAsText(error.error);
        } else {
          const errorMessage = error.error?.message || error.message || 'Error desconocido al exportar cuentas';

          // Verificar si es un mensaje informativo sobre cuentas no disponibles
          const isNoAccountsMessage = this.isNoAccountsAvailableMessage(errorMessage);

          if (isNoAccountsMessage) {
            // Mostrar como información en lugar de error
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: this.getNoAccountsMessage(status)
            });
          } else {
            // Mostrar como error para otros casos
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Exportación',
              detail: errorMessage
            });
          }
        }
      }
    });
  }

  /**
   * Verifica si el mensaje de error indica que no hay cuentas disponibles para exportar.
   */
  private isNoAccountsAvailableMessage(message: string): boolean {
    const noAccountsPatterns = [
      'no hay cuentas',
      'no existen cuentas',
      'no se encontraron cuentas',
      'no hay registros',
      'empty',
      'sin cuentas'
    ];

    return noAccountsPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Retorna el mensaje informativo apropiado según el filtro de estado aplicado.
   */
  private getNoAccountsMessage(status: boolean | undefined): string {
    switch (status) {
      case true:
        return 'No hay cuentas activas para exportar';
      case false:
        return 'No hay cuentas inactivas para exportar';
      case undefined:
      default:
        return 'No hay cuentas para exportar';
    }
  }

  /**
   * Procesa la respuesta HTTP para descargar el archivo.
   */
  private downloadFile(response: any): void {
    const blob = response.body;
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'catalogo_cuentas.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Muestra el modal con los detalles de errores de importación.
   */
  private showImportErrorsModal(errors: ImportError[], fileName: string, totalRecords?: number, failedImports?: number, successfulImports?: number, duplicatesSkipped?: number): void {
    this.importErrors = errors;
    this.totalErrors = errors.length;
    this.totalRecordsImported = totalRecords || 0;
    this.failedImportsCount = failedImports || errors.length;
    this.successfulImports = successfulImports || 0;
    this.duplicatesSkipped = duplicatesSkipped || 0;
    this.showErrorModal = true;
  }

  /**
   * Cierra el modal de errores de importación.
   */
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.importErrors = [];
    this.totalErrors = 0;
    this.totalRecordsImported = 0;
    this.failedImportsCount = 0;
    this.successfulImports = 0;
    this.duplicatesSkipped = 0;
  }

  /**
   * Exporta los errores de importación a un archivo Excel
   */
  exportImportErrors(): void {
    try {
      // Validar que existan errores para exportar
      if (!this.importErrors || this.importErrors.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin Errores',
          detail: 'No hay errores para exportar'
        });
        return;
      }

      // Crear el workbook y worksheet
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = {};

      // Información del encabezado
      const headerInfo = [
        ['ERRORES DE IMPORTACIÓN DE CATÁLOGO DE CUENTAS'],
        [''],
        ['Fecha de exportación:', new Date().toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })],
        ['Hora:', new Date().toLocaleTimeString('es-CO')],
        [''],
        ['RESUMEN DE IMPORTACIÓN'],
        ['Total procesados:', this.totalRecordsImported],
        ['Exitosos:', this.successfulImports],
        ['Fallidos:', this.failedImportsCount],
        ['Duplicados omitidos:', this.duplicatesSkipped],
        [''],
        ['DETALLE DE ERRORES']
      ];

      // Agregar la información del encabezado
      XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });

      // Encabezados de la tabla
      const tableHeaders = [
        ['Fila', 'Columna', 'Campo', 'Valor', 'Error']
      ];

      // Agregar encabezados de la tabla
      XLSX.utils.sheet_add_aoa(ws, tableHeaders, { origin: 'A14' });

      // Preparar los datos de la tabla
      const tableData = this.importErrors.map(error => [
        error.rowNumber,
        this.getExcelColumnLetter(error.columnNumber),
        error.columnName,
        error.fieldValue || '(vacío)',
        error.errorMessage
      ]);

      // Agregar los datos de la tabla
      XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A15' });

      // Establecer el rango de la hoja
      const totalRows = headerInfo.length + 2 + tableData.length;
      ws['!ref'] = `A1:E${totalRows}`;

      // Configurar anchos de columnas
      ws['!cols'] = [
        { wch: 8 },  // A - Fila
        { wch: 10 }, // B - Columna
        { wch: 25 }, // C - Campo
        { wch: 25 }, // D - Valor
        { wch: 60 }  // E - Error
      ];

      // Combinar celdas para el título
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }); // A1:E1 (Título)

      // Agregar el worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Errores Importación');

      // Generar el nombre del archivo con fecha local
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day}`;
      const fileName = `Errores_Importacion_Catalogo_Cuentas_${timestamp}.xlsx`;

      // Generar el archivo y descargarlo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);

      // Cerrar el modal
      this.closeErrorModal();

      // Mostrar notificación de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: 'El archivo se ha exportado correctamente.'
      });

    } catch (error) {
      console.error('Error al exportar errores:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error en Exportación',
        detail: 'Ocurrió un error al exportar los errores.'
      });
    }
  }

  /**
   * Convierte un número de columna a letra de Excel (1=A, 2=B, 27=AA, etc.)
   */
  getExcelColumnLetter(columnNumber: number): string {
    let columnLetter = '';
    let temp = columnNumber;

    while (temp > 0) {
      const remainder = (temp - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      temp = Math.floor((temp - 1) / 26);
    }

    return columnLetter;
  }

  /**
   * Maneja la selección de archivo para importar cuentas.
   * @param event Evento del selector de archivos.
   */
  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (!file) return;

    const entId = this.getIdEnterprise();

    this._accountService.importAccounts(entId, file).subscribe({
      next: (response) => {
        const importResult = response.body;

        if (importResult) {
          const { status, totalRecords, successfulImports, failedImports, duplicatesSkipped, errors } = importResult;

          // Si hay errores, mostrar modal de errores Y notificación de resumen
          if (errors && errors.length > 0) {
            let detail = `Total procesados: ${totalRecords || 0}\n`;
            detail += `Exitosos: ${successfulImports || 0}\n`;
            detail += `Fallidos: ${failedImports}\n`;
            if (duplicatesSkipped > 0) {
              detail += `Duplicados omitidos: ${duplicatesSkipped}\n`;
            }

            this.messageService.add({
              severity: 'info',
              summary: 'Importación Completada con Errores',
              detail,
              life: 8000
            });

            // Mostrar modal con detalles de errores
            this.showImportErrorsModal(errors, importResult.fileName || file.name, totalRecords, failedImports, successfulImports, duplicatesSkipped);

            // Recargar lista si hubo importaciones exitosas
            if (successfulImports > 0) {
              this.getAccounts();
            }
            return;
          }

          // Si no hay errores, mostrar resumen de importación exitosa
          let severity: 'success' | 'info' | 'warn' | 'error' = 'success';
          let summary = 'Importación Exitosa';

          if (status === 'FAILED') {
            severity = 'error';
            summary = 'Error en Importación';
          }

          // Construir mensaje detallado
          let detail = `Total procesados: ${totalRecords || 0}\n`;
          detail += `Exitosos: ${successfulImports || 0}\n`;
          if (duplicatesSkipped > 0) {
            detail += `Duplicados omitidos: ${duplicatesSkipped}\n`;
          }

          this.messageService.add({
            severity,
            summary,
            detail,
            life: 8000
          });

          // Recargar lista si hubo importaciones exitosas
          if (successfulImports > 0) {
            this.getAccounts();
          }
        }
      },
      error: (error) => {
        // Extraer los errores del backend
        if (error.error && typeof error.error === 'object') {
          const errorResponse = error.error;
          const errors = errorResponse.errors || [];

          if (errors && errors.length > 0) {
            // Mostrar modal de errores
            this.showImportErrorsModal(
              errors,
              errorResponse.fileName || file.name,
              errorResponse.totalRecords,
              errorResponse.failedImports,
              errorResponse.successfulImports,
              errorResponse.duplicatesSkipped
            );
          } else {
            // Error general sin detalles específicos
            const errorMessage = errorResponse.message || 'Error desconocido durante la importación';
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Importación',
              detail: errorMessage
            });
          }
        } else if (error.error instanceof Blob) {
          // Manejar errores que vienen como Blob
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              const errorMessage = errorData.message || 'No se pudo importar las cuentas.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Importación',
                detail: errorMessage
              });
            } catch (e) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Importación',
                detail: 'Ocurrió un error inesperado.'
              });
            }
          };
          reader.onerror = () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Importación',
              detail: 'No se pudo leer el mensaje de error.'
            });
          };
          reader.readAsText(error.error);
        } else {
          // Error que no es Blob
          const errorMessage = error.error?.message || error.message || 'Error desconocido al importar cuentas';
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Importación',
            detail: errorMessage
          });
        }
      }
    });
  }

}
