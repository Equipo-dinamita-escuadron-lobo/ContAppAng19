import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService, Bank } from '../../services/bank.service';
import { BankPresentationService } from '../../services/bank-presentation.service';

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
  private readonly bankService = inject(BankService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly localStorageMethod = inject(LocalStorageMethods);
  private readonly router = inject(Router);
  public readonly bankPresentationService = inject(BankPresentationService);

  private enterpriseId: string = '';

  loading = false;
  banks: Bank[] = [];

  pageSize = 10;
  totalRecords = 0;
  currentPage = 0;

  searchTerm = '';
  sortField: string | undefined;
  sortOrder: string | undefined;

  ngOnInit(): void {
    this.enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (this.enterpriseId) {
      this.loadBanks();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el identificador de la empresa'
      });
    }
  }
  private loadBanks(): void {
    this.loading = true;
    this.bankService.findAll(this.enterpriseId, this.currentPage, this.pageSize, this.sortField, this.sortOrder, this.searchTerm || undefined)
      .subscribe({
        next: (response) => {
          this.banks = response.content;
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
    this.loadBanks();
  }

  onSort(event: any): void {
    const newSortField = event.field;
    const newSortOrder = event.order === 1 ? 'asc' : 'desc';

    // Only reload if sort parameters actually changed
    if (this.sortField !== newSortField || this.sortOrder !== newSortOrder) {
      this.sortField = newSortField || undefined;
      this.sortOrder = newSortOrder || undefined;
      this.currentPage = 0; // Reset to first page when sorting
      this.loadBanks();
    }
  }

  onPage(event: any): void {
    const newPage = Math.floor(event.first / event.rows);
    const newRows = event.rows;

    if (this.currentPage !== newPage || this.pageSize !== newRows) {
      this.currentPage = newPage;
      this.pageSize = newRows;
      this.loadBanks();
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
            detail: `Estado del banco '${bank.name}' cambiado correctamente`
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
      message: `¿Desea eliminar "${bank.name}"?`,
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
          // Verificar si es error específico de banco en uso
          const errorCode = error?.error?.code || error?.code || '';
          if (errorCode === 'BANK_IN_USE') {
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: error?.error?.message || 'No se puede eliminar el banco porque tiene cuentas con movimientos contables',
              life: 6000
            });
            return;
          }

          // Verificar si el mensaje de error contiene la cadena específica de movimientos contables
          const errorMessage = error?.error?.message || error?.message || '';
          if (errorMessage.includes('No se puede eliminar el banco') && errorMessage.includes('movimientos contables')) {
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

  navigateToCreate(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks/create']);
  }

  navigateToEdit(bank: Bank): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks/edit', bank.id]);
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/bank-accounts']);
  }
}
