import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';

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
    DialogModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TabViewModule,
    CardModule
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

  /** Controla la visibilidad de la sección de identificaciones */
  showIdentifications = true;

  /** Datos de la empresa actual */
  entData: string = '';

  /** Controla la visibilidad del input para nuevo tipo de tercero */
  showInputThirdType = false;

  /** Controla la visibilidad del input para nuevo tipo de identificación */
  showInputTypeId = false;

  /** Nombre para nueva identificación */
  newIdentificatioName = '';

  /** Nombre para nuevo tipo de tercero */
  newThirdTypeName = '';

  /** Array de tipos de identificación */
  typesId: TypeId[] = [];

  /** Array de tipos de terceros */
  thirdTypes: ThirdType[] = [];

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
    private localStorageMethods: LocalStorageMethods
  ) {}

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
   * Se ejecuta cuando se oculta el diálogo
   */
  onHide(): void {
    this.close.emit();
  }

  /**
   * Cierra el modal actual
   */
  closePopUp(): void {
    this.close.emit();
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
   * Elimina un tipo de identificación
   */
  deleteItem(array: TypeId[], index: number): void {
    const item = array[index];
    
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el tipo de identificación "${item.typeId}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.thirdServiceConfiguration.deleteId(String(item.entId)).subscribe({
          next: () => {
            array.splice(index, 1);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tipo de identificación eliminado correctamente'
            });
          },
          error: (error: any) => {
            console.error('Error deleting type ID:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al eliminar el tipo de identificación'
            });
          }
        });
      }
    });
  }

  /**
   * Elimina un tipo de tercero
   */
  deleteItemId(array: ThirdType[], index: number): void {
    const item = array[index];
    
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el tipo de tercero "${item.thirdTypeName}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.thirdServiceConfiguration.deleteThird(String(item.entId)).subscribe({
          next: () => {
            array.splice(index, 1);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tipo de tercero eliminado correctamente'
            });
          },
          error: (error: any) => {
            console.error('Error deleting third type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al eliminar el tipo de tercero'
            });
          }
        });
      }
    });
  }

  /**
   * Agrega un nuevo tipo de identificación
   */
  addTypeId(array: TypeId[]): void {
    if (!this.newIdentificatioName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor ingrese el nombre de la identificación'
      });
      return;
    }

    const newTypeId: TypeId = {
      entId: this.entData,
      typeId: this.newIdentificatioName.trim(),
      typeIdname: this.newIdentificatioName.trim()
    };

    this.thirdServiceConfiguration.createTypeId(newTypeId).subscribe({
      next: (response: TypeId) => {
        array.push(response);
        this.newIdentificatioName = '';
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
  }

  /**
   * Cancela la adición de un tipo de identificación
   */
  cancelAddTypeId(): void {
    this.newIdentificatioName = '';
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
      thirdTypeName: this.newThirdTypeName.trim()
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
   * Cambia a la vista de identificaciones
   */
  showIdentificationsView(): void {
    this.showIdentifications = true;
    this.cancelAddTypeId();
    this.cancelAddThirdType();
  }

  /**
   * Cambia a la vista de tipos de tercero
   */
  showThirdTypesView(): void {
    this.showIdentifications = false;
    this.cancelAddTypeId();
    this.cancelAddThirdType();
  }

  /**
   * Verifica si hay elementos cargando
   */
  isLoading(): boolean {
    return this.loadingTypeIds || this.loadingThirdTypes;
  }
}