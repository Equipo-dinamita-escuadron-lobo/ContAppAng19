import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Tax, TaxUpdateRequest } from '../../models/Tax';
import { TaxService } from '../../services/tax.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Account } from '../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { cuentasDiferentesValidator, collectLeaves } from '../../CustomValidators/validateTaxInputs';

@Component({
  selector: 'app-edit-tax',
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
  templateUrl: './edit-tax.component.html',
  styleUrl: './edit-tax.component.css'
})
export class EditTaxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly chartAccountService = inject(ChartAccountService);
  private readonly messageService = inject(MessageService);

  editForm: FormGroup;
  salesTaxes: Account[] = [];
  purchaseTaxes: Account[] = [];
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  accounts: Account[] = [];
  taxId: number = 0;
  taxData: any = null;
  loading: boolean = false;
  initialFormValues: any = null;
  hasChanges: boolean = false;

  constructor() {
    this.editForm = this.formBuilder.group({
      code: ['', Validators.required],
      description: ['', Validators.required],
      interest: [null, [Validators.required, Validators.min(0)]],
      salesTax: [null], // Opcional
      purchaseTax: [null] // Opcional
    }, { validators: cuentasDiferentesValidator });

    // Suscribirse a cambios del formulario para detectar modificaciones
    this.editForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.taxId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Intentar obtener los datos del impuesto del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    const taxData = navigation?.extras?.state?.['taxData'] || history.state?.taxData;
    
    if (taxData) {
      this.taxData = taxData;
    }
    
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
    
    // Cargar los datos del impuesto después de que las cuentas estén disponibles
    this.loadTax();
  }

  /**
   * Carga los datos del impuesto a editar
   */
  loadTax(): void {
    // Si tenemos los datos del estado de navegación, usarlos directamente
    if (this.taxData) {
      this.setFormValues(this.taxData);
      return;
    }

    // Si no hay datos del estado de navegación, mostrar mensaje de error
    console.error('No se encontraron datos del impuesto para editar');
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos del impuesto.'
    });
  }

  /**
   * Establece los valores del formulario con los datos del impuesto
   */
  private setFormValues(tax: any): void {
    // Obtener códigos de cuenta (puede venir de Tax o TaxList)
    const salesTaxCode = tax.salesTax;
    const purchaseTaxCode = tax.purchaseTax;

    // Buscar las cuentas correspondientes por código
    const salesTax = this.salesTaxes.find(acc => acc.code === salesTaxCode);
    const purchaseTax = this.purchaseTaxes.find(acc => acc.code === purchaseTaxCode);

    this.editForm.patchValue({
      code: tax.code,
      description: tax.description,
      interest: tax.interest,
      salesTax: salesTax,
      purchaseTax: purchaseTax
    });

    // Guardar valores iniciales para comparar cambios
    this.initialFormValues = {
      code: tax.code,
      description: tax.description,
      interest: tax.interest,
      salesTax: salesTax,
      purchaseTax: purchaseTax
    };

    // Resetear estado de cambios
    this.hasChanges = false;
  }

  /**
   * Verifica si hay cambios en el formulario comparando con los valores iniciales
   */
  private checkForChanges(): void {
    if (!this.initialFormValues) {
      this.hasChanges = false;
      return;
    }

    const currentValues = this.editForm.value;
    
    // Comparar cada campo
    const codeChanged = currentValues.code !== this.initialFormValues.code;
    const descriptionChanged = currentValues.description !== this.initialFormValues.description;
    const interestChanged = currentValues.interest !== this.initialFormValues.interest;
    const salesTaxChanged = currentValues.salesTax?.code !== this.initialFormValues.salesTax?.code;
    const purchaseTaxChanged = currentValues.purchaseTax?.code !== this.initialFormValues.purchaseTax?.code;

    this.hasChanges = codeChanged || descriptionChanged || interestChanged ||
                     salesTaxChanged || purchaseTaxChanged;

  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.editForm.valid) {
      const formValue = this.editForm.value;
      
      const taxData: TaxUpdateRequest = {
        id: this.taxId,
        code: formValue.code,
        description: formValue.description,
        interest: formValue.interest,
        salesTaxId: formValue.salesTax?.id || undefined,
        purchaseTaxId: formValue.purchaseTax?.id || undefined,
        idEnterprise: this.entData?.id || ''
      };

      this.taxService.updateTax(taxData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Impuesto actualizado exitosamente',
            life: 3000 // Mantener notificación visible por 3 segundos
          });
          // Navegación después de 1.5 segundos para permitir leer la notificación
          setTimeout(() => {
            this.goBack();
          }, 1500);
        },
        error: (error) => {
          console.error('Error al actualizar el impuesto:', error);
          const errorMessage = error?.error?.message || 'No se pudo actualizar el impuesto';
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
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
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
    const field = this.editForm.get(fieldName);
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
    if (this.editForm.errors?.['cuentasIguales'] && this.editForm.touched) {
      return 'Las cuentas de impuesto de venta e impuesto de compra no pueden ser iguales';
    }
    return '';
  }
}