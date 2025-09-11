import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Models and Services
import { ThirdService } from '../../Services/third.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';

@Component({
  selector: 'app-third-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    CardModule,
    TagModule,
    TooltipModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService, LocalStorageMethods],
  templateUrl: './third-config.component.html',
  styleUrl: './third-config.component.css'
})
export class ThirdConfigComponent implements OnInit {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos recibidos como input al componente */
  @Input() inputData: any;
  
  /** Evento para cerrar el modal */
  @Output() close = new EventEmitter<void>();

  /** Datos de la empresa actual */
  entData: string = '';

  /** Controla la visibilidad del input para nuevo tipo de tercero */
  showInputThirdType = false;

  /** Controla la visibilidad del input para nuevo tipo de identificación */
  showInputTypeId = false;

  /** Código para nueva identificación */
  newIdentificationCode = '';

  /** Nombre para nueva identificación */
  newIdentificationName = '';

  /** Formulario reactivo para tipos de identificación */
  typeIdForm: FormGroup;

  /** Nombre para nuevo tipo de tercero */
  newThirdTypeName = '';

  /** Array de tipos de identificación */
  typesId: TypeId[] = [];

  /** Array de tipos de terceros */
  thirdTypes: ThirdType[] = [];

  /** Pestaña activa por defecto */
  activeTab: string = '0';

  /** Estados de carga */
  loading = false;
  loadingTypeIds = false;
  loadingThirdTypes = false;

  /**
   * Constructor del componente
   */
  constructor(
    private thirdService: ThirdService,
    private thirdServiceConfiguration: ThirdServiceConfigurationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private localStorageMethods: LocalStorageMethods,
    private fb: FormBuilder
  ) {
    this.typeIdForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      name: ['', [Validators.required]]
    });
  }

  /**
   * Inicializa el componente cargando los datos necesarios
   */
  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    this.loadData();
  }

  /**
   * Se ejecuta cuando cambian los inputs
   */
  ngOnChanges(): void {
    if (this.visible) {
      this.loadData();
    }
  }


  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    this.loadThirdTypes();
    this.loadTypeIds();
  }

  /**
   * Carga los tipos de tercero
   */
  private loadThirdTypes(): void {
    this.loadingThirdTypes = true;
    this.thirdServiceConfiguration.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        this.thirdTypes = response;
        this.loadingThirdTypes = false;
      },
      error: (error: any) => {
        console.error('Error loading third types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Tercero Para esta Empresa'
        });
        this.loadingThirdTypes = false;
      }
    });
  }

  /**
   * Carga los tipos de identificación
   */
  private loadTypeIds(): void {
    this.loadingTypeIds = true;
    this.thirdServiceConfiguration.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typesId = response;
        this.loadingTypeIds = false;
      },
      error: (error: any) => {
        console.error('Error loading type IDs:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Identificación Para esta Empresa'
        });
        this.loadingTypeIds = false;
      }
    });
  }


  /**
   * Cambia el estado de un tipo de identificación (activar/desactivar)
   */
  toggleTypeIdStatus(typeId: TypeId, index: number): void {
    const newStatus = !typeId.status;
    const action = newStatus ? 'activar' : 'desactivar';
    
    const updatedTypeId = { ...typeId, status: newStatus };
    
    this.thirdServiceConfiguration.updateTypeId(updatedTypeId).subscribe({
      next: (response: TypeId) => {
        this.typesId[index] = response;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de identificación ${newStatus ? 'activado' : 'desactivado'} correctamente`
        });
      },
      error: (error: any) => {
        console.error('Error updating type ID status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al ${action} el tipo de identificación`
        });
      }
    });
  }

  /**
   * Cambia el estado de un tipo de tercero (activar/desactivar)
   */
  toggleThirdTypeStatus(thirdType: ThirdType, index: number): void {
    const newStatus = !thirdType.status;
    const action = newStatus ? 'activar' : 'desactivar';
    
    const updatedThirdType = { ...thirdType, status: newStatus };
    
    this.thirdServiceConfiguration.updateThirdType(updatedThirdType).subscribe({
      next: (response: ThirdType) => {
        this.thirdTypes[index] = response;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de tercero ${newStatus ? 'activado' : 'desactivado'} correctamente`
        });
      },
      error: (error: any) => {
        console.error('Error updating third type status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al ${action} el tipo de tercero`
        });
      }
    });
  }

  /**
   * Agrega un nuevo tipo de identificación
   */
  addTypeId(array: TypeId[]): void {
    if (this.typeIdForm.valid) {
      const code = this.typeIdForm.get('code')?.value?.trim();
      const name = this.typeIdForm.get('name')?.value?.trim();
      
      // Verificar si ya existe el código
      const existingTypeId = array.find(t => t.typeId.toLowerCase() === code.toLowerCase());
      if (existingTypeId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ya existe un tipo de identificación con ese código'
        });
        return;
      }

      const newTypeId: TypeId = {
        entId: this.entData,
        typeId: code,
        typeIdname: name,
        status: true
      };

      this.thirdServiceConfiguration.createTypeId(newTypeId).subscribe({
        next: (response: TypeId) => {
          array.push(response);
          this.typeIdForm.reset();
          this.showInputTypeId = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de identificación creado correctamente'
          });
        },
        error: (error: any) => {
          console.error('Error creating type ID:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear el tipo de identificación'
          });
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.typeIdForm.controls).forEach(key => {
        this.typeIdForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Cancela la adición de un tipo de identificación
   */
  cancelAddTypeId(): void {
    this.typeIdForm.reset();
    this.showInputTypeId = false;
  }

  /**
   * Agrega un nuevo tipo de tercero
   */
  addThirdType(array: ThirdType[]): void {
    if (!this.newThirdTypeName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor ingrese el nombre del tipo de tercero'
      });
      return;
    }

    const newThirdType: ThirdType = {
      entId: this.entData,
      thirdTypeId: 0,
      thirdTypeName: this.newThirdTypeName.trim(),
      status: true
    };

    this.thirdServiceConfiguration.createThirdType(newThirdType).subscribe({
      next: (response: ThirdType) => {
        array.push(response);
        this.newThirdTypeName = '';
        this.showInputThirdType = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de tercero creado correctamente'
        });
      },
      error: (error: any) => {
        console.error('Error creating third type:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al crear el tipo de tercero'
        });
      }
    });
  }

  /**
   * Cancela la adición de un tipo de tercero
   */
  cancelAddThirdType(): void {
    this.newThirdTypeName = '';
    this.showInputThirdType = false;
  }


  /**
   * Verifica si hay elementos cargando
   */
  isLoading(): boolean {
    return this.loadingTypeIds || this.loadingThirdTypes;
  }
}