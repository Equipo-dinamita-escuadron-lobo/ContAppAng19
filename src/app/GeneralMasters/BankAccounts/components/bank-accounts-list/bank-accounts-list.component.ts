import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankAccountsService, BankAccount } from '../../services/bank-accounts.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { BankAccountsPresentationService } from '../../services/bank-accounts-presentation.service';

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
  selector: 'app-bank-accounts-list',
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
  templateUrl: './bank-accounts-list.component.html',
  styleUrl: './bank-accounts-list.component.css'
})
export class BankAccountsListComponent implements OnInit {
  private readonly bankAccountsService = inject(BankAccountsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly localStorageMethod = inject(LocalStorageMethods);
  private readonly chartAccountService = inject(ChartAccountService);
  public readonly bankAccountsPresentationService = inject(BankAccountsPresentationService);
  
  private enterpriseId: string = '';

  loading = false;

  bankAccounts: BankAccount[] = [];
  accountingAccounts: any[] = [];
  accountingAccountsMap: Map<string, string> = new Map();

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';
  sortField: string | undefined;
  sortOrder: string | undefined;

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (this.enterpriseId) {
      this.loadAccountingAccounts();
      this.loadBankAccounts();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la empresa'
      });
    }
  }

  private loadAccountingAccounts(): void {
    this.chartAccountService.getListAccounts(this.enterpriseId).subscribe({
      next: (accounts) => {
        this.accountingAccounts = this.flattenAccounts(accounts);
        for (const account of this.accountingAccounts) {
          if (account.id != null) {
            this.accountingAccountsMap.set(account.id.toString(), `${account.code} - ${account.description}`);
          }
        }
      },
      error: () => {
        // Silenciar error, no es crítico
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

  private loadBankAccounts(): void {
    this.loading = true;
    this.bankAccountsService.findAll(this.enterpriseId, this.currentPage, this.pageSize, this.sortField, this.sortOrder, this.searchTerm || undefined)
      .subscribe({
        next: (response) => {
          this.bankAccounts = response.content;
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


  // Search Functionality
  onSearch(): void {
    this.currentPage = 0; // Reset to first page when searching
    this.loadBankAccounts();
  }

  onSort(event: any): void {
    const newSortField = event.field;
    const newSortOrder = event.order === 1 ? 'asc' : 'desc';

    // Only reload if sort parameters actually changed
    if (this.sortField !== newSortField || this.sortOrder !== newSortOrder) {
      this.sortField = newSortField || undefined;
      this.sortOrder = newSortOrder || undefined;
      this.currentPage = 0; // Reset to first page when sorting
      this.loadBankAccounts();
    }
  }

  onPage(event: any): void {
    const newPage = Math.floor(event.first / event.rows);
    const newRows = event.rows;

    if (this.currentPage !== newPage || this.pageSize !== newRows) {
      this.currentPage = newPage;
      this.pageSize = newRows;
      this.loadBankAccounts();
    }
  }

  // Navigation
  navigateToBanks(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/bank-accounts/create']);
  }

  navigateToEdit(account: BankAccount): void {
    this.router.navigate(['/gen-masters/bank-accounts/edit', account.id]);
  }

  toggleAccountStatus(account: BankAccount, newStatus: boolean): void {
    if (!account.id) return;

    this.bankAccountsService.changeState(account.id, this.enterpriseId, newStatus)
      .subscribe({
        next: () => {
          account.status = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Estado de la cuenta '${account.accountNumber}' cambiado correctamente`
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
          account.status = !newStatus;
        }
      });
  }

  confirmDelete(account: BankAccount): void {
    this.confirmationService.confirm({
      message: `¿Desea eliminar la cuenta bancaria "${account.accountNumber}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteBankAccount(account);
      }
    });
  }

  private deleteBankAccount(account: BankAccount): void {
    if (!account.id) return;

    this.bankAccountsService.delete(account.id, this.enterpriseId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cuenta bancaria eliminada correctamente'
          });
          this.loadBankAccounts();
        },
        error: (error) => {
          // Verificar si es error específico de cuenta bancaria en uso
          const errorCode = error?.error?.code || error?.code || '';
          if (errorCode === 'BANK_ACCOUNT_IN_USE') {
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: error?.error?.message || 'No se puede eliminar la cuenta bancaria porque tiene movimientos contables',
              life: 6000
            });
            return;
          }

          // Verificar si el mensaje de error contiene la cadena específica de movimientos contables
          const errorMessage = error?.error?.message || error?.message || '';
          if (errorMessage.includes('No se puede eliminar la cuenta bancaria') && errorMessage.includes('movimientos contables')) {
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: errorMessage,
              life: 6000
            });
            return;
          }

          // Para otros errores, mostrar mensaje genérico
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
        }
      });
  }
}
