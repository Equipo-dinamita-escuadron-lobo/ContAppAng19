import { CommonModule } from '@angular/common';
import { Component, Input, Optional } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.css',
})
export class UnderConstructionComponent {
  @Input() title: string = 'En construcción...';
  @Input() purpose: string = 'Esta sección estará disponible próximamente.';
  @Input() tag: string = 'Próximamente';
  @Input() icon: string = 'engineering';

  constructor(@Optional() dialogConfig?: DynamicDialogConfig) {
    const data = dialogConfig?.data;
    if (data) {
      if (typeof data.title === 'string') this.title = data.title;
      if (typeof data.purpose === 'string') this.purpose = data.purpose;
      if (typeof data.tag === 'string') this.tag = data.tag;
      if (typeof data.icon === 'string') this.icon = data.icon;
    }
  }
}
