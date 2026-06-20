import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';

import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { GenerateAuxiliaryBookRequest } from '../../../Models/Requests/GenerateAuxiliaryBookRequest';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { MajorAndBalancesResponse } from '../../../Models/Responses/MajorAndBalancesBookResponse';
import { DialogService } from 'primeng/dynamicdialog';
@Component({
  selector: 'app-major-and-balances',
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
  providers: [DatePipe, DialogService],
  templateUrl: './major-and-balances.component.html',
  styleUrl: './major-and-balances.component.css',
})
export class MajorAndBalancesComponent extends BaseAuxiliaryBookComponent {
  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.MAJOR_AND_BALANCES,
    criteria: this.criteria,
  };

  override dataTable: MajorAndBalancesResponse[] = [];

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

  protected loadConfig(): void {
    this.auxiliaryBookInfo = {
      name: 'Libro Mayor y Balances',
      description:
        'Muestra los movimientos y saldos por cuenta contable, facilitando la consulta de información acumulada para análisis financieros y elaboración de estados contables.',
      icon: 'book_5',
    };

    this.levels = [
      { label: 'Clase', value: 'NUMBER_CLASS' },
      { label: 'SubCuenta', value: 'SUB_ACCOUNT' },
      { label: 'Grupo', value: 'GROUP' },
      { label: 'Auxiliar', value: 'AUXILIARY_ACCOUNT' },
      { label: 'Cuenta', value: 'ACCOUNT' },
    ];
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

    this.request = {
      entId: this.enterpriseData.id,
      criteria: this.criteria,
      type: AuxiliaryBookType.DIARY,
      userId: 123,
    };
  }
}
