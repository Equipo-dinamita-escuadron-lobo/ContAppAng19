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
import { TaxValidationMessagesService } from '../../services/tax-validation-messages.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';

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
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './list-tax.component.html',
  styleUrl: './list-tax.component.css',
})
export class ListTaxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly taxService = inject(TaxService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly chartAccountService = inject(ChartAccountService);
  public readonly taxValidationMessagesService = inject(
    TaxValidationMessagesService,
  );

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
        this.loadTaxesLazy({
          first: this.currentPage * this.currentSize,
          rows: this.currentSize,
          sortField: this.currentSortField,
          sortOrder: this.currentSortOrder === 'asc' ? 1 : -1,
        });
      },
      error: (error) => {
        this.loadTaxesLazy({
          first: this.currentPage * this.currentSize,
          rows: this.currentSize,
          sortField: this.currentSortField,
          sortOrder: this.currentSortOrder === 'asc' ? 1 : -1,
        });
      },
    });
  }

  /**
   * Aplana la estructura jerárquica de cuentas
   */
  private flattenAccounts(accounts: any[]): any[] {
    const result: any[] = [];

    const flatten = (items: any[]) => {
      items.forEach((item) => {
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
    if (!enterpriseId) {
      this.taxes = [];
      this.totalRecords = 0;
      return;
    }

    this.loading = true;

    const first = typeof event?.first === 'number' ? event.first : 0;
    const rows =
      typeof event?.rows === 'number' && event.rows > 0
        ? event.rows
        : this.currentSize || 10;

    this.currentPage = Math.floor(first / rows);
    this.currentSize = rows;

    if (event?.sortField) {
      this.currentSortField = event.sortField;
      this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    this.taxService
      .findAll(
        enterpriseId,
        this.currentPage,
        this.currentSize,
        this.currentSortField,
        this.currentSortOrder,
        this.searchTerm,
      )
      .subscribe({
        next: (response: any) => {
          const content: any[] = Array.isArray(response)
            ? response
            : Array.isArray(response?.content)
              ? response.content
              : [];

          this.taxes = content.map((tax: any) => ({
            ...tax,
            id: Number(tax.id),
            purchaseTaxName: this.getAccountName(
              tax.purchaseTax ?? tax.depositAccount,
            ),
            salesTaxName: this.getAccountName(
              tax.salesTax ?? tax.refundAccount,
            ),
            status: typeof tax.status === 'boolean' ? tax.status : false,
          }));

          this.totalRecords = Array.isArray(response)
            ? content.length
            : (response?.page?.totalElements ??
              response?.totalElements ??
              content.length);

          this.loading = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los impuestos',
          });
          this.loading = false;
        },
      });
  }

  /**
   * Recarga la página actual
   */
  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) {
      this.taxes = [];
      this.totalRecords = 0;
      return;
    }

    this.loading = true;

    this.taxService
      .findAll(
        enterpriseId,
        this.currentPage,
        this.currentSize,
        this.currentSortField,
        this.currentSortOrder,
        this.searchTerm,
      )
      .subscribe({
        next: (response: any) => {
          const content: any[] = Array.isArray(response)
            ? response
            : Array.isArray(response?.content)
              ? response.content
              : [];

          this.taxes = content.map((tax: any) => ({
            ...tax,
            id: Number(tax.id),
            purchaseTaxName: this.getAccountName(
              tax.purchaseTax ?? tax.depositAccount,
            ),
            salesTaxName: this.getAccountName(
              tax.salesTax ?? tax.refundAccount,
            ),
            status: typeof tax.status === 'boolean' ? tax.status : false,
          }));

          this.totalRecords = Array.isArray(response)
            ? content.length
            : (response?.page?.totalElements ??
              response?.totalElements ??
              content.length);

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron recargar los impuestos',
          });
        },
      });
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearchChange(): void {
    // Resetear a la primera página cuando se busca
    this.currentPage = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadTaxesLazy({
      first: 0,
      rows: this.currentSize,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder === 'asc' ? 1 : -1,
    });
  }

  /**
   * Obtiene el nombre de la cuenta por código
   */
  private getAccountName(code: string): string {
    if (!code) return 'N/A';
    const account = this.accounts.find(
      (acc) => String(acc.code) === String(code),
    );
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
      state: { taxData: tax },
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

        this.taxService.deleteTax(Number(tax.id), enterpriseId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Impuesto eliminado exitosamente',
            });
            this.reloadCurrentPage(); // Recargar la página actual
          },
          error: (error) => {
            const errorMessage =
              error?.error?.message || 'No se pudo eliminar el impuesto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
            });
          },
        });
      },
    });
  }

  /**
   * Cambia el estado de un impuesto
   */
  changeTaxState(taxId: number, tax: TaxList): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Sin soporte',
      detail: 'El cambio de estado aún no está implementado en el backend.',
    });
  }
  /**
   * Formatea el porcentaje para mostrar
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
