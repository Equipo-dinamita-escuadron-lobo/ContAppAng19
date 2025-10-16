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
import { Enterprise } from '../models/enterprise';
import { EnterpriseList } from '../models/EnterpriseList';

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
    HeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './create-enterprise.component.html',
  styleUrls: ['./create-enterprise.component.css'],
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
    { id: 3, name: 'Mixta' },
  ];

  taxLiabilities = [
    { id: 1, name: 'IVA' },
    { id: 2, name: 'ICA' },
    { id: 3, name: 'Retención en la fuente' },
    { id: 4, name: 'Retención de IVA' },
  ];

  taxPayerTypes = [
    { id: 1, name: 'Responsable de IVA' },
    { id: 2, name: 'No responsable de IVA' },
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
      legalName: ['', [Validators.required, Validators.minLength(5)]],
      ownerName: ['', [Validators.minLength(2)]],
      lastNames: ['', [Validators.minLength(2)]],
      nit: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      dv: ['', [Validators.required, Validators.pattern(/^\d{1}$/)]],
      taxPayerType: [null, Validators.required],
      mainActivity: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      secondaryActivity: ['', [Validators.pattern(/^\d{6}$/)]],
      country: [null],
      department: [null, Validators.required],
      city: [null, Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      hasBranches: [false],
    });

    this.updateFormValidations();
  }

  updateFormValidations(): void {
    if (this.personType === 'juridica') {
      this.enterpriseForm
        .get('legalName')
        ?.setValidators([Validators.required, Validators.minLength(5)]);
      this.enterpriseForm.get('ownerName')?.clearValidators();
      this.enterpriseForm.get('lastNames')?.clearValidators();
    } else {
      this.enterpriseForm.get('legalName')?.clearValidators();
      this.enterpriseForm
        .get('ownerName')
        ?.setValidators([Validators.required, Validators.minLength(2)]);
      this.enterpriseForm
        .get('lastNames')
        ?.setValidators([Validators.required, Validators.minLength(2)]);
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
    } else {
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    if (this.enterpriseForm.valid && this.selectedFile) {
      this.loading = true;
      const f = this.enterpriseForm.value;

      // Transformación para la API
      const enterpriseDetailsApi = {
        name: f.name,
        nit: f.nit,
        dv: f.dv,
        phone: '+57 ' + f.phone,
        branch: f.hasBranches ? 'Comercio al por mayor' : 'Comercio minorista',
        email: f.email,
        logo: 'https://cdn.tusitio.com/logos/' + this.selectedFile.name,
        mainActivity: parseInt(f.mainActivity),
        secondaryActivity: f.secondaryActivity
          ? parseInt(f.secondaryActivity)
          : undefined,
        taxLiabilities: f.taxLiabilities.map((t: any) => t.id || t),
        state: 'ACTIVE',
        taxPayerType: f.taxPayerType.id || f.taxPayerType,
        enterpriseType: f.enterpriseType.id || f.enterpriseType,
        personType:
          this.personType === 'juridica'
            ? {
                type: 'JURIDICA',
                name: null,
                surname: null,
                bussinessName: f.legalName,
              }
            : {
                type: 'NATURAL',
                name: f.ownerName,
                surname: f.lastNames,
                bussinessName: null,
              },
        location: {
          address: f.address,
          city: f.city.id || f.city,
          department: f.department.id || f.department,
          country: f.country.id || f.country,
        },
      };

      console.log('🧾 JSON enviado al backend (enterpriseDetailsApi):');
      console.log(JSON.stringify(enterpriseDetailsApi, null, 2));

      this.enterpriseService.createEnterprise(enterpriseDetailsApi).subscribe({

        next: () => {
          this.loading = false;
          this.router.navigate(['/enterprise/list']);
        },
        error: (err) => {
          console.error('Error al crear empresa:', err);
          this.loading = false;
        },
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan campos por llenar',
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }
}
