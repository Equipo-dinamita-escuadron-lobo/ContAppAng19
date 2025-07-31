import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Importaciones Standalone y de PrimeNG ---
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextarea } from 'primeng/inputtextarea';

import { ProductType } from '../../Models/ProductType';
import { ProductTypeService } from '../../Services/product-type.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-product-type-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Esencial para formularios reactivos en componentes Standalone
    RouterModule,
    CardModule,
    InputTextModule,
    InputTextarea,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './product-type-creation.component.html',
})
export class ProductTypeCreationComponent implements OnInit {
  productTypeForm: FormGroup;
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  formSubmitAttempt = false;

  constructor(
    private formBuilder: FormBuilder,
    private productTypeService: ProductTypeService,
    private router: Router,
    private messageService: MessageService
  ) {
    // Inicializa el formulario en el constructor para asegurar que esté disponible inmediatamente
    this.productTypeForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (!this.entData) {
      console.error("No se encontró el ID de la empresa. No se pueden cargar los datos del formulario.");
      Swal.fire('Error', 'No se pudo identificar la empresa. Vuelva a iniciar sesión.', 'error');
    }
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.productTypeForm.invalid) {
      Swal.fire('Formulario Inválido', 'Por favor, revise todos los campos requeridos.', 'warning');
      // Marcar todos los campos como "tocados" para mostrar los errores
      this.productTypeForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.productTypeForm.value };
    formData.enterpriseId = this.entData;

    console.log('Datos del formulario:', formData);

    this.productTypeService.createProductType(formData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Creación exitosa',
          text: 'Se ha creado el tipo de producto con éxito.',
          icon: 'success',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
        });
        this.router.navigate(['/commercial/business-masters/product-types/list']); // Redirigir a la lista
      },
      error: (err: any) => {
        console.error('Error al crear el tipo de producto:', err);
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al crear el tipo de producto.',
          icon: 'error',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/commercial/business-masters/product-types/list']);
  }
}