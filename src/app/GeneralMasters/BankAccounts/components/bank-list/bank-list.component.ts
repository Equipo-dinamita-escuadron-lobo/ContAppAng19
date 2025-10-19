import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService, Bank } from '../../services/bank.service';

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
  private bankService = inject(BankService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private localStorageMethod = inject(LocalStorageMethods);
  private router = inject(Router);

  private enterpriseId: string = '';

  loading = false;
  banks: Bank[] = [];
  filteredBanks: Bank[] = [];

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';

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
    this.bankService.findAll(this.enterpriseId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.banks = response.content;
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

    this.bankService.changeState(bank.id, this.enterpriseId, newStatus)
      .subscribe({
        next: () => {
          bank.status = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Estado del banco '${bank.nombre}' cambiado correctamente`
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: error.title || 'Error',
            detail: error.message
          });
          bank.status = !newStatus;
        }
      });
  }

  confirmDelete(bank: Bank): void {
    this.confirmationService.confirm({
      message: `¿Desea eliminar el banco "${bank.nombre}"?`,
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

    this.bankService.delete(bank.id, this.enterpriseId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Banco eliminado correctamente'
          });
          this.loadBanks();
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

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks/create']);
  }

  navigateToEdit(bank: Bank): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks/edit', bank.id]);
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/bank-accounts']);
  }

  getCurrencyDisplay(currencyCode: string): string {
    return this.bankService.getCurrencyDisplay(currencyCode);
  }
}
