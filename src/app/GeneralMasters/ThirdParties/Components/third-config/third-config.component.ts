import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
import { RadioButtonModule } from 'primeng/radiobutton';

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
    ToggleSwitchModule,
    RadioButtonModule
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

  /** Controla la visibilidad del input para editar tipo de tercero */
  showEditThirdType = false;

  /** Controla la visibilidad del input para nuevo tipo de identificación */
  showInputTypeId = false;

  /** Controla la visibilidad del input para editar tipo de identificación */
  showEditTypeId = false;

  /** Código para nueva identificación */
  newIdentificationCode = '';

  /** Nombre para nueva identificación */
  newIdentificationName = '';

  /** Formulario reactivo para tipos de identificación */
  typeIdForm: FormGroup;
  
  /** Formulario reactivo para editar tipos de identificación */
  editTypeIdForm: FormGroup;
  
  /** Formulario reactivo para tipos de terceros */
  thirdTypeForm: FormGroup;

  /** Formulario reactivo para editar tipos de terceros */
  editThirdTypeForm: FormGroup;

  /** Índice del tipo de tercero que se está editando */
  editingThirdTypeIndex: number = -1;

  /** Tipo de tercero original antes de editar */
  originalThirdType: ThirdType | null = null;

  /** Valor inicial del formulario de edición de ThirdType para detectar cambios */
  initialThirdTypeValue: any = {};

  /** Índice del tipo de identificación que se está editando */
  editingTypeIdIndex: number = -1;

  /** Tipo de identificación original antes de editar */
  originalTypeId: TypeId | null = null;

  /** Valor inicial del formulario de edición para detectar cambios */
  initialTypeIdValue: any = {};

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
    private thirdServiceConfiguration: ThirdServiceConfigurationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private localStorageMethods: LocalStorageMethods,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.typeIdForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      name: ['', [Validators.required]],
      classification: ['NATURAL_PERSON', [Validators.required]]
    });
    
    this.editTypeIdForm = this.fb.group({
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      classification: ['NATURAL_PERSON', [Validators.required]]
    });
    
    this.thirdTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/), Validators.minLength(1)]]
    });
    
    this.editThirdTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/), Validators.minLength(1)]]
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
    
    // Asegurarnos de incluir todos los campos, especialmente el id
    const updatedTypeId: TypeId = {
      id: typeId.id,
      entId: typeId.entId,
      typeId: typeId.typeId,
      typeIdname: typeId.typeIdname,
      status: newStatus,
      classification: typeId.classification
    };
    
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
    

    const updatedThirdType: ThirdType = {
      entId: this.entData,
      thirdTypeId: thirdType.thirdTypeId,
      thirdTypeName: thirdType.thirdTypeName,
      status: newStatus
    };
    
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

      const classification = this.typeIdForm.get('classification')?.value;
      
      const newTypeId: TypeId = {
        entId: this.entData,
        typeId: code,
        typeIdname: name,
        status: true,
        classification: classification
      };

      this.thirdServiceConfiguration.createTypeId(newTypeId).subscribe({
        next: (response: TypeId) => {
          array.push(response);
          this.typeIdForm.reset();
          this.typeIdForm.patchValue({
            classification: 'NATURAL_PERSON'
          });
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
    this.typeIdForm.patchValue({
      classification: 'NATURAL_PERSON'
    });
    this.showInputTypeId = false;
  }

  /**
   * Inicia la edición de un tipo de identificación
   */
  editTypeId(typeId: TypeId, index: number): void {
    // Cerrar otros formularios
    this.showInputTypeId = false;
    this.showInputThirdType = false;
    
    // Guardar referencia del elemento original
    this.originalTypeId = { ...typeId };
    this.editingTypeIdIndex = index;
    
    // Llenar el formulario con los datos actuales
    this.editTypeIdForm.patchValue({
      code: typeId.typeId,
      name: typeId.typeIdname,
      classification: typeId.classification
    });
    
    // Guardar valor inicial para detectar cambios
    this.initialTypeIdValue = {
      name: typeId.typeIdname,
      classification: typeId.classification
    };
    
    // Mostrar el formulario de edición
    this.showEditTypeId = true;
  }

  /**
   * Actualiza un tipo de identificación existente
   */
  updateTypeId(): void {
    if (this.editTypeIdForm.invalid || !this.hasTypeIdChanges()) {
      this.editTypeIdForm.markAllAsTouched();
      return;
    }
    
    if (this.originalTypeId) {
      const formValue = this.editTypeIdForm.value;
      const name = formValue.name?.trim();
      
      // Verificar si ya existe otro tipo con el mismo nombre (excluyendo el actual)
      const existingTypeId = this.typesId.find((t, index) => 
        t.typeIdname.toLowerCase() === name.toLowerCase() && 
        index !== this.editingTypeIdIndex
      );
      
      if (existingTypeId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ya existe otro tipo de identificación con ese nombre'
        });
        return;
      }

      const classification = this.editTypeIdForm.get('classification')?.value;
      
      const updatedTypeId: TypeId = {
        entId: this.originalTypeId.entId,
        typeId: this.originalTypeId.typeId, // El código no cambia
        typeIdname: name,
        status: this.originalTypeId.status, // Mantener el estado actual
        classification: classification
      };

      this.thirdServiceConfiguration.updateTypeId(updatedTypeId).subscribe({
        next: (response: TypeId) => {
          // Actualizar el elemento en el array
          this.typesId[this.editingTypeIdIndex] = response;
          
          // Limpiar el formulario y ocultar
          this.cancelEditTypeId();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de identificación actualizado correctamente'
          });
        },
        error: (error: any) => {
          console.error('Error updating type ID:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el tipo de identificación'
          });
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.editTypeIdForm.controls).forEach(key => {
        this.editTypeIdForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Verifica si hay cambios en el formulario de edición de TypeId
   */
  hasTypeIdChanges(): boolean {
    const currentName = this.editTypeIdForm.get('name')?.value;
    const currentClassification = this.editTypeIdForm.get('classification')?.value;
    return this.initialTypeIdValue.name !== currentName || 
           this.initialTypeIdValue.classification !== currentClassification;
  }

  /**
   * Cancela la edición de un tipo de identificación
   */
  cancelEditTypeId(): void {
    this.editTypeIdForm.reset();
    this.showEditTypeId = false;
    this.editingTypeIdIndex = -1;
    this.originalTypeId = null;
    this.initialTypeIdValue = {};
  }

  /**
   * Solicita confirmación para eliminar un tipo de identificación
   */
  confirmDeleteTypeId(typeId: TypeId, index: number): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el tipo de identificación "${typeId.typeIdname}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteTypeId(typeId, index);
      }
    });
  }

  /**
   * Elimina un tipo de identificación
   */
  deleteTypeId(typeId: TypeId, index: number): void {
    // Validar que el typeId tenga un id
    if (!typeId.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede eliminar el tipo de identificación: ID no disponible'
      });
      return;
    }

    this.thirdServiceConfiguration.deleteTypeId(typeId.id, this.entData).subscribe({
      next: (response: boolean) => {
        if (response) {
          this.typesId.splice(index, 1);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de identificación eliminado correctamente'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el tipo de identificación'
          });
        }
      },
      error: (error: any) => {
        let errorMessage = 'Error al eliminar el tipo de identificación';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'No se puede eliminar',
          detail: errorMessage
        });
      }
    });
  }

  /**
   * Agrega un nuevo tipo de tercero
   */
  addThirdType(array: ThirdType[]): void {
    if (this.thirdTypeForm.valid) {
      const name = this.thirdTypeForm.get('name')?.value?.trim();
      
      // Verificar si ya existe el nombre
      const existingThirdType = array.find(t => t.thirdTypeName.toLowerCase() === name.toLowerCase());
      if (existingThirdType) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ya existe un tipo de tercero con ese nombre'
        });
        return;
      }

      const newThirdType: ThirdType = {
        entId: this.entData,
        thirdTypeId: 0,
        thirdTypeName: name,
        status: true
      };

      this.thirdServiceConfiguration.createThirdType(newThirdType).subscribe({
        next: (response: ThirdType) => {
          array.push(response);
          this.thirdTypeForm.reset();
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
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.thirdTypeForm.controls).forEach(key => {
        this.thirdTypeForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Cancela la adición de un tipo de tercero
   */
  cancelAddThirdType(): void {
    this.thirdTypeForm.reset();
    this.showInputThirdType = false;
  }

  /**
   * Inicia la edición de un tipo de tercero
   */
  editThirdType(thirdType: ThirdType, index: number): void {
    // Cerrar otros formularios
    this.showInputTypeId = false;
    this.showInputThirdType = false;
    this.showEditTypeId = false;
    
    // Guardar referencia del elemento original
    this.originalThirdType = { ...thirdType };
    this.editingThirdTypeIndex = index;
    
    // Llenar el formulario con los datos actuales
    this.editThirdTypeForm.patchValue({
      name: thirdType.thirdTypeName
    });
    
    // Guardar valor inicial para detectar cambios
    this.initialThirdTypeValue = {
      name: thirdType.thirdTypeName
    };
    
    // Mostrar el formulario de edición
    this.showEditThirdType = true;
  }

  /**
   * Verifica si hay cambios en el formulario de edición de ThirdType
   */
  hasThirdTypeChanges(): boolean {
    const currentName = this.editThirdTypeForm.get('name')?.value;
    return this.initialThirdTypeValue.name !== currentName;
  }

  /**
   * Actualiza un tipo de tercero existente
   */
  updateThirdType(): void {
    if (this.editThirdTypeForm.invalid || !this.hasThirdTypeChanges()) {
      this.editThirdTypeForm.markAllAsTouched();
      return;
    }
    
    if (this.originalThirdType) {
      const formValue = this.editThirdTypeForm.value;
      const name = formValue.name?.trim();
      
      // Verificar si ya existe otro tipo con el mismo nombre (excluyendo el actual)
      const existingThirdType = this.thirdTypes.find((t, index) => 
        t.thirdTypeName.toLowerCase() === name.toLowerCase() && 
        index !== this.editingThirdTypeIndex
      );
      
      if (existingThirdType) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ya existe otro tipo de tercero con ese nombre'
        });
        return;
      }

      const updatedThirdType: ThirdType = {
        entId: this.originalThirdType.entId,
        thirdTypeId: this.originalThirdType.thirdTypeId,
        thirdTypeName: name,
        status: this.originalThirdType.status // Mantener el estado actual
      };

      this.thirdServiceConfiguration.updateThirdType(updatedThirdType).subscribe({
        next: (response: ThirdType) => {
          // Actualizar el elemento en el array
          this.thirdTypes[this.editingThirdTypeIndex] = response;
          
          // Limpiar el formulario y ocultar
          this.cancelEditThirdType();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de tercero actualizado correctamente'
          });
        },
        error: (error: any) => {
          console.error('Error updating third type:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el tipo de tercero'
          });
        }
      });
    }
  }

  /**
   * Cancela la edición de un tipo de tercero
   */
  cancelEditThirdType(): void {
    this.editThirdTypeForm.reset();
    this.showEditThirdType = false;
    this.editingThirdTypeIndex = -1;
    this.originalThirdType = null;
    this.initialThirdTypeValue = {};
  }

  /**
   * Solicita confirmación para eliminar un tipo de tercero
   */
  confirmDeleteThirdType(thirdType: ThirdType, index: number): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el tipo de tercero "${thirdType.thirdTypeName}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteThirdType(thirdType, index);
      }
    });
  }

  /**
   * Elimina un tipo de tercero
   */
  deleteThirdType(thirdType: ThirdType, index: number): void {
    // Validar que el thirdType tenga un id
    if (!thirdType.thirdTypeId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede eliminar el tipo de tercero: ID no disponible'
      });
      return;
    }

    this.thirdServiceConfiguration.deleteThirdType(thirdType.thirdTypeId, this.entData).subscribe({
      next: (response: boolean) => {
        if (response) {
          this.thirdTypes.splice(index, 1);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tipo de tercero eliminado correctamente'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el tipo de tercero'
          });
        }
      },
      error: (error: any) => {
        let errorMessage = 'Error al eliminar el tipo de tercero';
        
        // Capturar el mensaje del backend
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'No se puede eliminar',
          detail: errorMessage
        });
      }
    });
  }

  /**
   * Verifica si hay elementos cargando
   */
  isLoading(): boolean {
    return this.loadingTypeIds || this.loadingThirdTypes;
  }

  /**
   * Navega de vuelta al módulo de maestros generales
   */
  goBack(): void {
    this.router.navigate(['/gen-masters/third-parties/list']);
  }
}