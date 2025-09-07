import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

// PrimeNG Imports
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Models and Services
import { Third } from '../../models/Third';
import { ThirdService } from '../../Services/third.service';
import { ThirdServiceConfigurationService } from '../../Services/third-configuration.service';
import { ThirdType } from '../../models/ThirdType';
import { TypeId } from '../../models/TypeId';
import { eThirdGender } from '../../models/eThirdGender';
import { ePersonType } from '../../models/ePersonType';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

// External libraries
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-third-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    FileUploadModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './third-list.component.html',
  styleUrl: './third-list.component.css'
})
export class ThirdListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // Data properties
  thirds: Third[] = [];
  selectedThirds: Third[] = [];
  thirdTypes: ThirdType[] = [];
  typeIds: TypeId[] = [];
  
  // UI State
  loading = false;
  showDetailView = false;
  globalFilterValue = '';
  
  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;
  
  // Modal states
  showTemplateModal = false;
  showImportModal = false;
  showExportModal = false;
  createPdfRUT = false;
  
  // Company data
  entData: string = '';
  
  // Excel data
  excelData: any[] = [];

  constructor(
    private thirdService: ThirdService,
    private thirdConfigurationService: ThirdServiceConfigurationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private datePipe: DatePipe,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.entData = this.localStorageMethods.getIdEnterprise();
  }

  ngOnInit(): void {
    this.loadThirds();
    this.getThirdTypes();
    this.getTypesID();
  }

  /**
   * Carga la lista de terceros
   */
  loadThirds(): void {
    this.loading = true;
    this.thirdService.getThirdList(this.entData).subscribe({
      next: (data: Third[]) => {
        this.thirds = data;
        this.totalRecords = data.length;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading thirds:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los terceros'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Obtiene los tipos de tercero
   */
  private getThirdTypes(): void {
    this.thirdConfigurationService.getThirdTypes(this.entData).subscribe({
      next: (response: ThirdType[]) => {
        this.thirdTypes = response;
      },
      error: (error: any) => {
        console.error('Error loading third types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Tercero Para esta Empresa'
        });
      }
    });
  }

  /**
   * Obtiene los tipos de identificación
   */
  private getTypesID(): void {
    this.thirdConfigurationService.getTypeIds(this.entData).subscribe({
      next: (response: TypeId[]) => {
        this.typeIds = response;
      },
      error: (error: any) => {
        console.error('Error loading ID types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se han encontrado Tipos De Identificación Para esta Empresa'
        });
      }
    });
  }

  /**
   * Aplica filtro global a la tabla
   */
  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue = target.value;
    this.dt.filterGlobal(target.value, 'contains');
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.dt.clear();
    this.globalFilterValue = '';
  }

  /**
   * Alterna entre vista detallada y resumida
   */
  toggleDetailView(): void {
    this.showDetailView = !this.showDetailView;
  }

  /**
   * Navega a la página de creación de terceros
   */
  navigateToCreate(): void {
    this.router.navigate(['/general/operations/third-parties/create']);
  }

  /**
   * Navega a la página de edición de terceros
   */
  navigateToEdit(thirdId: number): void {
    this.router.navigate(['/general/operations/third-parties/edit', thirdId]);
  }

  /**
   * Cambia el estado de un tercero
   */
  changeThirdState(third: Third): void {
    const action = third.state ? 'desactivar' : 'activar';
    const severity = third.state ? 'warn' : 'info';
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea ${action} este tercero?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.thirdService.changeThirdPartieState(third.thId).subscribe({
          next: () => {
            third.state = !third.state;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Tercero ${action} correctamente`
            });
          },
          error: (error) => {
            console.error('Error changing third state:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al ${action} el tercero`
            });
          }
        });
      }
    });
  }

  /**
   * Obtiene el nombre completo o razón social
   */
  getDisplayName(third: Third): string {
    return third.names ? `${third.names} ${third.lastNames}` : third.socialReason || '';
  }

  /**
   * Obtiene la severidad del tag según el estado
   */
  getStateSeverity(state: boolean): 'success' | 'danger' {
    return state ? 'success' : 'danger';
  }

  /**
   * Obtiene el texto del estado
   */
  getStateText(state: boolean): string {
    return state ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene los tipos de tercero como string
   */
  getThirdTypesText(thirdTypes: ThirdType[]): string {
    return thirdTypes.map(type => type.thirdTypeName).join(', ');
  }

  /**
   * Exporta terceros a Excel
   */
  exportThirdsToExcel(): void {
    if (this.thirds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay terceros para exportar'
      });
      return;
    }

    const exportData = this.thirds.map(third => ({
      'Tipo Persona': third.personType,
      'Tipos de Tercero': this.getThirdTypesText(third.thirdTypes),
      'Nombres': third.names || '',
      'Apellidos': third.lastNames || '',
      'Razón Social': third.socialReason || '',
      'Género': third.gender || '',
      'Tipo ID': third.typeId.typeId,
      'Identificación': third.idNumber,
      'Número de Verificación': third.verificationNumber || '',
      'Estado': this.getStateText(third.state),
      'País': third.country,
      'Departamento': third.province,
      'Ciudad': third.city,
      'Dirección': third.address,
      'Teléfono': third.phoneNumber,
      'Correo': third.email,
      'Fecha Creación': third.creationDate,
      'Fecha Actualización': third.updateDate
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Terceros');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(data, `terceros_${new Date().getTime()}.xlsx`);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Terceros exportados correctamente'
    });
  }

  /**
   * Maneja la selección de archivos para importación
   */
  onFileSelect(event: any): void {
    const file = event.files[0];
    if (!file) return;

    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El archivo debe ser de tipo xlsx'
      });
      return;
    }

    this.readExcelFile(file);
  }

  /**
   * Lee y procesa un archivo Excel
   */
  private readExcelFile(file: File): void {
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    
    fileReader.onload = (e) => {
      try {
        const workBook = XLSX.read(fileReader.result, { type: 'binary', cellText: true });
        const sheetNames = workBook.SheetNames;
        this.excelData = XLSX.utils.sheet_to_json(workBook.Sheets[sheetNames[0]]);
        
        this.processExcelData();
      } catch (error) {
        console.error('Error reading Excel file:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al procesar el archivo Excel'
        });
      }
    };
  }

  /**
   * Procesa los datos del Excel
   */
  private processExcelData(): void {
    const currentDate = new Date();
    let successCount = 0;
    let errorCount = 0;

    this.excelData.forEach((row: any) => {
      try {
        const third: Third = {
          thId: 0,
          entId: this.entData,
          personType: this.convertPersonType(row["Tipo persona"]),
          thirdTypes: this.convertThirdTypes(row["Tipos de tercero"]),
          names: row["Nombres"],
          lastNames: row["Apellidos"],
          socialReason: row["Razon social"],
          gender: this.convertGender(row["Genero"]),
          typeId: this.convertTypeId(row["Tipo ID"]),
          idNumber: row["Identificacion"],
          verificationNumber: row["Numero de verificacion"],
          state: this.convertState(row["Estado"]),
          country: row["Pais"],
          province: row["Departamento"],
          city: row["Ciudad"],
          address: row["Direccion"],
          phoneNumber: row["Telefono"],
          email: row["Correo"],
          creationDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!,
          updateDate: this.datePipe.transform(currentDate, 'yyyy-MM-dd')!
        };

        this.createThirdFromExcel(third);
        successCount++;
      } catch (error) {
        console.error('Error processing row:', error);
        errorCount++;
      }
    });

    this.messageService.add({
      severity: successCount > 0 ? 'success' : 'error',
      summary: 'Importación completada',
      detail: `${successCount} terceros importados correctamente. ${errorCount} errores.`
    });

    if (successCount > 0) {
      this.loadThirds();
    }
  }

  /**
   * Crea un tercero desde datos de Excel
   */
  private createThirdFromExcel(third: Third): void {
    this.thirdService.createThird(third).subscribe({
      next: () => {
        // Success handled in processExcelData
      },
      error: (error) => {
        console.error('Error creating third from Excel:', error);
      }
    });
  }

  // Conversion methods for Excel import
  private convertPersonType(type: string): ePersonType {
    switch (type?.trim().toLowerCase()) {
      case 'natural':
        return ePersonType.natural;
      case 'juridica':
        return ePersonType.juridica;
      default:
        throw new Error(`Tipo de persona desconocido: ${type}`);
    }
  }

  private convertGender(gender: string): eThirdGender | null {
    if (!gender || gender.trim() === '') {
      return null;
    }
    
    switch (gender.trim().toLowerCase()) {
      case 'masculino':
        return eThirdGender.masculino;
      case 'femenino':
        return eThirdGender.femenino;
      case 'otro':
        return eThirdGender.Otro;
      default:
        throw new Error(`Género desconocido: ${gender}`);
    }
  }

  private convertState(state: string): boolean {
    switch (state?.trim().toLowerCase()) {
      case 'activo':
        return true;
      case 'inactivo':
        return false;
      default:
        throw new Error(`Estado desconocido: ${state}`);
    }
  }

  private convertThirdTypes(thirdTypes: string): ThirdType[] {
    const typeNames = (thirdTypes as string).split(",").map(item => item.trim());
    return this.thirdTypes.filter(type => 
      typeNames.includes(type.thirdTypeName)
    );
  }

  private convertTypeId(typeId: string): TypeId {
    const matchingType = this.typeIds.find(type => 
      typeId.includes(type.typeId)
    );
    
    if (!matchingType) {
      throw new Error(`No se encontró el tipo de ID: ${typeId}`);
    }
    
    return matchingType;
  }

  // Modal methods
  openConfigModal(): void {
    // TODO: Implement configuration modal
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
  }

  openCreatePDFRunt(): void {
    this.createPdfRUT = true;
  }

  closeCreatePDFRunt(): void {
    this.createPdfRUT = false;
  }
}