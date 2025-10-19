import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { environment } from '../../../../../environments/environment';

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

// Interfaces
interface Bank {
  id: number;
  codigo: string;
  nombre: string;
  moneda: string;
  status: boolean;
}

interface BankAccount {
  id?: number;
  accountNumber: number;
  bank: Bank;
  accountType: string;
  cuentaContable: string;
  status: boolean;
  isDeleted?: boolean;
  idEnterprise?: string;
}

interface AccountType {
  code: string;
  description: string;
}


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
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private localStorageMethod = inject(LocalStorageMethods);

  // API Base URLs
  private readonly BANK_ACCOUNT_API = environment.API_URL + 'accountCatalogue/bank-accounts';
  private readonly BANK_API = environment.API_URL + 'accountCatalogue/banks';
  
  // Enterprise ID
  private enterpriseId: string = '';

  // UI State
  loading = false;

  // Data
  bankAccounts: BankAccount[] = [];
  filteredBankAccounts: BankAccount[] = [];

  // Pagination
  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  // Search
  searchTerm = '';

  // Account Types
  accountTypes: AccountType[] = [
    { code: 'AHORROS', description: 'Cuenta de Ahorros' },
    { code: 'CORRIENTE', description: 'Cuenta Corriente' }
  ];

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
    this.http.get<any>(`${this.BANK_ACCOUNT_API}/findAll/${this.enterpriseId}?page=${this.currentPage}&size=${this.pageSize}`)
      .subscribe({
        next: (response) => {
          this.bankAccounts = response.content || [];
          this.totalRecords = response.totalElements || 0;
          this.applySearch();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading bank accounts:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la lista de cuentas bancarias'
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

  // Status Toggle
  toggleAccountStatus(account: BankAccount, newStatus: boolean): void {
    if (!account.id) return;

    this.http.patch<BankAccount>(`${this.BANK_ACCOUNT_API}/changeState/${account.id}/${this.enterpriseId}?state=${newStatus}`, {})
      .subscribe({
        next: (response) => {
          account.status = newStatus;
          this.messageService.add({
            severity: 'info',
            summary: 'Estado actualizado',
            detail: `Cuenta bancaria ${newStatus ? 'activada' : 'desactivada'} correctamente`
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error toggling account status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cambiar el estado de la cuenta bancaria'
          });
          // Revert the toggle
          account.status = !newStatus;
        }
      });
  }

  // Delete Confirmation
  confirmDelete(account: BankAccount): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la cuenta bancaria "${account.accountNumber}"?`,
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

    this.http.delete<BankAccount>(`${this.BANK_ACCOUNT_API}/delete/${account.id}/${this.enterpriseId}`)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cuenta bancaria eliminada correctamente'
          });
          this.loadBankAccounts();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting bank account:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al eliminar la cuenta bancaria'
          });
        }
      });
  }


  // Utility Methods
  getAccountTypeDisplay(accountType: string): string {
    const type = this.accountTypes.find(t => t.code === accountType);
    return type ? type.description : accountType;
  }
}
