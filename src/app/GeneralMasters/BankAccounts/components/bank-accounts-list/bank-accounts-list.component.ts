import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankAccountsService, BankAccount } from '../../services/bank-accounts.service';

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
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';


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
  private bankAccountsService = inject(BankAccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private localStorageMethod = inject(LocalStorageMethods);
  
  private enterpriseId: string = '';

  loading = false;

  bankAccounts: BankAccount[] = [];
  filteredBankAccounts: BankAccount[] = [];

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (this.enterpriseId) {
      this.loadBankAccounts();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la empresa'
      });
    }
  }

  private loadBankAccounts(): void {
    this.loading = true;
    this.bankAccountsService.findAll(this.enterpriseId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.bankAccounts = response.content;
          this.totalRecords = response.totalElements;
          this.applySearch();
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
    this.applySearch();
  }


  private applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBankAccounts = [...this.bankAccounts];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredBankAccounts = this.bankAccounts.filter(account =>
        account.accountNumber.toString().includes(term) ||
        account.bank?.nombre?.toLowerCase().includes(term) ||
        account.bank?.codigo?.toLowerCase().includes(term) ||
        account.cuentaContable.toLowerCase().includes(term)
      );
    }
  }

  // Navigation
  navigateToBanks(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/bank-accounts/create']);
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
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
        }
      });
  }


  getAccountTypeDisplay(accountType: string): string {
    return this.bankAccountsService.getAccountTypeDisplay(accountType);
  }
}
