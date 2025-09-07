import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { Select, SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { Third } from '../../../../../../GeneralMasters/ThirdParties/models/Third';
import { ThirdPartyBookResponse } from '../../../Models/Responses/ThirdPartyBookResponse';

// Services
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';

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
  providers: [DatePipe],
  templateUrl: './third-party-book.component.html',
  styleUrl: './third-party-book.component.css',
})
export class ThirdPartyBookComponent extends BaseAuxiliaryBookComponent {
  override thirdPartyOptions: Third[] = [];

  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.DIARY,
    criteria: this.criteria,
  };

  override dataTable: ThirdPartyBookResponse[] = [];

  constructor(
    auxiliaryBookService: AuxiliaryBooksServiceService,
    enterpriseService: EnterpriseService,
    thirdService: ThirdService,
    accountService: ChartAccountService,
    messageService: MessageService,
    private datePipe: DatePipe
  ) {
    super(
      auxiliaryBookService,
      enterpriseService,
      thirdService,
      accountService,
      messageService
    );
  }

  protected loadConfig(): void {
    this.auxiliaryBookInfo = {
      name: 'Libro Auxiliar por Tercero',
      description:
        'Presenta los movimientos contables asociados a terceros (clientes, proveedores, etc.), útil para conciliaciones y seguimiento de cuentas por cobrar o pagar.',
      icon: 'groups_3',
    };
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
      //TO DO: Change the value of entId when the enterprise has accounting info
      //Meanwhile we used this entId because the mock has this id bf4d475f-5d02-4551-b7f0-49a5c426ac0d
      //entId: this.enterpriseData.id,
      entId: 'bf4d475f-5d02-4551-b7f0-49a5c426ac0d',
      criteria: this.criteria,
      type: AuxiliaryBookType.THIRD_PARTY,
      //TO DO: Change the value of userId when the method to get the user ID is implemented
      userId: 123,
    };
  }
}
