import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

// --- Servicios y Modelos ---
import { UnitOfMeasureService } from '../../Services/unit-of-measure.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-unit-of-measure-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './unit-of-measure-creation.component.html',
  styleUrls: ['./unit-of-measure-creation.component.css']
})
export class UnitOfMeasureCreationComponent implements OnInit {
  unitOfMeasureForm: FormGroup;
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  formSubmitAttempt = false;

  constructor(
    private formBuilder: FormBuilder,
    private unitOfMeasureService: UnitOfMeasureService,
    private router: Router
  ) {
    // Inicializa el formulario en el constructor
    this.unitOfMeasureForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      abbreviation: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;

    if (this.unitOfMeasureForm.valid && this.entData) {
      const unitOfMeasureData = {
        ...this.unitOfMeasureForm.value,
        enterpriseId: this.entData,
        state: 'ACTIVE'
      };

      this.unitOfMeasureService.createUnitOfMeasure(unitOfMeasureData).subscribe(
        () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'La unidad de medida ha sido creada exitosamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/gen-masters/inventory/measurement-units/list']);
          });
        },
        error => {
          console.error('Error al crear la unidad de medida:', error);
          Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al crear la unidad de medida. Por favor, inténtelo de nuevo.',
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

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory/measurement-units/list']);
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
