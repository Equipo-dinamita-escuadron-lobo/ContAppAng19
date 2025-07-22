import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Account } from '../../models/ChartAccount';
import { FinancialStateType } from '../../models/FinancialStateType';
import { NatureType } from '../../models/NatureType';
import { ClasificationType } from '../../models/ClasificationType';
import { ChartAccountService } from '../../services/chart-account.service';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { AccountFormComponent } from '../account-form/account-form.component';
import { FilterPipe } from '../../pipes/filter.pipe';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';


@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    AccountFormComponent, FilterPipe,
    ButtonModule, FileUploadModule, DropdownModule, DialogModule
  ],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.css'
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
  * Variables determinadas según el nivel de la cuenta.
  * Estas variables gestionan el tipo de cuenta y si se deben agregar subcuentas o hijos.
  */
  currentLevelAccount: 'grupo' | 'cuenta' | 'subcuenta' | 'auxiliar' | 'clase' = 'clase';
  addChild: boolean = false;

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
    //private dialog: MatDialog,  //Descomentar linea cuando se tenga implementado esto
    //private taxService: TaxService  //Descomentar linea cuando se tenga implementado esto
  ) {

    this.accountForm = this.fb.group({})
    this.formTransactional = this.fb.group({
      selectedNatureType: [''],
      selectedFinancialStateType: [''],
      selectedClasificationType: ['']
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
    //console.log(this.listDepositAccount);
    //console.log(this.listRefundAccount);

    //DESCOMENTAR CUANDO SE IMPLEMENTE
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getTaxesByCodes();
    this.getNatureType();
    this.getFinancialStateType();
    this.getClasificationType();

    this.accountForm.valueChanges.subscribe(value => {
      console.log(value); // Log the values of the form whenever it changes
    });
  }

  onFileSelect(event: any) {
    // El evento de PrimeNG es un poco diferente. El archivo está en event.files[0]
    // Creamos un objeto de evento simulado para que tu método ReadExcel funcione sin cambios.
    const simulatedEvent = {
      target: {
        files: event.files
      }
    };
    this.ReadExcel(simulatedEvent);
    // Limpia el selector de archivos para poder seleccionar el mismo archivo de nuevo
    event.originalEvent.target.value = '';
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
      this.currentLevelAccount = 'grupo';
      this.num = 1;
      this.code = 'classCode';
      this.name = 'className';
    }

    if (code.length >= 2) {
      this.accountForm.addControl('groupName', new FormControl({ value: this.groupName, disabled: this.inputAccess.group }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('groupCode', new FormControl({ value: code.slice(0, 1), disabled: this.inputAccess.group }));
      this.accountForm.addControl('codeGroup', new FormControl({ value: code.slice(1, 2), disabled: this.inputAccess.group }, [Validators.maxLength(1), Validators.minLength(1)]));
      this.currentLevelAccount = 'cuenta';
      this.num = 2;
      this.code = 'codeGroup';
      this.name = 'groupName';
      this.parentId = code.slice(0, 1);
    }

    if (code.length >= 4) {
      this.accountForm.addControl('accountName', new FormControl({ value: this.accountName, disabled: this.inputAccess.account }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('accountCode', new FormControl(code.slice(0, 2)));
      this.accountForm.addControl('codeAccount', new FormControl({ value: code.slice(2, 4), disabled: this.inputAccess.account }, [Validators.maxLength(2), Validators.minLength(2)]));
      this.currentLevelAccount = 'subcuenta';
      this.num = 4;
      this.code = 'codeAccount';
      this.name = 'accountName';
      this.parentId = code.slice(0, 2);
    }

    if (code.length >= 6) {
      this.accountForm.addControl('subAccountName', new FormControl({ value: this.subAccountName, disabled: this.inputAccess.subAccount }, [Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,. ]+$')]));
      this.accountForm.addControl('subAccountCode', new FormControl(code.slice(0, 4)));
      this.accountForm.addControl('codeSubAccount', new FormControl({ value: code.slice(4, 6), disabled: this.inputAccess.subAccount }, [Validators.maxLength(2), Validators.minLength(2)]));
      this.currentLevelAccount = 'auxiliar';
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
          Swal.fire({
            title: 'Éxito',
            text: 'Se ha generado el archivo correctamente.',
            confirmButtonColor: '#000066',
            icon: 'success'
          });
        } else {
          // Si no hay cuentas, muestra la notificación de error
          Swal.fire({
            title: 'Error',
            text: 'No se encontraron cuentas para exportar.',
            confirmButtonColor: '#000066',
            icon: 'error',
          });
        }
      },
      error: (err) => {
        // Maneja el caso en que el servicio falle
        console.error('Error al obtener cuentas para exportar:', err);
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudieron obtener las cuentas. Intente de nuevo más tarde.',
          confirmButtonColor: '#000066',
          icon: 'error',
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
   * Recorre las cuentas y, según el primer carácter del código, asigna un tipo de estado financiero.
   * Si la cuenta tiene elementos hijos, se aplica recursivamente la misma lógica a esos hijos.
   *
   * @param accounts - Lista de cuentas a las que se les cambiará el estado financiero.
   * @returns Un arreglo de cuentas con los tipos de estados financieros actualizados.
   */
  changeFinancialStateType(accounts: Account[]): Account[] {
    accounts.forEach(account => {
      var code = account.code[0];
      if (code === "1" || code === "2" || code === "3") {
        account.financialStatus = "Estado de situacion financiero";
      }
      if (code === "4" || code === "5" || code === "6") {
        account.financialStatus = "Estado de resultados";
      }
      if (account.children) { // Verificamos que children no sea undefined
        account.children = this.changeFinancialStateType(account.children);
      }
    });
    return accounts;
  }

  /**
   * Cambia el tipo de naturaleza de las cuentas según el código de la cuenta.
   * Asigna "Débito" o "Crédito" a la propiedad 'nature' de cada cuenta según el primer carácter del código.
   * Además, verifica los primeros 4 caracteres del código para asignar "Crédito" en ciertos casos.
   * Si la cuenta tiene elementos hijos, se aplica recursivamente la misma lógica a esos hijos.
   *
   * @param accounts - Lista de cuentas a las que se les cambiará el tipo de naturaleza.
   * @returns Un arreglo de cuentas con el tipo de naturaleza actualizado.
   */
  changeNatureType(accounts: Account[]): Account[] {
    accounts.forEach(account => {
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
   * Lee un archivo Excel, procesa sus datos y los organiza en una estructura adecuada.
   * Verifica que el archivo sea de tipo xlsx, filtra las columnas necesarias, convierte valores numéricos,
   * y filtra las filas vacías o con solo espacios. Además, valida la existencia de campos requeridos y
   * crea una jerarquía con los datos importados.
   *
   * @param event - El evento de entrada de archivo que contiene el archivo Excel.
   */
  ReadExcel(event: any) {
    let file = event.target.files[0];

    // Check if the file is of type xlsx
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.error('El archivo debe ser de tipo xlsx.');
      return;
    }

    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);

    fileReader.onload = (e) => {
      var workBook = XLSX.read(fileReader.result, { type: 'binary', cellText: true });
      var sheetNames = workBook.SheetNames;

      // Convertimos la hoja a JSON con las columnas originales
      let jsonData: any[][] = XLSX.utils.sheet_to_json(workBook.Sheets[sheetNames[0]], { raw: false, header: 1 });

      // Definir las columnas requeridas
      const requiredFields = ['Código', 'Nombre', 'Naturaleza', 'Estado Financiero', 'Clasificación'];

      // Filtrar solo las columnas deseadas antes de procesar las filas
      let headers = jsonData[0]; // La primera fila contiene los encabezados
      let indicesToKeep = headers.map((header: string, index: number) => requiredFields.includes(header) ? index : -1).filter(index => index !== -1);

      // Filtrar las columnas para todas las filas (incluyendo los encabezados)
      jsonData = jsonData.map(row => indicesToKeep.map(index => row[index]));

      jsonData = jsonData.filter(row => /^\d+$/.test(String(row[0]))) // Filtra las filas donde el primer elemento es un número
        .map(row => row.map(item => /^\d+$/.test(String(item)) ? parseInt(item) : item)); // Convierte elementos numéricos a enteros

      // Agregar los encabezados de nuevo si es necesario
      jsonData.unshift(headers.filter((_, index) => indicesToKeep.includes(index))); // Agregar encabezados filtrados al inicio si lo deseas

      jsonData = this.filterByCodeLength(jsonData);

      // Filtrar filas que tengan celdas vacías o solo espacios
      let filteredRows = jsonData.filter(filtered => {
        return filtered.every(item =>
          item !== null &&
          item !== undefined &&
          item !== "" &&
          String(item).trim() !== ''

        );
      });




      // Convertir el array a una hoja
      const worksheet = XLSX.utils.aoa_to_sheet(filteredRows);

      // Convertir la hoja a JSON
      let jsonDataFiltered = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: headers });



      const missingFields = requiredFields.filter(field => {
        if (jsonDataFiltered.length === 0) {
          const obj = "vacio";
          return !Object.keys(obj).includes(field);
        } else {
          const obj = jsonDataFiltered[0] as { [key: string]: any };
          return !Object.keys(obj).includes(field);
        }
      });

      if (missingFields.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "El documento que quieres importar le falta algunos campos!",
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          footer: '<button (click)="openModalDetails()" class="text-purple-500">Obtener más información!</button>'
        });
        //console.error('Faltan los siguientes campos obligatorios:', missingFields.join(', '));
        return;
      }
      // Eliminamos la primera fila (índice 0)
      jsonDataFiltered.shift();
      const idEnterprise = this.getIdEnterprise();

      this.listExcel = jsonDataFiltered.map((item: any) => ({
        idEnterprise: idEnterprise,
        code: String(item['Código']), // Ensure the code is a string
        description: item['Nombre'],
        nature: item['Naturaleza'],
        financialStatus: item['Estado Financiero'],
        classification: item['Clasificación']
      }));

      if (this.listExcel) {
        this.importedAccounts = true;
      }

      this.listAccountsAux = this.listAccounts;

      this.listAccounts = this.createHierarchyWithParent(this.listExcel);
      this.listAccounts = this.sortAccountsRecursively(this.listAccounts);

      // Reset file input value
      event.target.value = null;
    };
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
  saveAccountRecursively(account: Account, parentId: number = 0): Observable<Account> {
    // Set the parent ID
    account.parent = parentId;

    return this._accountService.createAccount(account).pipe(
      switchMap(savedAccount => {
        const accountId = savedAccount.id; // Assume the saved account has an `id` property

        if (account.children && account.children.length > 0) {
          const childObservables = account.children.map(child =>
            this.saveAccountRecursively(child, accountId)
          );

          // Use forkJoin to wait for all child observables to complete
          return forkJoin(childObservables).pipe(
            switchMap(() => of(savedAccount))
          );
        } else {
          return of(savedAccount);
        }
      })
    );
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
          parent: ""  // Inicialmente, el parent es null
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
            parent: getParentCode(parentCode)  // Obtener el padre del padre
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

  downloadExcel() {
    const link = document.createElement('a');
    link.href = 'assets/templates/plantillaCatalogoCuentas.xlsx';
    link.download = 'plantillaCatalogoCuentas.xlsx';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
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
    this.formTransactional.reset({
      selectedNatureType: natureObject || null,
      selectedFinancialStateType: financialStateObject || null,
      selectedClasificationType: clasificationObject || null
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
   * Guarda las cuentas que han sido importadas llamando al servicio correspondiente.
   * Muestra un mensaje de éxito o error según el resultado de la operación.
   */
  saveImportAccounts() {
    this.importedAccounts = false;
    this.saveAccountHierarchy(this.listAccounts).subscribe((result) => {
      if (result) {
        Swal.fire({
          title: '¡Importación exitosa',
          text: 'Las cuentas han sido guardadas correctamente.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
        });
        this.ngOnInit();
      } else {
        Swal.fire({
          title: '¡Error al guardar!',
          text: 'Ocurrió un problema al guardar las cuentas importadas. Por favor, intente nuevamente o verifique los datos.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
        });
      }
    });
  }

  /**
   * Cancela la importación del archivo y restaura la lista de cuentas original.
   */
  cancelImportAccounts() {
    this.importedAccounts = false;
    this.listAccounts = this.listAccountsAux;
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
          parent: this.accountSelected.id
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
   * Obtiene una cuenta por su código.
   * @param account El objeto cuenta que contiene el código a buscar.
   * @returns Una promesa que se resuelve con un valor booleano que indica si la cuenta existe o no, o se rechaza con un error en caso de fallo.
   */
  getAccountByCode(account: Account): Promise<boolean> {
    return this._accountService.getAccountByCode(account.code, this.getIdEnterprise()).toPromise()
      .then(cuenta => {
        return !!cuenta;
      })
      .catch(error => {
        console.error('Error al obtener la cuenta:', error);
        return false;
      });
  }

  /**
   * Guarda una cuenta llamando al servicio.
   * Primero verifica si la cuenta ya existe. Si no existe, crea la cuenta mediante el servicio.
   * Si la cuenta es una subcuenta y la cuenta seleccionada tiene más de dos cuentas auxiliares, muestra un error.
   * @param account La cuenta que contiene la información a guardar.
   */
  async saveNewAccountType(account: Account) {
    try {
      const accountExist = await this.getAccountByCode(account);
      if (!accountExist) {
        if (this.name === 'subAccountName' && this.accountSelected && this.accountSelected.children && this.accountSelected.children.length >= 2) {
          Swal.fire({
            title: 'Error',
            text: 'Solo se permiten dos cuentas auxiliares para esta subcuenta!',
            confirmButtonColor: '#000066',
            //confirmButtonColor: buttonColors.confirmationColor,
            icon: 'error',
          });
          this.selectAccount(this.accountSelected);
          this.noShowFormAddNewClass();
          this.noAddNewChild();
        } else {
          this._accountService.createAccount(account).subscribe(
            (response) => {
              this.getAccounts()
                .then(() => {
                  this.expandAccounts(response);
                  this.selectAccount(response);
                  this.noShowFormAddNewClass();
                  this.noAddNewChild();
                  Swal.fire({
                    title: 'Creación exitosa',
                    showConfirmButton: false,
                    icon: 'success',
                    timer: 1000
                  });
                });
            },
            (error) => {
              Swal.fire({
                title: 'Error',
                text: 'Ha ocurrido un error al crear la cuenta!.',
                confirmButtonColor: '#000066',
                //confirmButtonColor: buttonColors.confirmationColor,
                icon: 'error',
              });
              console.log(error);
            }
          );
        }
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Ya existe una cuenta con el código ingresado!',
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
        });
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
        Swal.fire({
          title: 'Error al eliminar',
          text: 'No es posible eliminar porque está asociado a un impuesto.',
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
        });
        return
      }
      try {
        Swal.fire({
          title: '¿Desea Eliminar?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          cancelButtonColor: '#9D0311',
          //cancelButtonColor: buttonColors.cancelButtonColor,
          confirmButtonText: 'Sí, Eliminar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed && this.accountSelected?.id) {
            this._accountService.deleteAccount(this.accountSelected.id.toString()).subscribe(
              (response) => {
                Swal.fire({
                  title: 'Eliminación exitosa',
                  showConfirmButton: false,
                  confirmButtonColor: '#000066',
                  //confirmButtonColor: buttonColors.confirmationColor,
                  icon: 'success',
                  timer: 1000
                });
                this.getAccounts()
                  .then(() => {
                    if (this.accountSelected && this.accountSelected.parent) {
                      this._accountService.getAccountByCode(this.accountSelected?.parent, this.getIdEnterprise()).subscribe({
                        next: (account) => {
                          this.expandAccounts(account);
                          this.selectAccount(account);
                          this.noShowFormAddNewClass();
                          this.noAddNewChild();
                        }
                      });
                    } else {
                      this.noShowPrincipalAndTransactionalForm();
                    }
                  });
              },
              (error) => {
                Swal.fire({
                  title: 'Error',
                  text: 'Ha ocurrido un error al eliminar la cuenta!.',
                  confirmButtonColor: '#000066',
                  //confirmButtonColor: buttonColors.confirmationColor,
                  icon: 'error',
                });
              }
            );
          }

        })

      } catch (error) {
        console.error('Error al eliminar el tipo de cuenta: ', error);
      }
    }
  }

  /**
   * Actualiza la información de una cuenta seleccionada.
   * Valida que el código de la cuenta no esté asociado a subcuentas antes de proceder con la actualización.
   * Si la cuenta ya existe o si los datos no han cambiado, muestra un mensaje de error.
   * Si la cuenta no existe y los datos han cambiado, actualiza la cuenta llamando al servicio correspondiente.
   */
  async updateAccount() {
    try {
      if (this.accountSelected) {
        // ... (tu lógica de validación de subcuentas está bien)
        if (this.accountSelected.children && this.accountSelected.children.length > 0 && this.accountSelected.code !== this.parentId + this.accountForm.get(this.code)?.value) {
          Swal.fire({ /* ... */ });
          this.selectAccount(this.accountSelected);
          return; // Salir de la función
        }

        const transactionalValues = this.formTransactional.value;

        const account: Account = {
          code: this.parentId + this.accountForm.get(this.code)?.value,
          description: this.accountForm.get(this.name)?.value,

          // Extraemos el .name del objeto, o enviamos null si no hay nada seleccionado
          nature: transactionalValues.selectedNatureType ? transactionalValues.selectedNatureType.name : null,
          financialStatus: transactionalValues.selectedFinancialStateType ? transactionalValues.selectedFinancialStateType.name : null,
          classification: transactionalValues.selectedClasificationType ? transactionalValues.selectedClasificationType.name : null,
        };

        // ... el resto de tu lógica de validación con `accountExist` y `Swal.fire` está bien y ahora funcionará con el objeto `account` correcto.
        const accountExist = await this.getAccountByCode(account);

        if (!accountExist) {
          this.update(this.accountSelected?.id, account);
        } else {
          if (this.accountSelected.code === account.code && (this.accountSelected.description !== account.description || account.nature !== this.accountSelected.nature || account.financialStatus !== this.accountSelected.financialStatus || account.classification !== this.accountSelected.classification)) {
            this.update(this.accountSelected?.id, account);
          } else {
            if (this.accountSelected.code === account.code && this.accountSelected.description === account.description) {
              Swal.fire({
                title: 'Error',
                text: 'La cuenta tiene la misma información!',
                confirmButtonColor: '#000066',
                icon: 'error',
              });
            } else {
              Swal.fire({
                title: 'Error',
                text: 'Ya existe una cuenta con el código ingresado!',
                confirmButtonColor: '#000066',
                icon: 'error',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar la cuenta:', error);
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
            Swal.fire({
              title: 'Actualización exitosa',
              showConfirmButton: false,
              icon: 'success',
              confirmButtonColor: '#000066',
              //confirmButtonColor: buttonColors.confirmationColor,
              timer: 1000
            });
          });
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al actualizar la cuenta!.',
          confirmButtonColor: '#000066',
          //confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
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
        //console.log(data);
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

}
