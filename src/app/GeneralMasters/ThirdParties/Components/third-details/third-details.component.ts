import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Componentes compartidos
import { FormPanelComponent } from '../shared/form-panel.component';
import { FormFieldLabelComponent } from '../shared/form-field-label.component';

// Models and Services
import { ThirdService } from '../../Services/third.service';
import { ThirdValidationMessagesService } from '../../Services/third-validation-messages.service';
import { Third } from '../../models/Third';
import { ePersonType } from '../../models/ePersonType';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-third-details',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    FormPanelComponent,
    FormFieldLabelComponent
  ],
  providers: [LocalStorageMethods],
  templateUrl: './third-details.component.html',
  styleUrl: './third-details.component.css'
})
export class ThirdDetailsComponent implements OnInit, OnChanges {
  /** Control de visibilidad del modal */
  @Input() visible: boolean = false;
  
  /** Datos recibidos como input en el modal */
  @Input() inputData: any;
  
  /** Evento para cerrar el modal */
  @Output() close = new EventEmitter<void>();

  /** Objeto que almacena los datos del tercero a mostrar */
  thirdData: Third = {
    thId: 0,
    entId: '',
    typeId: { entId: '0', typeId: 'CC', typeIdname: 'CC', status: true, classification: 'NATURAL_PERSON' },
    thirdTypes: [],
    rutPath: undefined,
    personType: ePersonType.natural,
    names: undefined,
    lastNames: undefined,
    socialReason: undefined,
    gender: undefined,
    idNumber: 0,
    verificationNumber: undefined,
    state: false,
    photoPath: undefined,
    country: null,
    province: null,
    city: null,
    address: 'Calle Principal',
    phoneNumber: '1234567890',
    email: 'email@example.com'
  };

  /** Estado de carga de datos */
  loading: boolean = false;

  /**
   * Constructor del componente
   * @param thirdService Servicio para gestionar terceros
   * @param localStorageMethods Métodos para acceder al local storage
   * @param thirdValidationMessagesService Servicio para mensajes de validación y formateo
   */
  constructor(
    private readonly thirdService: ThirdService,
    private readonly localStorageMethods: LocalStorageMethods,
    public readonly thirdValidationMessagesService: ThirdValidationMessagesService
  ) { }

  /**
   * Inicializa el componente y carga los datos del tercero si existe
   */
  ngOnInit(): void {
    this.loadThirdData();
  }

  /**
   * Se ejecuta cuando cambian los inputs
   */
  ngOnChanges(): void {
    if (this.visible && this.inputData?.thId) {
      this.loadThirdData();
    }
  }

  /**
   * Carga los datos del tercero
   */
  private loadThirdData(): void {
    if (this.inputData?.thId && this.inputData.thId > 0) {
      this.loading = true;
      const entId = this.localStorageMethods.getIdEnterprise();
      this.thirdService.getThirdPartie(this.inputData.thId, entId).subscribe({
        next: (third: Third) => {
          this.thirdData = third;
          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;
        }
      });
    }
  }

  /**
   * Cierra el modal de detalles
   */
  closePopUp(): void {
    this.close.emit();
  }

  /**
   * Se ejecuta cuando se oculta el diálogo
   */
  onHide(): void {
    this.close.emit();
  }
}