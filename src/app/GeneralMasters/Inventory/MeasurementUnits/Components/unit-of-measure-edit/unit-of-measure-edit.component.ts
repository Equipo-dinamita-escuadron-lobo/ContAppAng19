import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
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
  entData: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly messageService: MessageService
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
    if (!this.entData) return;
    this.isLoading = true;
    this.unitOfMeasureService.getUnitOfMeasuresId(this.currentUnitId, this.entData).subscribe({
      next: (unitOfMeasure: UnitOfMeasure) => {
        this.originalUnitData = unitOfMeasure;
        this.unitOfMeasureForm.patchValue({
          name: unitOfMeasure.name,
          description: unitOfMeasure.description,
          abbreviation: unitOfMeasure.abbreviation
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la unidad de medida.'
        });
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;

    if (this.unitOfMeasureForm.valid && this.entData) {
      // Verificar si hubo cambios
      const formData = this.unitOfMeasureForm.value;
      const hasChanges = this.hasFormChanges(formData);

      if (!hasChanges) {
        this.messageService.add({
          severity: 'info',
          summary: 'Sin cambios',
          detail: 'No se han detectado cambios en la unidad de medida.'
        });
        return;
      }

      const updatedUnitData = {
        ...formData,
        id: this.originalUnitData.id,
        enterpriseId: this.originalUnitData.enterpriseId,
        state: this.originalUnitData.state
      };

      this.unitOfMeasureService.updateUnitOfMeasureId(this.currentUnitId, updatedUnitData, this.entData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'La unidad de medida ha sido actualizada exitosamente.',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/gen-masters/inventory/measurement-units/list']);
          }, 1500);
        },
        error: (error) => {
          const message = error.error?.message || 'Ha ocurrido un error al actualizar la unidad de medida. Por favor, inténtelo de nuevo.';
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

  // Método para verificar si hubo cambios en el formulario
  private hasFormChanges(formData: any): boolean {
    return (
      formData.name !== this.originalUnitData.name ||
      formData.description !== this.originalUnitData.description ||
      formData.abbreviation !== this.originalUnitData.abbreviation
    );
  }

  // Método público para verificar si hubo cambios (usado en el template)
  hasChanges(): boolean {
    if (!this.originalUnitData) return false;
    const formData = this.unitOfMeasureForm.value;
    return this.hasFormChanges(formData);
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

  // Getter para mantener dumb templates
  get isSubmitDisabled(): boolean {
    return this.unitOfMeasureForm.invalid || !this.hasChanges();
  }
}
