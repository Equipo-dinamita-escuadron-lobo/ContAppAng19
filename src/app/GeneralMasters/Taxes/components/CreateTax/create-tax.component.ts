import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TaxCreateRequest } from '../../models/Tax';
import { TaxService } from '../../services/tax.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Account } from '../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { cuentasDiferentesValidator, collectLeaves } from '../../CustomValidators/validateTaxInputs';

@Component({
  selector: 'app-create-tax',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './create-tax.component.html',
  styleUrl: './create-tax.component.css'
})
export class CreateTaxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly chartAccountService = inject(ChartAccountService);
  private readonly messageService = inject(MessageService);

  addForm: FormGroup;
  salesTaxes: Account[] = [];
  purchaseTaxes: Account[] = [];
  selectedAccount: any;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  accounts: Account[] = [];
  filterAccount: string = '';

  constructor() {
    this.accounts = [];

    this.addForm = this.formBuilder.group({
      code: ['', Validators.required],
      description: ['', Validators.required],
      interest: [null, [Validators.required, Validators.min(0)]],
      salesTax: [null], // Opcional
      purchaseTax: [null] // Opcional
    }, { validators: cuentasDiferentesValidator });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.getCuentas();
  }

  /**
   * Obtiene las cuentas auxiliares del catálogo de cuentas
   */
  getCuentas(): void {
    if (this.entData?.id) {
      this.chartAccountService.getListAuxiliaryAccounts(this.entData.id).subscribe({
        next: (data: Account[]) => {
          this.accounts = data;
          this.processAccounts();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'No se pudieron cargar las cuentas auxiliares';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      });
    }
  }

  /**
   * Procesa las cuentas para obtener solo las hojas (cuentas finales)
   */
  processAccounts(): void {
    const leaves: Account[] = [];
    this.accounts.forEach(account => {
      collectLeaves(account, leaves);
    });

    this.salesTaxes = [...leaves];
    this.purchaseTaxes = [...leaves];
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.addForm.valid) {
      const formValue = this.addForm.value;

      const taxData: TaxCreateRequest = {
        code: formValue.code,
        description: formValue.description,
        interest: formValue.interest,
        salesTaxId: formValue.salesTax?.id || undefined,
        purchaseTaxId: formValue.purchaseTax?.id || undefined,
        idEnterprise: this.entData?.id || ''
      };

      this.taxService.createTax(taxData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Impuesto creado exitosamente',
            life: 3000
          });
          setTimeout(() => {
            this.goBack();
          }, 1500);
        },
        error: (error) => {
          console.error('Error al crear el impuesto:', error);
          const errorMessage = error?.error?.message || 'No se pudo crear el impuesto';
          const isDuplicateError = errorMessage.toLowerCase().includes('ya existe') ||
                                   errorMessage.toLowerCase().includes('duplicado');
          this.messageService.add({
            severity: 'error',
            summary: isDuplicateError ? 'Registro Duplicado' : 'Error',
            detail: errorMessage
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.addForm.controls).forEach(key => {
      const control = this.addForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navega de vuelta a la lista de impuestos
   */
  goBack(): void {
    this.router.navigate(['/gen-masters/taxes/list']);
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.addForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
      if (field.errors['min']) {
        return `El valor debe ser mayor o igual a ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error de validación personalizada
   */
  getCustomError(): string {
    if (this.addForm.errors?.['cuentasIguales'] && this.addForm.touched) {
      return 'Las cuentas de impuesto de venta e impuesto de compra no pueden ser iguales';
    }
    return '';
  }
}