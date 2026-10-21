import { AbstractControl, ValidationErrors } from '@angular/forms';

export class HelpCenterValidators {
  /**
   * Validador personalizado para el editor Quill.
   * Verifica que el contenido del editor tenga texto.
   */
  static quillEditorRequired(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = control.value;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    return textContent.trim().length === 0 ? { required: true } : null;
  }
}
