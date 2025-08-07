import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { LocalStorageMethods, EntData } from '../../../Shared/Methods/local-storage.method';

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
    HeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './edit-enterprise.component.html',
  styleUrl: './edit-enterprise.component.css'
})
export class EditEnterpriseComponent implements OnInit {
  enterpriseForm!: FormGroup;
  personType: 'juridica' | 'natural' = 'juridica';
  selectedFile: File | null = null;
  loading: boolean = false;
  enterpriseData: EnterpriseDetails | null = null;
  enterpriseId: string = '';
  entData: EntData | null = null;

  // Opciones para los dropdowns
  enterpriseTypes = [
    { id: 1, name: 'Privada' },
    { id: 2, name: 'Oficial' },
    { id: 3, name: 'Mixta' }
  ];

  taxLiabilities = [
    { id: 1, name: 'IVA' },
    { id: 2, name: 'ICA' },
    { id: 3, name: 'Retención en la fuente' },
    { id: 4, name: 'Retención de IVA' }
  ];

  taxPayerTypes = [
    { id: 1, name: 'Responsable de IVA' },
    { id: 2, name: 'No responsable de IVA' },
    { id: 3, name: 'Gran contribuyente' }
  ];

  countries = [
    { id: 1, name: 'Colombia' },
    { id: 2, name: 'Estados Unidos' },
    { id: 3, name: 'España' }
  ];

  departments = [
    { id: 1, name: 'Cauca' },
    { id: 2, name: 'Valle del Cauca' },
    { id: 3, name: 'Antioquia' },
    { id: 4, name: 'Cundinamarca' }
  ];

  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private enterpriseService: EnterpriseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadEnterpriseData();
  }

  loadEnterpriseData(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    
    if (this.entData?.id) {
      this.enterpriseId = this.entData.id;
      this.loading = true;
      this.enterpriseService.getEnterpriseById(this.enterpriseId).subscribe({
        next: (data: EnterpriseDetails) => {
          this.enterpriseData = data;
          this.personType = data.personType || 'juridica';
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar datos de la empresa:', error);
          this.loading = false;
        }
      });
    }
  }

  initForm(): void {
    this.enterpriseForm = this.fb.group({
      name: [this.enterpriseData?.name || '', [Validators.required, Validators.minLength(2)]],
      enterpriseType: [this.enterpriseData?.enterpriseType || null, Validators.required],
      taxLiabilities: [this.enterpriseData?.taxLiabilities || [], Validators.required],
      legalName: [this.enterpriseData?.legalName || '', [Validators.required, Validators.minLength(5)]],
      ownerName: [this.enterpriseData?.ownerName || '', [Validators.minLength(2)]],
      lastNames: [this.enterpriseData?.lastNames || '', [Validators.minLength(2)]],
      nit: [this.enterpriseData?.nit || '', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      dv: [this.enterpriseData?.dv || '', [Validators.required, Validators.pattern(/^\d{1}$/)]],
      taxPayerType: [this.enterpriseData?.taxPayerType || null, Validators.required],
      mainActivity: [this.enterpriseData?.mainActivity || '', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      secondaryActivity: [this.enterpriseData?.secondaryActivity || '', [Validators.pattern(/^\d{4}$/)]],
      country: [this.enterpriseData?.location?.country || null],
      department: [this.enterpriseData?.location?.department || null, Validators.required],
      address: [this.enterpriseData?.location?.address || '', [Validators.required, Validators.minLength(10)]],
      phone: [this.enterpriseData?.phone || '', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
      email: [this.enterpriseData?.email || '', [Validators.required, Validators.email]],
      hasBranches: [this.enterpriseData?.branch === 'Sí' || false]
    });

    this.updateFormValidations();
  }

  updateFormValidations(): void {
    if (this.personType === 'juridica') {
      this.enterpriseForm.get('legalName')?.setValidators([Validators.required, Validators.minLength(5)]);
      this.enterpriseForm.get('ownerName')?.clearValidators();
      this.enterpriseForm.get('lastNames')?.clearValidators();
    } else {
      this.enterpriseForm.get('legalName')?.clearValidators();
      this.enterpriseForm.get('ownerName')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.enterpriseForm.get('lastNames')?.setValidators([Validators.required, Validators.minLength(2)]);
    }

    this.enterpriseForm.get('legalName')?.updateValueAndValidity();
    this.enterpriseForm.get('ownerName')?.updateValueAndValidity();
    this.enterpriseForm.get('lastNames')?.updateValueAndValidity();
  }

  onPersonTypeChange(type: 'juridica' | 'natural'): void {
    this.personType = type;
    this.updateFormValidations();
    
    if (type === 'juridica') {
      this.enterpriseForm.get('ownerName')?.setValue('');
      this.enterpriseForm.get('lastNames')?.setValue('');
    } else {
      this.enterpriseForm.get('legalName')?.setValue('');
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      console.log('Archivo seleccionado:', file.name);
    } else {
      console.error('Por favor selecciona un archivo de imagen válido');
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    if (this.enterpriseForm.valid) {
      this.loading = true;
      const formData = this.enterpriseForm.value;
      
      const enterpriseData: EnterpriseDetails = {
        id: this.enterpriseId,
        name: formData.name,
        nit: formData.nit,
        phone: formData.phone,
        branch: formData.hasBranches ? 'Sí' : 'No',
        email: formData.email,
        logo: this.selectedFile ? this.selectedFile.name : (this.enterpriseData?.logo || ''),
        taxLiabilities: formData.taxLiabilities,
        taxPayerType: formData.taxPayerType,
        enterpriseType: formData.enterpriseType,
        personType: this.personType,
        location: {
          country: formData.country,
          department: formData.department,
          address: formData.address
        },
        dv: formData.dv,
        mainActivity: parseInt(formData.mainActivity),
        secondaryActivity: formData.secondaryActivity ? parseInt(formData.secondaryActivity) : undefined,
        legalName: this.personType === 'juridica' ? formData.legalName : undefined,
        ownerName: this.personType === 'natural' ? formData.ownerName : undefined,
        lastNames: this.personType === 'natural' ? formData.lastNames : undefined
      };

      console.log('Datos de empresa a actualizar:', enterpriseData);
      
      this.enterpriseService.updateEnterprise(this.enterpriseId, enterpriseData).subscribe({
        next: (response) => {
          console.log('Empresa actualizada exitosamente:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Empresa actualizada correctamente'
          });
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error al actualizar empresa:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar la empresa'
          });
          this.loading = false;
        }
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan campos por llenar'
      });
      console.log('Formulario inválido:', this.enterpriseForm.errors);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
