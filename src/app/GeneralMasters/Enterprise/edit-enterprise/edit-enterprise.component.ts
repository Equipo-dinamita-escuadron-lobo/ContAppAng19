import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '../../../Core/Components/Header/header.component';
import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseDetails } from '../models/EnterpriseDetails';
import {
  LocalStorageMethods,
  EntData,
} from '../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-edit-enterprise',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    CheckboxModule,
    ToastModule,
    HeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './edit-enterprise.component.html',
  styleUrl: './edit-enterprise.component.css',
})
export class EditEnterpriseComponent implements OnInit {
  enterpriseForm!: FormGroup;
  personType: 'juridica' | 'natural' = 'juridica';
  selectedFile: File | null = null;
  loading: boolean = false;
  enterpriseData: EnterpriseDetails | null = null;
  enterpriseId: string = '';
  entData: EntData | null = null;

  // Opciones simuladas (puedes reemplazarlas por endpoints reales)
  enterpriseTypes = [
    { id: 1, name: 'Privada' },
    { id: 2, name: 'Oficial' },
    { id: 3, name: 'Mixta' },
  ];

  taxLiabilities = [
    { id: 1, name: 'Información exógena' },
    { id: 3, name: 'Informante de beneficiarios finales' },
  ];

  taxPayerTypes = [
    { id: 1, name: 'Responsable de IVA' },
    { id: 2, name: 'No Responsable de IVA' },
    { id: 3, name: 'Gran contribuyente' },
  ];

  countries = [
    { id: 1, name: 'Colombia' },
    { id: 2, name: 'Estados Unidos' },
    { id: 3, name: 'España' },
  ];

  departments = [
    { id: 1, name: 'Cauca' },
    { id: 2, name: 'Valle del Cauca' },
    { id: 3, name: 'Antioquia' },
    { id: 4, name: 'Cundinamarca' },
  ];

  city = [
    { id: 1, name: 'Popayán', departmentId: 1 },
    { id: 2, name: 'Cali', departmentId: 2 },
    { id: 3, name: 'Medellín', departmentId: 3 },
    { id: 4, name: 'Bogotá', departmentId: 4 },
  ];

  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadEnterpriseData();
  }

  /** ====================================
   *  Cargar datos de la empresa
   *  ==================================== */
  loadEnterpriseData(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();

    if (this.entData?.id) {
      this.enterpriseId = this.entData.id;
      this.loading = true;
      this.enterpriseService.getEnterpriseById(this.enterpriseId).subscribe({
        next: (data: EnterpriseDetails) => {
          this.enterpriseData = data;
          this.personType = data.personType?.type?.toLowerCase() || 'juridica';
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar datos de la empresa:', error);
          this.loading = false;
        },
      });
    }
  }

  /** ====================================
   *  Inicializar formulario con datos cargados
   *  ==================================== */
  initForm(): void {
    this.enterpriseForm = this.fb.group({
      name: [this.enterpriseData?.name || '', Validators.required],
      enterpriseType: [this.enterpriseData?.enterpriseType || null],
      taxLiabilities: [this.enterpriseData?.taxLiabilities || []],
      legalName: [this.enterpriseData?.personType?.bussinessName || ''],
      ownerName: [this.enterpriseData?.personType?.name || ''],
      lastNames: [this.enterpriseData?.personType?.surname || ''],
      nit: [this.enterpriseData?.nit || '', Validators.required],
      dv: [this.enterpriseData?.dv || ''],
      taxPayerType: [this.enterpriseData?.taxPayerType || null],
      mainActivity: [this.enterpriseData?.mainActivity || ''],
      secondaryActivity: [this.enterpriseData?.secondaryActivity || ''],
      country: [this.enterpriseData?.location?.country || null],
      department: [this.enterpriseData?.location?.department || null],
      city: [this.enterpriseData?.location?.city || null],
      address: [this.enterpriseData?.location?.address || ''],
      phone: [this.enterpriseData?.phone?.replace(/^\+57 /, '') || ''],
      email: [this.enterpriseData?.email || ''],
      hasBranches: [this.enterpriseData?.branch === 'Sí'],
    });

    this.updateFormValidations();
  }

  updateFormValidations(): void {
    if (this.personType === 'juridica') {
      this.enterpriseForm
        .get('legalName')
        ?.setValidators([Validators.required]);
      this.enterpriseForm.get('ownerName')?.clearValidators();
      this.enterpriseForm.get('lastNames')?.clearValidators();
    } else {
      this.enterpriseForm.get('legalName')?.clearValidators();
      this.enterpriseForm
        .get('ownerName')
        ?.setValidators([Validators.required]);
      this.enterpriseForm
        .get('lastNames')
        ?.setValidators([Validators.required]);
    }

    this.enterpriseForm.get('legalName')?.updateValueAndValidity();
    this.enterpriseForm.get('ownerName')?.updateValueAndValidity();
    this.enterpriseForm.get('lastNames')?.updateValueAndValidity();
  }

  onPersonTypeChange(type: 'juridica' | 'natural'): void {
    this.personType = type;
    this.updateFormValidations();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  /** ====================================
   *  Enviar actualización parcial (PATCH)
   *  ==================================== */
  onSubmit(): void {
    if (this.enterpriseForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor complete los campos mínimos necesarios.',
      });
      return;
    }
    // Asegurar prefijo +57 en el número antes de enviar
    const phoneValue = this.enterpriseForm.value.phone.startsWith('+57')
      ? this.enterpriseForm.value.phone
      : `+57 ${this.enterpriseForm.value.phone}`;

    // console.log(this.enterpriseForm.value); // Verifica el contenido del formulario

    // Transformar los datos para que coincidan con el formato esperado por el backend
    const updatedData: any = {
      name: this.enterpriseForm.value.name,
      nit: this.enterpriseForm.value.nit,
      dv: this.enterpriseForm.value.dv,
      phone: phoneValue,
      branch: this.enterpriseForm.value.mainActivity, // Cambia según el campo correcto
      email: this.enterpriseForm.value.email,
      logo: this.selectedFile
        ? this.selectedFile.name
        : this.enterpriseData?.logo,
      mainActivity: this.enterpriseForm.value.mainActivity,
      secondaryActivity: this.enterpriseForm.value.secondaryActivity,
      taxLiabilities: this.enterpriseForm.value.taxLiabilities.map(
        (liability: any) => liability.id
      ), // Solo IDs
      // state: this.enterpriseData?.state || 'ACTIVE', // Si el estado es requerido
      taxPayerType: this.enterpriseForm.value.taxPayerType?.id, // Solo ID
      enterpriseType: this.enterpriseForm.value.enterpriseType?.id, // Solo ID
      personType: {
        type: this.personType.toUpperCase(),
        name: this.enterpriseForm.value.ownerName || null,
        surname: this.enterpriseForm.value.lastNames || null,
        bussinessName: this.enterpriseForm.value.legalName,
      },
      location: {
        address: this.enterpriseForm.value.address,
        city: this.enterpriseForm.value.city?.id, // Solo ID
        department: this.enterpriseForm.value.department?.id, // Solo ID
        country: this.enterpriseForm.value.country?.id, // Solo ID
      },
    };

    console.log('Datos transformados:', updatedData); // Verifica el objeto transformado

    this.enterpriseService
      .updateEnterprise(this.enterpriseId, updatedData)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualización exitosa',
            detail: 'La empresa ha sido actualizada correctamente.',
          });
          this.router.navigate(['/enterprise/list']);
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la empresa.',
          });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  validateNumberInput(event: KeyboardEvent, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Solo permite números del 0 al 9
    const isNumber = /^[0-9]$/.test(key);

    if (!isNumber || input.value.length >= maxLength) {
      event.preventDefault();
    }
  }
}
