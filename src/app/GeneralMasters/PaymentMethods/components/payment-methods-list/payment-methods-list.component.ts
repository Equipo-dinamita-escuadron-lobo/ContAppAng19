import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentMethodsServiceService, PageResponse } from '../../services/payment-methods-service.service';
import { PaymentMethodsValidationMessagesService } from '../../services/payment-methods-validation-messages.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { Account } from '../../../AccountCatalogue/models/ChartAccount';
import { PaymentMethod } from '../../models/PaymentMethods';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// PrimeNG Services
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-payment-methods-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    ToggleSwitchModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './payment-methods-list.component.html',
  styleUrl: './payment-methods-list.component.css'
})
export class PaymentMethodsListComponent implements OnInit {
  private readonly service = inject(PaymentMethodsServiceService);
  private readonly chartAccountService = inject(ChartAccountService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly localStorageMethod = inject(LocalStorageMethods);
  private readonly router = inject(Router);
  public readonly paymentMethodsValidationMessagesService = inject(PaymentMethodsValidationMessagesService);

  private enterpriseId: string = '';

  loading = false;
  paymentMethods: PaymentMethod[] = [];

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';
  sortField: string | undefined;
  sortOrder: string | undefined;

  accountingAccounts: any[] = [];
  accountingAccountsMap: Map<string, string> = new Map();

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (this.enterpriseId) {
      this.loadAccountingAccounts();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el identificador de la empresa'
      });
    }
  }

  private loadAccountingAccounts(): void {
    this.chartAccountService.getListAccounts(this.enterpriseId).subscribe({
      next: (accounts: Account[]) => {
        this.accountingAccounts = this.flattenAccounts(accounts);
        for (const account of this.accountingAccounts) {
          if (account.code != null) {
            this.accountingAccountsMap.set(account.code.toString(), `${account.code} - ${account.description}`);
          }
        }
        // Una vez que tenemos el mapa, cargar los métodos de pago
        this.loadPaymentMethods();
      },
      error: (error) => {
        console.error('Error al cargar cuentas contables:', error);
        // Aún así cargar los métodos de pago, aunque sin nombres de cuentas
        this.loadPaymentMethods();
      }
    });
  }

  /**
   * Aplana la estructura jerárquica de cuentas
   */
  private flattenAccounts(accounts: any[]): any[] {
    const result: any[] = [];

    const flatten = (items: any[]) => {
      for (const item of items) {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      }
    };

    flatten(accounts);
    return result;
  }

  private loadPaymentMethods(): void {
    this.loading = true;
    this.service.findAll(this.enterpriseId, this.currentPage, this.pageSize, this.sortField, this.sortOrder, this.searchTerm || undefined)
      .subscribe({
        next: (response: PageResponse<PaymentMethod>) => {
          this.paymentMethods = response.content.map(pm => ({
            ...pm,
            accountingAccountDisplay: this.getAccountingAccountDisplay(pm.accountingAccount)
          }));
          this.totalRecords = response.page?.totalElements || response.totalElements || 0;
          this.loading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 0; // Reset to first page when searching
    this.loadPaymentMethods();
  }

  onSort(event: any): void {
    const newSortField = event.field;
    const newSortOrder = event.order === 1 ? 'asc' : 'desc';

    // Only reload if sort parameters actually changed
    if (this.sortField !== newSortField || this.sortOrder !== newSortOrder) {
      this.sortField = newSortField || undefined;
      this.sortOrder = newSortOrder || undefined;
      this.currentPage = 0; // Reset to first page when sorting
      this.loadPaymentMethods();
    }
  }

  onPage(event: any): void {
    const newPage = Math.floor(event.first / event.rows);
    const newRows = event.rows;

    if (this.currentPage !== newPage || this.pageSize !== newRows) {
      this.currentPage = newPage;
      this.pageSize = newRows;
      this.loadPaymentMethods();
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/payment-methods/create']);
  }

  navigateToEdit(paymentMethod: PaymentMethod): void {
    if (!paymentMethod.id) return;
    this.router.navigate(['/gen-masters/payment-methods/edit', paymentMethod.id]);
  }

  confirmDelete(paymentMethod: PaymentMethod): void {
    if (!paymentMethod.id) return;

    this.confirmationService.confirm({
      message: `¿Desea eliminar "${paymentMethod.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deletePaymentMethod(paymentMethod);
      }
    });
  }

  private deletePaymentMethod(paymentMethod: PaymentMethod): void {
    if (!paymentMethod.id) return;

    this.service.delete(paymentMethod.id, this.enterpriseId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Método de pago eliminado correctamente'
          });
          this.loadPaymentMethods();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
        }
      });
  }

  togglePaymentMethodStatus(paymentMethod: PaymentMethod, newStatus: boolean): void {
    if (!paymentMethod.id) return;

    this.service.changeState(paymentMethod.id, this.enterpriseId, newStatus)
      .subscribe({
        next: () => {
          paymentMethod.status = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Estado del método de pago '${paymentMethod.name}' cambiado correctamente`
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
          paymentMethod.status = !newStatus;
        }
      });
  }

  getAccountingAccountDisplay(accountingAccount: string): string {
    return this.accountingAccountsMap.get(accountingAccount) || accountingAccount || 'Sin cuenta asignada';
  }
}