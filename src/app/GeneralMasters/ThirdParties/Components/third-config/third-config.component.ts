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
  @Input() visible: boolean = false;
  
  @Input() inputData: any;
  
  @Output() close = new EventEmitter<void>();

  entData: string = '';

  showInputThirdType = false;

  showEditThirdType = false;

  showInputTypeId = false;

  showEditTypeId = false;
  newIdentificationCode = '';

  newIdentificationName = '';

  typeIdForm: FormGroup;
  
  editTypeIdForm: FormGroup;
  
  thirdTypeForm: FormGroup;
  editThirdTypeForm: FormGroup;

  editingThirdTypeIndex: number = -1;

  originalThirdType: ThirdType | null = null;

  initialThirdTypeValue: any = {};

  editingTypeIdIndex: number = -1;

  originalTypeId: TypeId | null = null;

  initialTypeIdValue: any = {};

  newThirdTypeName = '';

  typesId: TypeId[] = [];

  thirdTypes: ThirdType[] = [];

  activeTab: string = '0';

  /** Estados de carga */
  loading = false;
  loadingTypeIds = false;
  loadingThirdTypes = false;

  /** Variables para paginación de tipos de ID */
  totalRecordsTypeIds: number = 0;
  currentPageTypeIds: number = 0;
  currentSizeTypeIds: number = 10;
  currentSortFieldTypeIds: string = 'tiName';
  currentSortOrderTypeIds: string = 'asc';
  searchTermTypeIds: string = '';

  /** Variables para paginación de tipos de tercero */
  totalRecordsThirdTypes: number = 0;
  currentPageThirdTypes: number = 0;
  currentSizeThirdTypes: number = 10;
  currentSortFieldThirdTypes: string = 'thirdTypeName';
  currentSortOrderThirdTypes: string = 'asc';
  searchTermThirdTypes: string = '';

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
    this.thirdServiceConfiguration.getThirdTypes(
      this.entData,
      this.currentPageThirdTypes,
      this.currentSizeThirdTypes,
      undefined, // No enviar sortField, el backend siempre ordena por ttName
      this.currentSortOrderThirdTypes,
      this.searchTermThirdTypes || undefined
    ).subscribe({
      next: (response: any) => {
        this.thirdTypes = Array.isArray(response.content) ? response.content : [];
        this.totalRecordsThirdTypes = response?.page?.totalElements || 0;
        this.loadingThirdTypes = false;
      },
      error: (error: any) => {
        this.thirdTypes = [];
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
   * Carga los tipos de identificación con paginación
   */
  private loadTypeIds(): void {
    this.loadingTypeIds = true;
    this.thirdServiceConfiguration.getTypeIds(
      this.entData,
      this.currentPageTypeIds,
      this.currentSizeTypeIds,
      this.currentSortFieldTypeIds,
      this.currentSortOrderTypeIds,
      this.searchTermTypeIds || undefined
    ).subscribe({
      next: (response: any) => {
        this.typesId = Array.isArray(response.content) ? response.content : [];
        this.totalRecordsTypeIds = response?.page?.totalElements || 0;
        this.loadingTypeIds = false;
      },
      error: (error: any) => {
        this.typesId = [];
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
   * Carga los tipos de identificación con paginación lazy
   */
  loadTypeIdsLazy(event: any): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

    // Calcular página y tamaño desde los controles de PrimeNG
    this.currentPageTypeIds = Math.floor(event.first / event.rows);
    this.currentSizeTypeIds = event.rows;
    
    // Manejar ordenamiento si está presente
    if (event.sortField) {
      this.currentSortFieldTypeIds = event.sortField;
      this.currentSortOrderTypeIds = event.sortOrder === 1 ? 'asc' : 'desc';
    }
    
    this.loadTypeIds();
  }

  /**
   * Maneja el cambio en el término de búsqueda para tipos de ID
   */
  onSearchTypeIdsChange(searchTerm: string): void {
    this.searchTermTypeIds = searchTerm;
    this.currentPageTypeIds = 0; // Resetear a la primera página
    this.loadTypeIds();
  }

  /**
   * Recarga la página actual de tipos de ID
   */
  reloadCurrentPageTypeIds(): void {
    this.loadTypeIds();
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
        this.reloadCurrentPageTypeIds();
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
          this.typeIdForm.reset();
          this.typeIdForm.patchValue({
            classification: 'NATURAL_PERSON'
          });
          this.showInputTypeId = false;
          this.reloadCurrentPageTypeIds();
          this.messageService.add({
            severity: 'success',
            summary: 'Registro exitoso',
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
    this.showInputTypeId = false;
    this.showInputThirdType = false;
    
    this.originalTypeId = { ...typeId };
    this.editingTypeIdIndex = index;
    
    this.editTypeIdForm.patchValue({
      code: typeId.typeId,
      name: typeId.typeIdname,
      classification: typeId.classification
    });
    
    this.initialTypeIdValue = {
      code: typeId.typeId?.trim(),
      name: typeId.typeIdname?.trim(),
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
      const code = formValue.code?.trim();
      const name = formValue.name?.trim();
      
      // Verificar si ya existe otro tipo con el mismo código (excluyendo el actual)
      const existingTypeId = this.typesId.find((t, index) => 
        t.typeId.toLowerCase() === code.toLowerCase() && 
        index !== this.editingTypeIdIndex
      );
      
      if (existingTypeId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ya existe otro tipo de identificación con ese código'
        });
        return;
      }

      const classification = this.editTypeIdForm.get('classification')?.value;
      
      const updatedTypeId: TypeId = {
        id: this.originalTypeId.id,
        entId: this.originalTypeId.entId,
        typeId: code,
        typeIdname: name,
        status: this.originalTypeId.status, // Mantener el estado actual
        classification: classification
      };

      this.thirdServiceConfiguration.updateTypeId(updatedTypeId).subscribe({
        next: (response: TypeId) => {
          this.cancelEditTypeId();
          this.reloadCurrentPageTypeIds();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Actualización exitosa',
            detail: 'Tipo de identificación actualizado correctamente'
          });
        },
        error: (error: any) => {
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
    const currentCode = this.editTypeIdForm.get('code')?.value?.trim();
    const currentName = this.editTypeIdForm.get('name')?.value?.trim();
    const currentClassification = this.editTypeIdForm.get('classification')?.value;
    return this.initialTypeIdValue.code !== currentCode ||
           this.initialTypeIdValue.name !== currentName || 
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
          this.reloadCurrentPageTypeIds();
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
          this.thirdTypeForm.reset();
          this.showInputThirdType = false;
          this.reloadCurrentPageThirdTypes();
          this.messageService.add({
            severity: 'success',
            summary: 'Registro exitoso',
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
      name: thirdType.thirdTypeName?.trim()
    };
    
    // Mostrar el formulario de edición
    this.showEditThirdType = true;
  }

  /**
   * Verifica si hay cambios en el formulario de edición de ThirdType
   */
  hasThirdTypeChanges(): boolean {
    const currentName = this.editThirdTypeForm.get('name')?.value?.trim();
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
        entId: this.entData,
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
            summary: 'Actualización exitosa',
            detail: 'Tipo de tercero actualizado correctamente'
          });
        },
        error: (error: any) => {
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
          this.reloadCurrentPageThirdTypes();
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
   * Maneja el cambio en el término de búsqueda para tipos de tercero
   */
  onSearchThirdTypesChange(): void {
    this.currentPageThirdTypes = 0;
    this.loadThirdTypes();
  }

  /**
   * Maneja la carga lazy de tipos de tercero
   */
  loadThirdTypesLazy(event: any): void {
    this.currentPageThirdTypes = event.first / event.rows;
    this.currentSizeThirdTypes = event.rows;
    // Para tipos de tercero, el backend siempre ordena por nombre (ttName), no necesitamos sortField
    this.currentSortOrderThirdTypes = event.sortOrder === 1 ? 'asc' : 'desc';
    this.loadThirdTypes();
  }

  /**
   * Recarga la página actual de tipos de tercero
   */
  reloadCurrentPageThirdTypes(): void {
    this.loadThirdTypes();
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