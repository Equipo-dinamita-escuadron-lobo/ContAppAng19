import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Account } from '../../models/ChartAccount';
import { FinancialStateType } from '../../models/FinancialStateType';
import { NatureType } from '../../models/NatureType';
import { ClasificationType } from '../../models/ClasificationType';
import { ChartAccountService } from '../../services/chart-account.service';
import { forkJoin, map, Observable, of, switchMap, firstValueFrom, catchError } from 'rxjs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { AccountFormComponent } from '../account-form/account-form.component';
import { FilterPipe } from '../../pipes/filter.pipe';
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
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

// Interfaces para manejo de errores de importación
interface ImportError {
  fila: number;
  columna: string;
  campo: string;
  error: string;
}

interface ExcelRow {
  [key: string]: any;
  'Código': string;
  'Nombre': string;
  'Naturaleza': string;
  'Estado Financiero': string;
  'Clasificación': string;
  'Cruce': string;
  'Centro de Costo': string;
}

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    AccountFormComponent, FilterPipe,
    ButtonModule, FileUploadModule, DropdownModule, DialogModule,
    IconFieldModule, InputIconModule, InputTextModule, CheckboxModule,
    ToggleSwitchModule, TagModule, ToastModule, ConfirmDialogModule,
    TableModule, PaginatorModule
  ],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class AccountListComponent {
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
  * Variables para la importación de archivos planos (flat file).
  * Estas variables gestionan los datos importados, filtros y estados de importación.
  */
  filterAccount: string = '';
  listExcel: Account[] = [];
  listAccountsToShow: Account[] = [];
  importedAccounts: boolean = false;
  importedFailed: boolean = false;

  //Variable para controlar la visibilidad
  showImportModal = false;
  
  // Variables para manejar errores de importación
  showErrorModal = false;
  importErrors: ImportError[] = [];
  totalErrors = 0;

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
  * Variables para controlar la visibilidad de los botones en la interfaz de usuario.
  */
  showButton = false;
  showUpdateButton = false;
  showAddNewClass: boolean = false;
  showButtonDelete: boolean = false;

  /**
  * Variables para controlar la visibilidad de los checkboxes en la edición
  */
  showCrossingCheckboxEdit: boolean = false;
  showCostCenterCheckboxEdit: boolean = false;

    /**
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
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods(); //Descomentar linea cuando se tenga implementado esto
  entData: any | null = null;
  //taxes: Tax[] = []; //Descomentar linea cuando se tenga implementado esto

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
    private fb: FormBuilder,
    private _accountService: ChartAccountService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    //private dialog: MatDialog,  //Descomentar linea cuando se tenga implementado esto
    //private taxService: TaxService  //Descomentar linea cuando se tenga implementado esto
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
      this.updateInputAccess(parseInt(this.accountSelected.code));
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
  * Abre un diálogo modal para mostrar los detalles de la importación.
  */
  openModalDetails(): void {
    // this.OpenDetailsImport('Detalles de importación ', AccountImportComponent) //Descomentar linea cuando se tenga implementado esto
  }

  // Nuevo método para abrir el modal (reemplaza a openModalDetails)
  openTemplateModal(): void {
    this.showImportModal = true;
  }

  // Nuevo método para cerrar el modal
  closeTemplateModal(): void {
    this.showImportModal = false;
  }

  /**
   * Descarga la plantilla de catálogo de cuentas desde el backend.
   */
  downloadTemplate(): void {
    this._accountService.downloadTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantillaCatalogoCuentas.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga exitosa',
          detail: 'La plantilla se ha descargado correctamente'
        });
      },
      error: (error) => {
        console.error('Error al descargar la plantilla:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar la plantilla. Intente nuevamente.'
        });
      }
    });
  }

  /**
  * Abre un diálogo modal con un título y componente específicos.
  * @param title El título del cuadro de diálogo modal.
  * @param component El componente que se mostrará en el cuadro de diálogo modal.
  */
  /*OpenDetailsImport(title: any, component: any) {
    var _popUp = this.dialog.open(component, {
      width: '40%',
      height: '100px',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '600ms',
      data: {
        title: title
      }
    });
    _popUp.afterClosed().subscribe()
  }*/ //Descomentar linea cuando se tenga implementado esto

  /**
   * Inicializa el componente obteniendo datos desde los servicios.
   */
  ngOnInit(): void {
    this.getAccounts();


    //DESCOMENTAR CUANDO SE IMPLEMENTE
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getTaxesByCodes();
    this.getNatureType();
    this.getFinancialStateType();
    this.getClasificationType();

    this.accountForm.valueChanges.subscribe(() => {
      this.showUpdateButton = this.shouldShowUpdateButton();
    });
  }

  onFileSelect(event: any) {
    // Validar tipo de archivo antes de procesar
    if (event.files && event.files.length > 0) {
      const file = event.files[0];
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Solo se permiten archivos .xlsx'
        });
        // Limpiar el selector de archivos
        if (event.originalEvent && event.originalEvent.target) {
          event.originalEvent.target.value = '';
        }
        return;
      }
    }
    
    // El evento de PrimeNG es un poco diferente. El archivo está en event.files[0]
    // Creamos un objeto de evento simulado para que tu método ReadExcel funcione sin cambios.
    const simulatedEvent = {
      target: {
        files: event.files
      }
    };
    this.ReadExcel(simulatedEvent);
    // Limpia el selector de archivos para poder seleccionar el mismo archivo de nuevo
    if (event.originalEvent && event.originalEvent.target) {
    event.originalEvent.target.value = '';
    }
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
    this.showUpdateButton = false;
    this.accountSelected = account;
    this.updateCheckboxVisibilityEdit();
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
  * Determina si se debe mostrar el botón de "Actualizar" basado en los cambios en los formularios.
  * @returns Si el botón de "Actualizar" debe mostrarse.
  */
  shouldShowUpdateButton(): boolean {
    const accountFormHasChanges = this.hasFormValueChanged(this.accountForm);
    const transactionalFormHasChanges = this.hasFormValueChanged(this.formTransactional);
    return accountFormHasChanges || transactionalFormHasChanges;
  }

  /**
  * Verifica si algún control en el formulario proporcionado ha sido modificado.
  * @param form El grupo de formularios a verificar.
  * @returns Si algún control en el formulario ha sido modificado.
  */
  hasFormValueChanged(form: FormGroup): boolean {
    const formValues = form.value;
    for (const key in formValues) {
      if (formValues.hasOwnProperty(key)) {
        const control = form.get(key);
        if (control && control.dirty) {
          return true;
        }
      }
    }
    return false;
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
  exportAccountsToExcel(): void {
    // 1. Llama a tu servicio para obtener las cuentas actualizadas
    this._accountService.getListAccounts(this.getIdEnterprise()).subscribe({
      next: (accounts) => {
        // 2. Verifica si se obtuvieron cuentas
        if (accounts && accounts.length > 0) {
          // 3. Si hay cuentas, procede a crear y descargar el Excel
          this.createAndDownloadExcel(accounts); // Llamamos a un nuevo método de ayuda

          // 4. Muestra la notificación de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Se ha generado el archivo correctamente.'
          });
        } else {
          // Si no hay cuentas, muestra la notificación de error
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontraron cuentas para exportar.'
          });
        }
      },
      error: (err) => {
        // Maneja el caso en que el servicio falle
        console.error('Error al obtener cuentas para exportar:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Conexión',
          detail: 'No se pudieron obtener las cuentas. Intente de nuevo más tarde.'
        });
      }
    });
  }

  private createAndDownloadExcel(accounts: Account[]): void {
    // Define la cabecera del Excel
    const data: any[] = [['Código', 'Nombre', 'Naturaleza', 'Estado Financiero', 'Clasificación']];

    // Función auxiliar recursiva para aplanar la jerarquía
    const addAccountRows = (accountList: Account[]) => {
      for (const account of accountList) {
        data.push([
          account.code,
          account.description,
          account.nature,
          account.financialStatus,
          account.classification
        ]);
        if (account.children && account.children.length > 0) {
          addAccountRows(account.children);
        }
      }
    };

    // Llama a la función auxiliar para poblar los datos
    addAccountRows(accounts);

    // Crea la hoja de cálculo (worksheet)
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

    // Opcional: ajusta el ancho de las columnas
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 25 }];

    // Crea el libro de trabajo (workbook)
    const workbook: XLSX.WorkBook = {
      Sheets: { 'CatalogoCuentas': worksheet },
      SheetNames: ['CatalogoCuentas']
    };

    // Genera el buffer del archivo Excel
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Crea un Blob (Binary Large Object) para la descarga
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // Usa file-saver para iniciar la descarga
    saveAs(blobData, 'CatalogoCuentas.xlsx');
  }

  /**
  * Ordena las cuentas recursivamente por código.
  */
  sortAccountsRecursively(accounts: Account[]): Account[] {
    // Ordenamos la lista actual numéricamente
    accounts.sort((a, b) => parseInt(a.code) - parseInt(b.code));

    // Iteramos sobre cada cuenta para ordenar sus hijos recursivamente
    accounts.forEach(account => {
      if (account.children && account.children.length > 0) {
        // Si la cuenta tiene hijos, aplicamos la función recursiva
        account.children = this.sortAccountsRecursively(account.children);
      }
    });

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
    accounts.forEach(account => {
      // Solo asignar valor por defecto si no tiene un estado financiero definido
      if (!account.financialStatus || account.financialStatus.trim() === '') {
        var code = account.code[0];
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
    });
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
    accounts.forEach(account => {
      // Solo asignar valor por defecto si no tiene una naturaleza definida
      if (!account.nature || account.nature.trim() === '') {
        var code = account.code[0];
        var codeAccount = account.code.slice(0, 4);
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
    });
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
   * Valida formato, campos obligatorios, duplicados, jerarquía y otros criterios.
   *
   * @param event - El evento de entrada de archivo que contiene el archivo Excel.
   */
  ReadExcel(event: any) {
    let file = event.target.files[0];

    if (!file) {
      return;
    }

    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);

    fileReader.onload = (e) => {
      try {
        const workBook = XLSX.read(fileReader.result, { type: 'binary', cellText: true });
        const sheetNames = workBook.SheetNames;
        
        // Convertir la hoja a JSON
        let jsonData: any[][] = XLSX.utils.sheet_to_json(workBook.Sheets[sheetNames[0]], { 
          raw: false, 
          header: 1,
          defval: '' // Valor por defecto para celdas vacías
        });

        // Validaciones y procesamiento
        this.validateExcelDataAsync(jsonData).then((validationResult) => {
          if (validationResult.errors.length > 0) {
            this.showImportErrors(validationResult.errors);
            return;
          }

          // Si no hay errores, procesar las cuentas válidas
          this.processValidAccounts(validationResult.validAccounts);
        }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error durante la validación del archivo'
          });
        });
        
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al procesar el archivo Excel'
        });
      }

      // Reset file input value
      event.target.value = null;
    };
  }

  /**
   * Valida todos los datos del Excel según los requerimientos de forma asíncrona.
   */
  private async validateExcelDataAsync(jsonData: any[][]): Promise<{ errors: ImportError[], validAccounts: ExcelRow[] }> {
    const errors: ImportError[] = [];
    const validAccounts: ExcelRow[] = [];
    
    if (jsonData.length === 0) {
      errors.push({
        fila: 1,
        columna: 'General',
        campo: 'Archivo',
        error: 'El archivo está vacío'
      });
      return { errors, validAccounts };
    }

    // Verificar columnas requeridas
    const headers = jsonData[0] as string[];
    const requiredColumns = ['Código', 'Nombre', 'Naturaleza', 'Estado Financiero', 'Clasificación', 'Cruce', 'Centro de Costo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      missingColumns.forEach(col => {
        errors.push({
          fila: 1,
          columna: 'Encabezados',
          campo: col,
          error: `La columna ${col} es obligatoria`
        });
      });
      return { errors, validAccounts };
    }

    // Crear mapeo de índices de columnas
    const columnIndexes: { [key: string]: number } = {};
    requiredColumns.forEach(col => {
      columnIndexes[col] = headers.indexOf(col);
    });

    // PRIMERA PASADA: Recopilar todas las cuentas del archivo para validación de jerarquía
    const dataRows = jsonData.slice(1);
    const allAccountsInFile: ExcelRow[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2;
      const row = dataRows[i];
      
      if (this.isEmptyRow(row)) continue;

      const rowData: ExcelRow = {
        'Código': this.getCellValue(row, columnIndexes['Código']),
        'Nombre': this.getCellValue(row, columnIndexes['Nombre']),
        'Naturaleza': this.getCellValue(row, columnIndexes['Naturaleza']),
        'Estado Financiero': this.getCellValue(row, columnIndexes['Estado Financiero']),
        'Clasificación': this.getCellValue(row, columnIndexes['Clasificación']),
        'Cruce': this.getCellValue(row, columnIndexes['Cruce']),
        'Centro de Costo': this.getCellValue(row, columnIndexes['Centro de Costo']),
        '_rowIndex': rowIndex
      };

      if (rowData['Código']) {
        allAccountsInFile.push(rowData);
      }
    }

    // SEGUNDA PASADA: Validaciones completas con todas las cuentas disponibles
    const codesInFile = new Set<string>();
    const namesInFile = new Set<string>();
    const accountsInFile: ExcelRow[] = [];

    for (const rowData of allAccountsInFile) {
      const rowIndex = rowData['_rowIndex'];
      
      // Campos vacíos
      const emptyFields = this.validateRequiredFields(rowData, rowIndex, errors);
      if (emptyFields) continue;

      // Código debe ser solo números
      if (!this.validateCodeFormat(rowData['Código'], rowIndex, errors)) continue;

      // Nombre no puede contener números y mínimo 2 caracteres
      if (!this.validateNameFormat(rowData['Nombre'], rowIndex, errors)) continue;

      // Duplicados en el mismo archivo
      if (!this.validateDuplicatesInFile(rowData, rowIndex, codesInFile, namesInFile, errors)) continue;

      // Validar jerarquía de padres (ahora con todas las cuentas disponibles)
      if (!(await this.validateParentHierarchy(rowData['Código'], allAccountsInFile, rowIndex, errors))) continue;

      // procesar campos Cruce y Centro de Costo
      this.processBooleanFields(rowData);

      // Remover el índice auxiliar
      delete rowData['_rowIndex'];
      
      accountsInFile.push(rowData);
      codesInFile.add(rowData['Código']);
      namesInFile.add(rowData['Nombre'].toLowerCase());
    }

    // Si hay errores, no procesar más validaciones
    if (errors.length > 0) {
      return { errors, validAccounts };
    }

    await this.validateAgainstDatabase(accountsInFile, errors);

    if (errors.length === 0) {
      validAccounts.push(...accountsInFile);
      
      // Verificar si después de todas las validaciones hay cuentas para importar
      if (validAccounts.length === 0) {
        // Todas las cuentas ya existen, mostrar mensaje informativo
        this.messageService.add({
          severity: 'info',
          summary: 'Información',
          detail: 'Todas las cuentas del archivo ya existen en el sistema. No hay cuentas nuevas para importar.'
        });
      }
    }

    return { errors, validAccounts };
  }

  private getCellValue(row: any[], index: number): string {
    return row[index] ? String(row[index]).trim() : '';
  }

  private isEmptyRow(row: any[]): boolean {
    return !row || row.every(cell => !cell || String(cell).trim() === '');
  }

  private validateRequiredFields(rowData: ExcelRow, rowIndex: number, errors: ImportError[]): boolean {
      const requiredFields = ['Código', 'Nombre', 'Naturaleza', 'Estado Financiero', 'Clasificación'];
    let hasErrors = false;

    requiredFields.forEach(field => {
      if (!rowData[field] || rowData[field].trim() === '') {
        errors.push({
          fila: rowIndex,
          columna: this.getColumnLetter(field),
          campo: field,
          error: `El campo ${field} es obligatorio`
        });
        hasErrors = true;
      }
    });

    return hasErrors;
  }

  private validateCodeFormat(code: string, rowIndex: number, errors: ImportError[]): boolean {
    if (!/^\d+$/.test(code)) {
      errors.push({
        fila: rowIndex,
        columna: 'A',
        campo: 'Código',
        error: 'El código debe contener solo números positivos y sin espacios entre si'
      });
      return false;
    }
    
    // Validar longitud máxima de 8 dígitos
    if (code.length > 8) {
      errors.push({
        fila: rowIndex,
        columna: 'A',
        campo: 'Código',
        error: 'El código no puede tener más de 8 dígitos'
      });
      return false;
    }
    
    // Validar longitudes permitidas (1, 2, 4, 6, 8)
    const validLengths = [1, 2, 4, 6, 8];
    if (!validLengths.includes(code.length)) {
      errors.push({
        fila: rowIndex,
        columna: 'A',
        campo: 'Código',
        error: 'El código debe tener exactamente 1, 2, 4, 6 u 8 dígitos'
      });
      return false;
    }
    
    return true;
  }

  private validateNameFormat(name: string, rowIndex: number, errors: ImportError[]): boolean {
    // Validar que tenga al menos 2 caracteres
    if (name.trim().length < 2) {
      errors.push({
        fila: rowIndex,
        columna: 'B',
        campo: 'Nombre',
        error: 'El nombre debe tener al menos 2 caracteres'
      });
      return false;
    }

    // Validar que no contenga números
    if (/\d/.test(name)) {
      errors.push({
        fila: rowIndex,
        columna: 'B',
        campo: 'Nombre',
        error: 'El nombre no puede contener números'
      });
      return false;
    }
    
    return true;
  }

  private validateDuplicatesInFile(rowData: ExcelRow, rowIndex: number, codesInFile: Set<string>, namesInFile: Set<string>, errors: ImportError[]): boolean {
    const code = rowData['Código'];
    const name = rowData['Nombre'].toLowerCase();
    
    if (codesInFile.has(code)) {
      errors.push({
        fila: rowIndex,
        columna: 'A',
        campo: 'Código',
        error: 'Código duplicado en el archivo'
      });
      return false;
    }
    
    if (namesInFile.has(name)) {
      errors.push({
        fila: rowIndex,
        columna: 'B',
        campo: 'Nombre',
        error: 'Nombre duplicado en el archivo'
      });
      return false;
    }
    
    return true;
  }

  private async validateParentHierarchy(code: string, accountsInFile: ExcelRow[], rowIndex: number, errors: ImportError[]): Promise<boolean> {
    if (code.length <= 1) return true; // Cuentas de nivel 1 no necesitan padre

    let parentCode: string;
    
    // Determinar código del padre según la longitud
    switch (code.length) {
      case 2: // Nivel 2: padre tiene 1 dígito
        parentCode = code.substring(0, 1);
        break;
      case 4: // Nivel 3: padre tiene 2 dígitos
        parentCode = code.substring(0, 2);
        break;
      case 6: // Nivel 4: padre tiene 4 dígitos
        parentCode = code.substring(0, 4);
        break;
      case 8: // Nivel 5: padre tiene 6 dígitos
        parentCode = code.substring(0, 6);
        break;
      default:
        errors.push({
          fila: rowIndex,
          columna: 'A',
          campo: 'Código',
          error: 'El código debe tener 1, 2, 4, 6 u 8 dígitos'
        });
        return false;
    }
    
    // PRIMERO: Verificar si el padre existe en la base de datos
    // Buscar en la lista cargada (más eficiente)
    const parentInCurrentList = this.listAccountsAux.find(account => account.code === parentCode && account.status === true);
    
    if (parentInCurrentList) {
      return true; // Padre encontrado en la lista actual y está activo
    }
    
    // Si no está en la lista actual, hacer búsqueda en BD
    try {
      const idEnterprise = this.getIdEnterprise();
      const existingParent = await firstValueFrom(
        this._accountService.getAccountByCode(parentCode, idEnterprise)
      );
      
      if (existingParent && existingParent.status === true) {
        return true; // Padre encontrado en BD y está activo
      }
    } catch (error) {
      // Padre no existe en BD, continuar con verificación en archivo
    }
    
    // SEGUNDO: Si no existe en BD, verificar si está en el archivo Excel para crearlo
    const parentExistsInFile = accountsInFile.some(account => account['Código'] === parentCode);
    
    if (parentExistsInFile) {
      return true; // Padre será creado desde el archivo
    }
    
    // Si no existe ni en BD ni en el archivo, es un error
    errors.push({
      fila: rowIndex,
      columna: 'A',
      campo: 'Código',
      error: `La cuenta padre (${parentCode}) no existe en la base de datos ni en el archivo`
    });
    return false;
  }

  private processBooleanFields(rowData: ExcelRow): void {
    // Procesar campo Cruce
    const cruce = rowData['Cruce'].toUpperCase();
    if (cruce === 'SI') {
      rowData['Cruce'] = 'true';
    } else if (cruce === 'NO') {
      rowData['Cruce'] = 'false';
        } else {
      rowData['Cruce'] = 'null';
    }

    // Procesar campo Centro de Costo
    const centroCosto = rowData['Centro de Costo'].toUpperCase();
    if (centroCosto === 'SI') {
      rowData['Centro de Costo'] = 'true';
    } else if (centroCosto === 'NO') {
      rowData['Centro de Costo'] = 'false';
    } else {
      rowData['Centro de Costo'] = 'null';
    }
  }

  private async validateAgainstDatabase(accountsInFile: ExcelRow[], errors: ImportError[]): Promise<void> {
    const idEnterprise = this.getIdEnterprise();
    const accountsToRemove: number[] = [];
    
    for (let i = 0; i < accountsInFile.length; i++) {
      const account = accountsInFile[i];
      const rowIndex = account['_rowIndex'] || (i + 2);
      
      try {
        // Verificar si ya existe una cuenta con el mismo código
        const existingAccountByCode = await firstValueFrom(
          this._accountService.getAccountByCode(account['Código'], idEnterprise)
        );
        
        if (existingAccountByCode) {
          if (existingAccountByCode.status === true) {
            // Cuenta activa existente
            if (existingAccountByCode.description.trim().toLowerCase() === account['Nombre'].trim().toLowerCase()) {
              // Si es exactamente igual, omitir (no importar duplicados)
              accountsToRemove.push(i);
              continue;
            } else {
              // Código existe con diferente nombre - ERROR
              errors.push({
                fila: rowIndex,
                columna: 'A',
                campo: 'Código',
                error: `El código ${account['Código']} ya existe con un nombre diferente: "${existingAccountByCode.description}"`
              });
              continue;
            }
          } else {
            // Cuenta inactiva - se puede reactivar importando
            // No hacer nada, permitir la importación
          }
        }

        // Verificar si ya existe una cuenta con la misma descripción pero diferente código
        try {
          // Buscar por descripción (simulamos la búsqueda)
          const allAccounts = await firstValueFrom(this._accountService.getListAccounts(idEnterprise));
          const existingAccountByDescription = allAccounts.find(acc => 
            acc.description.trim().toLowerCase() === account['Nombre'].trim().toLowerCase() && 
            acc.status === true &&
            acc.code !== account['Código']
          );

          if (existingAccountByDescription) {
            errors.push({
              fila: rowIndex,
              columna: 'B',
              campo: 'Nombre',
              error: `El nombre "${account['Nombre']}" ya existe con un código diferente: ${existingAccountByDescription.code}`
            });
            continue;
          }
        } catch (descriptionError) {
          // Error al buscar por descripción, continuar
        }

        // Validar naturaleza (debe ser "Débito" o "Crédito" con tilde)
        const validNatures = ['Débito', 'Crédito'];
        if (!validNatures.includes(account['Naturaleza'])) {
          // Intentar corregir automáticamente
          const correctedNature = this.correctNatureValue(account['Naturaleza']);
          if (correctedNature) {
            account['Naturaleza'] = correctedNature;
        } else {
            errors.push({
              fila: rowIndex,
              columna: 'C',
              campo: 'Naturaleza',
              error: `La naturaleza debe ser "Débito" o "Crédito". Valor actual: "${account['Naturaleza']}"`
            });
            continue;
          }
        }

      } catch (error) {
        // Si hay error 404, la cuenta no existe - está bien para importar
        if (error && (error as any).status === 404) {
          // Cuenta no existe, se puede importar
          continue;
        }
        
        // Para otros errores, reportar
        console.error('Error validando cuenta:', error);
        errors.push({
          fila: rowIndex,
          columna: 'A',
          campo: 'Código',
          error: 'Error al validar la cuenta en el sistema'
        });
      }
    }

    // Remover cuentas duplicadas (en orden inverso para no afectar índices)
    for (let i = accountsToRemove.length - 1; i >= 0; i--) {
      accountsInFile.splice(accountsToRemove[i], 1);
    }
  }

  /**
   * Corrige valores de naturaleza sin tildes
   */
  private correctNatureValue(nature: string): string | null {
    const normalized = nature.toLowerCase().trim();
    switch (normalized) {
      case 'debito':
        return 'Débito';
      case 'credito':
        return 'Crédito';
      default:
        return null;
    }
  }

  /**
   * Crea una jerarquía simple para importación sin crear padres vacíos
   */
  private createSimpleHierarchyForImport(accounts: Account[]): Account[] {
    // Ordenar cuentas por código para procesar padres antes que hijos
    const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));
    
    // Crear mapa de cuentas por código
    const accountMap = new Map<string, Account>();
    const rootAccounts: Account[] = [];
    
    for (const account of sortedAccounts) {
      const accountWithHierarchy: Account = {
        ...account,
        children: [],
        parent: null,
        showSubAccounts: false
      };
      
      accountMap.set(account.code, accountWithHierarchy);
      
      // Determinar código del padre
      const parentCode = this.getParentCodeForImport(account.code);
      
      if (parentCode && accountMap.has(parentCode)) {
        // Padre existe en las cuentas a importar
        const parent = accountMap.get(parentCode)!;
        parent.children = parent.children || [];
        parent.children.push(accountWithHierarchy);
        accountWithHierarchy.parent = parentCode;
      } else {
        // No hay padre en las cuentas a importar, es cuenta raíz
        rootAccounts.push(accountWithHierarchy);
      }
    }
    
    return rootAccounts;
  }

  /**
   * Obtiene el código del padre para importación
   */
  private getParentCodeForImport(code: string): string | null {
    switch (code.length) {
      case 1: return null; // Clase, no tiene padre
      case 2: return code.substring(0, 1); // Grupo -> Clase
      case 4: return code.substring(0, 2); // Cuenta -> Grupo
      case 6: return code.substring(0, 4); // Subcuenta -> Cuenta
      case 8: return code.substring(0, 6); // Auxiliar -> Subcuenta
      default: return null;
    }
  }

  private getColumnLetter(fieldName: string): string {
    const columnMap: { [key: string]: string } = {
      'Código': 'A',
      'Nombre': 'B',
      'Naturaleza': 'C',
      'Estado Financiero': 'D',
      'Clasificación': 'E',
      'Cruce': 'F',
      'Centro de Costo': 'G'
    };
    return columnMap[fieldName] || '';
  }

  private showImportErrors(errors: ImportError[]): void {
    this.importErrors = errors;
    this.totalErrors = errors.length;
    this.showErrorModal = true;
  }

    private processValidAccounts(validAccounts: ExcelRow[]): void {
    if (validAccounts.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'No hay cuentas nuevas para importar'
      });
        return;
      }

      const idEnterprise = this.getIdEnterprise();

    // Convertir a formato Account con estado activo
    this.listExcel = validAccounts.map((item: ExcelRow) => ({
        idEnterprise: idEnterprise,
      code: item['Código'],
        description: item['Nombre'],
        nature: item['Naturaleza'],
        financialStatus: item['Estado Financiero'],
      classification: item['Clasificación'],
      crossing: item['Cruce'] === 'true' ? true : item['Cruce'] === 'false' ? false : null,
      costCenter: item['Centro de Costo'] === 'true' ? true : item['Centro de Costo'] === 'false' ? false : null,
      status: true //Estado activo por defecto
      }));

    if (this.listExcel.length > 0) {
        this.importedAccounts = true;
      this.listAccountsAux = [...this.listAccounts]; // Hacer copia para restaurar después

      // Mostrar solo las cuentas a importar sin crear padres vacíos
      this.listAccounts = this.createSimpleHierarchyForImport(this.listExcel);
      this.listAccounts = this.sortAccountsRecursively(this.listAccounts);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se prepararon ${this.listExcel.length} cuenta(s) para importar`
      });
    }
  }



  closeErrorModal(): void {
    this.showErrorModal = false;
    this.importErrors = [];
    this.totalErrors = 0;
  }

  exportErrors(): void {
    // Crear datos para exportar errores
    const errorData = this.importErrors.map(error => ({
      'Fila': error.fila,
      'Columna': error.columna,
      'Campo': error.campo,
      'Error': error.error
    }));

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errores');

    // Descargar archivo
    XLSX.writeFile(wb, 'errores_importacion.xlsx');
  }

  /**
   * Guarda las cuentas importadas en la base de datos
   */
  saveImportAccounts() {
    this.importedAccounts = false;
    
    // Filtrar solo las cuentas realmente nuevas (sin ID) para evitar conflictos
    const newAccountsOnly = this.listExcel.filter(account => !account.id);
    
    if (newAccountsOnly.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'No hay cuentas nuevas para guardar.'
      });
      return;
    }
    
    // Crear jerarquía simple solo con cuentas nuevas para guardar
    const accountsToSave = this.createSimpleListForSave(newAccountsOnly);
    
    this.saveAccountsList(accountsToSave).subscribe((result) => {
      if (result) {
        this.messageService.add({
          severity: 'success',
          summary: '¡Éxito!',
          detail: `Se guardaron ${newAccountsOnly.length} cuenta(s) correctamente.`
        });
        
        // Recargar las cuentas desde la base de datos para mostrar todas las cuentas actualizadas
        this.getAccounts().then(() => {
          // Limpiar variables de importación
          this.listExcel = [];
          this.importedAccounts = false;
        }).catch(error => {
          console.error('Error al recargar las cuentas:', error);
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: '¡Error!',
          detail: 'Ha ocurrido un error al guardar las cuentas.'
        });
      }
    });
  }

  /**
   * Crea una lista simple de cuentas para guardar sin jerarquía compleja
   */
  private createSimpleListForSave(accounts: Account[]): Account[] {
    return accounts.map(account => ({
      ...account,
      children: [], // Sin hijos para evitar guardado recursivo
      parent: null  // Se asignará automáticamente en saveAccountRecursively
    }));
  }

  /**
   * Guarda una lista de cuentas de forma secuencial, creando padres automáticamente
   */
  saveAccountsList(accounts: Account[]): Observable<boolean> {
    return new Observable(observer => {
      const processAllAccounts = async () => {
        try {
          // Crear un mapa para rastrear cuentas guardadas y sus IDs
          const savedAccountsMap = new Map<string, number>();
          
          // Cargar todas las cuentas existentes en el sistema para tener referencia
          await this.loadExistingAccountsToMap(savedAccountsMap);
          
          // Ordenar cuentas por longitud de código (padres primero)
          const sortedAccounts = [...accounts].sort((a, b) => a.code.length - b.code.length);
          
          // Procesar cada cuenta secuencialmente
          for (const account of sortedAccounts) {
            await this.saveAccountWithHierarchy(account, savedAccountsMap);
          }
          
          observer.next(true);
          observer.complete();
        } catch (error) {
          console.error('Error al guardar cuentas:', error);
          observer.error(false);
        }
      };

      processAllAccounts();
    });
  }

  /**
   * Carga las cuentas existentes en el mapa para referencia
   */
  private async loadExistingAccountsToMap(savedAccountsMap: Map<string, number>): Promise<void> {
    try {
      // Cargar todas las cuentas existentes activas
      const existingAccounts = await firstValueFrom(this._accountService.getListAccounts(this.getIdEnterprise()));
      existingAccounts.forEach(account => {
        if (account.status && account.id) {
          savedAccountsMap.set(account.code, account.id);
        }
      });
      console.log(`Cargadas ${savedAccountsMap.size} cuentas existentes para referencia`);
    } catch (error) {
      console.warn('Error cargando cuentas existentes:', error);
    }
  }

  /**
   * Guarda una cuenta asegurando que su jerarquía de padres exista
   */
  private async saveAccountWithHierarchy(account: Account, savedAccountsMap: Map<string, number>): Promise<Account> {
    try {
      let parentId: number | null = null;
      
      // Si la cuenta tiene más de 1 dígito, necesita un padre
      if (account.code.length > 1) {
        const parentCode = this.getParentCodeForImport(account.code);
        if (parentCode) {
          // Verificar si el padre ya existe
          if (savedAccountsMap.has(parentCode)) {
            parentId = savedAccountsMap.get(parentCode)!;
            console.log(`Padre ${parentCode} encontrado con ID: ${parentId}`);
          } else {
            // El padre no existe, necesitamos crearlo automáticamente
            console.log(`Creando padre automático: ${parentCode}`);
            const parentAccount = await this.createAutomaticParent(parentCode, savedAccountsMap);
            parentId = parentAccount.id!;
          }
        }
      }

      // Asignar el parent ID y guardar la cuenta
      account.parent = parentId;
      console.log(`Guardando cuenta ${account.code} con parent_id: ${parentId}`);
      
      const savedAccount = await firstValueFrom(this._accountService.createAccount(account));
      
      // Registrar la cuenta guardada
      if (savedAccount.id) {
        savedAccountsMap.set(account.code, savedAccount.id);
        console.log(`Cuenta ${account.code} guardada con ID: ${savedAccount.id}`);
      }

      return savedAccount;
    } catch (error) {
      console.error(`Error guardando cuenta ${account.code}:`, error);
      throw error;
    }
  }

  /**
   * Crea un padre automático para mantener la jerarquía
   */
  private async createAutomaticParent(parentCode: string, savedAccountsMap: Map<string, number>): Promise<Account> {
    try {
      // Crear cuenta padre automática con valores por defecto
      const parentAccount: Account = {
        code: parentCode,
        description: `Cuenta ${parentCode} (Creada automáticamente)`,
        nature: 'Débito', // Valor por defecto
        financialStatus: 'Balance General', // Valor por defecto
        classification: 'Activo', // Valor por defecto
        crossing: null,
        costCenter: null,
        status: true,
        parent: null, // Se asignará recursivamente si es necesario
        children: []
      };

      // Si el padre también necesita un padre, crearlo recursivamente
      if (parentCode.length > 1) {
        const grandParentCode = this.getParentCodeForImport(parentCode);
        if (grandParentCode && !savedAccountsMap.has(grandParentCode)) {
          const grandParent = await this.createAutomaticParent(grandParentCode, savedAccountsMap);
          parentAccount.parent = grandParent.id!;
        } else if (grandParentCode && savedAccountsMap.has(grandParentCode)) {
          parentAccount.parent = savedAccountsMap.get(grandParentCode)!;
        }
      }

      console.log(`Creando cuenta padre automática: ${parentCode} con parent_id: ${parentAccount.parent}`);
      const savedParent = await firstValueFrom(this._accountService.createAccount(parentAccount));
      
      // Registrar el padre creado
      if (savedParent.id) {
        savedAccountsMap.set(parentCode, savedParent.id);
        console.log(`Padre automático ${parentCode} creado con ID: ${savedParent.id}`);
      }

      return savedParent;
    } catch (error) {
      console.error(`Error creando padre automático ${parentCode}:`, error);
      throw error;
    }
  }

  /**
   * Cancela la importación y restaura la lista original
   */
  cancelImportAccounts() {
    this.importedAccounts = false;
    this.listAccounts = [...this.listAccountsAux]; // Restaurar lista original
    this.listExcel = [];
    this.listAccounts = this.sortAccountsRecursively(this.listAccounts);
  }

  /**
  * Guarda la jerarquía de cuentas de forma recursiva.
  * Para cada cuenta, llama a la función de guardado de forma recursiva y espera a que todas las operaciones
  * de guardado se completen. Al finalizar, devuelve un observable que emite `true`.
  *
  * @param accounts - Lista de cuentas que se guardarán recursivamente.
  * @returns Un observable que emite `true` cuando todas las cuentas hayan sido guardadas correctamente.
  */
  saveAccountHierarchy(accounts: Account[]): Observable<boolean> {
    const saveObservables = accounts.map(account => this.saveAccountRecursively(account));

    // Retornar el observable de forkJoin
    return forkJoin(saveObservables).pipe(
      // Aquí, cuando todas las operaciones terminen, devolvemos `true`
      map(() => true)
    );
  }

  /**
  * Guarda una cuenta de forma recursiva, asignando un ID de padre y luego guardando la cuenta.
  * Si la cuenta tiene hijos, se guarda cada uno de ellos recursivamente, esperando a que todos los hijos
  * se guarden antes de devolver la cuenta guardada.
  *
  * @param account - La cuenta que se va a guardar.
  * @param parentId - El ID del padre de la cuenta (por defecto es 0 para la raíz).
  * @returns Un observable que emite la cuenta guardada.
  */
  saveAccountRecursively(account: Account, parentId: number | null = null): Observable<Account> {
    return new Observable(observer => {
      // Función async dentro del Observable
      const processAccount = async () => {
        try {
          // Buscar el ID del padre si no se ha proporcionado y la cuenta tiene un código con más de 1 dígito
          if (!parentId && account.code.length > 1) {
            const parentCode = this.getParentCodeForImport(account.code);
            if (parentCode) {
              // Buscar el padre en la lista actual primero (más eficiente)
              const parentInCurrentList = this.listAccountsAux.find(acc => 
                acc.code === parentCode && acc.status === true
              );
              
              if (parentInCurrentList && parentInCurrentList.id) {
                parentId = parentInCurrentList.id;
              } else {
                // Si no está en la lista actual, buscar en BD
                try {
                  const parentAccount = await firstValueFrom(
                    this._accountService.getAccountByCode(parentCode, this.getIdEnterprise())
                  );
                  if (parentAccount && parentAccount.id && parentAccount.status === true) {
                    parentId = parentAccount.id;
                  }
                } catch (error) {
                  console.warn(`Padre ${parentCode} no encontrado para cuenta ${account.code}:`, error);
                  parentId = null;
                }
              }
            }
          }

          // Asignar el parent ID
          account.parent = parentId;

          console.log(`Guardando cuenta ${account.code} con parent_id: ${parentId}`);

          // Crear la cuenta
          const savedAccount = await firstValueFrom(this._accountService.createAccount(account));
          const accountId = savedAccount.id;

          // Procesar hijos si existen
          if (account.children && account.children.length > 0) {
            const childPromises = account.children.map(child =>
              firstValueFrom(this.saveAccountRecursively(child, accountId))
            );
            await Promise.all(childPromises);
          }

          observer.next(savedAccount);
          observer.complete();
        } catch (error) {
          console.error(`Error guardando cuenta ${account.code}:`, error);
          observer.error(error);
        }
      };

      processAccount();
    });
  }

  /**
   * Crea una jerarquía de cuentas con relaciones padre-hijo a partir de un arreglo de cuentas.
   * Asigna a cada cuenta su código de padre correspondiente dependiendo del nivel de la cuenta.
   * La función también organiza las cuentas de nivel superior (Clase) y sus hijos en la jerarquía.
   *
   * @param accounts - El arreglo de cuentas que se utilizará para crear la jerarquía.
   * @returns Un arreglo de cuentas de nivel superior (Clase) con sus respectivas relaciones padre-hijo.
   */
  createHierarchyWithParent(accounts: Account[]): Account[] {
    const hierarchy: Record<string, Account> = {};

    // Función para obtener el código del padre dependiendo del nivel
    const getParentCode = (code: string): string => {
      if (code.length > 6) return code.slice(0, 6);  // Subcuenta -> Cuenta
      if (code.length > 4) return code.slice(0, 4);  // Cuenta -> Grupo
      if (code.length > 2) return code.slice(0, 2);  // Grupo -> Clase
      if (code.length > 1) return code.slice(0, 1);  // Clase no tiene más padres
      return "";  // No hay padre para la Clase
    };

    // Agrupar cuentas por código
    for (const account of accounts) {
      const code = account.code;

      if (!hierarchy[code]) {
        hierarchy[code] = {
          ...account,
          children: [],
          idEnterprise: this.getIdEnterprise(),  // Asignar idEnterprise a la cuenta actual
          parent: null  // Inicialmente, el parent es null
        };
      } else {
        hierarchy[code].description = account.description;
      }

      // Crear la jerarquía de padres hasta el nivel Clase
      let currentCode = code;
      let parentCode = getParentCode(currentCode);

      while (parentCode) {
        if (!hierarchy[parentCode]) {
          hierarchy[parentCode] = {
            code: parentCode,
            description: '',
            nature: '',
            financialStatus: '',
            classification: '',
            children: [],
            idEnterprise: this.getIdEnterprise(),  // Asignar idEnterprise al padre
            parent: getParentCode(parentCode) || null  // Obtener el padre del padre o null si no hay
          };
        }
        if (!hierarchy[currentCode].parent) {
          hierarchy[currentCode].parent = parentCode;  // Asignar parent_id a la cuenta actual si aún no se ha asignado
        }
        if (!hierarchy[parentCode].children?.includes(hierarchy[currentCode])) {
          hierarchy[parentCode].children?.push(hierarchy[currentCode]);  // Agregar solo si no está ya en la lista
        }

        // Pasar al siguiente nivel (más arriba en la jerarquía)
        currentCode = parentCode;
        parentCode = getParentCode(currentCode);
      }
    }

    // Obtener cuentas de nivel superior (clases)
    const topLevelAccounts: Account[] = [];
    for (const account of Object.values(hierarchy)) {
      if (account.code.length === 1) {  // Las cuentas de nivel más alto tienen un solo dígito (Clase)
        topLevelAccounts.push(account);
      }
    }

    return topLevelAccounts;
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
      class: !(code == 1),
      group: !(code == 2),
      account: !(code == 4),
      subAccount: !(code == 6),
      auxiliary: !(code == 8)
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
    const crossingValue = selectedAccount.crossing === true ? true : false;
    const costCenterValue = selectedAccount.costCenter === true ? true : false;
    
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
      .replace(/[\u0300-\u036f]/g, ""); // 3. Eliminar los diacríticos (acentos)
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

  //CRUD Metodos
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
   * No valida duplicados porque es una cuenta nueva que se está creando.
   * El backend se encargará de manejar cualquier error de duplicados.
   * Si la cuenta es una subcuenta y la cuenta seleccionada tiene más de dos cuentas auxiliares, muestra un error.
   * @param account La cuenta que contiene la información a guardar.
   */
  async saveNewAccountType(account: Account) {
    try {
      // Validación específica para subcuentas con límite de auxiliares
      if (this.name === 'subAccountName' && this.accountSelected && this.accountSelected.children && this.accountSelected.children.length >= 2) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Solo se permiten dos cuentas auxiliares para esta subcuenta!'
        });
        this.selectAccount(this.accountSelected);
        this.noShowFormAddNewClass();
        this.noAddNewChild();
      } else {
        // Crear la cuenta directamente - el backend manejará duplicados si los hay
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
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Ha ocurrido un error al crear la cuenta!.'
            });
          }
        );
      }
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
    if (this.accountSelected && this.accountSelected.id) {
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
                    if (this.accountSelected && this.accountSelected.parent) {
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
   * Valida que el código de la cuenta no esté asociado a subcuentas antes de proceder con la actualización.
   * Si la cuenta ya existe o si los datos no han cambiado, muestra un mensaje de error.
   * Si la cuenta no existe y los datos han cambiado, actualiza la cuenta llamando al servicio correspondiente.
   */
  async updateAccount() {
    // Prevenir múltiples actualizaciones simultáneas
    if (this.isUpdating) {
      return;
    }
    this.isUpdating = true;

    try {
      if (this.accountSelected) {
        if (this.accountSelected.children && this.accountSelected.children.length > 0 && this.accountSelected.code !== this.parentId + this.accountForm.get(this.code)?.value) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se puede cambiar el código de una cuenta que tiene subcuentas asociadas.'
          });
          this.selectAccount(this.accountSelected);
          return; // Salir de la función
        }

        const transactionalValues = this.formTransactional.value;

        // Construir el código correctamente según el nivel de cuenta
        let newCode = '';
        const codeValue = this.accountForm.get(this.code)?.value || '';
        
        // Asegurar que el código mantenga la longitud correcta según el nivel
        if (this.num === 1) {
          // Clase: 1 dígito
          newCode = codeValue.padStart(1, '0');
        } else if (this.num === 2) {
          // Grupo: 2 dígitos  
          newCode = this.parentId + codeValue.padStart(1, '0');
        } else if (this.num === 4) {
          // Cuenta: 4 dígitos
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else if (this.num === 6) {
          // Subcuenta: 6 dígitos
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else if (this.num === 8) {
          // Auxiliar: 8 dígitos
          newCode = this.parentId + codeValue.padStart(2, '0');
        } else {
          // Fallback: usar la construcción original
          newCode = this.parentId + codeValue;
        }

        const account: Account = {
          code: newCode,
          description: this.accountForm.get(this.name)?.value,

          // Extraemos el .name del objeto, o enviamos null si no hay nada seleccionado
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
          // Proceder con la actualización - el backend manejará duplicados si los hay
          this.update(this.accountSelected?.id, account);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'La cuenta tiene la misma información!'
          });
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ha ocurrido un error al actualizar la cuenta!.'
        });
        console.error('Error al actualizar la cuenta:', error);
      }
    );
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
 * Obtiene los impuestos a través del servicio `taxService` y procesa los resultados.
 * Mapea las cuentas de depósito y de reembolso de cada impuesto, y luego asigna estas cuentas a las propiedades `listDepositAccount` y `listRefundAccount`.
 * Si ocurre un error al obtener los impuestos, se muestra un mensaje de error en la consola.
 */
  getTaxesByCodes(): void {
    //Descomentar cuando este implementado
    /*this.taxService.getTaxes(this.entData).pipe(
      map((taxes: Tax[]) => {
        const depositAccounts = taxes.map(tax => tax.depositAccount);
        const refundAccounts = taxes.map(tax => tax.refundAccount);
        return { depositAccounts, refundAccounts };
      })
    ).subscribe(
      (data) => {

        const { depositAccounts, refundAccounts } = data;
        this.listDepositAccount = depositAccounts;
        this.listRefundAccount = refundAccounts;
      },
      (error) => {
        console.error('Error al obtener los impuestos:', error);
      }
    );*/
  }

  /**
 * Verifica si una cuenta está asociada a algún impuesto, buscando si su código se encuentra en las listas de cuentas de reembolso o de depósito.
 * @param accountCode El código de la cuenta a verificar.
 * @returns `true` si el código de la cuenta está presente en alguna de las listas, `false` en caso contrario.
 */
  searchIfAccountIsLinked(accountCode: string) {
    return this.listRefundAccount.some(account => account === accountCode) || this.listDepositAccount.some(account => account === accountCode)
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
    if (currentValue.length >= maxLength && !allowedKeys.includes(event.key)) {
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
    value = value.replace(/[^0-9]/g, '');
    
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
   * Bloquea caracteres que no sean letras, espacios y caracteres especiales permitidos.
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

    // Solo permitir letras, espacios y caracteres especiales permitidos
    const allowedPattern = /^[a-zA-ZÀ-ÿ\u00f1\u00d1,.()\/\-+&%]$/;
    if (!allowedPattern.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Cambia el estado de una cuenta y actualiza recursivamente el estado de sus hijos.
   * @param account La cuenta cuyo estado se va a cambiar.
   */
  changeAccountState(account: Account) {
    // Prevenir múltiples cambios de estado simultáneos
    if (this.isChangingState) {
      return;
    }
    this.isChangingState = true;

    if (!account?.id || account.status == null) {
      // Revertir el estado en la UI si la validación falla
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
        // Actualizar recursivamente el estado de todos los hijos en la UI
        this.updateChildrenStatusRecursively(account, newStatus);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de la cuenta "${account.description}" cambiado correctamente`
        });
        this.isChangingState = false;
      },
      error: () => {
        // Revertir el estado en la UI del padre y todos los hijos si la llamada al servicio falla
        account.status = !newStatus;
        this.updateChildrenStatusRecursively(account, !newStatus);
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


}
