import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
  entData: string | null = null;
  formSubmitAttempt = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly router: Router,
    private readonly messageService: MessageService
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

      this.unitOfMeasureService.createUnitOfMeasure(unitOfMeasureData).subscribe({
        next: () => {
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
        error: (error) => {
          const message = error.error?.message || 'Ha ocurrido un error al crear la unidad de medida. Por favor, inténtelo de nuevo.';
          let summary = 'Error';
          if (message.includes('Ya existe')) {
            summary = 'Registro Duplicado';
          }
          this.messageService.add({
            severity: 'error',
            summary: summary,
            detail: message
          });
        }
      });
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
