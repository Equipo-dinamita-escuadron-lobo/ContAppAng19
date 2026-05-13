import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/Requests/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { AccountingMovementBookResponse } from '../../../Models/Responses/AccountingMovementBookResponse';

// Services
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';
import { DialogService } from 'primeng/dynamicdialog';
import { ColumnDefinition } from '../../export-auxiliary-book/Components/report-preview/report-preview.component';
@Component({
  selector: 'app-accounting-movement',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    CheckboxModule,
    SelectModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './accounting-movement.component.html',
  styleUrl: './accounting-movement.component.css',
})
export class AccountingMovementComponent extends BaseAuxiliaryBookComponent {
  documentTypeInfo: any;
  documentTypeSelected: boolean = false;
  isDocumentTypeOptionSelected: boolean = false;
  documentTypeOptions: any[] = [];

  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
    criteria: this.criteria,
  };

  override dataTable: AccountingMovementBookResponse[] = [];

  headerConfig: ColumnDefinition[][] = [
    [
      { header: 'Tipo Documento', field: 'voucherType', rowspan: 2 },
      { header: 'Fecha', field: 'date', rowspan: 2 },
      { header: 'Estado', field: 'state', rowspan: 2 },
      {
        header: 'Tercero',
        colspan: 2,
        children: [
          { header: 'Identificación', field: 'thirdPartyId' },
          { header: 'Nombre', field: 'thirdPartyName' },
        ],
      },
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
          { header: 'Saldo Inicial', field: 'initialBalance', type: 'number' },
          { header: 'Débito', field: 'debitMovement', type: 'number' },
          { header: 'Crédito', field: 'creditMovement', type: 'number' },
        ],
      },
      { header: 'Movimiento Neto', field: 'netMovement', type: 'number', rowspan: 2 },
    ],
    [
      { header: 'Identificación' },
      { header: 'Nombre' },
      { header: 'Código' },
      { header: 'Descripción' },
      { header: 'Saldo Inicial' },
      { header: 'Débito' },
      { header: 'Crédito' },
    ],
  ];

  constructor(
    auxiliaryBookService: AuxiliaryBooksServiceService,
    enterpriseService: EnterpriseService,
    thirdService: ThirdService,
    accountService: ChartAccountService,
    messageService: MessageService,
    dialogService: DialogService,
    private datePipe: DatePipe
  ) {
    super(
      auxiliaryBookService,
      enterpriseService,
      thirdService,
      accountService,
      messageService,
      dialogService
    );
  }

  onDocumentTypeOptionSelected(): void {
    this.documentTypeSelected = !this.documentTypeSelected;
  }

  onSelectDocumentType(): void {
    this.documentTypeSelected = true;
  }

  protected loadConfig(): void {
    this.auxiliaryBookInfo = {
      name: 'Movimiento de Contabilidad',
      description:
        'Resume todos los movimientos contables realizados, facilitando auditorías, validaciones y análisis históricos de operaciones.',
      icon: 'difference',
    };

    this.criteria.criteriaType = 'ACCOUNT';
    this.isLevelSelected = true;
  }

  protected organizeRequest(): void {
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

    this.criteria.criteriaType = 'ACCOUNT';

    this.request = {
      
      entId: this.resolveEntId(),
      criteria: this.criteria,
      type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      
      userId: this.resolveUserId(),
    };
  }
}
