import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ProductType } from '../../Models/ProductType';
import { ProductTypeService } from '../../Services/product-type.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-product-type-edit',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-type-edit.component.html',
})
export class ProductTypeEditComponent implements OnInit {
  productTypeForm!: FormGroup;
  productTypeId: string | null = null;
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  loading = false;
  currentProductType: ProductType | null = null;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private productTypeService: ProductTypeService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.productTypeForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(255)]]
    });

    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.productTypeId = this.route.snapshot.paramMap.get('id');
    
    if (this.productTypeId) {
      this.loadProductType();
    }
  }

  loadProductType(): void {
    if (this.productTypeId) {
      this.loading = true;
      this.productTypeService.getProductTypeById(this.productTypeId).subscribe({
        next: (productType) => {
          this.currentProductType = productType;
          this.productTypeForm.patchValue({
            name: productType.name,
            description: productType.description
          });
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar el tipo de producto:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el tipo de producto'
          });
          this.loading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.productTypeForm.valid && this.currentProductType && this.entData) {
      this.loading = true;
      
      const updatedProductType: ProductType = {
        ...this.currentProductType,
        name: this.productTypeForm.value.name,
        description: this.productTypeForm.value.description,
        enterpriseId: this.entData.id
      };

      this.productTypeService.updateProductType(updatedProductType).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de producto actualizado correctamente'
          });
          
          setTimeout(() => {
            this.router.navigate(['/commercial/business-masters/product-types/list']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error al actualizar el tipo de producto:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el tipo de producto'
          });
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  deleteProductType(): void {
    if (this.productTypeId) {
      this.confirmationService.confirm({
        message: '¿Estás seguro de que deseas eliminar este tipo de producto? Esta acción no se puede deshacer.',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.productTypeService.deleteProductType(this.productTypeId!).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Tipo de producto eliminado correctamente'
              });
              
              setTimeout(() => {
                this.router.navigate(['/commercial/business-masters/product-types/list']);
              }, 2000);
            },
            error: (error: any) => {
              console.error('Error al eliminar el tipo de producto:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el tipo de producto'
              });
            }
          });
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productTypeForm.controls).forEach(key => {
      const control = this.productTypeForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/commercial/business-masters/product-types/list']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productTypeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productTypeForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `El campo ${fieldName === 'name' ? 'Nombre' : 'Descripción'} es requerido.`;
      }
      if (field.errors['maxlength']) {
        return `El campo ${fieldName === 'name' ? 'Nombre' : 'Descripción'} excede la longitud máxima permitida.`;
      }
    }
    return '';
  }
}