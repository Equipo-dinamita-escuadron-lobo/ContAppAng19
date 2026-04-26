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
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FieldsetModule } from 'primeng/fieldset';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../../Core/auth/services/auth.service';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { Criteria } from '../../Models/Criteria';
import { AuxiliaryBookType } from '../../Models/eAuxiliaryBookType';
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';

type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type DeliveryWay = 'DOWNLOAD' | 'EMAIL';

interface ScheduleFormControls {
  bookType: FormControl<AuxiliaryBookType | null>;
  criteriaType: FormControl<string | null>;
  useAccountRange: FormControl<boolean>;
  rangeFrom: FormControl<number | null>;
  rangeTo: FormControl<number | null>;
  criteriaStartDate: FormControl<Date | null>;
  criteriaEndDate: FormControl<Date | null>;
  startAt: FormControl<Date | null>;
  endAt: FormControl<Date | null>;
  frequency: FormControl<ScheduleFrequency | null>;
  deliveryWay: FormControl<DeliveryWay | null>;
  email: FormControl<string>;
}

interface SchedulingInitialState {
  bookType: AuxiliaryBookType | null;
  bookTypeLocked: boolean;
  criteria: Criteria;
  startAt: Date;
  endAt: Date | null;
  frequency: ScheduleFrequency;
  deliveryWay: DeliveryWay;
  email: string;
  isEditing: boolean;
}

export interface ScheduledReportEmailConfig {
  email: string;
}

export interface CreateScheduledReportRequest {
  entId: string;
  userId: number;
  bookType: AuxiliaryBookType;
  criteria: Criteria;
  frequency: ScheduleFrequency;
  startAt: string;
  endAt: string | null;
  createdBy: string | null;
  deliveryWay: DeliveryWay;
  emailConfig: ScheduledReportEmailConfig | null;
}

export interface AuxiliaryBookHistory {
  id: number;
  bookName: string;
  generationDate: Date | null;
  user: string;
  status: 'Generando' | 'Completado' | 'Error' | string;
  publicId?: string;
  type?: string;
  createdAt?: Date | string;
  userId?: string;
  state?: string;
  etypeEvent?: string;
  criteria?: Partial<Criteria> | null;
  deliveryWay?: string | string[] | null;
  frequency?: string | null;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  scheduleDate?: Date | string | null;
  nextExecutionAt?: Date | string | null;
  email?: string | null;
  scheduleId?: string | number | null;
  auxiliaryBook?: {
    type?: string | null;
    publicId?: string | null;
    createdAt?: Date | string | null;
    userId?: string | null;
    criteria?: Partial<Criteria> | null;
    deliveryWay?: string | string[] | null;
    frequency?: string | null;
    startAt?: Date | string | null;
    endAt?: Date | string | null;
    scheduleDate?: Date | string | null;
    nextExecutionAt?: Date | string | null;
    email?: string | null;
    scheduleId?: string | number | null;
  } | null;
}

export interface AuxiliaryBookSchedulePayload {
  action: 'save' | 'delete';
  scheduleId: string | number | null;
  reportPublicId: string | null;
  request: CreateScheduledReportRequest | null;
}

@Component({
  selector: 'app-auxiliary-books-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    FieldsetModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './auxiliary-books-scheduling.component.html',
  styleUrl: './auxiliary-books-scheduling.component.css',
})
export class AuxiliaryBooksSchedulingComponent implements OnInit {
  @Input() historyItem: AuxiliaryBookHistory | null = null;
  @Output() closeModal =
    new EventEmitter<AuxiliaryBookSchedulePayload | null>();

  scheduleForm!: FormGroup<ScheduleFormControls>;
  minDate = new Date();
  isEditingSchedule = false;
  isBookTypeLocked = false;
  showDeleteConfirmation = false;

  readonly reportTypeOptions = [
    {
      label: 'Libro de Inventarios y Balances',
      value: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      description: 'Cierre contable e inventarios a una fecha determinada.',
    },
    {
      label: 'Libro Diario',
      value: AuxiliaryBookType.DIARY,
      description: 'Movimientos cronologicos por periodo.',
    },
    {
      label: 'Libro Mayor',
      value: AuxiliaryBookType.MAJOR_AND_BALANCES,
      description: 'Saldos y movimientos agrupados por cuenta.',
    },
    {
      label: 'Libro Auxiliar por Cuenta',
      value: AuxiliaryBookType.ACCOUNT,
      description: 'Detalle contable por cuenta y rango.',
    },
    {
      label: 'Libro Auxiliar por Tercero',
      value: AuxiliaryBookType.THIRD_PARTY,
      description: 'Detalle contable asociado a terceros.',
    },
    {
      label: 'Movimiento de Contabilidad',
      value: AuxiliaryBookType.ACCOUNTING_MOVEMENT,
      description: 'Consulta operativa de movimientos contables.',
    },
  ];

  readonly criteriaLevelOptions = [
    { label: 'Clase', value: 'NUMBER_CLASS' },
    { label: 'Grupo', value: 'GROUP' },
    { label: 'Cuenta', value: 'ACCOUNT' },
    { label: 'Subcuenta', value: 'SUB_ACCOUNT' },
    { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
  ];

  readonly frequencyOptions = [
    {
      label: 'Diaria',
      value: 'DAILY' as ScheduleFrequency,
      description: 'Recurrencia cada dia desde la fecha de inicio.',
    },
    {
      label: 'Semanal',
      value: 'WEEKLY' as ScheduleFrequency,
      description: 'Recurrencia semanal a partir de la fecha programada.',
    },
    {
      label: 'Mensual',
      value: 'MONTHLY' as ScheduleFrequency,
      description:
        'Recurrencia mensual tomando como referencia la fecha inicial.',
    },
  ];

  readonly deliveryWayOptions = [
    {
      label: 'Descarga en el sistema',
      value: 'DOWNLOAD' as DeliveryWay,
      description: 'Deja el reporte disponible para visualizacion y descarga.',
    },
    {
      label: 'Correo electronico',
      value: 'EMAIL' as DeliveryWay,
      description: 'Envia el resultado al correo configurado.',
    },
  ];

  private sourceData: AuxiliaryBookHistory | null = null;
  private initialCriteriaMetadata: Pick<
    Criteria,
    'costCenterId' | 'thirdPartyId'
  > = {
    costCenterId: null,
    thirdPartyId: null,
  };

  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly enterpriseService: EnterpriseService,
    private readonly authService: AuthService,
    private readonly auxiliaryBookService: AuxiliaryBooksServiceService,
    @Optional() public dynamicDialogConfig: DynamicDialogConfig,
    @Optional() public dynamicDialogRef: DynamicDialogRef,
  ) {}

  get bookInfo() {
    return this.normalizeBookInfo(this.sourceData);
  }

  get dialogTitle(): string {
    return this.isEditingSchedule ? 'Editar Programacion' : 'Programar Reporte';
  }

  get submitLabel(): string {
    return this.isEditingSchedule
      ? 'Actualizar programacion'
      : 'Guardar programacion';
  }

  get submitIcon(): string {
    return this.isEditingSchedule ? 'pi pi-pencil' : 'pi pi-calendar-plus';
  }

  get canDeleteSchedule(): boolean {
    return (
      this.isEditingSchedule || this.resolveScheduleId(this.sourceData) != null
    );
  }

  get selectedBookTypeLabel(): string {
    const bookType = this.scheduleForm?.getRawValue().bookType;
    return bookType ? this.getReportTypeLabel(bookType) : 'Sin definir';
  }

  get selectedFrequencyLabel(): string {
    const frequency = this.scheduleForm?.getRawValue().frequency;
    return this.getFrequencyLabel(frequency);
  }

  get selectedDeliveryWayLabel(): string {
    const deliveryWay = this.scheduleForm?.getRawValue().deliveryWay;
    return this.getDeliveryWayLabel(deliveryWay);
  }

  ngOnInit(): void {
    this.sourceData =
      (this.dynamicDialogConfig?.data as AuxiliaryBookHistory | null) ??
      this.historyItem;

    const initialState = this.buildInitialState(this.sourceData);

    this.isEditingSchedule = initialState.isEditing;
    this.isBookTypeLocked = initialState.bookTypeLocked;
    this.initialCriteriaMetadata = {
      costCenterId: initialState.criteria.costCenterId,
      thirdPartyId: initialState.criteria.thirdPartyId,
    };

    this.scheduleForm = this.fb.group({
      bookType: this.fb.control<AuxiliaryBookType | null>(
        initialState.bookType,
        Validators.required,
      ),
      criteriaType: this.fb.control<string | null>(
        initialState.criteria.criteriaType || null,
        Validators.required,
      ),
      useAccountRange: this.fb.nonNullable.control(
        Boolean(initialState.criteria.criteriaRange),
      ),
      rangeFrom: this.fb.control<number | null>(
        initialState.criteria.criteriaRange?.from ?? null,
      ),
      rangeTo: this.fb.control<number | null>(
        initialState.criteria.criteriaRange?.to ?? null,
      ),
      criteriaStartDate: this.fb.control<Date | null>(
        this.parseDateLike(initialState.criteria.startDate),
        Validators.required,
      ),
      criteriaEndDate: this.fb.control<Date | null>(
        this.parseDateLike(initialState.criteria.endDate),
        Validators.required,
      ),
      startAt: this.fb.control<Date | null>(
        initialState.startAt,
        Validators.required,
      ),
      endAt: this.fb.control<Date | null>(initialState.endAt),
      frequency: this.fb.control<ScheduleFrequency | null>(
        initialState.frequency,
        Validators.required,
      ),
      deliveryWay: this.fb.control<DeliveryWay | null>(
        initialState.deliveryWay,
        Validators.required,
      ),
      email: this.fb.nonNullable.control(initialState.email),
    });

    if (this.isBookTypeLocked) {
      this.control('bookType')?.disable({ emitEvent: false });
    }

    this.control('useAccountRange')?.valueChanges.subscribe((enabled) => {
      this.updateRangeControls(enabled === true);
    });

    this.control('deliveryWay')?.valueChanges.subscribe((deliveryWay) => {
      this.updateEmailValidators(deliveryWay);
    });

    this.updateRangeControls(this.control('useAccountRange')?.value === true);
    this.updateEmailValidators(this.control('deliveryWay')?.value ?? null);
  }

  control(name: keyof ScheduleFormControls): AbstractControl | null {
    return this.scheduleForm?.get(name) ?? null;
  }

  setFrequency(frequency: ScheduleFrequency): void {
    this.control('frequency')?.setValue(frequency);
  }

  setDeliveryWay(deliveryWay: DeliveryWay): void {
    this.control('deliveryWay')?.setValue(deliveryWay);
  }

  isFrequencySelected(frequency: ScheduleFrequency): boolean {
    return this.control('frequency')?.value === frequency;
  }

  isDeliveryWaySelected(deliveryWay: DeliveryWay): boolean {
    return this.control('deliveryWay')?.value === deliveryWay;
  }

  requiresEmailConfig(deliveryWay: DeliveryWay | null | undefined): boolean {
    return deliveryWay === 'EMAIL';
  }

  isControlInvalid(name: keyof ScheduleFormControls): boolean {
    const control = this.control(name);
    return Boolean(control?.invalid && control?.touched);
  }

  isRangeInvalid(): boolean {
    if (this.control('useAccountRange')?.value !== true) {
      return false;
    }

    const fromValue = this.toNumber(this.control('rangeFrom')?.value);
    const toValue = this.toNumber(this.control('rangeTo')?.value);

    if (fromValue == null || toValue == null) {
      return false;
    }

    return fromValue >= toValue;
  }

  isCriteriaDateRangeInvalid(): boolean {
    const startDate = this.control('criteriaStartDate')?.value;
    const endDate = this.control('criteriaEndDate')?.value;

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      return false;
    }

    return startDate.getTime() > endDate.getTime();
  }

  isScheduleWindowInvalid(): boolean {
    const startAt = this.control('startAt')?.value;
    const endAt = this.control('endAt')?.value;

    if (!(startAt instanceof Date) || !(endAt instanceof Date)) {
      return false;
    }

    return endAt.getTime() < startAt.getTime();
  }

  isStartAtInvalid(): boolean {
    const startAt = this.control('startAt')?.value;

    if (!(startAt instanceof Date)) {
      return false;
    }

    return startAt.getTime() <= new Date().getTime();
  }

  close(data: AuxiliaryBookSchedulePayload | null = null): void {
    if (this.dynamicDialogRef) {
      this.dynamicDialogRef.close(data);
      return;
    }

    this.closeModal.emit(data);
  }

  onSubmit(): void {
    this.scheduleForm.markAllAsTouched();

    const validationMessages = this.collectValidationMessages();

    if (validationMessages.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Configuracion invalida',
        detail: validationMessages.join(' '),
        life: 5000,
      });
      return;
    }

    const payload = this.buildSchedulePayload('save');

    if (!payload.request) {
      return;
    }

    this.isSubmitting = true;

    const editingPublicId =
      this.isEditingSchedule && typeof payload.scheduleId === 'string'
        ? payload.scheduleId
        : null;

    const request$ = editingPublicId
      ? this.auxiliaryBookService.updateScheduledReport(
          editingPublicId,
          payload.request,
        )
      : this.auxiliaryBookService.createScheduledReport(payload.request);

    request$.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Programacion guardada',
          detail: this.isEditingSchedule
            ? 'La programacion se actualizo correctamente.'
            : 'La programacion se guardo correctamente.',
          life: 2200,
        });

        const persistedPayload: AuxiliaryBookSchedulePayload = {
          ...payload,
          scheduleId: response?.publicId ?? payload.scheduleId,
          reportPublicId: response?.publicId ?? payload.reportPublicId,
        };

        setTimeout(() => this.close(persistedPayload), 900);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar la programacion',
          detail:
            err?.error?.message ??
            err?.message ??
            'No se pudo guardar la programacion. Intente de nuevo.',
          life: 5000,
        });
      },
    });
  }

  requestDeleteSchedule(): void {
    this.showDeleteConfirmation = true;
  }

  cancelDeleteRequest(): void {
    this.showDeleteConfirmation = false;
  }

  confirmDeleteSchedule(): void {
    if (!this.canDeleteSchedule) {
      return;
    }

    const payload = this.buildSchedulePayload('delete');
    const publicId =
      typeof payload.scheduleId === 'string' ? payload.scheduleId : null;

    if (!publicId) {
      this.messageService.add({
        severity: 'error',
        summary: 'No se pudo cancelar',
        detail: 'No se encontro un identificador valido para la programacion.',
        life: 5000,
      });
      return;
    }

    this.isSubmitting = true;

    this.auxiliaryBookService.cancelScheduledReport(publicId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showDeleteConfirmation = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Programacion cancelada',
          detail: 'La tarea automatica fue cancelada correctamente.',
          life: 2200,
        });
        setTimeout(() => this.close(payload), 900);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cancelar',
          detail:
            err?.error?.message ??
            err?.message ??
            'No se pudo cancelar la programacion. Intente de nuevo.',
          life: 5000,
        });
      },
    });
  }

  getStatusSeverity(
    status: string | null | undefined,
  ): 'success' | 'warning' | 'danger' | 'info' {
    const normalizedStatus = String(status ?? '').toUpperCase();

    if (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS')
    ) {
      return 'success';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'danger';
    }

    if (
      normalizedStatus.includes('GENER') ||
      normalizedStatus.includes('PENDING') ||
      normalizedStatus.includes('SCHEDULE') ||
      normalizedStatus.includes('PROCESS')
    ) {
      return 'info';
    }

    return 'warning';
  }

  private updateRangeControls(enabled: boolean): void {
    const rangeFromControl = this.control('rangeFrom');
    const rangeToControl = this.control('rangeTo');

    if (enabled) {
      rangeFromControl?.enable({ emitEvent: false });
      rangeToControl?.enable({ emitEvent: false });
      rangeFromControl?.setValidators([Validators.required]);
      rangeToControl?.setValidators([Validators.required]);
    } else {
      rangeFromControl?.clearValidators();
      rangeToControl?.clearValidators();
      rangeFromControl?.setValue(null, { emitEvent: false });
      rangeToControl?.setValue(null, { emitEvent: false });
      rangeFromControl?.disable({ emitEvent: false });
      rangeToControl?.disable({ emitEvent: false });
    }

    rangeFromControl?.updateValueAndValidity({ emitEvent: false });
    rangeToControl?.updateValueAndValidity({ emitEvent: false });
  }

  private updateEmailValidators(
    deliveryWay: DeliveryWay | null | undefined,
  ): void {
    const emailControl = this.control('email');
    const requiresEmail = this.requiresEmailConfig(deliveryWay);

    if (requiresEmail) {
      emailControl?.enable({ emitEvent: false });
      emailControl?.setValidators([Validators.required, Validators.email]);

      if (!emailControl?.value.trim()) {
        emailControl?.setValue(this.resolveCurrentUserEmail(), {
          emitEvent: false,
        });
      }
    } else {
      emailControl?.clearValidators();
      emailControl?.setValue('', { emitEvent: false });
      emailControl?.disable({ emitEvent: false });
    }

    emailControl?.updateValueAndValidity({ emitEvent: false });
  }

  private collectValidationMessages(): string[] {
    const errors: string[] = [];
    const rawValue = this.scheduleForm.getRawValue();
    const userId = this.resolveNumericUserId();
    const enterpriseId = this.resolveEnterpriseId();

    if (!enterpriseId) {
      errors.push(
        'No se encontro una empresa activa para programar el reporte.',
      );
    }

    if (userId == null) {
      errors.push(
        'No se pudo resolver un userId numerico para el usuario autenticado.',
      );
    }

    if (!rawValue.bookType) {
      errors.push('Debe seleccionar un tipo de reporte.');
    }

    if (!rawValue.criteriaType) {
      errors.push('Debe seleccionar un criterio contable.');
    }

    if (!rawValue.criteriaStartDate || !rawValue.criteriaEndDate) {
      errors.push('Debe definir un rango de fechas para los criterios.');
    } else if (this.isCriteriaDateRangeInvalid()) {
      errors.push(
        'La fecha inicial del criterio debe ser anterior o igual a la fecha final.',
      );
    }

    if (rawValue.useAccountRange) {
      const rangeFrom = this.toNumber(rawValue.rangeFrom);
      const rangeTo = this.toNumber(rawValue.rangeTo);

      if (rangeFrom == null || rangeTo == null) {
        errors.push('Debe completar el rango de cuentas.');
      } else if (rangeFrom >= rangeTo) {
        errors.push(
          'El rango de cuentas es invalido. El valor inicial debe ser menor al final.',
        );
      }
    }

    if (!rawValue.startAt) {
      errors.push('Debe definir la fecha inicial de ejecucion.');
    } else if (this.isStartAtInvalid()) {
      errors.push('La fecha inicial de ejecucion debe ser futura.');
    }

    if (this.isScheduleWindowInvalid()) {
      errors.push(
        'La fecha final de programacion debe ser posterior o igual a la fecha inicial.',
      );
    }

    if (!rawValue.frequency || !this.isSupportedFrequency(rawValue.frequency)) {
      errors.push('La frecuencia seleccionada no es soportada.');
    }

    if (
      !rawValue.deliveryWay ||
      !this.isSupportedDeliveryWay(rawValue.deliveryWay)
    ) {
      errors.push('Debe seleccionar un medio de entrega valido.');
    }

    if (this.requiresEmailConfig(rawValue.deliveryWay)) {
      if (!rawValue.email.trim()) {
        errors.push(
          'Debe ingresar un correo electronico para construir el emailConfig.',
        );
      } else if (this.control('email')?.invalid) {
        errors.push('El correo electronico ingresado no es valido.');
      }
    }

    return errors;
  }

  private buildSchedulePayload(
    action: 'save' | 'delete',
  ): AuxiliaryBookSchedulePayload {
    if (action === 'delete') {
      return {
        action,
        scheduleId: this.resolveScheduleId(this.sourceData),
        reportPublicId: this.sourceData?.publicId ?? null,
        request: null,
      };
    }

    const rawValue = this.scheduleForm.getRawValue();
    const user = this.authService.returnUserInfo();
    const bookType =
      rawValue.bookType ?? this.resolveInitialBookType(this.sourceData);

    return {
      action,
      scheduleId: this.resolveScheduleId(this.sourceData),
      reportPublicId: this.sourceData?.publicId ?? null,
      request: {
        entId: this.resolveEnterpriseId() ?? '',
        userId: this.resolveNumericUserId() ?? 0,
        bookType: bookType ?? AuxiliaryBookType.DIARY,
        criteria: {
          criteriaType: rawValue.criteriaType ?? '',
          criteriaRange: rawValue.useAccountRange
            ? {
                from: this.toNumber(rawValue.rangeFrom),
                to: this.toNumber(rawValue.rangeTo),
              }
            : null,
          costCenterId: this.initialCriteriaMetadata.costCenterId,
          thirdPartyId: this.initialCriteriaMetadata.thirdPartyId,
          startDate: this.formatDateOnly(rawValue.criteriaStartDate),
          endDate: this.formatDateOnly(rawValue.criteriaEndDate),
        },
        frequency: rawValue.frequency ?? 'DAILY',
        startAt: rawValue.startAt ? rawValue.startAt.toISOString() : '',
        endAt: rawValue.endAt ? rawValue.endAt.toISOString() : null,
        createdBy: this.resolveCreatedBy(user),
        deliveryWay: rawValue.deliveryWay ?? 'DOWNLOAD',
        emailConfig: this.requiresEmailConfig(rawValue.deliveryWay)
          ? {
              email: rawValue.email.trim(),
            }
          : null,
      },
    };
  }

  private buildInitialState(
    source: AuxiliaryBookHistory | null,
  ): SchedulingInitialState {
    const criteria = this.extractCriteria(source);
    const incomingBookType = this.resolveInitialBookType(source);
    const incomingFrequency =
      source?.frequency ?? source?.auxiliaryBook?.frequency ?? null;
    const incomingDeliveryWay =
      source?.deliveryWay ?? source?.auxiliaryBook?.deliveryWay ?? null;
    const incomingStartAt =
      source?.startAt ??
      source?.scheduleDate ??
      source?.nextExecutionAt ??
      source?.auxiliaryBook?.startAt ??
      source?.auxiliaryBook?.scheduleDate ??
      source?.auxiliaryBook?.nextExecutionAt ??
      null;
    const incomingEndAt = source?.endAt ?? source?.auxiliaryBook?.endAt ?? null;
    const emailSource = source?.email ?? source?.auxiliaryBook?.email ?? null;
    const bookTypeLocked =
      incomingBookType != null &&
      !this.isGenericReportLabel(source?.bookName) &&
      !this.isGenericReportLabel(source?.type);

    return {
      bookType: incomingBookType,
      bookTypeLocked,
      criteria,
      startAt:
        this.parseDateLike(incomingStartAt) ?? this.buildDefaultStartAt(),
      endAt: this.parseDateLike(incomingEndAt),
      frequency: this.parseFrequency(incomingFrequency) ?? 'DAILY',
      deliveryWay: this.parseDeliveryWay(incomingDeliveryWay) ?? 'DOWNLOAD',
      email: emailSource || this.resolveCurrentUserEmail(),
      isEditing: Boolean(
        this.resolveScheduleId(source) != null ||
        incomingStartAt ||
        incomingFrequency ||
        this.isScheduledStatus(
          source?.status ?? source?.state ?? source?.etypeEvent,
        ),
      ),
    };
  }

  private resolveInitialBookType(
    source: AuxiliaryBookHistory | null,
  ): AuxiliaryBookType | null {
    const rawValue =
      source?.type ??
      source?.auxiliaryBook?.type ??
      source?.bookName ??
      this.historyItem?.type ??
      null;

    return this.parseReportType(rawValue);
  }

  private extractCriteria(source: AuxiliaryBookHistory | null): Criteria {
    const criteriaSource = source?.criteria ?? source?.auxiliaryBook?.criteria;
    const criteriaRange = criteriaSource?.criteriaRange ?? null;

    return {
      criteriaType: criteriaSource?.criteriaType ?? '',
      criteriaRange:
        criteriaRange?.from != null && criteriaRange?.to != null
          ? {
              from: this.toNumber(criteriaRange.from),
              to: this.toNumber(criteriaRange.to),
            }
          : null,
      costCenterId: this.toNumber(criteriaSource?.costCenterId),
      thirdPartyId: this.toNumber(criteriaSource?.thirdPartyId),
      startDate: this.parseDateLike(criteriaSource?.startDate),
      endDate: this.parseDateLike(criteriaSource?.endDate),
    };
  }

  private normalizeBookInfo(source: AuxiliaryBookHistory | null | undefined) {
    const generationDate =
      source?.generationDate ??
      source?.createdAt ??
      source?.auxiliaryBook?.createdAt ??
      null;
    const bookType = this.resolveInitialBookType(source ?? null);

    return {
      bookName:
        this.getReportTypeLabel(bookType) ||
        source?.bookName ||
        source?.type ||
        source?.auxiliaryBook?.type ||
        'Libro Auxiliar General',
      status: this.normalizeStatus(
        source?.status || source?.state || source?.etypeEvent,
      ),
      publicId: source?.publicId || source?.auxiliaryBook?.publicId || 'N/A',
      user:
        source?.user ||
        source?.userId ||
        source?.auxiliaryBook?.userId ||
        'Sistema',
      generationDate: this.parseDateLike(generationDate),
    };
  }

  private normalizeStatus(status: string | null | undefined): string {
    const normalizedStatus = String(status ?? '').toUpperCase();

    if (
      normalizedStatus.includes('COMPLET') ||
      normalizedStatus.includes('SUCCESS')
    ) {
      return 'Completado';
    }

    if (
      normalizedStatus.includes('ERROR') ||
      normalizedStatus.includes('FAIL')
    ) {
      return 'Error';
    }

    if (normalizedStatus.includes('SCHEDULE')) {
      return 'Programado';
    }

    if (
      normalizedStatus.includes('GENER') ||
      normalizedStatus.includes('PENDING') ||
      normalizedStatus.includes('PROCESS')
    ) {
      return 'Generando';
    }

    return status || 'Desconocido';
  }

  private getReportTypeLabel(type: AuxiliaryBookType | null): string {
    if (!type) {
      return '';
    }

    return (
      this.reportTypeOptions.find((option) => option.value === type)?.label ||
      type
    );
  }

  private getFrequencyLabel(
    frequency: ScheduleFrequency | null | undefined,
  ): string {
    return (
      this.frequencyOptions.find((option) => option.value === frequency)
        ?.label || 'Sin definir'
    );
  }

  private getDeliveryWayLabel(
    deliveryWay: DeliveryWay | null | undefined,
  ): string {
    return (
      this.deliveryWayOptions.find((option) => option.value === deliveryWay)
        ?.label || 'Sin definir'
    );
  }

  private parseFrequency(
    value: string | null | undefined,
  ): ScheduleFrequency | null {
    const normalizedValue = String(value ?? '')
      .trim()
      .toUpperCase();

    if (normalizedValue.includes('DAY') || normalizedValue.includes('DIAR')) {
      return 'DAILY';
    }

    if (normalizedValue.includes('WEEK') || normalizedValue.includes('SEMAN')) {
      return 'WEEKLY';
    }

    if (normalizedValue.includes('MONTH') || normalizedValue.includes('MENS')) {
      return 'MONTHLY';
    }

    return null;
  }

  private parseDeliveryWay(
    value: string | string[] | null | undefined,
  ): DeliveryWay | null {
    if (!value) {
      return null;
    }

    const normalizedValues = Array.isArray(value)
      ? value.map((item) => String(item).toUpperCase())
      : String(value)
          .split(/[,\s|/;-]+/)
          .filter(Boolean)
          .map((item) => item.toUpperCase());

    const hasDownload = normalizedValues.some((item) =>
      ['DOWNLOAD', 'SYSTEM', 'VIEW', 'VISUALIZATION', 'IN_APP'].includes(item),
    );
    const hasEmail = normalizedValues.some((item) =>
      ['EMAIL', 'MAIL', 'CORREO'].includes(item),
    );

    if (hasEmail) {
      return 'EMAIL';
    }

    if (hasDownload) {
      return 'DOWNLOAD';
    }

    return null;
  }

  private parseReportType(
    value: string | null | undefined,
  ): AuxiliaryBookType | null {
    const normalizedValue = String(value ?? '')
      .trim()
      .toUpperCase()
      .replaceAll('-', '_');

    const reportTypeMap: Record<string, AuxiliaryBookType> = {
      INVENTORY_AND_BALANCES: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      LIBRO_DE_INVENTARIOS_Y_BALANCES: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      DIARY: AuxiliaryBookType.DIARY,
      LIBRO_DIARIO: AuxiliaryBookType.DIARY,
      MAJOR_AND_BALANCES: AuxiliaryBookType.MAJOR_AND_BALANCES,
      LIBRO_MAYOR: AuxiliaryBookType.MAJOR_AND_BALANCES,
      ACCOUNT: AuxiliaryBookType.ACCOUNT,
      ACCOUNT_BOOK: AuxiliaryBookType.ACCOUNT,
      LIBRO_AUXILIAR_POR_CUENTA: AuxiliaryBookType.ACCOUNT,
      THIRD_PARTY: AuxiliaryBookType.THIRD_PARTY,
      THIRD_PARTY_BOOK: AuxiliaryBookType.THIRD_PARTY,
      LIBRO_AUXILIAR_POR_TERCERO: AuxiliaryBookType.THIRD_PARTY,
      ACCOUNTING_MOVEMENT: AuxiliaryBookType.ACCOUNTING_MOVEMENT,
      MOVIMIENTO_DE_CONTABILIDAD: AuxiliaryBookType.ACCOUNTING_MOVEMENT,
    };

    return reportTypeMap[normalizedValue] ?? null;
  }

  private parseDateLike(value: unknown): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }

    const trimmedValue = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      const [year, month, day] = trimmedValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(trimmedValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  private formatDateOnly(value: Date | null): string | null {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildDefaultStartAt(): Date {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);
    return date;
  }

  private resolveCurrentUserEmail(): string {
    return this.authService.returnUserInfo()?.email ?? '';
  }

  private resolveEnterpriseId(): string | null {
    const selectedEnterprise = this.enterpriseService.getSelectedEnterprise();
    return selectedEnterprise?.id ? String(selectedEnterprise.id) : null;
  }

  private resolveNumericUserId(): number | null {
    const userId = this.authService.returnUserInfo()?.id;
    return this.toNumber(userId);
  }

  private resolveCreatedBy(
    user: ReturnType<AuthService['returnUserInfo']>,
  ): string | null {
    if (!user) {
      return null;
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.username || user.email || null;
  }

  private resolveScheduleId(
    source: AuxiliaryBookHistory | null | undefined,
  ): string | number | null {
    return source?.scheduleId ?? source?.auxiliaryBook?.scheduleId ?? null;
  }

  private isSupportedFrequency(value: string): boolean {
    return ['DAILY', 'WEEKLY', 'MONTHLY'].includes(value);
  }

  private isSupportedDeliveryWay(value: string): boolean {
    return ['DOWNLOAD', 'EMAIL'].includes(value);
  }

  private isScheduledStatus(status: string | null | undefined): boolean {
    return String(status ?? '')
      .toUpperCase()
      .includes('SCHEDULE');
  }

  private isGenericReportLabel(value: string | null | undefined): boolean {
    const normalizedValue = String(value ?? '')
      .trim()
      .toUpperCase();

    return !normalizedValue || normalizedValue === 'LIBROS AUXILIARES';
  }
}
