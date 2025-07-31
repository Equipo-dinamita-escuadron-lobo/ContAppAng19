import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { ReactiveFormsModule } from '@angular/forms';

// --- Servicios y Modelos ---
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { UnitOfMeasure } from '../../Models/UnitOfMeasure';
import { UnitOfMeasureService } from '../../Services/unit-of-measure.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-unit-of-measure-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DialogModule,
    TagModule,
    InputIcon,
    IconField,
    ReactiveFormsModule
  ],
  templateUrl: './unit-of-measure-list.component.html',
  styleUrls: ['./unit-of-measure-list.component.css']
})
export class UnitOfMeasureListComponent implements OnInit {
  unitOfMeasures: UnitOfMeasure[] = [];
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;



  constructor(
    private unitOfMeasureService: UnitOfMeasureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    console.log('Enterprise ID:', this.entData);
    if (this.entData) {
      this.getUnitOfMeasures();
    } else {
      console.error('No se pudo obtener el ID de la empresa');
    }
  }

  getUnitOfMeasures(): void {
    console.log('Llamando al servicio con enterpriseId:', this.entData);
    this.unitOfMeasureService.getUnitOfMeasures(this.entData).subscribe(
      (data: UnitOfMeasure[]) => {
        console.log('Datos recibidos:', data);
        this.unitOfMeasures = data;
      },
      error => {
        console.error('Error al obtener las unidades de medida:', error);
        console.error('URL llamada:', `${environment.API_URL}unit-measures/findAll/${this.entData}`);
      }
    );
  }



  // Método para redirigir a editar
  redirectToEdit(unitId: number): void {
    this.router.navigate(['/commercial/business-masters/measurement-units/edit/', unitId]);
  }

  // Método para redirigir a crear nueva unidad
  redirectToCreate(): void {
    this.router.navigate(['/commercial/business-masters/measurement-units/create']);
  }

  // Método para eliminar unidad
  deleteUnit(unitId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar esta unidad de medida?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.unitOfMeasureService.deleteUnitOfMeasureId(unitId.toString()).subscribe(
          () => {
            this.getUnitOfMeasures();
            Swal.fire({
              title: '¡Eliminado!',
              text: 'La unidad de medida ha sido eliminada con éxito.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error => {
            console.error('Error al eliminar la unidad de medida:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la unidad de medida. Puede estar siendo utilizada.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/commercial/products/list']);
  }

}
