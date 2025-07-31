import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

// --- Servicios y Modelos ---
import { UnitOfMeasure } from '../../Models/UnitOfMeasure';
import { UnitOfMeasureService } from '../../Services/unit-of-measure.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-unit-of-measure-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './unit-of-measure-edit.component.html',
  styleUrls: ['./unit-of-measure-edit.component.css']
})
export class UnitOfMeasureEditComponent implements OnInit {
  unitOfMeasureForm: FormGroup;
  currentUnitId!: string;
  isLoading = true;
  formSubmitAttempt = false;

  // --- Añade esta propiedad para guardar datos originales ---
  private originalUnitData!: UnitOfMeasure;

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private unitOfMeasureService: UnitOfMeasureService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.unitOfMeasureForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      abbreviation: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.route.params.subscribe(params => {
      this.currentUnitId = params['id'];
      this.loadUnitData();
    });
  }

  loadUnitData(): void {
    this.isLoading = true;
    this.unitOfMeasureService.getUnitOfMeasuresId(this.currentUnitId).subscribe(
      (unitOfMeasure: UnitOfMeasure) => {
        this.originalUnitData = unitOfMeasure;
        this.unitOfMeasureForm.patchValue({
          name: unitOfMeasure.name,
          description: unitOfMeasure.description,
          abbreviation: unitOfMeasure.abbreviation
        });
        this.isLoading = false;
      },
      error => {
        console.error('Error al cargar los datos de la unidad de medida:', error);
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la información de la unidad de medida.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.goBack();
        });
      }
    );
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;

    if (this.unitOfMeasureForm.valid) {
      // Verificar si hubo cambios
      const formData = this.unitOfMeasureForm.value;
      const hasChanges = this.hasFormChanges(formData);

      if (!hasChanges) {
        Swal.fire({
          title: 'Sin cambios',
          text: 'No se han detectado cambios en la unidad de medida.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      const updatedUnitData = {
        ...formData,
        id: this.originalUnitData.id,
        enterpriseId: this.originalUnitData.enterpriseId,
        state: this.originalUnitData.state
      };

      this.unitOfMeasureService.updateUnitOfMeasureId(this.currentUnitId, updatedUnitData).subscribe(
        () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'La unidad de medida ha sido actualizada exitosamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/commercial/business-masters/measurement-units/list']);
          });
        },
        error => {
          console.error('Error al actualizar la unidad de medida:', error);
          Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al actualizar la unidad de medida. Por favor, inténtelo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      );
    } else {
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos requeridos.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  // Método para verificar si hubo cambios en el formulario
  private hasFormChanges(formData: any): boolean {
    return (
      formData.name !== this.originalUnitData.name ||
      formData.description !== this.originalUnitData.description ||
      formData.abbreviation !== this.originalUnitData.abbreviation
    );
  }

  goBack(): void {
    this.router.navigate(['/commercial/business-masters/measurement-units/list']);
  }

  // Método auxiliar para verificar errores de validación
  hasFieldError(fieldName: string): boolean {
    const field = this.unitOfMeasureForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitAttempt));
  }

  // Método auxiliar para obtener el mensaje de error
  getFieldError(fieldName: string): string {
    const field = this.unitOfMeasureForm.get(fieldName);
    if (field?.errors?.['required']) {
      return `El campo ${fieldName} es requerido.`;
    }
    return '';
  }
}
