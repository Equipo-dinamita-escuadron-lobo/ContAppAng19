import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { Option } from '../../Models/common/Option';
import { ExportModalConfig } from '../../Models/export/ExportModalConfig';
import { ExportJobServiceService } from '../../Services/export-job-service.service';
import { ExportFormat } from '../../Models/export/ExportJobResponse';
import { DocumentOperationType } from '../../Models/enums/DocumentOperationType';
import { ExportAppliedFilter } from '../../Models/export/ExportAppliedFilter';


@Component({
  standalone: true,
  selector: 'app-export-modal',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ProgressBarModule,
    DatePickerModule,
    DropdownModule,
    InputTextModule,
    FormsModule,
    ToastModule,
    DividerModule,
    RadioButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './export-modal.component.html',
  styleUrl: './export-modal.component.css'
})
export class ExportModalComponent implements OnDestroy{

  @Input() config!: ExportModalConfig;
  @Output() closed = new EventEmitter<void>();

  private exportJobService = inject(ExportJobServiceService);
  private messageService = inject(MessageService);
  private pollSubscription?: Subscription;

  // Estado del modal
  visible = false;
  phase: 'confirm' | 'filters' | 'progress' | 'error' = 'confirm';

  // Progreso
  jobId?: string;
  progress = 0;
  totalRecords = 0;
  fileName = '';
  errorMessage = '';
  fileBlob?: Blob;

  // Filtros específicos de documentos (se muestran condicionalmente)
  selectedFormat: ExportFormat = 'EXCEL';

  extraFilters = {
    operationType: null as DocumentOperationType | null,
  };

  readonly today = new Date();

  readonly documentOperationOptions: Option<DocumentOperationType | null>[] = [
    { label: 'Todas las operaciones', value: null },
    { label: 'Creación',              value: DocumentOperationType.CREATE },
    { label: 'Modificación',          value: DocumentOperationType.UPDATE },
    { label: 'Eliminación',           value: DocumentOperationType.DELETE },
    { label: 'Aprobación',            value: DocumentOperationType.APPROVE },
    { label: 'Anulación',             value: DocumentOperationType.VOID },
  ];

  /**
   * Filtros resueltos en el momento de abrir el modal.
   * Se calculan UNA vez al abrir para no re-evaluar en cada ciclo de detección.
   */
  resolvedAppliedFilters: ExportAppliedFilter[] = [];

  open(): void {
    this.resetState();
    this.visible = true;

    this.resolvedAppliedFilters = this.config.appliedFilters?.() ?? [];
    this.phase = this.config.showExtraFilters ? 'filters' : 'confirm';
    this.visible = true;
  }

  close(): void {
    this.pollSubscription?.unsubscribe();
    this.visible = false;
    this.closed.emit();
  }

  startExport(format: ExportFormat = 'EXCEL'): void {
    this.phase = 'progress';
    this.progress = 0;
    this.selectedFormat = format;

    const combinedFilters = {
      ...this.config.currentFilters(),
      ...(this.config.showExtraFilters ? this.buildExtraFilters() : {})
    };

    this.pollSubscription = this.config
      .initiateExport(format, combinedFilters)
      .pipe(
        switchMap(({ jobId }) => {
          this.jobId = jobId;
          return this.exportJobService.pollUntilDone(jobId);
        })
      )
      .subscribe({
        next: (status) => {
          this.progress = status.progress;
          this.totalRecords = status.totalRecords ?? 0;
          this.fileName = status.fileName;

          if (status.status === 'COMPLETED') {
            this.downloadAndClose();
          } else if (status.status === 'FAILED') {
            this.errorMessage = status.errorMessage || 'No se pudo completar la exportación.';
            this.phase = 'error';
          }
          
        },
        error: () => {
          this.errorMessage = 'No se pudo completar la exportación.';
          this.phase = 'error';
        }
      });
  }

  downloadFile(): void {
    if (!this.jobId) return;

    this.exportJobService.downloadFile(this.jobId)
      .pipe(
        switchMap(blob => {
          this.triggerDownload(blob);
          return this.exportJobService.removeJob(this.jobId!);
        })
      )
      .subscribe({
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'El archivo se descargó pero no se pudo liberar el job del servidor.'
          });
        }
      });
  }

  retryFilters(): void {
    this.pollSubscription?.unsubscribe();
    this.phase = this.config.showExtraFilters ? 'filters' : 'confirm';
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private buildExtraFilters(): Record<string, any> {
    return {
      operationType: this.extraFilters.operationType ?? undefined
    };
  }

  private triggerDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private resetState(): void {
    this.phase = 'confirm';
    this.progress = 0;
    this.totalRecords = 0;
    this.jobId = undefined;
    this.errorMessage = '';
    this.fileName = '';
    this.selectedFormat = 'EXCEL';
    this.extraFilters = { operationType: null};
    this.resolvedAppliedFilters = [];
  }

  private downloadAndClose(): void {
    if (!this.jobId) return;
    this.exportJobService.downloadFile(this.jobId)
      .pipe(
        switchMap(blob => {
          this.triggerDownload(blob);
          return this.exportJobService.removeJob(this.jobId!);
        })
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Exportación completada',
            detail: `Se exportaron ${this.totalRecords} registros correctamente.`
          });
          this.close();
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Exportación parcial',
            detail: 'El archivo se descargó, pero no se pudo liberar el recurso temporal.'
          });
          this.close();
        }
      });
  }
}
