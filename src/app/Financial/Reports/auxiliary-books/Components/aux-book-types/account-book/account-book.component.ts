import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover';

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/Requests/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { ThirdPartyBookResponse } from '../../../Models/Responses/ThirdPartyBookResponse';
import { ColumnDefinition } from '../../export-auxiliary-book/Components/report-preview/report-preview.component';

// Services
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-account-book',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    RadioButton,
    CheckboxModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    TableModule,
    PopoverModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './account-book.component.html',
  styleUrl: './account-book.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class AccountBookComponent extends BaseAuxiliaryBookComponent {
  @ViewChild('dt') dt!: Table;

  thirdsOptions: { id: string; label: string }[] = [];
  selectedThirdsFilter: string[] = [];

  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.ACCOUNT,
    criteria: this.criteria,
  };

  override dataTable: ThirdPartyBookResponse[] = [];

  headerConfig: ColumnDefinition[][] = [
    [
      { header: 'Fecha', field: 'date', rowspan: 2 },
      {
        header: 'Cuenta',
        colspan: 2,
        children: [
          { header: 'Código', field: 'account.accountCode' },
          { header: 'Descripción', field: 'account.accountDescription' },
        ],
      },
      {
        header: 'Movimiento',
        colspan: 3,
        children: [
          { header: 'Débito', field: 'debitMovement', type: 'number' },
          { header: 'Crédito', field: 'creditMovement', type: 'number' },
          { header: 'Saldo', field: 'balanceMovement', type: 'number' },
        ],
      },
      {
        header: 'Tercero',
        colspan: 2,
        children: [
          { header: 'Identificación', field: 'thirdPartyId' },
          { header: 'Nombre', field: 'thirdPartyName' },
        ],
      },
      {
        header: 'Documento',
        colspan: 2,
        children: [
          { header: 'Centro de Costos', field: 'voucherCostCenter' },
          { header: 'Número', field: 'voucherNumber' },
        ],
      },
    ],
    [
      { header: 'Código' },
      { header: 'Descripción' },
      { header: 'Débito' },
      { header: 'Crédito' },
      { header: 'Saldo' },
      { header: 'Identificación' },
      { header: 'Nombre' },
      { header: 'Centro de Costos' },
      { header: 'Número' },
    ],
  ];

  constructor(
    auxiliaryBookService: AuxiliaryBooksServiceService,
    enterpriseService: EnterpriseService,
    thirdService: ThirdService,
    accountService: ChartAccountService,
    messageService: MessageService,
    dialogService: DialogService,
    private datePipe: DatePipe,
  ) {
    super(
      auxiliaryBookService,
      enterpriseService,
      thirdService,
      accountService,
      messageService,
      dialogService,
    );
  }

  protected loadConfig(): void {
    this.auxiliaryBookInfo = {
      name: 'Libro Auxiliar por Cuenta',
      description:
        'Registra cronológicamente todas las transacciones contables de la empresa.',
      icon: 'account_balance',
    };

    this.levels = [
      { label: 'Cuenta', value: 'ACCOUNT' },
      { label: 'SubCuenta', value: 'SUB_ACCOUNT' },
      { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
    ];
  }

  protected organizeRequest(): void {
    //TO DO: Change the value of start date to enterprise creation date when the enterprise had this attribute
    //this.criteria.startDate = this.enterpriseData.creationDate;

    const formattedStartDate = this.datePipe.transform(
      new Date('01/01/2025'),
      'yyyy-MM-dd',
    );

    const formattedEndDate = this.datePipe.transform(
      this.criteria.endDate,
      'yyyy-MM-dd',
    );

    this.request = {
      entId: this.resolveEntId(),
      criteria: {
        ...this.criteria,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },
      type: AuxiliaryBookType.ACCOUNT,
      userId: this.resolveUserId(),
    };
  }

  protected override calculateTotals(): void {
    const uniqueIds = new Set<string>();
    (this.dataTable ?? []).forEach((row) => {
      const id = row?.thirdPartyId?.trim();
      if (id) {
        uniqueIds.add(id);
      }
    });

    this.thirdsOptions = Array.from(uniqueIds)
      .sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);
        if (Number.isFinite(numA) && Number.isFinite(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b, undefined, { numeric: true });
      })
      .map((id) => ({ id, label: id }));

    this.selectedThirdsFilter = [];
    this.dt?.filter(null, 'thirdPartyId', 'in');
  }

  onThirdFilterChange(values: string[]): void {
    this.selectedThirdsFilter = values ?? [];
    const filterValue = this.selectedThirdsFilter.length
      ? this.selectedThirdsFilter
      : null;
    this.dt?.filter(filterValue, 'thirdPartyId', 'in');
  }

  clearThirdFilter(): void {
    this.selectedThirdsFilter = [];
    this.dt?.filter(null, 'thirdPartyId', 'in');
  }
}
