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
import { DiaryResponse } from '../../../Models/Responses/DiaryBookResponse';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ColumnDefinition } from '../../export-auxiliary-book/Components/report-preview/report-preview.component';

@Component({
  selector: 'app-diary',
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
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css',
})
export class DiaryComponent extends BaseAuxiliaryBookComponent {
  override request: GenerateAuxiliaryBookRequest = {
    entId: '',
    userId: 0,
    type: AuxiliaryBookType.DIARY,
    criteria: this.criteria,
  };

  override dataTable: DiaryResponse[] = [];

  /**
   * ✅ NUEVO: Define la configuración de las cabeceras para la previsualización.
   * Esta estructura debe coincidir con la tabla que se muestra en el HTML.
   */
  headerConfig: ColumnDefinition[][] = [
    // Fila 1 de la cabecera
    [
      { header: 'Fecha', field: 'date', rowspan: 2 },
      {
        header: 'Cuenta',
        colspan: 2,
        children: [
          { header: 'Código', field: 'accountCode' },
          { header: 'Descripción', field: 'accountDescription' },
        ],
      },
      { header: 'Débito', field: 'debit', type: 'number', rowspan: 2 },
      { header: 'Crédito', field: 'credit', type: 'number', rowspan: 2 },
    ],
    // Fila 2 de la cabecera (columnas anidadas)
    [
      // Estas columnas se renderizarán debajo de 'Cuenta'
      { header: 'Código', field: 'accountCode' },
      { header: 'Descripción', field: 'accountDescription' },
      // Nota: He omitido 'Comprobante' ya que no está en los datos de la respuesta (DiaryResponse)
      // Si se añade en el futuro, se puede agregar aquí de forma similar a 'Cuenta'.
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
      name: 'Libro Diario',
      description:
        'Registra cronologicamente todas las transacciones de la empresa.',
      icon: 'wb_sunny',
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

    const formattedStartDate = this.datePipe.transform(
      this.datePeriod[0],
      'yyyy-MM-dd'
    );

    const formattedEndDate = this.datePipe.transform(
      this.datePeriod[1],
      'yyyy-MM-dd'
    );

    this.request = {
      entId: this.resolveEntId(),
      criteria: {
        ...this.criteria,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },
      type: AuxiliaryBookType.DIARY,
      userId: this.resolveUserId(),
    };
  }

  override calculateTotals() {
    this.totalDebit = this.dataTable.reduce(
      (sum, row) => sum + (Number(row.debit) || 0),
      0
    );
    this.totalCredit = this.dataTable.reduce(
      (sum, row) => sum + (Number(row.credit) || 0),
      0
    );

    console.log('Total Débito:', this.totalDebit);
    console.log('Total Crédito:', this.totalCredit);
  }
}
