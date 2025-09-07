import { Component, Inject, Type } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ThirdServiceService } from '../../services/third-service.service';
import { LocalStorageMethods } from '../../../../../shared/methods/local-storage.method';
import Swal from 'sweetalert2';
import { ThirdServiceConfigurationService } from '../../services/third-service-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { buttonColors } from '../../../../../shared/buttonColors';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-third-config',
  imports: [],
  templateUrl: './third-config.component.html',
  styleUrl: './third-config.component.css'
})
export class ThirdConfigComponent {
  /** Datos recibidos como input al componente */
  inputData: any;

  /** Controla la visibilidad de la sección de identificaciones */
  showIdentifications = true;

  /** Instancia de métodos para manejo de localStorage */
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  /** Datos de la empresa actual */
  entData: any | null = null;

  /** Controla la visibilidad del input para nuevo tipo de tercero */
  showInputThirdType = false;

  /** Controla la visibilidad del input para nuevo tipo de identificación */
  showInputTypeId = false;

  /** Nombre temporal para nuevo item */
  newItemName = '';

  /** Nombre para nueva identificación */
  newIdentificatioName = '';

  /** Nombre para nuevo tipo de tercero */
  newThirdTypeName = '';

  /** Array de tipos de identificación */
  typesId: TypeId[] = []

  /** Array de tipos de terceros */
  thirdTypes: ThirdType[] = [];

  /**
   * Constructor del componente
   * 
   * @param data - Datos inyectados al modal
   * @param ref - Referencia al diálogo actual
   * @param service - Servicio para operaciones con terceros
   * @param thirdServiceConfiguration - Servicio para configuración de terceros
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<ThirdConfigModalComponent>, private service: ThirdServiceService, private thirdServiceConfiguration: ThirdServiceConfigurationService) {
  }

  /**
   * Cierra el modal actual
   * 
   * @returns {void}
   */
  closePopUp() {
    this.ref.close('closing from modal details');
  }

  /**
   * Inicializa el componente cargando los datos necesarios
   * 
   * @returns {void}
   */
  ngOnInit() {
    this.inputData = this.data;
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.thirdServiceConfiguration.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        this.thirdTypes = response;
      },
      error: (error) => {
        console.log(error)
        Swal.fire({
          title: 'Error',
          text: 'No se han encontrado Tipos De Tercero Para esta Empresa',
          confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
        });
      }
    });

    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typesId = response;
        console.log(response)
      },
      error: (error) => {
        console.log(error)
        Swal.fire({
          title: 'Error',
          text: 'No se han encontrado Tipos De Tercero Para esta Empresa',
          confirmButtonColor: buttonColors.confirmationColor,
          icon: 'error',
        });
      }
    });
  }

  /**
   * Añade un nuevo tipo de identificación
   * Corrección HU-1.1: Al momento de crear un nuevo Tipo de identificación se muestra un mensaje en pantalla
   * Se actualiza la tabla donde se muestran todos los tipos de identifiación registrados en el sistema
   * 
   * @param items - Lista actual de tipos de identificación
   * @returns {void}
   */
  addTypeId(items: any) {
    console.log(this.newIdentificatioName)
    let sendTypeId: TypeId = {
      entId: this.entData,
      typeId: this.newIdentificatioName,
      typeIdname: this.newIdentificatioName
    };
    this.thirdServiceConfiguration.createTypeId(sendTypeId).subscribe({
      next: (response) => {
        this.typesId.push(response);
        this.newIdentificatioName = '';
        this.showInputTypeId = false;
        Swal.fire({
          title: 'Éxito',
          text: 'Tipo de identificación agregado con éxito',
          icon: "success",
          confirmButtonColor: buttonColors.confirmationColor
        });
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al agregar el Tipo de Identifiacion',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor
        });
      },
    });
  }

  /**
   * Añade un nuevo tipo de tercero
   * Corrección HU-1.2: Al momento de crear un nuevo Tipo de Tercero se muestra un mensaje en pantalla
   * Se actualiza la tabla donde se muestran todos los tipos de Terceros registrados en el sistema
   * 
   * @param items - Lista actual de tipos de tercero
   * @returns {void}
   */
  addThirdType(items: any) {
    console.log(this.newThirdTypeName)
    let sendTypeId: ThirdType = {
      entId: this.entData,
      thirdTypeId: Math.floor(Math.random() * 1001),
      thirdTypeName: this.newThirdTypeName
    };
    console.log(sendTypeId)
    this.thirdServiceConfiguration.createThirdType(sendTypeId).subscribe({
      next: (response) => {
        this.thirdTypes.push(response);
        this.newThirdTypeName = '';
        this.showInputThirdType = false;
        Swal.fire({
          title: 'Éxito',
          text: 'Tipo de tercero agregado con exito',
          icon: "success",
          confirmButtonColor: buttonColors.confirmationColor
        });
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al agregar el Tipo de Tercero',
          icon: 'error',
          confirmButtonColor: buttonColors.confirmationColor
        });
      },
    });
  }

  /**
   * Cancela la adición de un nuevo tipo de tercero
   * 
   * @returns {void}
   */
  cancelAddThirdType() {
    this.newThirdTypeName = '';
    this.showInputThirdType = false;
  }

  /**
   * Cancela la adición de un nuevo tipo de identificación
   * 
   * @returns {void}
   */
  cancelAddTypeId() {
    this.newIdentificatioName = '';
    this.showInputTypeId = false;
  }

  /**
   * Elimina un tipo de tercero
   * 
   * @param items - Lista de tipos de tercero
   * @param index - Índice del elemento a eliminar
   * @returns {void}
   */
  deleteItem(items: any, index: number) {
    this.thirdServiceConfiguration.deleteThird(items[index].thirdTypeId).subscribe({
      next: (response) => {
      },
      error: (error: HttpErrorResponse) => {
        if (error.error.text === 'SUCCESS') {
          this.createAlert(items, index, "¿estás seguro?", "no se podra revertir este cambio", 'success', true, "si, eliminalo")
        }
        else {
          this.createAlert(items, index, "No se pudo eliminar", "el valor esta asignado a un usuario", 'error', false, undefined)
        }
      }
    });
  }

  /**
   * Elimina un tipo de identificación
   * 
   * @param items - Lista de tipos de identificación
   * @param index - Índice del elemento a eliminar
   * @returns {void}
   */
  deleteItemId(items: any, index: number) {
    this.thirdServiceConfiguration.deleteThird(items[index].thirdTypeId).subscribe({
      next: (response) => {
      },
      error: (error: HttpErrorResponse) => {
        if (error.error.text === 'SUCCESS') {
          this.createAlert(items, index, "¿estás seguro?", "no se podra revertir este cambio", 'success', true, "si, eliminalo")
        }
        else {
          this.createAlert(items, index, "No se pudo eliminar", "el valor esta asignado a un usuario", 'error', false, undefined)
        }
      }
    });
  }

  /**
   * Crea y muestra una alerta de confirmación
   * 
   * @param items - Lista de elementos afectados
   * @param index - Índice del elemento en la lista
   * @param title - Título de la alerta
   * @param text - Texto descriptivo de la alerta
   * @param icono - Tipo de icono a mostrar
   * @param confirmed - Indica si se requiere confirmación
   * @param confirmButtonText - Texto del botón de confirmación
   * @returns {void}
   */
  createAlert(
    items: any,
    index: number,
    title: string,
    text: string,
    icono: 'success' | 'error' | 'warning' | 'info' | 'question',
    confirmed: boolean,
    confirmButtonText: string | undefined
  ) {
    Swal.fire({
      title: title,
      text: text,
      icon: icono,
      showCancelButton: true,
      confirmButtonColor: buttonColors.confirmationColor,
      cancelButtonColor: buttonColors.cancelButtonColor,
      confirmButtonText: confirmed ? confirmButtonText : undefined,
      showConfirmButton: confirmed
    }).then((result) => {
      if (confirmed && result.isConfirmed) {
        items.splice(index, 1);
        Swal.fire({
          title: "Eliminado!",
          text: "Se eliminó con exito el tipo",
          confirmButtonColor: buttonColors.confirmationColor,
          icon: "success"
        });
      }
    });
  }
}
