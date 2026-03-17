import { Directive, OnInit, ViewChild } from '@angular/core';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Account } from '../../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { Criteria } from '../../../Models/Criteria';
import { FinancialStatementType } from '../../../Models/eFinancialStatementType';
import { FinancialStatementsService } from '../../../Services/financial-statements.service';
import { ExportFinancialStatementComponent } from '../../export-financial-statement/export-financial-statement.component';
import { ColumnDefinition } from '../../report-preview/report-preview.component';

export interface FinancialStatementInfo {
  name: string;
  type: FinancialStatementType;
  description: string;
  icon: string;
  usesCutoffDate?: boolean;
  requiresLevelSelection?: boolean;
  requiresPreviousCutoffDate?: boolean;
}

export interface FinancialStatementTableColumn {
  header: string;
  field: string;
  type?: 'number' | 'percentage' | 'text';
  natureField?: string;
}

@Directive()
export abstract class BaseFinancialStatementComponent implements OnInit {
  @ViewChild('fromSelect') fromSelect!: Select;
  @ViewChild('toSelect') toSelect!: Select;
  @ViewChild('thirdPartySelect') thirdPartySelect!: Select;

  financialStatementInfo!: FinancialStatementInfo;
  financialStatementGenerated: any;

  isOptionLevelSelect = false;
  isLevelSelected = false;

  isRangeOptionSelected = false;
  rangeFromOptions: Account[] = [];
  rangeToOptions: Account[] = [];

  thirdPartyOptions: Third[] = [];
  isThirdPartyOptionSelected = false;
  thirdPartySelected: Third | null = null;

  datePeriod: Date[] = [];

  levels: { label: string; value: string }[] = [];
  levelRange: { from: number | null; to: number | null } = {
    from: null,
    to: null,
  };

  enterpriseData: any;

  thirdPartyInfo: {
    typeId: string;
    name: string;
    types: string;
  } | null = null;

  criteria: Criteria = {
    criteriaType: '',
    criteriaRange: null,
    costCenterId: null,
    thirdPartyId: null,
    startDate: null,
    endDate: null,
  };

  errors: string[] = [];

  isReportGenerated = false;

  request: any;
  dataTable: any[] = [];

  tableColumns: FinancialStatementTableColumn[] = [];
  headerConfig: ColumnDefinition[][] = [];

  totalDebit: number | null = null;
  totalCredit: number | null = null;

  refDialog: DynamicDialogRef | undefined;

  constructor(
    protected readonly financialStatementsService: FinancialStatementsService,
    protected readonly authService: AuthService,
    protected readonly enterpriseService: EnterpriseService,
    protected readonly thirdService: ThirdService,
    protected readonly accountService: ChartAccountService,
    protected readonly messageService: MessageService,
    protected readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.getEnterpriseInfo();
    this.ensureEnterpriseContext();
  }

  protected abstract loadConfig(): void;

  protected abstract organizeRequest(): void;

  protected calculateTotals(): void {}

  protected normalizeDataTable(dataTable: any[], _rawResponse?: any): any[] {
    return dataTable;
  }

  protected afterReportLoaded(_rawResponse: any): void {}

  private getEnterpriseInfo(): void {
    this.enterpriseData = this.enterpriseService.getSelectedEnterprise();
  }

  private ensureEnterpriseContext(): void {
    const selectedEnterprise = this.enterpriseService.getSelectedEnterprise();
    if (selectedEnterprise?.id) {
      this.enterpriseData = selectedEnterprise;
      return;
    }
  }

  onLevelChange(): void {
    if (this.criteria.criteriaType.length > 0) {
      this.isLevelSelected = true;
      if (this.isRangeOptionSelected) {
        this.getAccountOptions();
        this.resetRangeDropDowns();
      }
    }
  }

  onRangeSelectionChange(): void {
    if (this.criteria.criteriaType.length === 0) {
      this.isRangeOptionSelected = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'No se puede seleccionar un rango ya que no ha escogido un nivel',
      });
      return;
    }

    if (this.isRangeOptionSelected) {
      this.criteria.criteriaRange = { from: 0, to: 0 };
      this.getAccountOptions();
      return;
    }

    this.criteria.criteriaRange = null;
    this.resetRangeDropDowns();
  }

  private getAccountOptions(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      return;
    }

    this.accountService.getListAccounts(enterpriseId).subscribe({
      next: (response: Account[]) => {
        this.rangeFromOptions = this.filterAccountsByLevel(
          response,
          this.criteria.criteriaType
        );
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se han encontrado Cuentas para esta Empresa. Error: ' +
            err.message,
        });
      },
    });
  }

  get rangeFromOptionsFiltered(): Account[] {
    const maxValue = Math.max(
      ...this.rangeFromOptions.map((opt) => Number.parseInt(opt.code, 10))
    );

    return this.rangeFromOptions.filter(
      (opt) => Number.parseInt(opt.code, 10) < maxValue
    );
  }

  onFromChange(): void {
    if (this.isRangeOptionSelected && this.levelRange.from !== null) {
      this.criteria.criteriaRange!.from = this.levelRange.from;
      this.rangeToOptions = this.rangeFromOptions.filter(
        (opt) => Number.parseInt(opt.code, 10) > this.levelRange.from!
      );
    }
  }

  onToChange(): void {
    if (this.isRangeOptionSelected && this.levelRange.to !== null) {
      this.criteria.criteriaRange!.to = this.levelRange.to;
    }
  }

  private resetRangeDropDowns(): void {
    if (this.fromSelect) {
      this.fromSelect.clear();
    }

    if (this.toSelect) {
      this.toSelect.clear();
    }

    this.levelRange = { from: 0, to: 0 };
  }

  private filterAccountsByLevel(accounts: Account[], level: string): Account[] {
    switch (level) {
      case 'NUMBER_CLASS':
        return accounts;
      case 'GROUP':
        return accounts.flatMap((a) => a.children || []);
      case 'ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) => b.children || [])
        );
      case 'SUB_ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) =>
            (b.children || []).flatMap((c) => c.children || [])
          )
        );
      case 'AUXILIARY_ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) =>
            (b.children || []).flatMap((c) =>
              (c.children || []).flatMap((d) => d.children || [])
            )
          )
        );
      default:
        return [];
    }
  }

  onThirdPartyOptionSelected(): void {
    if (this.isThirdPartyOptionSelected) {
      this.getThirdPartyOptions();
      return;
    }

    if (this.thirdPartySelect) {
      this.thirdPartySelect.clear();
    }
    this.thirdPartySelected = null;
    this.thirdPartyInfo = null;
    this.criteria.thirdPartyId = null;
  }

  private getThirdPartyOptions(): void {
    const enterpriseId = this.resolveEnterpriseId();
    if (!enterpriseId) {
      return;
    }

    this.thirdService.getThirdList(enterpriseId).subscribe({
      next: (response: Third[]) => {
        this.thirdPartyOptions = response.map((third) => ({
          ...third,
          fullName: `${third.names} ${third.lastNames}`,
        }));
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se han encontrado Terceros para esta Empresa. Error: ' +
            err.message,
        });
      },
    });
  }

  onSelectThirdParty(): void {
    if (!this.thirdPartySelected) {
      this.thirdPartyInfo = null;
      this.criteria.thirdPartyId = null;
      return;
    }

    const selectedThird: Third = this.thirdPartySelected;

    setTimeout(() => {
      this.thirdPartyInfo = {
        typeId: selectedThird.typeId.typeId,
        name: `${selectedThird.names} ${selectedThird.lastNames}`,
        types: this.concatenateThirdTypeInfo(selectedThird.thirdTypes),
      };

      this.criteria.thirdPartyId = selectedThird.thId;
    }, 300);
  }

  concatenateThirdTypeInfo(thirdTypes: any): string {
    if (thirdTypes && thirdTypes.length > 0) {
      return thirdTypes.map((type: any) => type.thirdTypeName).join(', ');
    }

    return '';
  }

  protected generateReport(): void {
    if (!this.validateCriteria()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en el formulario',
        detail: this.errors.join('\n'),
      });
      return;
    }

    this.organizeRequest();
    if (!this.hasValidRequestContext()) {
      return;
    }

    this.financialStatementsService
      .registerFinancialStatement(this.request)
      .subscribe({
        next: (data: any) => {
          const resolvedDataTable = this.resolveDataTableFromResponse(data);
          this.dataTable = this.normalizeDataTable(resolvedDataTable, data);
          this.financialStatementGenerated =
            this.resolveFinancialStatementFromResponse(data);

          this.calculateTotals();
          this.afterReportLoaded(data);
          this.isReportGenerated = true;

          if (this.dataTable.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail:
                'La consulta no arrojo resultados con los criterios seleccionados.',
            });
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: 'Se obtuvo la informacion contable con exito.',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'No se pudo obtener la informacion contable. Error: ' +
              err.message,
          });
        },
      });
  }

  private resolveDataTableFromResponse(data: any): any[] {
    if (!data) {
      return [];
    }

    const possibleCollections = [
      data.accountingData,
      data.financialStatementData,
      data.reportData,
      data.content,
      data.data,
    ];

    const collection = possibleCollections.find((item) => Array.isArray(item));
    return Array.isArray(collection) ? collection : [];
  }

  private resolveFinancialStatementFromResponse(data: any): any {
    if (!data) {
      return null;
    }

    return data.financialStatement ?? data.report ?? data;
  }

  protected resolveEnterpriseId(): string | null {
    const selectedEnterprise = this.enterpriseService.getSelectedEnterprise();
    if (selectedEnterprise?.id) {
      this.enterpriseData = selectedEnterprise;
      return String(selectedEnterprise.id);
    }

    const enterpriseId = this.enterpriseData?.id;
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Debe seleccionar una empresa antes de generar el reporte.',
      });
      return null;
    }

    return String(enterpriseId);
  }

  protected resolveCurrentUserId(): number | null {
    const profileId = this.toPositiveNumber(
      this.authService.returnUserInfo()?.id
    );

    if (profileId !== null) {
      return profileId;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'No se encontro un usuario autenticado para generar el reporte.',
      });
      return null;
    }

    try {
      const payload = this.decodeJwtPayload(token);
      const tokenUserId =
        this.toPositiveNumber(payload?.['userId']) ??
        this.toPositiveNumber(payload?.['user_id']) ??
        this.toPositiveNumber(payload?.['id']) ??
        this.toPositiveNumber(payload?.['sub']);

      if (tokenUserId !== null) {
        return tokenUserId;
      }

      const fallbackValue =
        payload?.['sub'] ??
        payload?.['userId'] ??
        payload?.['user_id'] ??
        payload?.['id'] ??
        payload?.['preferred_username'] ??
        payload?.['email'];
      const derivedUserId = this.toDeterministicPositiveNumber(fallbackValue);
      if (derivedUserId !== null) {
        return derivedUserId;
      }
    } catch {
      // Si el token no puede parsearse, reportamos error mas abajo.
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Atencion',
      detail:
        'No fue posible resolver un userId numerico desde la sesion. El backend requiere userId numerico.',
    });
    return null;
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length < 2) {
        return null;
      }

      const payload = tokenParts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(tokenParts[1].length / 4) * 4, '=');

      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private toPositiveNumber(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private toDeterministicPositiveNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    if (!text) {
      return null;
    }

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const positive = Math.abs(hash);
    return positive > 0 ? positive : null;
  }

  private hasValidRequestContext(): boolean {
    const enterpriseId = String(this.request?.entId ?? '').trim();
    const userId = this.toPositiveNumber(this.request?.userId);

    if (!enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el reporte porque la empresa no esta definida.',
      });
      return false;
    }

    if (userId === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el reporte porque el usuario no esta definido.',
      });
      return false;
    }

    return true;
  }

  private validateCriteria(): boolean {
    this.errors = [];
    const requiresLevelSelection =
      this.financialStatementInfo?.requiresLevelSelection !== false;

    if (requiresLevelSelection && !this.isLevelValid()) {
      this.errors.push('No ha seleccionado un nivel.');
    }

    if (this.financialStatementInfo?.usesCutoffDate) {
      if (!this.isDateValid(this.criteria.endDate)) {
        this.errors.push('No ha seleccionado una fecha de corte.');
      }

      if (
        this.financialStatementInfo?.requiresPreviousCutoffDate &&
        !this.isDateValid(this.criteria.startDate)
      ) {
        this.errors.push('No ha seleccionado la fecha de corte anterior.');
      }

      if (
        this.financialStatementInfo?.requiresPreviousCutoffDate &&
        this.isDateValid(this.criteria.startDate) &&
        this.isDateValid(this.criteria.endDate) &&
        !this.isPreviousCutoffBeforeCurrent(
          this.criteria.startDate,
          this.criteria.endDate
        )
      ) {
        this.errors.push(
          'La fecha de corte anterior debe ser menor a la fecha de corte actual.'
        );
      }
    } else if (this.datePeriod.length === 2) {
      if (!this.isDatePeriodValid()) {
        this.errors.push(
          'El rango de fechas no es valido. La fecha inicial debe ser anterior a la fecha final.'
        );
      }
    } else {
      this.errors.push(
        'Debe seleccionar 2 fechas (Inicial y Final) para el periodo.'
      );
    }

    if (this.isRangeOptionSelected && !this.isRangeValid()) {
      this.errors.push('El rango del nivel seleccionado no es valido.');
    }

    if (this.isThirdPartyOptionSelected && !this.isThirdPartyValid()) {
      this.errors.push(
        'No ha seleccionado un tercero antes de generar el reporte.'
      );
    }

    return this.errors.length === 0;
  }

  private isLevelValid(): boolean {
    return !!this.criteria.criteriaType;
  }

  private isDateValid(date: string | null): boolean {
    return !!date;
  }

  private isPreviousCutoffBeforeCurrent(previousDate: any, currentDate: any): boolean {
    const previous = this.parseToDate(previousDate);
    const current = this.parseToDate(currentDate);

    if (!previous || !current) {
      return false;
    }

    return previous.getTime() < current.getTime();
  }

  private parseToDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isRangeValid(): boolean {
    const { from, to } = this.levelRange;
    return !!(from && to && from < to);
  }

  private isThirdPartyValid(): boolean {
    return !!this.criteria.thirdPartyId;
  }

  private isDatePeriodValid(): boolean {
    return !(this.datePeriod[0].getTime() > this.datePeriod[1].getTime());
  }

  showExportDialog(): void {
    this.refDialog = this.dialogService.open(ExportFinancialStatementComponent, {
      data: {
        reportTitle: this.financialStatementInfo.name,
        statementType: this.financialStatementInfo.type,
        financialStatement: this.financialStatementGenerated,
        dataTable: this.dataTable,
        headerConfig: this.headerConfig,
        enterpriseData: this.enterpriseData,
        thirdPartyInfo: this.thirdPartyInfo,
        totals: {
          totalDebit: this.totalDebit,
          totalCredit: this.totalCredit,
        },
      },
    });
  }

  getNestedValue(obj: any, path: string): any {
    if (!path) {
      return '';
    }

    return path
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
  }

  formatMoneyAligned(value: number | null | undefined, nature?: string): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const parts = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(Math.abs(value));

    const integer = parts
      .filter((p) => p.type === 'integer' || p.type === 'group')
      .map((p) => p.value)
      .join('');

    const decimal = parts.find((p) => p.type === 'decimal')?.value ?? ',';
    const fraction = parts.find((p) => p.type === 'fraction')?.value ?? '00';

    const symbol = '$';
    const isNegative = value < 0;
    const sign = isNegative ? '-' : '';

    let cssClasses = '';

    if (nature) {
      const normalizedNature = nature.trim().toUpperCase();
      const isRed =
        (normalizedNature === 'DEBITO' && value < 0) ||
        (normalizedNature === 'CREDITO' && value > 0);

      if (isRed) {
        cssClasses = 'text-red-600 font-bold';
      }
    } else if (isNegative) {
      cssClasses = 'negative';
    }

    return `
      <span class="money font-mono ${cssClasses}">
        <span class="symbol">${symbol}</span>
        <span class="integer">${sign}${integer}</span>
        <span class="decimal">${decimal}${fraction}</span>
      </span>
    `;
  }
  formatMoneyCompact(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const sign = value < 0 ? '-$ ' : '$ ';
    const absoluteValue = Math.abs(value);
    const formattedValue = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absoluteValue);

    return `${sign}${formattedValue}`;
  }
}


