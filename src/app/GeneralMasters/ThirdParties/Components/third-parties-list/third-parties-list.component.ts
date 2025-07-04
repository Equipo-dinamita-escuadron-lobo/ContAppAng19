import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Third } from '../../models/Third';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdPartyServiceService } from '../../Services/third-party-service.service';
import { ThirdPartyConfigurationServiceService } from '../../Services/third-party-configuration-service.service';
import { ePersonType } from '../../models/ePersonType';
import { eThirdGender } from '../../models/eThirdGender';

@Component({
  selector: 'app-third-parties-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './third-parties-list.component.html',
  styleUrl: './third-parties-list.component.css',
})
export class ThirdPartiesListComponent {
  /** ID del tercero seleccionado actualmente */
  selectedThirdId: string | null = null;

  /** Temporizador para operaciones asíncronas */
  timer: any;

  /** Array de terceros */
  data: Third[] = [];

  /** Lista de terceros para Excel */
  listExcel: Third[] = [];

  /** Indica si hay terceros importados */
  importedThirds: boolean = false;

  /** Lista de tipos de tercero */
  thirdTypes: ThirdType[] = [];

  /** Lista de tipos de identificación */
  typeIds: TypeId[] = [];

  /** Columnas para la vista resumida */
  displayedColumnsBrief: any[] = [
    'personType',
    'thirdTypes',
    'socialReason',
    'typeId',
    'idNumber',
    'email',
    'actions',
  ];

  globalFilterFields: string[] = [
    'personType',
    'thirdTypes.thirdTypeName',
    'socialReason',
    'names',
    'lastNames',
    'typeId.typeId',
    'idNumber',
    'email',
    'country',
    'province',
    'city',
    'address',
    'phoneNumber',
  ];

  /** Columnas para la vista completa */
  displayedColumnsComplete: any[] = [
    'personType',
    'thirdTypes',
    'socialReason',
    'typeId',
    'idNumber',
    'verificationNumber',
    'email',
    'country',
    'province',
    'city',
    'address',
    'phoneNumber',
    'state',
    'actions',
  ];

  /** Fuente de datos para la tabla */
  dataSource: Third[] = [];

  /** Control de vista detallada */
  showDetailTable = false;

  /** Métodos de localStorage */
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  /** Datos de la empresa */
  entData: any | null = null;

  /** Control de visibilidad del modal */
  showModal = false;

  /** Control para crear tercero desde PDF RUT */
  createPdfRUT: boolean = false;

  /**
   * Constructor del componente
   * @param thirdService Servicio de terceros
   * @param thirdServiceConfiguration Servicio de configuración de terceros
   * @param datePipe Pipe para formateo de fechas
   * @param thirdExportComponent Componente de exportación
   * @param fb Constructor de formularios
   * @param router Router para navegación
   * @param dialog Servicio de diálogos
   */
  constructor(
    private thirdService: ThirdPartyServiceService,
    private thirdServiceConfiguration: ThirdPartyConfigurationServiceService
  ) {}

  /**
   * Inicializa las validaciones del formulario
   * @returns Objeto con configuración de validaciones
   */
  validationsAll() {
    return {
      stringSearch: [''],
    };
  }

  /**
   * Inicializa el componente y carga datos necesarios
   */
  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getTypesID();
    this.getThirdTypes();

    if (this.entData) {
      // this.thirdService.getThirdList(this.entData).subscribe({
      //   next: (response: Third[]) => {
      //     this.data = response;
      //     console.log(response);
      //     this.dataSource = new MatTableDataSource<Third>(this.data);
      //     this.dataSource.paginator = this.paginator;
      //   }
      // });
    }
  }

  /**
   * Alterna entre vista resumida y detallada
   */
  showDetailTableFunction(): void {
    this.showDetailTable = !this.showDetailTable;
  }

  /**
   * Abre el modal de detalles de un tercero
   * @param thId ID del tercero
   */
  openModalDetails(thId: number): void {
    // this.openPopUp(thId, 'Detalles del tercero', ThirdDetailsModalComponent);
  }

  /**
   * Abre el modal de edición de un tercero
   * @param thId ID del tercero
   */
  openModalEdit(thId: number): void {
    // this.openPopUp(
    //   thId,
    //   'Editar información del Tercero',
    //   ThirdEditModalComponent
    // );
  }
  /**
   * Abre el modal para crear tercero desde PDF RUT
   */
  openCreatePDFRunt(): void {
    this.createPdfRUT = true;
  }
  /**
   * Cierra el modal de creación desde PDF RUT
   */
  closeCreatePDFRunt(): void {
    this.createPdfRUT = false;
  }

  /**
   * Redirige a la edición de un tercero
   * @param ThirdId ID del tercero
   */
  redirectToEdit(ThirdId: string): void {
    console.log('El id del tercero es', ThirdId);
    // this.router.navigate(['/general/operations/third-parties/edit', ThirdId]);
  }

  /**
   * Abre el modal de configuración de terceros
   */
  openConfigTPModal(): void {
    // this.openPopUp(0, 'Configuración de Terceros', ThirdConfigModalComponent);
  }

  /**
   * Cambia el estado de un tercero
   * @param thId ID del tercero
   */
  changeThirdPartieState(thId: number): void {
    // this.thirdService.changeThirdPartieState(thId).subscribe({
    //   next: (response: Boolean) => {
    //     if (response) {
    //       let updatedThird = this.data.find((t) => t.thId === thId);
    //       if (updatedThird) {
    //         updatedThird.state = !updatedThird.state;
    //       }
    //       Swal.fire({
    //         title: 'Exito',
    //         text: 'Se cambió exitosamente. el estado del tercero',
    //         confirmButtonColor: buttonColors.confirmationColor,
    //         icon: 'success',
    //       });
    //     }
    //   },
    //   error: (error) => {
    //     console.log(error);
    //     Swal.fire({
    //       title: 'Error',
    //       text: 'No se pudo cambiar el estado del tercero',
    //       confirmButtonColor: buttonColors.confirmationColor,
    //       icon: 'error',
    //     });
    //   },
    // });
  }
  /**
   * Elimina un tercero
   * @param thId ID del tercero
   */
  deleteThirdPartie(thId: number): void {}

  /**
   * Abre un popup modal genérico
   * @param thId ID del tercero
   * @param title Título del modal
   * @param component Componente a mostrar
   */
  openPopUp(thId: any, title: any, component: any) {
    // var _popUp = this.dialog.open(component, {
    //   width: '40%',
    //   enterAnimationDuration: '0ms',
    //   exitAnimationDuration: '600ms',
    //   data: {
    //     title: title,
    //     thId: thId,
    //   },
    // });
    // _popUp.afterClosed().subscribe();
  }

  /**
   * Redirige a una ruta específica
   * @param route Ruta destino
   */
  redirectTo(route: string): void {
    // this.router.navigateByUrl(route);
  }

  /**
   * Aplica filtros a la tabla de terceros
   * @param event Evento del input de filtro
   */
  applyFilter(event: Event) {
    // const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    // // Obtener las columnas por las que se desea filtrar
    // const columns = ['socialReason', 'names', 'idNumber'];
    // // Crear un nuevo filtro que solo aplique a las columnas seleccionadas
    // this.dataSource.filterPredicate = (data: any, filter) => {
    //   return columns.some((column) =>
    //     data[column].toString().toLowerCase().includes(filter)
    //   );
    // };
    // // Aplicar el nuevo filtro
    // this.dataSource.filter = filterValue;
  }

  /**
   * Abre el modal de detalles de importación
   */
  openModalDetailsImport(): void {
    // this.OpenDetailsImport('Detalles de importación ', ThirdImportComponent);
  }
  /**
   * Abre un popup de detalles de importación
   * @param title Título del modal
   * @param component Componente a mostrar
   */
  OpenDetailsImport(title: any, component: any) {
    // var _popUp = this.dialog.open(component, {
    //   width: '40%',
    //   height: '100px',
    //   enterAnimationDuration: '0ms',
    //   exitAnimationDuration: '600ms',
    //   data: {
    //     title: title,
    //   },
    // });
    // _popUp.afterClosed().subscribe();
  }
  /**
   * Exporta la lista de terceros a Excel
   */
  exportThirdsToExcel() {
    console.log('paso 1');
    // this.thirdExportComponent.getThirds().then((success) => {
    //   if (success) {
    //     Swal.fire({
    //       title: 'Éxito!',
    //       text: 'Se ha generado el archivo correctamente.',
    //       confirmButtonColor: buttonColors.confirmationColor,
    //       icon: 'success',
    //     });
    //   } else {
    //     Swal.fire({
    //       title: 'Error!',
    //       text: 'No se encontraron terceros para exportar.',
    //       confirmButtonColor: buttonColors.confirmationColor,
    //       icon: 'error',
    //     });
    //   }
    // });
  }
  /**
   * Crea un tercero desde datos de Excel
   * @param third Datos del tercero
   */
  createThirdFromExcel(third: Third) {
    // this.thirdService.createThird(third).subscribe({
    //   next: (response) => {
    //     console.log('Tercero creado con éxito', response);
    //     // mostrar alerta
    //   },
    //   error: (error) => {
    //     console.error('Error al crear el tercero', error);
    //     Swal.fire({
    //       title: 'Error al crear los terceros',
    //       text: 'Hubo un error al procesar el archivo, por favor intente nuevamente.',
    //       icon: 'error',
    //       confirmButtonText: 'Aceptar',
    //     });
    //   },
    // });
  }
  /**
   * Obtiene los tipos de tercero
   */
  private getThirdTypes(): void {
    // this.thirdServiceConfiguration.getThirdTypes(this.entData).subscribe({
    //   next: (response: ThirdType[]) => {
    //     this.thirdTypes = response;
    //   },
    //   error: (error) => {
    //     console.log(error);
    //     Swal.fire({
    //       title: 'Error!',
    //       text: 'No se han encontrado Tipos De Tercero Para esta Empresa',
    //       icon: 'error',
    //     });
    //   },
    // });
  }
  /**
   * Obtiene los tipos de identificación
   */
  private getTypesID(): void {
    // this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
    //   next: (response: TypeId[]) => {
    //     this.typeIds = response;
    //   },
    //   error: (error) => {
    //     console.log(error);
    //     Swal.fire({
    //       title: 'Error!',
    //       text: 'No se han encontrado Tipos De Identifiacion Para esta Empresa',
    //       icon: 'error',
    //     });
    //   },
    // });
  }
  excelData: any;
  /**
   * Lee y procesa un archivo Excel
   * @param event Evento del input de archivo
   */
  ReadExcel(event: any) {
    let file = event.target.files[0];
    // Check if the file is of type xlsx
    if (
      file.type !==
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      console.error('El archivo debe ser de tipo xlsx.');
      return;
    }
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    const currentDate = new Date();
    this.getTypesID();
    // fileReader.onload = (e) => {
    //   var workBook = XLSX.read(fileReader.result, {
    //     type: 'binary',
    //     cellText: true,
    //   });
    //   var sheetNames = workBook.SheetNames;
    //   this.excelData = XLSX.utils.sheet_to_json(workBook.Sheets[sheetNames[0]]);
    //   console.log('Datos: ', this.excelData);
    //   this.excelData.forEach((row: any) => {
    //     var third: Third = {
    //       thId: 0,
    //       entId: this.entData,
    //       personType: this.convertirTipoPersona(row['Tipo persona']),
    //       thirdTypes: this.convertirTipoTercero(row['Tipos de tercero']),
    //       names: row['Nombres'],
    //       lastNames: row['Apellidos'],
    //       socialReason: row['Razon social'],
    //       gender: this.convertirGenero(row['Genero']),
    //       typeId: this.convertirTipoId(row['Tipo ID']),
    //       idNumber: row['Identificacion'],
    //       verificationNumber: row['Numero de verificacion'],
    //       state: this.convertirEstado(row['Estado']),
    //       country: row['Pais'],
    //       province: row['Departamento'],
    //       city: row['Ciudad'],
    //       address: row['Direccion'],
    //       phoneNumber: row['Telefono'],
    //       email: row['Correo'],
    //       creationDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!,
    //       updateDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!,
    //     };
    //     this.createThirdFromExcel(third);
    //   });
    // };
    // window.location.reload();
  }
  /**
   * Convierte el tipo de persona desde Excel
   * @param tipo Tipo de persona en texto
   * @returns Enum de tipo de persona
   */
  convertirTipoPersona(tipo: string): ePersonType {
    console.log('TP', tipo);
    switch (tipo.trim().toLowerCase()) {
      case 'natural':
        return ePersonType.natural;
      case 'juridica':
        return ePersonType.juridica;
      default:
        throw new Error(`Tipo de persona desconocido: ${tipo}`);
    }
  }
  /**
   * Convierte el género desde Excel
   * @param gender Género en texto
   * @returns Enum de género o null
   */
  convertirGenero(gender: String): eThirdGender | null {
    // Si el campo de género está vacío o no tiene valor válido, devolvemos `null`
    if (!gender || gender.trim() === '') {
      return null; // No asignamos género si el campo está vacío
    }
    switch (gender.trim().toLowerCase()) {
      case 'masculino':
        return eThirdGender.masculino;
      case 'femenino':
        return eThirdGender.femenino;
      case 'Otro':
        return eThirdGender.Otro;
      default:
        throw new Error(`Genero desconocido: ${gender}`);
    }
  }
  /**
   * Convierte el estado desde Excel
   * @param estado Estado en texto
   * @returns Boolean del estado
   */
  convertirEstado(estado: String) {
    switch (estado.trim().toLowerCase()) {
      case 'activo':
        return true;
      case 'inactivo':
        return false;
      default:
        throw new Error(`Estado desconocido: ${estado}`);
    }
  }
  /**
   * Convierte los tipos de tercero desde Excel
   * @param thirdTypes Tipos de tercero en texto
   * @returns Array de tipos de tercero
   */
  convertirTipoTercero(thirdTypes: String): ThirdType[] {
    console.log('tpss', this.thirdTypes);
    const resultado = (thirdTypes as string)
      .split(',')
      .map((item) => item.trim());
    // Filtrar los tipos de tercero que coinciden con el nombre
    const coincidencias = this.thirdTypes.filter((tipo) =>
      resultado.includes(tipo.thirdTypeName)
    );
    console.log('coin');
    return coincidencias;
  }
  /**
   * Convierte el tipo de ID desde Excel
   * @param tipoId Tipo de ID en texto
   * @returns Objeto TypeId
   */
  convertirTipoId(tipoId: String): TypeId {
    // Buscar la primera coincidencia
    const coincidencia = this.typeIds.find((tipo) =>
      tipoId.includes(tipo.typeId)
    );
    // Si no existe una coincidencia, lanzar un error
    if (!coincidencia) {
      throw new Error(`No se encontró el tipo de ID: ${tipoId}`);
    }
    // Si se encontró, devolver la coincidencia
    return coincidencia;
  }
}
