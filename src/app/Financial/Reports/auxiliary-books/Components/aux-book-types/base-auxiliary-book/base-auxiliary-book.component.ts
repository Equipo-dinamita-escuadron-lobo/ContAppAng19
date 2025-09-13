// base-aux-book.component.ts
import { Directive, OnInit, ViewChild } from '@angular/core';
import { Account } from '../../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
import { Criteria } from '../../../Models/Criteria';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdPartyServiceService } from '../../../../../../GeneralMasters/ThirdParties/Services/third-party-service.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { auxBookResponse } from '../../../Models/Responses/BookResponse';

@Directive()
export abstract class BaseAuxiliaryBookComponent implements OnInit {
  @ViewChild('fromSelect') fromSelect!: Select;
  @ViewChild('toSelect') toSelect!: Select;
  @ViewChild('thirdPartySelect') thirdPartySelect!: Select;

  auxiliaryBookInfo: any;

  isOptionLevelSelect: boolean = false;
  isLevelSelected: boolean = false;

  isRangeOptionSelected = false;
  rangeFromOptions: Account[] = [];
  rangeToOptions: Account[] = [];

  thirdPartyOptions: Third[] = [];
  isThirdPartyOptionSelected = false;
  thirdPartySelected: Third | null = null;

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

  totalDebit: number = 0;
  totalCredit: number = 0;

  constructor(
    protected auxiliaryBookService: AuxiliaryBooksServiceService,
    protected enterpriseService: EnterpriseService,
    protected thirdService: ThirdPartyServiceService,
    protected accountService: ChartAccountService,
    protected messageService: MessageService
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
    console.log(this.enterpriseData);
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
          this.criteria.criteriaType
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
      ...this.rangeFromOptions.map((opt) => parseInt(opt.code))
    );
    return this.rangeFromOptions.filter((opt) => parseInt(opt.code) < maxValue);
  }

  onFromChange() {
    if (this.isRangeOptionSelected && this.levelRange.from !== null) {
      this.criteria.criteriaRange!.from = this.levelRange.from;
      this.rangeToOptions = this.rangeFromOptions.filter(
        (opt) => parseInt(opt.code) > this.levelRange.from!
      );
    }
  }

  onToChange() {
    if (this.isRangeOptionSelected && this.levelRange.to !== null) {
      this.criteria.criteriaRange!.to = this.levelRange.to;
    }
  }

  private resetForm(): void {
    this.resetCriteria();
    this.resetRangeDropDowns();
    this.resetThirdPartySelect();

    // ✅ Reset de checkboxes
    this.isRangeOptionSelected = false;
    this.isThirdPartyOptionSelected = false;

    // ✅ Esto también borra la info del tercero en pantalla
    this.thirdPartySelected = null;
    this.thirdPartyInfo = null;
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
    if (this.thirdPartySelect) {
      this.thirdPartySelect.clear();
    }
    this.thirdPartySelected = null;
  }

  private resetCriteria(): void {
    this.isLevelSelected = false;
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
    if (this.isThirdPartyOptionSelected === true) {
      this.getThirdPartyOptions();
    } else {
      this.thirdPartySelect.clear();
    }
  }

  private getThirdPartyOptions(): void {
    this.thirdService.getThirdParties(this.enterpriseData.id, 1).subscribe({
      next: (response: Third[]) => {
        this.thirdPartyOptions = response;
      },
      error: (err) => {
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
      }, 300);
    } else {
      this.thirdPartyInfo = null;
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

    console.log('Generando reporte con la petición:', this.request);
    console.log(
      'Id del Tercero asociado a los criterios:',
      this.request.criteria.thirdPartyId
    );

    this.auxiliaryBookService.registerAuxiliaryBook(this.request).subscribe({
      next: (response: auxBookResponse) => {
        this.dataTable = response.data;
        this.calculateTotals();
        console.log(this.dataTable);

        this.isReportGenerated = true;

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

    //this.resetForm();
  }

  private validateCriteria(): boolean {
    this.errors = []; // reiniciamos errores

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
            'El rango de fechas no es válido. La fecha inicial debe ser anterior a la fecha final.'
          );
        }
      } else {
        this.errors.push(
          'Debe seleccionar 2 fechas (Inicial y Final) para el periodo.'
        );
      }
    }

    if (this.isRangeOptionSelected && !this.isRangeValid()) {
      this.errors.push('El rango del nivel seleccionado no es válido.');
    }

    if (this.isThirdPartyOptionSelected && !this.isThirdPartyValid()) {
      this.errors.push(
        'No ha seleccionado un Tercero antes de generar el reporte.'
      );
    }

    return this.errors.length === 0; // ✅ retorna true solo si no hay errores
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

  private isDatePeriodValid(): boolean {
    return !(this.datePeriod[0].getTime() > this.datePeriod[1].getTime());
  }
}
