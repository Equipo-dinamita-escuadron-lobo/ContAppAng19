import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Third } from '../../models/Third';
import { ThirdServiceService } from '../../services/third-service.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../../shared/methods/local-storage.method';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { ThirdEditModalComponent } from '../third-edit-modal/third-edit-modal.component';
import { ThirdDetailsModalComponent } from '../third-details-modal/third-details-modal.component';
import { ThirdConfigModalComponent } from '../third-config-modal/third-config-modal.component';
import { buttonColors } from '../../../../../shared/buttonColors';
import { ThirdServiceConfigurationService } from '../../services/third-service-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { eThirdGender } from '../../models/eThirdGender';
import { ePersonType } from '../../models/ePersonType';
import { DatePipe } from '@angular/common';
import { ThirdExportComponent } from '../third-export/third-export.component';
import { ThirdImportComponent } from '../third-import/third-import.component';


@Component({
  selector: 'app-third-list',
  imports: [],
  templateUrl: './third-list.component.html',
  styleUrl: './third-list.component.css'
})
export class ThirdListComponent {
  
  /**
   * Obtiene los tipos de tercero
   */
  private getThirdTypes(): void {
    this.thirdServiceConfiguration.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        this.thirdTypes = response;
      },
      error: (error) => {
        console.log(error)
        Swal.fire({
          title: 'Error!',
          text: 'No se han encontrado Tipos De Tercero Para esta Empresa',
          icon: 'error',
        });
      }
    });
  }
  /**
   * Obtiene los tipos de identificación
   */
  private getTypesID(): void {
    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typeIds = response;
      },
      error: (error) => {
        console.log(error)
        Swal.fire({
          title: 'Error!',
          text: 'No se han encontrado Tipos De Identifiacion Para esta Empresa',
          icon: 'error',
        });
      }
    });
  }
  excelData: any;
  /**
   * Lee y procesa un archivo Excel
   * @param event Evento del input de archivo
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
    const currentDate = new Date();
    this.getTypesID();
    fileReader.onload = (e) => {
      var workBook = XLSX.read(fileReader.result, { type: 'binary', cellText: true });
      var sheetNames = workBook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workBook.Sheets[sheetNames[0]])
      console.log('Datos: ', this.excelData);
      this.excelData.forEach((row: any) => {
        var third: Third = {
          thId: 0,
          entId: this.entData,
          personType: this.convertirTipoPersona(row["Tipo persona"]),
          thirdTypes: this.convertirTipoTercero(row["Tipos de tercero"]),
          names: row["Nombres"],
          lastNames: row["Apellidos"],
          socialReason: row["Razon social"],
          gender: this.convertirGenero(row["Genero"]),
          typeId: this.convertirTipoId(row["Tipo ID"]),
          idNumber: row["Identificacion"],
          verificationNumber: row["Numero de verificacion"],
          state: this.convertirEstado(row["Estado"]),
          country: row["Pais"],
          province: row["Departamento"],
          city: row["Ciudad"],
          address: row["Direccion"],
          phoneNumber: row["Telefono"],
          email: row["Correo"],
          creationDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!,
          updateDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!
        }
        this.createThirdFromExcel(third);
      });
    }
    window.location.reload();
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
    const resultado = (thirdTypes as string).split(",").map(item => item.trim());
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
