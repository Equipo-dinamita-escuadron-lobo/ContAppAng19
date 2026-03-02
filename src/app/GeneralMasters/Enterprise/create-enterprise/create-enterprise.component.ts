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
import { SubjectService } from '../../Subjects/services/subjects.service';
import { Subject } from '../../Subjects/models/subjects';

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
    { id: 1, name: 'Amazonas' },
    { id: 2, name: 'Antioquia' },
    { id: 3, name: 'Arauca' },
    { id: 4, name: 'Atlántico' },
    { id: 5, name: 'Bolívar' },
    { id: 6, name: 'Boyacá' },
    { id: 7, name: 'Caldas' },
    { id: 8, name: 'Caquetá' },
    { id: 9, name: 'Casanare' },
    { id: 10, name: 'Cauca' },
    { id: 11, name: 'Cesar' },
    { id: 12, name: 'Chocó' },
    { id: 13, name: 'Córdoba' },
    { id: 14, name: 'Cundinamarca' },
    { id: 15, name: 'Guainía' },
    { id: 16, name: 'Guaviare' },
    { id: 17, name: 'Huila' },
    { id: 18, name: 'La Guajira' },
    { id: 19, name: 'Magdalena' },
    { id: 20, name: 'Meta' },
    { id: 21, name: 'Nariño' },
    { id: 22, name: 'Norte de Santander' },
    { id: 23, name: 'Putumayo' },
    { id: 24, name: 'Quindío' },
    { id: 25, name: 'Risaralda' },
    { id: 26, name: 'San Andrés y Providencia' },
    { id: 27, name: 'Santander' },
    { id: 28, name: 'Sucre' },
    { id: 29, name: 'Tolima' },
    { id: 30, name: 'Valle del Cauca' },
    { id: 31, name: 'Vaupés' },
    { id: 32, name: 'Vichada' },
    { id: 33, name: 'Bogotá D.C.' },
  ];

  city = [
    { id: 1, name: 'Leticia', departmentId: 1 }, // Amazonas
    { id: 2, name: 'Medellín', departmentId: 2 }, // Antioquia
    { id: 3, name: 'Arauca', departmentId: 3 }, // Arauca
    { id: 4, name: 'Barranquilla', departmentId: 4 }, // Atlántico
    { id: 5, name: 'Cartagena', departmentId: 5 }, // Bolívar
    { id: 6, name: 'Tunja', departmentId: 6 }, // Boyacá
    { id: 7, name: 'Manizales', departmentId: 7 }, // Caldas
    { id: 8, name: 'Florencia', departmentId: 8 }, // Caquetá
    { id: 9, name: 'Yopal', departmentId: 9 }, // Casanare
    { id: 10, name: 'Popayán', departmentId: 10 }, // Cauca
    { id: 11, name: 'Valledupar', departmentId: 11 }, // Cesar
    { id: 12, name: 'Quibdó', departmentId: 12 }, // Chocó
    { id: 13, name: 'Montería', departmentId: 13 }, // Córdoba
    { id: 14, name: 'Bogotá', departmentId: 14 }, // Cundinamarca (si tú usas Bogotá aparte, dímelo)
    { id: 15, name: 'Inírida', departmentId: 15 }, // Guainía
    { id: 16, name: 'San José del Guaviare', departmentId: 16 }, // Guaviare
    { id: 17, name: 'Neiva', departmentId: 17 }, // Huila
    { id: 18, name: 'Riohacha', departmentId: 18 }, // La Guajira
    { id: 19, name: 'Santa Marta', departmentId: 19 }, // Magdalena
    { id: 20, name: 'Villavicencio', departmentId: 20 }, // Meta
    { id: 21, name: 'Pasto', departmentId: 21 }, // Nariño
    { id: 22, name: 'Cúcuta', departmentId: 22 }, // Norte de Santander
    { id: 23, name: 'Mocoa', departmentId: 23 }, // Putumayo
    { id: 24, name: 'Armenia', departmentId: 24 }, // Quindío
    { id: 25, name: 'Pereira', departmentId: 25 }, // Risaralda
    { id: 26, name: 'San Andrés', departmentId: 26 }, // San Andrés y Providencia
    { id: 27, name: 'Bucaramanga', departmentId: 27 }, // Santander
    { id: 28, name: 'Sincelejo', departmentId: 28 }, // Sucre
    { id: 29, name: 'Ibagué', departmentId: 29 }, // Tolima
    { id: 30, name: 'Cali', departmentId: 30 }, // Valle del Cauca
    { id: 31, name: 'Mitú', departmentId: 31 }, // Vaupés
    { id: 32, name: 'Puerto Carreño', departmentId: 32 }, // Vichada
  ];

  subjects = [
    { id: 1, name: 'Contabilidad Financiera', departmentId: 1 },
    { id: 2, name: 'Contabilidad de Costos', departmentId: 1 },
    { id: 3, name: 'Contabilidad Administrativa', departmentId: 1 },
    {
      id: 4,
      name: 'NIIF (Normas Internacionales de Información Financiera)',
      departmentId: 1,
    },
    { id: 5, name: 'Auditoría', departmentId: 1 },
    { id: 6, name: 'Revisoría Fiscal', departmentId: 1 },
    { id: 7, name: 'Tributaria (Impuestos)', departmentId: 1 },
    { id: 8, name: 'Finanzas Corporativas', departmentId: 1 },
    { id: 9, name: 'Presupuestos', departmentId: 1 },
    { id: 10, name: 'Control Interno y Gestión del Riesgo', departmentId: 1 },
  ];

  subjectsList: Subject[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private subjectService: SubjectService,
    private messageService: MessageService,
  ) {}

  // Inicialización del componente
  ngOnInit(): void {
    this.initForm();
    this.subjectsList = this.subjects as any;
  }

  // Inicialización del formulario reactivo
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
      subject: [null, Validators.required],
      semester: [null, Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      hasBranches: [false],
    });

    this.updateFormValidations();
  }

  // Actualiza las validaciones del formulario según el tipo de persona
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

  // Manejo del cambio de tipo de persona
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

  // Manejo de la selección de archivo
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  // Envío del formulario
  onSubmit(): void {
    if (!this.enterpriseForm.valid || !this.selectedFile) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan campos por llenar o el logo no fue seleccionado',
      });
      return;
    }

    this.loading = true;
    const f = this.enterpriseForm.value;

    this.enterpriseService.uploadLogo(this.selectedFile).subscribe({
      next: (res) => {
        const enterpriseDetailsApi = {
          name: f.name,
          nit: f.nit,
          dv: f.dv,
          phone: '+57 ' + f.phone,
          branch: f.hasBranches
            ? 'Comercio al por mayor'
            : 'Comercio minorista',
          email: f.email,

          // AQUÍ ya existe res
          logo: res.url,

          mainActivity: parseInt(f.mainActivity, 10),
          secondaryActivity: f.secondaryActivity
            ? parseInt(f.secondaryActivity, 10)
            : undefined,

          taxLiabilities: f.taxLiabilities.map((t: any) => t.id ?? t),
          state: 'ACTIVE',
          taxPayerType: f.taxPayerType.id ?? f.taxPayerType,
          enterpriseType: f.enterpriseType.id ?? f.enterpriseType,

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
            city: f.city.id ?? f.city,
            department: f.department.id ?? f.department,
            country: f.country.id ?? f.country,
          },

          subjects: f.subject
            ? [{ name: f.subject.name, code: f.subject.code }]
            : undefined,

          semester: f.semester,
        };

        this.enterpriseService
          .createEnterprise(enterpriseDetailsApi)
          .subscribe({
            next: () => {
              this.loading = false;
              this.router.navigate(['/enterprise/list']);
            },
            error: (err) => {
              console.error('Error al crear empresa:', err);
              this.loading = false;
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo crear la empresa.',
              });
            },
          });
      },
      error: (err) => {
        console.error('Error al subir logo:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo subir el logo.',
        });
      },
    });
  }

  // Navegación de regreso a la lista de empresas
  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }

  // validateNumberInput(event: KeyboardEvent): void {
  //   const input = event.target as HTMLInputElement;
  //   const key = event.key;

  //   // Solo permite números y evita más de 10 dígitos
  //   if (!/^[0-9]$/.test(key) || input.value.length >= 10) {
  //     event.preventDefault();
  //   }
  // }

  validateNumberInput(event: KeyboardEvent, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Solo permite números del 0 al 9
    const isNumber = /^[0-9]$/.test(key);

    if (!isNumber || input.value.length >= maxLength) {
      event.preventDefault();
    }
  }

  /* ==================== CARGAR MATERIAS ==================== */
  loadSubjects(): void {
    this.subjectService.getAllSubjects().subscribe({
      next: (data) => {
        this.subjectsList = data;
      },
      error: (err) => {
        console.error('Error al cargar materias:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las materias desde el servidor.',
        });
      },
    });
  }
}
