import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FinancialStatementsService } from '../../Services/financial-statements.service';
import {
  CreateFinancialStatementEmailScheduleRequest,
  ReportDeliveryFrequency,
  ReportExportFormat,
} from '../../Models/Requests/CreateFinancialStatementEmailScheduleRequest';

export interface FinancialStatementHistory {
  id: number;
  reportId?: string;
  publicId?: string;
  bookName: string;
  generationDate: Date;
  user: string;
  status: string;
}

@Component({
  selector: 'app-financial-statements-scheduling',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    ToastModule,
    FieldsetModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './financial-statements-scheduling.component.html',
  styleUrl: './financial-statements-scheduling.component.css',
})
export class FinancialStatementsSchedulingComponent implements OnInit {
  @Input() historyItem: FinancialStatementHistory | null = null;
  @Output() closeModal = new EventEmitter<any>();

  scheduleForm!: FormGroup;
  minDate: Date;
  isSaving = false;

  readonly frequencyOptions: { label: string; value: ReportDeliveryFrequency }[] =
    [
      { label: 'Diaria', value: 'DAILY' },
      { label: 'Semanal', value: 'WEEKLY' },
      { label: 'Mensual', value: 'MONTHLY' },
    ];

  readonly formatOptions: { label: string; value: ReportExportFormat }[] = [
    { label: 'PDF', value: 'PDF' },
    { label: 'Excel', value: 'EXCEL' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly financialStatementsService: FinancialStatementsService,
    @Optional() public readonly dynamicDialogConfig: DynamicDialogConfig,
    @Optional() public readonly dynamicDialogRef: DynamicDialogRef
  ) {
    this.minDate = new Date();
  }

  get reportInfo(): FinancialStatementHistory | any {
    return this.dynamicDialogConfig?.data || this.historyItem;
  }

  ngOnInit(): void {
    this.scheduleForm = this.fb.group({
      scheduleDate: [new Date(), Validators.required],
      email: ['', [Validators.required, Validators.email]],
      frequency: ['DAILY', Validators.required],
      format: ['PDF', Validators.required],
    });
  }

  close(data?: any): void {
    if (this.dynamicDialogRef) {
      this.dynamicDialogRef.close(data);
      return;
    }

    this.closeModal.emit(data);
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const reportId = this.reportInfo?.reportId;
    if (!reportId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontro el reportId para programar el envio.',
      });
      return;
    }

    const scheduleDate: Date = this.scheduleForm.get('scheduleDate')?.value;
    const frequency: ReportDeliveryFrequency =
      this.scheduleForm.get('frequency')?.value;
    const format: ReportExportFormat = this.scheduleForm.get('format')?.value;
    const email: string = this.scheduleForm.get('email')?.value;

    const payload = this.buildSchedulePayload(
      reportId,
      email,
      frequency,
      format,
      scheduleDate
    );

    this.isSaving = true;
    this.financialStatementsService.createEmailSchedule(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail:
            'Programacion guardada. Proxima ejecucion: ' +
            (response?.nextRunAt || 'calculada por servidor'),
          life: 2400,
        });
        setTimeout(() => this.close(response), 900);
      },
      error: (error) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No fue posible guardar la programacion. ' +
            (error?.error?.message || error.message || ''),
        });
      },
    });
  }

  private buildSchedulePayload(
    reportId: string,
    email: string,
    frequency: ReportDeliveryFrequency,
    format: ReportExportFormat,
    scheduleDate: Date
  ): CreateFinancialStatementEmailScheduleRequest {
    const safeDate = scheduleDate instanceof Date ? scheduleDate : new Date();
    const hourOfDay = safeDate.getHours();
    const minuteOfHour = safeDate.getMinutes();

    let dayOfWeek: number | null = null;
    let dayOfMonth: number | null = null;

    if (frequency === 'WEEKLY') {
      dayOfWeek = this.toIsoWeekDay(safeDate);
    }

    if (frequency === 'MONTHLY') {
      dayOfMonth = Math.min(28, Math.max(1, safeDate.getDate()));
    }

    return {
      reportId,
      recipientEmail: email.trim(),
      format,
      frequency,
      hourOfDay,
      minuteOfHour,
      dayOfWeek,
      dayOfMonth,
      timezone: 'America/Bogota',
    };
  }

  private toIsoWeekDay(date: Date): number {
    const jsDay = date.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }
}
