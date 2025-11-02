import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LocalStorageMethods, EntData } from '../../../../Shared/Methods/local-storage.method';
import { Router } from '@angular/router';
import { EnterpriseService } from '../../../Enterprise/services/enterprise.service';
import { EnterpriseList } from '../../../Enterprise/models/EnterpriseList';
import { ValuationMethodConfigService } from '../../services/valuation-method-config.service';
import {
  ValuationMethodConfig,
  InventoryConfigType
} from '../../models/valuation-method.model';


interface ValuationMethod {
  label: string;
  value: string;
  description: string;
  advantages?: string[];
  disabled?: boolean;
}


interface Enterprise {
  id: string;
  name: string;
}


@Component({
  selector: 'app-valuation-method-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './configuration-valuation-models.component.html',
  styleUrl: './configuration-valuation-models.component.css'
})
export class ValuationMethodConfigComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  configurationForm: FormGroup;
  isLoading = false;
  today = new Date();

  selectedMethod: ValuationMethod | null = null;

  localStorageMethods = new LocalStorageMethods();
  currentEnterprise: EntData | null = null;
  currentInventoryConfigType: 'PEPS' | 'WEIGHTED_AVERAGE' = 'WEIGHTED_AVERAGE';
  isEnterpriseSelected = false;
  showEnterpriseWarning = false;


  valuationMethods: ValuationMethod[] = [
    {
      label: 'PEPS (Primero en Entrar, Primero en Salir)',
      value: 'PEPS',
      description: 'Los productos que entraron primero al inventario son los primeros en salir. Ideal para productos perecederos.',
      advantages: [
        'Refleja mejor el flujo físico real de productos',
        'Inventario valorado a costos más recientes',
        'Mejor para productos con fecha de vencimiento'
      ]
    },
    {
      label: 'Promedio Ponderado',
      value: 'WEIGHTED_AVERAGE',
      description: 'El costo se calcula promediando todos los costos de los productos en inventario.',
      advantages: [
        'Suaviza las fluctuaciones de precios',
        'Fácil de calcular y administrar',
        'Ideal para productos homogéneos'
      ]
    },
  ];


  enterprises: Enterprise[] = [];


  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private valuationMethodConfigService: ValuationMethodConfigService
  ) {
    this.configurationForm = this.createConfigurationForm();
  }


  ngOnInit(): void {
    this.loadEnterpriseFromLocalStorage();
    this.loadEnterprises();
  }

  loadEnterpriseFromLocalStorage(): void {
    this.currentEnterprise = this.localStorageMethods.loadEnterpriseData();

    if (this.currentEnterprise) {
      this.isEnterpriseSelected = true;
      this.currentInventoryConfigType = this.currentEnterprise.inventoryConfigType || 'WEIGHTED_AVERAGE';

      // Deshabilitar el método actual
      this.valuationMethods = this.valuationMethods.map(method => ({
        ...method,
        disabled: method.value === this.currentInventoryConfigType
      }));

      // Preseleccionar la empresa en el formulario
      this.configurationForm.patchValue({
        enterpriseId: this.currentEnterprise.id
      });
    }
  }

  loadEnterprises(): void {
    this.enterpriseService.getEnterprisesActive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.enterprises = data.map(e => ({
          id: String(e.id),
          name: e.name
        }));
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
  }

  private createConfigurationForm(): FormGroup {
    return this.formBuilder.group({
      valuationMethod: ['', Validators.required],
      enterpriseId: ['', Validators.required]
    });
  }


  onValuationMethodChange(event: any): void {
    const methodValue = event.value;
    this.selectedMethod = this.valuationMethods.find(method => method.value === methodValue) || null;
  }


  onSubmit(): void {
    if (this.configurationForm.valid) {
      this.isLoading = true;
      const formValue = this.configurationForm.value;

      // Crear el objeto de configuración
      const config: ValuationMethodConfig = {
        enterpriseId: formValue.enterpriseId,
        valuationMethod: formValue.valuationMethod as InventoryConfigType,
        effectiveDate: new Date()
      };

      // Llamar al servicio para aplicar la configuración
      this.valuationMethodConfigService.applyValuationMethodConfig(config).subscribe({
        next: (response) => {
          // Actualizar el método de valuación en el localStorage
          if (this.currentEnterprise) {
            const updatedEntData: EntData = {
              ...this.currentEnterprise,
              inventoryConfigType: formValue.valuationMethod
            };
            this.localStorageMethods.saveEnterpriseData(updatedEntData);
            this.currentInventoryConfigType = formValue.valuationMethod;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Configuración Aplicada',
            detail: response.message || 'El método de valuación ha sido configurado exitosamente',
            life: 5000
          });

          // Actualizar la lista de métodos para deshabilitar el nuevo método actual
          this.valuationMethods = this.valuationMethods.map(method => ({
            ...method,
            disabled: method.value === this.currentInventoryConfigType
          }));

          this.isLoading = false;

          // Cerrar el modal después de guardar
          setTimeout(() => {
            this.closeModal.emit();
          }, 1500);
        },
        error: (error) => {
          console.error('Error al aplicar la configuración:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo aplicar la configuración del método de valuación',
            life: 5000
          });

          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }
  private markFormGroupTouched(): void {
    Object.keys(this.configurationForm.controls).forEach(key => {
      const control = this.configurationForm.get(key);
      control?.markAsTouched();
    });
  }



  cancelForm(): void {
    this.configurationForm.reset();
    this.selectedMethod = null;
    this.closeModal.emit();
  }
}
