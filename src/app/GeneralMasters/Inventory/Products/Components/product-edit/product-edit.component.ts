// src/app/GeneralMasters/Inventory/Products/Components/product-edit/product-edit.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Tus importaciones... ---
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProductType } from '../../../ProductTypes/Models/ProductType';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ProductService } from '../../Services/product.service';
import { UnitOfMeasureService } from '../../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../../Category/Services/category.service';
import { ProductTypeService } from '../../../ProductTypes/Services/product-type.service';
import { Product } from '../../Models/Product';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    SelectModule,
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
  currentProductId!: number;
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
      itemType: ['', Validators.required], // Cambiado de name a itemType
      description: ['', Validators.required],
      reference: [''],
      presentation: [''], // Campo opcional
      quantity: [0, [Validators.required, Validators.min(0)]],
      taxPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      unitOfMeasureId: [null, Validators.required],
      categoryId: [null, Validators.required],
      productTypeId: [null, Validators.required],
      state: [true], // Nuevo campo
    });
  }

  ngOnInit(): void {
    // Las migas de pan se manejan a través del enrutamiento y el componente bread-crumb

    this.entData = this.localStorageMethods.getIdEnterprise();
    this.loadDropdownData();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentProductId = parseInt(id, 10);
      this.loadProductData(this.currentProductId);
    } else {
      console.error('ID de producto no encontrado en la ruta');
      Swal.fire('Error', 'No se encontró un ID de producto para editar.', 'error');
      this.router.navigate(['/gen-masters/inventory/products/list']);
    }
  }

  loadDropdownData(): void {
    if (!this.entData) return;
    this.unitOfMeasureService.getUnitOfMeasures(this.entData).subscribe(data => this.unitOfMeasures = data);
    this.categoryService.getCategories(this.entData).subscribe(data => this.categories = data);
    this.productTypeService.getProductTypes(this.entData).subscribe((data: any) => this.productTypes = data);
  }

  // --- CAMBIO 2: Modifica este método para guardar el producto original ---
  loadProductData(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product: Product) => {
        // Convertir valores numéricos explícitamente
        this.originalProductData = {
          ...product,
          quantity: Number(product.quantity),
          taxPercentage: Number(product.taxPercentage),
          cost: Number(product.cost),
          unitOfMeasureId: Number(product.unitOfMeasureId),
          categoryId: Number(product.categoryId),
          productTypeId: Number(product.productTypeId)
        };
        
        // Usar los mismos valores convertidos para el formulario
        this.productForm.patchValue(this.originalProductData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el producto:', err);
        Swal.fire('Error', 'No se pudieron cargar los datos del producto.', 'error');
        this.isLoading = false;
        this.router.navigate(['/gen-masters/inventory/products/list']); // Ruta corregida
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

    // Verificar si hubo cambios
    const hasChanges = this.hasFormChanges();

    if (!hasChanges) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'No se han detectado cambios en el producto.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
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
          this.router.navigate(['/gen-masters/inventory/products/list']); // Ruta corregida
        });
      },
      error: (err) => {
        console.error('Error al actualizar el producto:', err);
        Swal.fire('Error', 'Ha ocurrido un problema al actualizar el producto.', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory/products/list']); // Ruta corregida
  }

  // Método para verificar si hubo cambios en el formulario
  private hasFormChanges(): boolean {
    if (!this.originalProductData) return false;
    const formData = this.productForm.value;
    
    // Convertir los valores numéricos a números para comparación consistente
    const compareValues = (val1: any, val2: any) => {
      if (typeof val1 === 'number' || typeof val2 === 'number') {
        return Number(val1) !== Number(val2);
      }
      return val1 !== val2;
    };

    const changes = {
      itemType: compareValues(formData.itemType, this.originalProductData.itemType),
      description: compareValues(formData.description, this.originalProductData.description),
      reference: compareValues(formData.reference, this.originalProductData.reference),
      presentation: compareValues(formData.presentation, this.originalProductData.presentation),
      quantity: compareValues(formData.quantity, this.originalProductData.quantity),
      taxPercentage: compareValues(formData.taxPercentage, this.originalProductData.taxPercentage),
      cost: compareValues(formData.cost, this.originalProductData.cost),
      unitOfMeasureId: compareValues(formData.unitOfMeasureId, this.originalProductData.unitOfMeasureId),
      categoryId: compareValues(formData.categoryId, this.originalProductData.categoryId),
      productTypeId: compareValues(formData.productTypeId, this.originalProductData.productTypeId)
    };

    // Devolver true si hay al menos un cambio
    return Object.values(changes).some(changed => changed === true);
  }

  // Método público para verificar si hubo cambios (usado en el template)
  get hasChanges(): boolean {
    if (!this.originalProductData) return false;
    return this.hasFormChanges();
  }
}