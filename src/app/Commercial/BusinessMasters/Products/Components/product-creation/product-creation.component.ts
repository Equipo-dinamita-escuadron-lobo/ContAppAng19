// C:/.../app/Commercial/BusinessMasters/Products/components/product-creation/product-creation.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Servicios y Modelos (sin cambios) ---


// --- AHORA: Importaciones Standalone y de PrimeNG ---
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ProductType } from '../../../ProductTypes/Models/ProductType';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ProductService } from '../../Services/product.service';
import { UnitOfMeasureService } from '../../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../../Category/Services/category.service';
import { ProductTypeService } from '../../../ProductTypes/Services/product-type.service';

@Component({
  selector: 'app-product-creation',
  standalone: true,
  // --- AHORA: Importa todos los módulos necesarios aquí ---
  imports: [
    CommonModule,
    ReactiveFormsModule, // Esencial para formularios reactivos en componentes Standalone
    RouterModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    InputNumberModule,
    CalendarModule
  ],
  templateUrl: './product-creation.component.html',
  styleUrls: ['./product-creation.component.css'],
})
export class ProductCreationComponent implements OnInit {
  productForm: FormGroup;
  unitOfMeasures: any[] = [];
  categories: any[] = [];
  productTypes: ProductType[] = [];

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  formSubmitAttempt = false;

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private unitOfMeasureService: UnitOfMeasureService,
    private categoryService: CategoryService,
    private productTypeService: ProductTypeService,
    private router: Router
  ) {
    // Inicializa el formulario en el constructor para asegurar que esté disponible inmediatamente
    const today = new Date().toISOString().split('T')[0];
    this.productForm = this.formBuilder.group({
      itemType: ['', Validators.required],
      description: ['', Validators.required],
      reference: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      taxPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      unitOfMeasureId: [null, Validators.required],
      categoryId: [null, Validators.required],
      productTypeId: [null, Validators.required],
      creationDate: [today, Validators.required],
      // No necesitamos 'id' en el formulario de creación, la API debería generarlo.
    });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (this.entData) {
      this.loadInitialData();
    } else {
      console.error("No se encontró el ID de la empresa. No se pueden cargar los datos del formulario.");
      Swal.fire('Error', 'No se pudo identificar la empresa. Vuelva a iniciar sesión.', 'error');
    }
  }

  loadInitialData(): void {
    this.getUnitOfMeasures();
    this.getCategories();
    this.loadProductTypes();
  }

  loadProductTypes(): void {
    this.productTypeService.getProductTypes(this.entData).subscribe({
      next: (data: any) => this.productTypes = data,
      error: (err: any) => console.error('Error al cargar tipos de producto', err)
    });
  }

  getCategories(): void {
    this.categoryService.getCategories(this.entData).subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Error al obtener las categorías:', err)
    });
  }

  getUnitOfMeasures(): void {
    this.unitOfMeasureService.getUnitOfMeasures(this.entData).subscribe({
      next: (data) => this.unitOfMeasures = data,
      error: (err) => console.error('Error al obtener las unidades de medida:', err)
    });
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.productForm.invalid) {
      Swal.fire('Formulario Inválido', 'Por favor, revise todos los campos requeridos.', 'warning');
      // Marcar todos los campos como "tocados" para mostrar los errores
      this.productForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.productForm.value };
    formData.enterpriseId = this.entData;

    // Asegurarse de que los valores numéricos se envíen como números
    formData.cost = Number(formData.cost);
    formData.quantity = Number(formData.quantity);
    formData.taxPercentage = Number(formData.taxPercentage);

    console.log('Datos del formulario:', formData);

    this.productService.createProduct(formData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Creación exitosa',
          text: 'Se ha creado el producto con éxito.',
          icon: 'success',
          confirmButtonColor:   '#000066',
        });
        this.router.navigate(['/commercial/products/list']); // Redirigir a la lista
      },
      error: (err) => {
        console.error('Error al crear el producto:', err);
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al crear el producto.',
          icon: 'error',
          confirmButtonColor: '#000066',
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/commercial/products/list']);
  }
}