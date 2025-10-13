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

// Models
import { GenerateAuxiliaryBookRequest } from '../../../Models/GenerateAuxiliaryBookRequest';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';
import { InventoryAndBalancesResponse } from '../../../Models/Responses/InventoryAndBalancesBookResponse';
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
  providers: [DatePipe, DialogService],
  templateUrl: './inventory-and-balances.component.html',
  styleUrl: './inventory-and-balances.component.css',
})
export class InventoryAndBalancesComponent extends BaseAuxiliaryBookComponent {
  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.INVENTORY_AND_BALANCES,
    criteria: this.criteria,
  };

  override dataTable: InventoryAndBalancesResponse[] = [];

  /**
   * ✅ NUEVO: Define la configuración de las cabeceras para la previsualización.
   * Esta estructura debe coincidir con la tabla mostrada en el HTML.
   */
  headerConfig: ColumnDefinition[][] = [
    // Fila 1 de la cabecera
    [
      {
        header: 'Cuenta',
        colspan: 2,
        // Los 'children' se usan para calcular las columnas de datos (flatColumns)
        children: [
          { header: 'Código', field: 'accountCode' },
          { header: 'Descripción', field: 'accountDescription' },
        ],
      },
      { header: 'Descripción', field: 'description', rowspan: 2 },
      { header: 'Valor', field: 'value', type: 'number', rowspan: 2 },
    ],
    // ✅ CORREGIDO: Fila 2 de la cabecera, contiene los hijos de 'Cuenta'
    [
      // Estas columnas se renderizarán debajo de 'Cuenta'
      { header: 'Código', field: 'accountCode' },
      { header: 'Descripción', field: 'accountDescription' },
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

  protected loadConfig(): void {
    this.auxiliaryBookInfo = {
      name: 'Libro de Inventarios y Balances',
      description:
        'Presenta los activos, pasivos y patrimonio de la empresa en un momento determinado.',
      icon: 'inventory_2',
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
