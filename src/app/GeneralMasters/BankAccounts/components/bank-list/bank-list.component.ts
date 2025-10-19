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
  templateUrl: './bank-list.component.html',
  styleUrl: './bank-list.component.css'
})
export class BankListComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private localStorageMethod = inject(LocalStorageMethods);
  private router = inject(Router);

  private readonly API_BASE = environment.API_URL + 'accountCatalogue/banks';
  private enterpriseId: string = '';

  loading = false;
  banks: Bank[] = [];
  filteredBanks: Bank[] = [];

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';

  currencies: Currency[] = [
    { code: 'COP', description: 'COP - Peso Colombiano' },
    { code: 'USD', description: 'USD - Dólar Estadounidense' },
    { code: 'EUR', description: 'EUR - Euro' },
    { code: 'GBP', description: 'GBP - Libra Esterlina' },
    { code: 'CHF', description: 'CHF - Franco Suizo' },
    { code: 'JPY', description: 'JPY - Yen Japonés' }
  ];

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (this.enterpriseId) {
      this.loadBanks();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la empresa'
      });
    }
  }
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

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks/create']);
  }

  getCurrencyDisplay(currencyCode: string): string {
    const currency = this.currencies.find(c => c.code === currencyCode);
    return currency ? currency.description : currencyCode;
  }
}
