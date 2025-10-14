import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

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

// PrimeNG Services
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

// Interfaces
interface Bank {
  id?: number;
  codigo: string;
  nombre: string;
  moneda: string;
  status: boolean;
  isDeleted?: boolean;
  idEnterprise?: string;
}

interface Currency {
  code: string;
  description: string;
}

interface BankCreateRequest {
  codigo: string;
  nombre: string;
  moneda: string;
  idEnterprise: string;
}

interface BankUpdateRequest {
  id: number;
  codigo: string;
  nombre: string;
  moneda: string;
  status: boolean;
  idEnterprise: string;
}

@Component({
  selector: 'app-bank-list',
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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './bank-list.component.html',
  styleUrl: './bank-list.component.css'
})
export class BankListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // API Base URL
  private readonly API_BASE = '/api/accountCatalogue/banks';
  
  // Enterprise ID - En un caso real vendría del servicio de autenticación
  private readonly enterpriseId = 'EMP001';

  // Form and UI State
  bankForm!: FormGroup;
  showForm = false;
  isEditing = false;
  isSubmitting = false;
  loading = false;

  // Data
  banks: Bank[] = [];
  filteredBanks: Bank[] = [];
  editingBank: Bank | null = null;

  // Pagination
  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  // Search
  searchTerm = '';

  // Currency Options
  currencies: Currency[] = [
    { code: 'COP', description: 'COP - Peso Colombiano' },
    { code: 'USD', description: 'USD - Dólar Estadounidense' },
    { code: 'EUR', description: 'EUR - Euro' },
    { code: 'GBP', description: 'GBP - Libra Esterlina' },
    { code: 'CHF', description: 'CHF - Franco Suizo' },
    { code: 'JPY', description: 'JPY - Yen Japonés' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadBanks();
  }

  private initializeForm(): void {
    this.bankForm = this.fb.group({
      codigo: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9]+$/),
        Validators.maxLength(10)
      ], [this.duplicateCodeValidator.bind(this)]],
      nombre: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9\s]+$/),
        Validators.maxLength(100)
      ], [this.duplicateNameValidator.bind(this)]],
      moneda: ['', Validators.required],
      status: [true]
    });
  }

  // Custom Validators
  private duplicateCodeValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || (this.isEditing && this.editingBank?.codigo === control.value)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const exists = this.banks.some(bank => 
          bank.codigo.toLowerCase() === control.value.toLowerCase() && 
          (!this.isEditing || bank.id !== this.editingBank?.id)
        );
        resolve(exists ? { duplicateCode: true } : null);
      }, 300);
    });
  }

  private duplicateNameValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || (this.isEditing && this.editingBank?.nombre === control.value)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const exists = this.banks.some(bank => 
          bank.nombre.toLowerCase() === control.value.toLowerCase() && 
          (!this.isEditing || bank.id !== this.editingBank?.id)
        );
        resolve(exists ? { duplicateName: true } : null);
      }, 300);
    });
  }

  // Data Loading
  private loadBanks(): void {
    this.loading = true;
    this.http.get<any>(`${this.API_BASE}/findAll/${this.enterpriseId}?page=${this.currentPage}&size=${this.pageSize}`)
      .subscribe({
        next: (response) => {
          this.banks = response.content || [];
          this.totalRecords = response.totalElements || 0;
          this.applySearch();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading banks:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la lista de bancos'
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
      this.filteredBanks = [...this.banks];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredBanks = this.banks.filter(bank =>
        bank.codigo.toLowerCase().includes(term) ||
        bank.nombre.toLowerCase().includes(term)
      );
    }
  }

  // Form Operations
  showCreateForm(): void {
    this.isEditing = false;
    this.editingBank = null;
    this.showForm = true;
    this.bankForm.reset();
    this.bankForm.patchValue({ status: true });
  }

  editBank(bank: Bank): void {
    this.isEditing = true;
    this.editingBank = { ...bank };
    this.showForm = true;
    this.bankForm.patchValue({
      codigo: bank.codigo,
      nombre: bank.nombre,
      moneda: bank.moneda,
      status: bank.status
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingBank = null;
    this.bankForm.reset();
  }

  onSubmit(): void {
    if (this.bankForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      if (this.isEditing) {
        this.updateBank();
      } else {
        this.createBank();
      }
    }
  }

  private createBank(): void {
    const formValue = this.bankForm.value;
    const createRequest: BankCreateRequest = {
      codigo: formValue.codigo,
      nombre: formValue.nombre,
      moneda: formValue.moneda,
      idEnterprise: this.enterpriseId
    };

    this.http.post<Bank>(`${this.API_BASE}/create`, createRequest)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Banco creado correctamente'
          });
          this.loadBanks();
          this.cancelForm();
          this.isSubmitting = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating bank:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al crear el banco'
          });
          this.isSubmitting = false;
        }
      });
  }

  private updateBank(): void {
    if (!this.editingBank?.id) return;

    const formValue = this.bankForm.value;
    const updateRequest: BankUpdateRequest = {
      id: this.editingBank.id,
      codigo: formValue.codigo,
      nombre: formValue.nombre,
      moneda: formValue.moneda,
      status: formValue.status,
      idEnterprise: this.enterpriseId
    };

    this.http.put<Bank>(`${this.API_BASE}/update`, updateRequest)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Banco actualizado correctamente'
          });
          this.loadBanks();
          this.cancelForm();
          this.isSubmitting = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating bank:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al actualizar el banco'
          });
          this.isSubmitting = false;
        }
      });
  }

  // Status Toggle
  toggleBankStatus(bank: Bank, newStatus: boolean): void {
    if (!bank.id) return;

    this.http.patch<Bank>(`${this.API_BASE}/changeState/${bank.id}/${this.enterpriseId}?state=${newStatus}`, {})
      .subscribe({
        next: (response) => {
          bank.status = newStatus;
          this.messageService.add({
            severity: 'info',
            summary: 'Estado actualizado',
            detail: `Banco ${newStatus ? 'activado' : 'desactivado'} correctamente`
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error toggling bank status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cambiar el estado del banco'
          });
          // Revert the toggle
          bank.status = !newStatus;
        }
      });
  }

  // Delete Confirmation
  confirmDelete(bank: Bank): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el banco "${bank.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteBank(bank);
      }
    });
  }

  private deleteBank(bank: Bank): void {
    if (!bank.id) return;

    this.http.delete<Bank>(`${this.API_BASE}/delete/${bank.id}/${this.enterpriseId}`)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Banco eliminado correctamente'
          });
          this.loadBanks();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting bank:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al eliminar el banco'
          });
        }
      });
  }

  // Export Functionality
  exportBanks(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Exportación',
      detail: 'Funcionalidad de exportación en desarrollo'
    });
  }

  // Utility Methods
  getCurrencyDisplay(currencyCode: string): string {
    const currency = this.currencies.find(c => c.code === currencyCode);
    return currency ? currency.description : currencyCode;
  }
}
