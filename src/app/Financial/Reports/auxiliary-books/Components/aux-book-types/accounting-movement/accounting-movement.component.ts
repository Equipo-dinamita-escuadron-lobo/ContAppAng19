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
import { GenerateAuxiliaryBookRequest } from '../../../Models/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { InventoryAndBalancesResponse } from '../../../Models/Responses/InventoryAndBalancesBookResponse';

// Services
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';
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
  providers: [DatePipe],
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

  override dataTable: InventoryAndBalancesResponse[] = [];

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
}
