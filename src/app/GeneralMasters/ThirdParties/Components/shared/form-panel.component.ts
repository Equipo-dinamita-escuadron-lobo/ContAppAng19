import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente para paneles de sección en formularios con título
 */
@Component({
  selector: 'app-form-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg p-20 shadow-sm mb-20 border border-neutral-80">
      <h3 class="section-title text-center border-b border-primary pb-2 mb-24">
        {{ title }}
      </h3>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    h3 {
      font-family: var(--font-family-titillium);
      color: var(--color-primary);
      border-color: var(--color-primary);
      margin-bottom: 24px;
    }
  `]
})
export class FormPanelComponent {
  /** Título del panel */
  @Input() title: string = '';
}
