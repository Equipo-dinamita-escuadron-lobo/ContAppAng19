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
import { InventoryAndBalancesResponse } from '../../../Models/Responses/InventoryAndBalancesBookResponse';

// Services
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { BaseAuxiliaryBookComponent } from '../base-auxiliary-book/base-auxiliary-book.component';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { CostCenter } from '../../../../../../GeneralMasters/CostCenters/models/cost-center.model';
import { Page } from '../../../../../../GeneralMasters/AccountingCalendar/types/calendar.types';
import { DialogService } from 'primeng/dynamicdialog';
import { AccountingCalendarService } from '../../../../../../GeneralMasters/AccountingCalendar/services/accounting-calendar.service';

// Interface para respuestas paginadas
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

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
  @ViewChild('costCenterSelect') costCenterSelect!: Select;

  costCenterOptions: any;
  isCostCenterOptionSelected = false;
  costCenterSelected: any | null = null;

  thirdSelectedInFilter: any | null = null;
  thirdsOptions: any[] = [];

  costCenterInfo: {
    id: string;
    name: string;
  } | null = null;

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
    dialogService: DialogService,
    private costCenterService: CostCenterService,
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

  onCostCenterOptionSelected(): void {
    if (this.isCostCenterOptionSelected === true) {
      this.getCostCenterOptions();
    } else {
      this.costCenterSelect.clear();
    }
  }

  private getCostCenterOptions(): void {
    this.costCenterService.findAll(this.enterpriseData.id).subscribe({
      next: (response: Page<CostCenter>) => {
        this.costCenterOptions = response;
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

  onSelectCostCenter(): void {
    if (this.costCenterSelected) {
      const seleccionado: any = this.costCenterSelected;

      setTimeout(() => {
        this.costCenterInfo = {
          id: seleccionado.id,
          name: seleccionado.name,
        };
      }, 300);
    } else {
      this.costCenterInfo = null;
    }
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
      type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
      //TO DO: Change the value of userId when the method to get the user ID is implemented
      userId: 123,
    };
  }
}
