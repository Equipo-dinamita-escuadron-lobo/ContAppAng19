import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';

/**
 * Componente para mostrar mensajes de error de validación de formularios
 */
@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <small 
      class="error-message" 
      *ngIf="shouldShowError()">
      <ng-content></ng-content>
    </small>
  `,
  styles: [`
    small {
      font-family: var(--font-family-sans);
    }
  `]
})
export class FormFieldErrorComponent {
  /** Formulario que contiene el campo */
  @Input() form!: FormGroup;
  
  /** Nombre del campo en el formulario */
  @Input() fieldName!: string;
  
  /** Indica si el formulario fue enviado */
  @Input() submitted: boolean = false;

  /**
   * Determina si se debe mostrar el error
   */
  shouldShowError(): boolean {
    const field = this.form.get(this.fieldName);
    return !!(
      field &&
      field.invalid &&
      (this.submitted || field.touched)
    );
  }
}
