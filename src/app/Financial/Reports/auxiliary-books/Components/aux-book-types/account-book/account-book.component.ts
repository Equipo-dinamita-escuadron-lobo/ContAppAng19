import { Component, ViewEncapsulation } from '@angular/core';
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
import { TableModule } from 'primeng/table';

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/Requests/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { ThirdPartyBookResponse } from '../../../Models/Responses/ThirdPartyBookResponse';

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
  ],
  providers: [DatePipe, DialogService],
  templateUrl: './account-book.component.html',
  styleUrl: './account-book.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class AccountBookComponent extends BaseAuxiliaryBookComponent {
  thirdSelectedInFilter: any | null = null;
  thirdsOptions: any[] = [];

  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.ACCOUNT,
    criteria: this.criteria,
  };

  override dataTable: ThirdPartyBookResponse[] = [];

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

    this.criteria.startDate = this.datePipe.transform(
      new Date('01/01/2025'),
      'yyyy-MM-dd',
    );

    this.criteria.endDate = this.datePipe.transform(
      this.criteria.endDate,
      'yyyy-MM-dd',
    );

    this.request = {
      
      entId: this.resolveEntId(),
      criteria: this.criteria,
      type: AuxiliaryBookType.ACCOUNT,
      
      userId: this.resolveUserId(),
    };
  }
}
