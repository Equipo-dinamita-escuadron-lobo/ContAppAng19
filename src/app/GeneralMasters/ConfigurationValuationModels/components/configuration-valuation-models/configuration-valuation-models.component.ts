import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';


interface ValuationMethod {
  label: string;
  value: string;
  description: string;
  advantages?: string[];
}


interface Enterprise {
  id: string;
  name: string;
}


interface Currency {
  label: string;
  value: string;
}


interface CurrentConfiguration {
  methodLabel: string;
  effectiveDate: Date;
  status: string;
}


interface PreviewData {
  methodLabel: string;
  enterpriseName: string;
  effectiveDate: Date;
  affectedProducts: number;
}


@Component({
  selector: 'app-valuation-method-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    CalendarModule,
    InputNumberModule,
    TextareaModule,
    MessageModule,
    ToastModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './configuration-valuation-models.component.html',
  styleUrl: './configuration-valuation-models.component.css'
})
export class ValuationMethodConfigComponent implements OnInit {
  configurationForm: FormGroup;
  isLoading = false;
  showAdvancedSettings = false;
  showPreviewModal = false;
  today = new Date();


  selectedMethod: ValuationMethod | null = null;
  currentConfiguration: CurrentConfiguration | null = null;
  previewData: PreviewData | null = null;


  valuationMethods: ValuationMethod[] = [
    {
      label: 'PEPS (Primero en Entrar, Primero en Salir)',
      value: 'FIFO',
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


  enterprises: Enterprise[] = [
    { id: '1', name: 'Empresa Principal S.A.S.' },
    { id: '2', name: 'Sucursal Norte Ltda.' },
    { id: '3', name: 'Almacén Central' }
  ];


  currencies: Currency[] = [
    { label: 'Peso Colombiano (COP)', value: 'COP' },
    { label: 'Dólar Americano (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' }
  ];


  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService
  ) {
    this.configurationForm = this.createConfigurationForm();
  }


  ngOnInit(): void {
    this.loadCurrentConfiguration();
  }


  private createConfigurationForm(): FormGroup {
    return this.formBuilder.group({
      valuationMethod: ['', Validators.required],
      enterpriseId: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      decimalPrecision: [2, [Validators.min(2), Validators.max(6)]],
      baseCurrency: ['COP'],
      notes: ['']
    });
  }


  onValuationMethodChange(event: any): void {
    const methodValue = event.value;
    this.selectedMethod = this.valuationMethods.find(method => method.value === methodValue) || null;
  }


  toggleAdvancedSettings(): void {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }


  previewChanges(): void {
    if (this.configurationForm.valid) {
      const formValue = this.configurationForm.value;
      const selectedEnterprise = this.enterprises.find(e => e.id === formValue.enterpriseId);
      const selectedMethod = this.valuationMethods.find(m => m.value === formValue.valuationMethod);


      this.previewData = {
        methodLabel: selectedMethod?.label || '',
        enterpriseName: selectedEnterprise?.name || '',
        effectiveDate: formValue.effectiveDate,
        affectedProducts: Math.floor(Math.random() * 500) + 100
      };


      this.showPreviewModal = true;
    }
  }


  closePreview(): void {
    this.showPreviewModal = false;
    this.previewData = null;
  }


  confirmApplication(): void {
    this.showPreviewModal = false;
    this.onSubmit();
  }


  onSubmit(): void {
    if (this.configurationForm.valid) {
      this.isLoading = true;
      const formValue = this.configurationForm.value;


      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Configuración Aplicada',
          detail: 'El método de valuación ha sido configurado exitosamente',
          life: 5000
        });


        this.loadCurrentConfiguration();
        this.isLoading = false;
      }, 2000);
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


  private loadCurrentConfiguration(): void {
    this.currentConfiguration = {
      methodLabel: 'Promedio Ponderado',
      effectiveDate: new Date(2024, 0, 1),
      status: 'Activo'
    };
  }


  cancelForm(): void {
    this.configurationForm.reset();
    this.selectedMethod = null;
    this.showAdvancedSettings = false;
  }
}
