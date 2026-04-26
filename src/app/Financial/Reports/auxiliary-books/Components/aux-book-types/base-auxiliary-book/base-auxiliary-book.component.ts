// base-aux-book.component.ts
import { Directive, OnInit, ViewChild, inject } from '@angular/core';
import { Account } from '../../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
import { CostCenter } from '../../../../../../GeneralMasters/CostCenters/models/cost-center.model';
import { Criteria } from '../../../Models/Criteria';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ExportAuxiliaryBookComponent } from '../../export-auxiliary-book/export-auxiliary-book.component';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';

@Directive()
export abstract class BaseAuxiliaryBookComponent implements OnInit {
  @ViewChild('fromSelect') fromSelect!: Select;
  @ViewChild('toSelect') toSelect!: Select;
  @ViewChild('thirdPartySelect') thirdPartySelect!: Select;
  @ViewChild('costCenterSelect') costCenterSelect!: Select;

  auxiliaryBookInfo: any;
  auxiliaryBookGenerated: any;

  isOptionLevelSelect: boolean = false;
  isLevelSelected: boolean = false;

  isRangeOptionSelected = false;
  rangeFromOptions: Account[] = [];
  rangeToOptions: Account[] = [];

  thirdPartyOptions: Third[] = [];
  isThirdPartyOptionSelected = false;
  thirdPartySelected: Third | null = null;

  costCenterOptions: CostCenter[] = [];
  isCostCenterOptionSelected = false;
  costCenterSelected: CostCenter | null = null;

  datePeriod: Date[] = [];

  levels: any[] = [];
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

  costCenterInfo: {
    id: number | null;
    code: string;
    name: string;
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

  isReportGenerated: boolean = false;

  request: any;

  dataTable: any;

  totalDebit: number | null = null;
  totalCredit: number | null = null;

  refDialog: DynamicDialogRef | undefined;
  private readonly costCenterService = inject(CostCenterService);
  protected readonly authService = inject(AuthService);

  /**
   * Returns the active enterprise id or empty string if none is selected.
   */
  protected resolveEntId(): string {
    return this.enterpriseData?.id ?? '';
  }

  /**
   * Returns the numeric user id from the auth service, or 0 if unavailable.
   */
  protected resolveUserId(): number {
    const rawId = this.authService.returnUserInfo()?.id;
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  constructor(
    protected auxiliaryBookService: AuxiliaryBooksServiceService,
    protected enterpriseService: EnterpriseService,
    protected thirdService: ThirdService,
    protected accountService: ChartAccountService,
    protected messageService: MessageService,
    protected dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.getEnterpriseInfo();
  }

  /**
   * Método que cada libro debe implementar
   * para definir sus criterios y columnas
   */
  protected abstract loadConfig(): void;

  /**
   * Método que cada libro debe implementar
   * para definir sus criterios y columnas
   */
  protected abstract organizeRequest(): void;

  protected calculateTotals(): void {}

  private getEnterpriseInfo(): void {
    this.enterpriseData = this.enterpriseService.getSelectedEnterprise();
  }

  onLevelChange() {
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
    } else {
      if (this.isRangeOptionSelected === true) {
        this.criteria.criteriaRange = { from: 0, to: 0 };
        this.getAccountOptions();
      } else {
        this.criteria.criteriaRange = null;
        this.resetRangeDropDowns();
      }
    }
  }

  private getAccountOptions(): void {
    this.accountService.getListAccounts(this.enterpriseData.id).subscribe({
      next: (response: Account[]) => {
        const filterAccounts = this.filterAccountsByLevel(
          response,
          this.criteria.criteriaType,
        );

        this.rangeFromOptions = filterAccounts;
      },
      error: (err) => {
        console.error('Error fetching accounts:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se han encontrado Cuentas para esta Empresa\n Error:' +
            err.message,
        });
      },
    });
  }

  get rangeFromOptionsFiltered() {
    const maxValue = Math.max(
      ...this.rangeFromOptions.map((opt) => parseInt(opt.code)),
    );
    return this.rangeFromOptions.filter((opt) => parseInt(opt.code) < maxValue);
  }

  onFromChange() {
    if (this.isRangeOptionSelected && this.levelRange.from !== null) {
      this.criteria.criteriaRange!.from = this.levelRange.from;
      this.rangeToOptions = this.rangeFromOptions.filter(
        (opt) => parseInt(opt.code) > this.levelRange.from!,
      );
    }
  }

  onToChange() {
    if (this.isRangeOptionSelected && this.levelRange.to !== null) {
      this.criteria.criteriaRange!.to = this.levelRange.to;
    }
    ``;
  }

  private resetRangeDropDowns(): void {
    if (this.fromSelect) {
      this.fromSelect.clear();
    }
    if (this.toSelect) {
      this.toSelect.clear();
    }
    this.levelRange = { from: 0, to: 0 }; // reset valores
  }

  private resetThirdPartySelect(): void {
    this.thirdPartySelected = null;
    this.thirdPartyInfo = null;
    this.criteria.thirdPartyId = null;
  }

  private resetCostCenterSelect(): void {
    this.costCenterSelected = null;
    this.costCenterInfo = null;
    this.criteria.costCenterId = null;
  }

  private resetCriteria(): void {
    this.isLevelSelected = false;
    this.isCostCenterOptionSelected = false;
    this.isThirdPartyOptionSelected = false;
    this.criteria = {
      criteriaType: '',
      costCenterId: null,
      thirdPartyId: null,
      criteriaRange: null,
      startDate: null,
      endDate: null,
    };
  }

  private filterAccountsByLevel(accounts: Account[], level: string): Account[] {
    switch (level) {
      case 'NUMBER_CLASS':
        return accounts; // nivel raíz (clases)
      case 'GROUP':
        return accounts.flatMap((a) => a.children || []);
      case 'ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) => b.children || []),
        );
      case 'SUB_ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) =>
            (b.children || []).flatMap((c) => c.children || []),
          ),
        );
      case 'AUXILIARY_ACCOUNT':
        return accounts.flatMap((a) =>
          (a.children || []).flatMap((b) =>
            (b.children || []).flatMap((c) =>
              (c.children || []).flatMap((d) => d.children || []),
            ),
          ),
        );
      default:
        return [];
    }
  }

  onThirdPartyOptionSelected(): void {
    if (this.isThirdPartyOptionSelected === true) {
      this.getThirdPartyOptions();
    } else {
      if (this.thirdPartySelect) {
        this.thirdPartySelect.clear();
      }
      this.resetThirdPartySelect();
    }
  }

  private getThirdPartyOptions(): void {
    this.thirdService.getThirdList(this.enterpriseData.id).subscribe({
      next: (response: Third[]) => {
        this.thirdPartyOptions = response.map((third) => ({
          ...third,
          fullName: `${third.names} ${third.lastNames}`,
        }));
      },
      error: (err: any) => {
        console.error('Error fetching third parties:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se han encontrado Terceros para esta Empresa\n Error:' +
            err.message,
        });
      },
    });
  }

  onSelectThirdParty(): void {
    if (this.thirdPartySelected) {
      const seleccionado: Third = this.thirdPartySelected;

      setTimeout(() => {
        this.thirdPartyInfo = {
          typeId: seleccionado.typeId.typeId,
          name: `${seleccionado.names} ${seleccionado.lastNames}`,
          types: this.concatenateThirdTypeInfo(seleccionado.thirdTypes),
        };

        this.criteria.thirdPartyId = seleccionado.thId;
      }, 300);
    } else {
      this.resetThirdPartySelect();
    }
  }

  onCostCenterOptionSelected(): void {
    if (this.isCostCenterOptionSelected === true) {
      this.getCostCenterOptions();
    } else {
      this.costCenterOptions = [];
      if (this.costCenterSelect) {
        this.costCenterSelect.clear();
      }
      this.resetCostCenterSelect();
    }
  }

  private getCostCenterOptions(): void {
    console.log(this.enterpriseData.id);

    this.costCenterService
      .findActiveAuxiliary(this.enterpriseData.id)
      .subscribe({
        next: (response: CostCenter[]) => {
          console.log(response);

          this.costCenterOptions = response;
        },
        error: (err: any) => {
          console.error('Error fetching cost centers:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'No se han encontrado Centros de Costos para esta Empresa\n Error:' +
              err.message,
          });
        },
      });
  }

  onSelectCostCenter(): void {
    if (this.costCenterSelected) {
      const seleccionado: CostCenter = this.costCenterSelected;

      setTimeout(() => {
        this.costCenterInfo = {
          id: seleccionado.id ?? null,
          code: seleccionado.code,
          name: seleccionado.name,
        };

        this.criteria.costCenterId = seleccionado.id ?? null;
      }, 300);
    } else {
      this.resetCostCenterSelect();
    }
  }

  concatenateThirdTypeInfo(thirdTypes: any): string {
    if (thirdTypes && thirdTypes.length > 0) {
      return thirdTypes.map((type: any) => type.thirdTypeName).join(', ');
    }
    return '';
  }

  protected generateReport(): void {
    if (!this.validateCriteria()) {
      // 🚨 Mostrar todos los errores en un solo mensaje
      this.messageService.add({
        severity: 'error',
        summary: 'Errores en el formulario',
        detail: this.errors.join('\n'),
      });
      return;
    }

    this.organizeRequest();

    this.auxiliaryBookService.registerAuxiliaryBook(this.request).subscribe({
      next: (data: any) => {
        this.dataTable = data.accountingData;
        this.auxiliaryBookGenerated = data.auxiliaryBook;
        this.calculateTotals();
        this.isReportGenerated = true;

        if (this.dataTable.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail:
              'La consulta no arrojó resultados con los criterios seleccionados.',
          });
          return;
        }

        console.log('Respuesta del servicio:', data);

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Se obtuvo la información contable con éxito.',
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se pudo obtener la información contable. \nError:' +
            err.message,
        });
      },
    });
  }

  private validateCriteria(): boolean {
    this.errors = [];

    if (!this.isLevelValid()) {
      this.errors.push('No ha seleccionado un nivel.');
    }

    if (this.auxiliaryBookInfo.name === 'Libro de Inventarios y Balances') {
      if (!this.isDateValid(this.criteria.endDate)) {
        this.errors.push('No ha seleccionado una fecha de corte.');
      }
    } else {
      if (this.datePeriod.length === 2) {
        if (!this.isDatePeriodValid()) {
          this.errors.push(
            'El rango de fechas no es válido. La fecha inicial debe ser anterior a la fecha final.',
          );
        } else {
          this.criteria.startDate = this.datePeriod[0];
          this.criteria.endDate = this.datePeriod[1];
        }
      } else {
        this.errors.push(
          'Debe seleccionar 2 fechas (Inicial y Final) para el periodo.',
        );
      }
    }

    if (this.isRangeOptionSelected && !this.isRangeValid()) {
      this.errors.push('El rango del nivel seleccionado no es válido.');
    }

    if (this.isThirdPartyOptionSelected && !this.isThirdPartyValid()) {
      this.errors.push(
        'No ha seleccionado un Tercero antes de generar el reporte.',
      );
    }

    if (this.isCostCenterOptionSelected && !this.isCostCenterValid()) {
      this.errors.push(
        'No ha seleccionado un Centro de Costos antes de generar el reporte.',
      );
    }

    return this.errors.length === 0;
  }

  private isLevelValid(): boolean {
    return !!this.criteria.criteriaType;
  }

  private isDateValid(date: Date | null): boolean {
    return !!date && !isNaN(date.getTime());
  }

  private isRangeValid(): boolean {
    const { from, to } = this.levelRange;
    return !!(from && to && from < to);
  }

  private isThirdPartyValid(): boolean {
    return !!this.criteria.thirdPartyId;
  }

  private isCostCenterValid(): boolean {
    return (
      this.criteria.costCenterId !== null &&
      this.criteria.costCenterId !== undefined
    );
  }

  private isDatePeriodValid(): boolean {
    return !(this.datePeriod[0].getTime() > this.datePeriod[1].getTime());
  }

  showExportDialog() {
    let data = {
      reportTitle: this.auxiliaryBookInfo.name,
      auxBookType: this.auxiliaryBookInfo.type,
      auxiliaryBook: this.auxiliaryBookGenerated,
      dataTable: this.dataTable,
      headerConfig: (this as any).headerConfig || [],
      enterpriseData: this.enterpriseData,
      totals: {
        totalDebit: this.totalDebit,
        totalCredit: this.totalCredit,
      },
    };

    this.refDialog = this.dialogService.open(ExportAuxiliaryBookComponent, {
      data: data,
    });
  }

  /**
   * @param value El valor numérico.
   * @param nature (Opcional) 'DEBITO' o 'CREDITO'. Si se envía, aplica la regla de color rojo.
   */
  formatMoneyAligned(
    value: number | null | undefined,
    nature?: string,
  ): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const locale = 'es-CO';
    const currency = 'COP';

    const parts = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(Math.abs(value));

    const integer = parts
      .filter((p) => p.type === 'integer' || p.type === 'group')
      .map((p) => p.value)
      .join('');

    const decimal = parts.find((p) => p.type === 'decimal')?.value ?? ',';
    const fraction = parts.find((p) => p.type === 'fraction')?.value ?? '00';

    // Símbolo de moneda
    const symbol = '$';

    const isNegative = value < 0;
    const sign = isNegative ? '-' : '';

    // --- LÓGICA NUEVA DE COLOR ---
    let cssClasses = '';

    if (nature) {
      const normalizedNature = nature.trim().toUpperCase();

      // Regla: Rojo si es Débito negativo O Crédito positivo
      const isRed =
        (normalizedNature === 'DEBITO' && value < 0) ||
        (normalizedNature === 'CREDITO' && value > 0);

      // Usamos clase de Tailwind 'text-red-600' o tu clase custom 'negative'
      if (isRed) {
        cssClasses = 'text-red-600 font-bold';
      }
    } else {
      // Fallback: Si no envían naturaleza, mantenemos tu lógica original (solo negativos en rojo)
      if (isNegative) {
        cssClasses = 'negative';
      }
    }
    // -----------------------------

    return `
    <span class="money font-mono ${cssClasses}">
      <span class="symbol">${symbol}</span>
      <span class="integer">${sign}${integer}</span>
      <span class="decimal">${decimal}${fraction}</span>
    </span>
  `;
  }
}
