import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/Requests/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
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
  selector: 'app-third-party-book',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    CheckboxModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './third-party-book.component.html',
  styleUrl: './third-party-book.component.css',
})
export class ThirdPartyBookComponent extends BaseAuxiliaryBookComponent {
  override thirdPartyOptions: Third[] = [];

  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.THIRD_PARTY,
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
      name: 'Libro Auxiliar por Tercero',
      description:
        'Presenta los movimientos contables asociados a terceros (clientes, proveedores, etc.), útil para conciliaciones y seguimiento de cuentas por cobrar o pagar.',
      icon: 'groups_3',
    };

    this.isThirdPartyOptionSelected = true;
    this.onThirdPartyOptionSelected();
  }

  protected override generateReport(): void {
    if (this.criteria.thirdPartyId == null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Tercero requerido',
        detail:
          'Debe seleccionar un tercero antes de generar el Libro Auxiliar por Tercero.',
      });
      return;
    }

    super.generateReport();
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
      type: AuxiliaryBookType.THIRD_PARTY,
      userId: this.resolveUserId(),
    };
  }
}
