import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TaxList } from '../../models/Tax';
import { TaxService } from '../../services/tax.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-list-tax',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    ToggleSwitchModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './list-tax.component.html',
  styleUrl: './list-tax.component.css'
})
export class ListTaxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly taxService = inject(TaxService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly chartAccountService = inject(ChartAccountService);

  taxes: TaxList[] = [];
  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'description';
  currentSortOrder: string = 'asc';
  searchTerm: string = '';
  loading: boolean = false;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  accounts: any[] = [];

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.loadAccountNames();
  }

  /**
   * Obtiene el ID de la empresa desde el localStorage
   */
  private getEnterpriseId(): string {
    const entData = this.localStorageMethods.loadEnterpriseData();
    return entData?.id || '';
  }

  /**
   * Carga los nombres de las cuentas para mapear códigos a nombres
   */
  private loadAccountNames(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.chartAccountService.getListAccounts(enterpriseId).subscribe({
      next: (accounts) => {
        this.accounts = this.flattenAccounts(accounts);
        this.loadTaxesLazy({ first: this.currentPage * this.currentSize, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
      },
      error: (error) => {
        console.warn('No se pudieron cargar los nombres de las cuentas:', error);
        this.loadTaxesLazy({ first: this.currentPage * this.currentSize, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
      }
    });
  }

  /**
   * Aplana la estructura jerárquica de cuentas
   */
  private flattenAccounts(accounts: any[]): any[] {
    const result: any[] = [];

    const flatten = (items: any[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };

    flatten(accounts);
    return result;
  }

  /**
   * Carga los impuestos con paginación lazy
   */
  loadTaxesLazy(event: any): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;

    // Calcular página y tamaño desde los controles de PrimeNG
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;

    // Manejar ordenamiento si está presente
    if (event.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    this.taxService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        const content: any[] = page.content || [];
        this.taxes = content.map((tax: any) => ({
          ...tax,
          id: Number(tax.id),
          depositAccountName: this.getAccountName(tax.depositAccount),
          refundAccountName: this.getAccountName(tax.refundAccount)
        }));
        this.totalRecords = page?.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar los impuestos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los impuestos'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Recarga la página actual
   */
  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.loading = true;
    this.taxService.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder, this.searchTerm).subscribe({
      next: (page: any) => {
        const content: any[] = page.content || [];
        this.taxes = content.map((tax: any) => ({
          ...tax,
          id: Number(tax.id),
          depositAccountName: this.getAccountName(tax.depositAccount),
          refundAccountName: this.getAccountName(tax.refundAccount)
        }));
        this.totalRecords = page?.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al recargar los impuestos:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
    this.currentPage = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadTaxesLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder === 'asc' ? 1 : -1 });
  }

  /**
   * Obtiene el nombre de la cuenta por código
   */
  private getAccountName(code: string): string {
    if (!code) return 'No especificada';
    const account = this.accounts.find(acc => acc.code === code);
    return account ? `${account.code} - ${account.description}` : code;
  }



  /**
   * Navega al componente de creación de impuestos
   */
  createTax(): void {
    this.router.navigate(['/gen-masters/taxes/create']);
  }

  /**
   * Navega al componente de edición de impuestos
   */
  editTax(tax: TaxList): void {
    this.router.navigate(['/gen-masters/taxes/edit', Number(tax.id)], {
      state: { taxData: tax }
    });
  }

  /**
   * Confirma y elimina un impuesto
   */
  deleteTax(tax: TaxList): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el impuesto "${tax.description}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        const enterpriseId = this.getEnterpriseId();
        if (!enterpriseId) return;

        this.taxService.deleteTax(Number(tax.id)).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Impuesto eliminado exitosamente'
            });
            this.reloadCurrentPage(); // Recargar la página actual
          },
          error: (error) => {
            console.error('Error al eliminar el impuesto:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar el impuesto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage
            });
          }
        });
      }
    });
  }

  /**
   * Cambia el estado de un impuesto
   */
  changeTaxState(taxId: number, tax: TaxList): void {
    const enterpriseId = this.getEnterpriseId();
    if (!taxId || !enterpriseId) return;

    const newStatus = !tax.status;

    this.taxService.changeState(taxId, enterpriseId, newStatus).subscribe({
      next: () => {
        tax.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Impuesto "${tax.description}" cambiado correctamente`
        });
      },
      error: (error) => {
        console.error('Error al cambiar el estado del impuesto:', error);
        const errorMessage = error?.error?.message || 'No se pudo cambiar el estado del impuesto.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }

  /**
   * Formatea el porcentaje para mostrar
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  /**
   * Obtiene la severidad del tag de estado
   */
  getStateSeverity(status: boolean): string {
    return status ? 'success' : 'danger';
  }

  /**
   * Formatea el estado para mostrar
   */
  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  /**
   * Verifica si el estado está activo
   */
  isActive(status: boolean): boolean {
    return status === true;
  }
}
