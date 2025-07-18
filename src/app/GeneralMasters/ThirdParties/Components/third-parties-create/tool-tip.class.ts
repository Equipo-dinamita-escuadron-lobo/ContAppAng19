import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToolTipService } from '../../Services/tool-tip.service';
import { Tooltip } from '../../models/Tooltip';
import { ElementRef, Injectable, QueryList, ViewChildren } from '@angular/core';

@Injectable()
export class ToolTipClass {
  /** ID del tooltip actual */
  tooltipId: string = '';

  /** Texto del tooltip actual */
  tooltipText: string = '';

  /** Array que almacena todos los tooltips disponibles */
  tooltips: Tooltip[] = [];

  /** Formulario para la gestión de tooltips */
  tooltipForm: FormGroup;

  /** Tooltip que se está mostrando actualmente */
  currentTooltip: Tooltip | undefined;

  /** Controla la visibilidad del tooltip */
  isTooltipVisible: boolean = false;

  /** Indica si se está editando un tooltip */
  isEditingTooltip: boolean = false;

  /** Texto temporal durante la edición del tooltip */
  editTooltipText: string = '';

  /** Coordenadas de posición del tooltip */
  tooltipPosition = { top: 0, left: 0 };

  /** Referencia a los elementos del tooltip en el DOM */
  @ViewChildren('tooltipTrigger') tooltipTriggers!: QueryList<ElementRef>;

  constructor(private tooltipService: ToolTipService, private fb: FormBuilder) {
    this.tooltipForm = this.fb.group({
      entId: ['', Validators.required],
      tip: ['', Validators.required],
    });
  }

  /**
   * Muestra un tooltip específico en una posición determinada
   * @param id ID del tooltip a mostrar
   * @param event Evento del mouse que triggered el tooltip
   */
  showTooltip(id: string, event: MouseEvent): void {
    this.tooltipService.getTooltipById(id).subscribe(
      (tooltip) => {
        this.currentTooltip = tooltip;
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.tooltipPosition = {
          top: rect.top + window.scrollY + 20,
          left: rect.left + window.scrollX + 20,
        };
        this.isTooltipVisible = true;
      },
      (error) => {
        console.error('Error al cargar el tooltip:', error);
      }
    );
  }

  /**
   * Oculta el tooltip actual
   */
  hideTooltip(): void {
    this.isTooltipVisible = false;
  }

  /**
   * Activa el modo de edición para un tooltip específico
   * @param id ID del tooltip a editar
   * @param event Evento del mouse asociado
   */
  editTooltip(id: string, event: MouseEvent): void {
    this.tooltipService.getTooltipById(id).subscribe(
      (tooltip) => {
        this.currentTooltip = tooltip;
        this.editTooltipText = tooltip.tip; // Asignar el texto del tooltip a la propiedad temporal
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        this.tooltipPosition = {
          top: rect.top + window.scrollY + 20,
          left: rect.left + window.scrollX + 20,
        };
        this.isEditingTooltip = true;
      },
      (error) => {
        console.error('Error al cargar el tooltip:', error);
      }
    );
  }

  /**
   * Cierra el modo de edición del tooltip
   */
  closeEditTooltip(): void {
    this.isEditingTooltip = false;
  }

  /**
   * Guarda los cambios realizados en el tooltip en edición
   */
  onSubmitEditTooltip(): void {
    if (this.currentTooltip) {
      this.currentTooltip.tip = this.editTooltipText; // Actualizar el texto del tooltip
      this.tooltipService
        .updateTooltip(this.currentTooltip.entId, this.currentTooltip)
        .subscribe(
          (response) => {
            console.log('Tooltip actualizado:', response);
            this.isEditingTooltip = false;
            // this.loadTooltips(); // Actualizar la lista de tooltips
          },
          (error) => {
            console.error('Error al actualizar el tooltip:', error);
          }
        );
    }
  }

  /**
   * Crea un nuevo tooltip
   */
  createTooltip(): void {
    if (this.tooltipForm.valid) {
      const newTooltip: Tooltip = this.tooltipForm.value;
      this.tooltipService.createTooltip2(newTooltip).subscribe(
        (response) => {
          console.log('Tooltip creado:', response);
          // Aquí puedes agregar lógica adicional, como mostrar una notificación
        },
        (error) => {
          console.error('Error al crear el tooltip:', error);
        }
      );
    }
  }

  /**
   * Actualiza un tooltip existente
   */
  onSubmit(): void {
    const tooltip: Tooltip = { entId: this.tooltipId, tip: this.tooltipText };
    this.tooltipService.updateTooltip(this.tooltipId, tooltip).subscribe(
      (response) => {
        console.log('Tooltip actualizado:', response);
        // this.loadTooltips(); // Actualizar la lista de tooltips
      },
      (error) => {
        console.error('Error al actualizar el tooltip:', error);
      }
    );
  }

  /**
   * Carga todos los tooltips disponibles
   */
  loadTooltips(): void {
    this.tooltipService.getAllTooltips().subscribe(
      (response) => {
        this.tooltips = response;
        console.log('Tooltips cargados:', this.tooltips);
      },
      (error) => {
        console.error('Error al cargar los tooltips:', error);
      }
    );
  }
}
