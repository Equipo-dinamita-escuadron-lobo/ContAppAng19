import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
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

interface BankAccountCreateRequest {
  accountNumber: number;
  bankId: number;
  accountType: string;
  cuentaContable: string;
  idEnterprise: string;
}

interface BankAccountUpdateRequest {
  id: number;
  accountNumber: number;
  bankId: number;
  accountType: string;
  cuentaContable: string;
  status: boolean;
  idEnterprise: string;
}


@Component({
  selector: 'app-bank-accounts-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
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
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // API Base URLs
  private readonly BANK_ACCOUNT_API = '/api/accountCatalogue/bank-accounts';
  private readonly BANK_API = '/api/accountCatalogue/banks';
  
  // Enterprise ID - En un caso real vendría del servicio de autenticación
  private readonly enterpriseId = 'EMP001';

  // Form and UI State
  bankAccountForm!: FormGroup;
  showForm = false;
  isEditing = false;
  isSubmitting = false;
  loading = false;

  // Data
  bankAccounts: BankAccount[] = [];
  filteredBankAccounts: BankAccount[] = [];
  banks: Bank[] = [];
  editingBankAccount: BankAccount | null = null;

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
    this.initializeForm();
    this.loadBanks();
    this.loadBankAccounts();
  }

  private initializeForm(): void {
    this.bankAccountForm = this.fb.group({
      accountNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/),
        Validators.maxLength(20)
      ], [this.duplicateAccountValidator.bind(this)]],
      bankId: ['', Validators.required],
      accountType: ['', Validators.required],
      cuentaContable: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9]+$/),
        Validators.maxLength(50)
      ]],
      status: [true]
    });
  }

  // Custom Validators
  private duplicateAccountValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || (this.isEditing && this.editingBankAccount?.accountNumber === control.value)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const exists = this.bankAccounts.some(account => 
          account.accountNumber === control.value && 
          (!this.isEditing || account.id !== this.editingBankAccount?.id)
        );
        resolve(exists ? { duplicateAccount: true } : null);
      }, 300);
    });
  }

  // Data Loading
  private loadBanks(): void {
    this.http.get<any>(`${this.BANK_API}/findAllByStatus/${this.enterpriseId}?status=true&page=0&size=100`)
      .subscribe({
        next: (response) => {
          this.banks = response.content || [];
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading banks:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la lista de bancos'
          });
        }
      });
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
    this.router.navigate(['/general-masters/bank-accounts/banks']);
  }

  // Form Operations
  showCreateForm(): void {
    this.isEditing = false;
    this.editingBankAccount = null;
    this.showForm = true;
    this.bankAccountForm.reset();
    this.bankAccountForm.patchValue({ status: true });
  }

  editBankAccount(account: BankAccount): void {
    this.isEditing = true;
    this.editingBankAccount = { ...account };
    this.showForm = true;
    this.bankAccountForm.patchValue({
      accountNumber: account.accountNumber,
      bankId: account.bank?.id,
      accountType: account.accountType,
      cuentaContable: account.cuentaContable,
      status: account.status
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingBankAccount = null;
    this.bankAccountForm.reset();
  }

  onSubmit(): void {
    if (this.bankAccountForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      if (this.isEditing) {
        this.updateBankAccount();
      } else {
        this.createBankAccount();
      }
    }
  }

  private createBankAccount(): void {
    const formValue = this.bankAccountForm.value;
    const createRequest: BankAccountCreateRequest = {
      accountNumber: formValue.accountNumber,
      bankId: formValue.bankId,
      accountType: formValue.accountType,
      cuentaContable: formValue.cuentaContable,
      idEnterprise: this.enterpriseId
    };

    this.http.post<BankAccount>(`${this.BANK_ACCOUNT_API}/create`, createRequest)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cuenta bancaria creada correctamente'
          });
          this.loadBankAccounts();
          this.cancelForm();
          this.isSubmitting = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating bank account:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al crear la cuenta bancaria'
          });
          this.isSubmitting = false;
        }
      });
  }

  private updateBankAccount(): void {
    if (!this.editingBankAccount?.id) return;

    const formValue = this.bankAccountForm.value;
    const updateRequest: BankAccountUpdateRequest = {
      id: this.editingBankAccount.id,
      accountNumber: formValue.accountNumber,
      bankId: formValue.bankId,
      accountType: formValue.accountType,
      cuentaContable: formValue.cuentaContable,
      status: formValue.status,
      idEnterprise: this.enterpriseId
    };

    this.http.put<BankAccount>(`${this.BANK_ACCOUNT_API}/update`, updateRequest)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cuenta bancaria actualizada correctamente'
          });
          this.loadBankAccounts();
          this.cancelForm();
          this.isSubmitting = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating bank account:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al actualizar la cuenta bancaria'
          });
          this.isSubmitting = false;
        }
      });
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
