import { Component, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { Select, SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';

// Models
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
import { Account } from '../../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { GenerateAuxiliaryBookRequest } from '../../../Models/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { Criteria } from '../../../Models/Criteria';
import { InventoryAndBalancesResponse } from '../../../Models/InventoryAndBalancesResponse';

// Services
import { ThirdPartyServiceService } from '../../../../../../GeneralMasters/ThirdParties/Services/third-party-service.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MenuItem, MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { auxBookResponse } from '../../../Models/Response';

@Component({
  selector: 'app-inventory-and-balances',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    RadioButton,
    CheckboxModule,
    SelectModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [DatePipe],
  templateUrl: './inventory-and-balances.component.html',
  styleUrl: './inventory-and-balances.component.css',
})
export class InventoryAndBalancesComponent {
  @ViewChild('fromSelect') fromSelect!: Select;
  @ViewChild('toSelect') toSelect!: Select;
  @ViewChild('thirdPartySelect') thirdPartySelect!: Select;

  auxiliaryBookInfo = {
    name: 'Libro de Inventarios y Balances',
    description:
      'Presenta los activos, pasivos y patrimobio de la empresa en un momento determinado.',
    icon: 'inventory_2',
  };

  isLevelSelected = false;
  levels = [
    { label: 'Clase', value: 'NUMBER_CLASS' },
    { label: 'SubCuenta', value: 'SUB_ACCOUNT' },
    { label: 'Grupo', value: 'GROUP' },
    { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
    { label: 'Cuenta', value: 'ACCOUNT' },
  ];

  enterpriseData: any;

  isRangeOptionSelected = false;
  rangeFromOptions: Account[] = [];
  rangeToOptions: Account[] = [];

  thirdPartyOptions: Third[] = [];
  isThirdPartyOptionSelected = false;
  thirdPartySelected: Third | null = null;

  thirdPartyInfo: { typeId: string; name: string; types: string } | null = null;

  criteria: Criteria = {
    criteriaType: '',
    criteriaRange: null,
    costCenterId: null,
    thirdPartyId: null,
    startDate: null,
    endDate: null,
  };

  range: { from: number | null; to: number | null } = { from: null, to: null };

  request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
    criteria: this.criteria,
  };

  dataTable: InventoryAndBalancesResponse[] = [];

  errors: string[] = [];

  isReportGenerated: boolean = false;

  constructor(
    private auxiliaryBookService: AuxiliaryBooksServiceService,
    private enterpriseService: EnterpriseService,
    private thirdService: ThirdPartyServiceService,
    private accountService: ChartAccountService,
    private messageService: MessageService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.getEnterpriseInfo();
  }

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
    if (this.isRangeOptionSelected && this.range.from !== null) {
      this.criteria.criteriaRange!.from = this.range.from;
      this.rangeToOptions = this.rangeFromOptions.filter(
        (opt) => parseInt(opt.code) > this.range.from!
      );
    }
  }

  onToChange() {
    if (this.isRangeOptionSelected && this.range.to !== null) {
      this.criteria.criteriaRange!.to = this.range.to;
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
    this.range = { from: 0, to: 0 }; // reset valores
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

  private organizeRequest(): void {
    //TO DO: Change the value of start date to enterprise creation date when the enterprise had this attribute
    //this.criteria.startDate = this.enterpriseData.creationDate;

    this.criteria.startDate = this.datePipe.transform(
      new Date('01/01/2025'),
      'yyyy-MM-dd'
    );

    this.criteria.endDate = this.datePipe.transform(
      this.criteria.endDate,
      'yyyy-MM-dd'
    );

    this.request = {
      //TO DO: Change the value of entId when the enterprise has accounting info
      //Meanwhile we used this entId because the mock has this id bf4d475f-5d02-4551-b7f0-49a5c426ac0d
      //entId: this.enterpriseData.id,
      entId: 'bf4d475f-5d02-4551-b7f0-49a5c426ac0d',
      criteria: this.criteria,
      type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      //TO DO: Change the value of userId when the method to get the user ID is implemented
      userId: 123,
    };
  }

  generateReport(): void {
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

    this.resetForm();
  }

  private validateCriteria(): boolean {
    this.errors = []; // reiniciamos errores

    if (!this.isLevelValid()) {
      this.errors.push('No ha seleccionado un nivel.');
    }

    if (!this.isDateValid(this.criteria.endDate)) {
      this.errors.push('No ha seleccionado una fecha de corte.');
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
    const { from, to } = this.range;
    return !!(from && to && from < to);
  }

  private isThirdPartyValid(): boolean {
    return !!this.criteria.thirdPartyId;
  }

  calcularTotal() {
    return this.dataTable.reduce((acc, item) => acc + 0, 0);
  }
}
