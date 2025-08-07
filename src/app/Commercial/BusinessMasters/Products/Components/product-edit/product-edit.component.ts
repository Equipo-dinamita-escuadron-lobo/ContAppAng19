// commercial/masters/products/components/edit-product/edit-product.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Tus importaciones... ---
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProductType } from '../../Models/ProductType';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ProductService } from '../../Services/product.service';
import { UnitOfMeasureService } from '../../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../../Category/Services/category.service';
import { ProductTypeService } from '../../../ProductTypes/Services/product-type.service';
import { Product } from '../../Models/Product';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    InputNumberModule,
  ],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
})
export class ProductEditComponent implements OnInit {
  productForm: FormGroup;
  unitOfMeasures: any[] = [];
  categories: any[] = [];
  productTypes: ProductType[] = [];
  currentProductId!: string;
  isLoading = true;
  formSubmitAttempt = false;

  // --- CAMBIO 1: Añade esta propiedad para guardar datos originales ---
  private originalProductData!: Product;

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private unitOfMeasureService: UnitOfMeasureService,
    private categoryService: CategoryService,
    private productTypeService: ProductTypeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
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
    });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.loadDropdownData();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentProductId = id;
      this.loadProductData(id);
    } else {
      console.error('ID de producto no encontrado en la ruta');
      Swal.fire('Error', 'No se encontró un ID de producto para editar.', 'error');
      this.router.navigate(['/commercial/masters/products']);
    }
  }

  loadDropdownData(): void {
    if (!this.entData) return;
    this.unitOfMeasureService.getUnitOfMeasures(this.entData).subscribe(data => this.unitOfMeasures = data);
    this.categoryService.getCategories(this.entData).subscribe(data => this.categories = data);
    this.productTypeService.getAllProductTypes().subscribe(data => this.productTypes = data);
  }

  // --- CAMBIO 2: Modifica este método para guardar el producto original ---
  loadProductData(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (product: Product) => {
        this.originalProductData = product; // Guarda el objeto completo
        const formData = {
          ...product,
          productTypeId: product.productType?.id
        };
        this.productForm.patchValue(formData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el producto:', err);
        Swal.fire('Error', 'No se pudieron cargar los datos del producto.', 'error');
        this.isLoading = false;
        this.router.navigate(['/commercial/products/list']); // Ruta corregida
      }
    });
  }

  // --- CAMBIO 3: Reemplaza este método por completo ---
  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.productForm.invalid) {
      Swal.fire('Formulario Inválido', 'Por favor, revise todos los campos requeridos.', 'warning');
      this.productForm.markAllAsTouched();
      return;
    }

    // Combina los datos originales (id, state, etc.) con los datos actualizados del formulario
    const payload: Product = {
      ...this.originalProductData,
      ...this.productForm.value
    };

    // Llama al servicio con los dos argumentos correctos: (ID, DATOS)
    this.productService.updateProduct(this.currentProductId, payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Actualizado!',
          text: 'El producto ha sido actualizado con éxito.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/commercial/products/list']); // Ruta corregida
        });
      },
      error: (err) => {
        console.error('Error al actualizar el producto:', err);
        Swal.fire('Error', 'Ha ocurrido un problema al actualizar el producto.', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/commercial/products/list']); // Ruta corregida
  }
}