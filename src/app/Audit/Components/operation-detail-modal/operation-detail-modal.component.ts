import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { OperationAudit } from '../../Models/operations/OperationAudit';
import { OperationType } from '../../Models/enums/OperationType';
import { getFieldLabel, getValueLabel, isVisible } from '../../Models/config/entity-field-config';

@Component({
  selector: 'app-operation-detail-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, TagModule],
  templateUrl: './operation-detail-modal.component.html',
  styleUrl: './operation-detail-modal.component.css'
})
export class OperationDetailModalComponent {

  @Input() visible: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() operation: OperationAudit | null = null;

  readonly OperationType = OperationType;

  getFieldLabel = getFieldLabel;
  getValueLabel = getValueLabel;
  isVisible = isVisible;

  get operationLabel(): string {
    const labels: Record<string, string> = {
      [OperationType.CREATE]:     'Creación',
      [OperationType.UPDATE]:     'Modificación',
      [OperationType.DELETE]:     'Eliminación',
      [OperationType.INACTIVATE]: 'Inactivación',
      [OperationType.ACTIVATE]:   'Activación',
    };
    return labels[this.operation?.operationType ?? ''] ?? '';
  }

  get operationSeverity(): string {
    const map: Record<string, string> = {
      [OperationType.CREATE]:     'success',
      [OperationType.UPDATE]:     'info',
      [OperationType.DELETE]:     'danger',
      [OperationType.INACTIVATE]: 'warning',
      [OperationType.ACTIVATE]:   'success',
    };
    return map[this.operation?.operationType ?? ''] ?? 'info';
  }

  hasContent(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  visibleEntries(obj: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(obj)
      .filter(([key]) => isVisible(key))
      .map(([key, value]) => ({ key, value }));
  }
}
