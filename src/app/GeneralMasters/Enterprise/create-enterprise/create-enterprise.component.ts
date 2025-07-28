import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-create-enterprise',
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
  templateUrl: './create-enterprise.component.html',
  styleUrl: './create-enterprise.component.css'
})
export class CreateEnterpriseComponent implements OnInit {
  enterpriseForm!: FormGroup;
  personType: 'juridica' | 'natural' = 'juridica';
  selectedFile: File | null = null;
  loading: boolean = false;

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.enterpriseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      enterpriseType: [null, Validators.required],
      taxLiabilities: [[], Validators.required],
      legalName: ['', [Validators.required, Validators.minLength(5)]], // Solo para persona jurídica
      ownerName: ['', [Validators.minLength(2)]], // Solo para persona natural
      lastNames: ['', [Validators.minLength(2)]], // Solo para persona natural
      nit: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      dv: ['', [Validators.required, Validators.pattern(/^\d{1}$/)]],
      taxPayerType: [null, Validators.required],
      mainActivity: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      secondaryActivity: ['', [Validators.pattern(/^\d{4}$/)]],
      country: [null],
      department: [null, Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      hasBranches: [false]
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

    // Actualizar validaciones
    this.enterpriseForm.get('legalName')?.updateValueAndValidity();
    this.enterpriseForm.get('ownerName')?.updateValueAndValidity();
    this.enterpriseForm.get('lastNames')?.updateValueAndValidity();
  }

  onPersonTypeChange(type: 'juridica' | 'natural'): void {
    this.personType = type;
    this.updateFormValidations();
    
    // Limpiar campos cuando cambie el tipo
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
    if (this.enterpriseForm.valid && this.selectedFile) {
      this.loading = true;
      const formData = this.enterpriseForm.value;
      
      const enterpriseData: EnterpriseDetails = {
        name: formData.name,
        nit: formData.nit,
        phone: formData.phone,
        branch: formData.hasBranches ? 'Sí' : 'No',
        email: formData.email,
        logo: this.selectedFile.name, // Nombre del archivo
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
        // Campos específicos según tipo de persona
        legalName: this.personType === 'juridica' ? formData.legalName : undefined,
        ownerName: this.personType === 'natural' ? formData.ownerName : undefined,
        lastNames: this.personType === 'natural' ? formData.lastNames : undefined
      };

      console.log('Datos de empresa a crear:', enterpriseData);
      
      this.enterpriseService.createEnterprise(enterpriseData).subscribe({
        next: (response) => {
          console.log('Empresa creada exitosamente:', response);
          this.loading = false;
          this.router.navigate(['/enterprise/list']);
        },
        error: (error) => {
          console.error('Error al crear empresa:', error);
          this.loading = false;
        }
      });
    } else {
      // Mostrar notificación de error
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan campos por llenar'
      });
      console.log('Formulario inválido o archivo no seleccionado:', this.enterpriseForm.errors);
    }
  }

  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }
}
