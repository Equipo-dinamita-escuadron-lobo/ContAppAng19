import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
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
    private router: Router,
    private messageService: MessageService
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
        state: true
      };

      this.unitOfMeasureService.createUnitOfMeasure(unitOfMeasureData).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'La unidad de medida ha sido creada exitosamente.',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/gen-masters/inventory/measurement-units/list']);
          }, 1500);
        },
        error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ha ocurrido un error al crear la unidad de medida. Por favor, inténtelo de nuevo.'
          });
        }
      );
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, complete todos los campos requeridos.'
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
