import { Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ThirdServiceService } from '../../services/third-service.service';
import { Third } from '../../models/Third';
import { TypeId } from '../../models/TypeId';
import { ePersonType } from '../../models/ePersonType';

@Component({
  selector: 'app-third-details',
  imports: [],
  templateUrl: './third-details.component.html',
  styleUrl: './third-details.component.css'
})
export class ThirdDetailsComponent {
  /** Datos recibidos como input en el modal */
  inputData: any;

  /** Objeto que almacena los datos del tercero a mostrar */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId: { entId: '0', typeId: 'CC', typeIdname: 'CC' },
    thirdTypes: [],
    rutPath: undefined,
    personType: ePersonType.natural,
    names: undefined,
    lastNames: undefined,
    socialReason: undefined,
    gender: undefined,
    idNumber: 0,
    verificationNumber: undefined,
    state: false,
    photoPath: undefined,
    country: 0,
    province: 0,
    city: 0,
    address: 'Calle Principal',
    phoneNumber: '1234567890',
    email: 'email@example.com',
    creationDate: '2024-04-27',
    updateDate: '2024-04-29',
  };

  /**
   * Constructor del componente
   * @param data Datos pasados al modal
   * @param ref Referencia al diálogo modal
   * @param service Servicio para gestionar terceros
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<ThirdDetailsModalComponent>,
    private service: ThirdServiceService
  ) { }

  /**
   * Cierra el modal de detalles
   */
  closePopUp() {
    this.ref.close('closing from modal details');
  }

  /**
   * Inicializa el componente y carga los datos del tercero si existe
   */
  ngOnInit() {
    this.inputData = this.data;
    if (this.inputData.thId > 0) {
      this.service.getThirdPartie(this.inputData.thId).subscribe((third) => {
        this.thirdData = third;
      });
    }
  }

  /**
   * Concatena los nombres de los tipos de terceros
   * @returns String con los nombres de los tipos concatenados
   */
  getThirdTypesNames(): string {
    return this.thirdData.thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Verifica y retorna el género o "NO APLICA" si está vacío
   * @returns String con el género o "NO APLICA"
   */
  getGender(): string {
    return this.thirdData.gender ? this.thirdData.gender : 'NO APLICA';
  }

  /**
   * Verifica y retorna el número de verificación o "NO APLICA" si está vacío
   * @returns String con el número de verificación o "NO APLICA"
   */
  getVerificationNumber(): string {
    return this.thirdData.verificationNumber ? this.thirdData.verificationNumber.toString() : 'NO APLICA';
  }
}
