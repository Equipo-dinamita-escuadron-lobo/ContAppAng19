import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente para etiquetas de campos de formulario con estilo consistente
 */
@Component({
  selector: 'app-form-field-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label 
      [for]="forId"
      [ngClass]="{
        'label-title': true,
        'label-required': required
      }">
      {{ label }}
    </label>
  `,
  styles: [`
    label {
      font-family: var(--font-family-sans);
      color: var(--color-primary);
      font-weight: 600;
    }
  `]
})
export class FormFieldLabelComponent {
  /** Texto de la etiqueta */
  @Input() label: string = '';
  
  /** Indica si el campo es requerido (muestra asterisco) */
  @Input() required: boolean = false;
  
  /** ID del campo asociado (para accesibilidad) */
  @Input() forId?: string;
}
