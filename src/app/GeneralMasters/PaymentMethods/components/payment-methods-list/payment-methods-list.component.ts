import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { PaymentMethodsServiceService } from '../../services/payment-methods-service.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { Account } from '../../../AccountCatalogue/models/ChartAccount';
import { PaymentMethod, AccountingAccountOption } from '../../models/PaymentMethods';
import { PaymentMethodsUtils } from '../../utils/payment-methods.utils';

@Component({
  selector: 'app-payment-methods-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    TagModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './payment-methods-list.component.html',
  styleUrl: './payment-methods-list.component.css'
})
export class PaymentMethodsListComponent {
  list: PaymentMethod[] = [];
  filtered: PaymentMethod[] = [];
  totalRecords: number = 0;
  currentPage: number = 0;
  currentSize: number = 10;
  currentSortField: string = 'name';
  currentSortOrder: string = 'asc';
  accountingAccountsMap: Map<string, string> = new Map(); // código -> descripción
  accountingAccountsOptions: AccountingAccountOption[] = []; // Para compatibilidad

  constructor(
    private service: PaymentMethodsServiceService,
    private chartAccountService: ChartAccountService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const enterpriseId = this.getEnterpriseId();
    if (enterpriseId) {
      // Primero cargar las cuentas contables para crear el mapa
      this.loadAccountingAccounts(enterpriseId);
    }
  }

  private getEnterpriseId(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      try { return JSON.parse(entData).id; } catch {}
    }
    return '';
  }

  private loadAccountingAccounts(enterpriseId: string): void {
    this.chartAccountService.getListAccounts(enterpriseId).subscribe({
      next: (accounts: Account[]) => {
        // Obtener todas las cuentas auxiliares para crear el mapa
        const auxiliaryAccounts: Account[] = [];
        accounts.forEach(account => {
          PaymentMethodsUtils.collectAuxiliaryAccounts(account, auxiliaryAccounts);
        });

        // Crear mapa de código -> descripción
        auxiliaryAccounts.forEach(account => {
          this.accountingAccountsMap.set(account.code, account.description);

        // También crear opciones para dropdown si es necesario
        this.accountingAccountsOptions = this.accountingAccountsOptions || [];
        if (account.id !== undefined) {
          this.accountingAccountsOptions.push({
            label: `${account.code} - ${account.description}`,
            value: account.id,
            code: account.code
          });
        }
        });

        // Una vez que tenemos el mapa, cargar los métodos de pago
        this.loadPaymentMethodsLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: 1 });
      },
      error: (error) => {
        console.error('Error al cargar cuentas contables:', error);
        // Aún así cargar los métodos de pago, aunque sin nombres de cuentas
        this.loadPaymentMethodsLazy({ first: 0, rows: this.currentSize, sortField: this.currentSortField, sortOrder: 1 });
      }
    });
  }

  loadPaymentMethodsLazy(event: any): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    // Calcular página y tamaño desde los controles de PrimeNG
    this.currentPage = Math.floor(event.first / event.rows);
    this.currentSize = event.rows;

    // Capturar parámetros de sorting
    this.currentSortField = event.sortField || 'name'; // Campo por defecto
    this.currentSortOrder = event.sortOrder === 1 ? 'asc' : 'desc'; // 1 = asc, -1 = desc

    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder).subscribe({
      next: (page) => {
        const content: PaymentMethod[] = page.content || [];
        this.list = content.map(pm => ({
          ...pm,
          // Usar el campo accountingAccount que ya contiene el formato "código - descripción"
          accountingAccountDisplay: pm.accountingAccount || 'Sin cuenta asignada'
        }));
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al cargar métodos de pago:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los métodos de pago. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  reloadCurrentPage(): void {
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) return;

    this.service.findAll(enterpriseId, this.currentPage, this.currentSize, this.currentSortField, this.currentSortOrder).subscribe({
      next: (page) => {
        const content: PaymentMethod[] = page.content || [];
        this.list = content.map(pm => ({
          ...pm,
          // Usar el campo accountingAccount que ya contiene el formato "código - descripción"
          accountingAccountDisplay: pm.accountingAccount || 'Sin cuenta asignada'
        }));
        this.totalRecords = page?.totalElements || 0;
      },
      error: (error) => {
        console.error('Error al recargar métodos de pago:', error);
      }
    });
  }

  private getAccountingAccountDisplay(accountingAccount: string): string {
    if (!accountingAccount) return '';

    const description = this.accountingAccountsMap.get(accountingAccount);
    return description ? `${accountingAccount} - ${description}` : accountingAccount;
  }

  filterGlobal(event: Event, table: any) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  createPaymentMethod() {
    this.router.navigate(['/gen-masters/payment-methods/create']);
  }

  editPaymentMethod(row: PaymentMethod) {
    if (!row?.id) return;
    this.router.navigate(['/gen-masters/payment-methods/edit', row.id]);
  }

  deletePaymentMethod(row: PaymentMethod) {
    if (!row?.id) return;

    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Desea eliminar el método de pago "${row.name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      defaultFocus: 'reject',
      closeOnEscape: true,
      accept: () => this.confirmDeletePaymentMethod(row)
    });
  }

  changePaymentMethodState(paymentMethod: PaymentMethod) {
    const enterpriseId = this.getEnterpriseId();
    if (!paymentMethod?.id || !enterpriseId) return;

    const newStatus = !paymentMethod.status;

    this.service.changeState(paymentMethod.id, enterpriseId, newStatus).subscribe({
      next: () => {
        paymentMethod.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del método de pago "${paymentMethod.name}" cambiado correctamente`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del método de pago.'
        });
      }
    });
  }

  getStateSeverity(status: boolean): string {
    return status ? 'success' : 'danger';
  }

  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  isActive(status: boolean): boolean {
    return status === true;
  }

  private confirmDeletePaymentMethod(row: PaymentMethod): void {
    const enterpriseId = this.getEnterpriseId();
    if (!row?.id || !enterpriseId) return;

    this.service.delete(row.id, enterpriseId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Método de pago eliminado correctamente.'
        });
        this.reloadCurrentPage();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el método de pago.'
        });
      }
    });
  }
}