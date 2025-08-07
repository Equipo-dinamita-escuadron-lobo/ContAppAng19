import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TaxList } from '../../models/Tax';
import { TaxService } from '../../services/tax.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-list-tax',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './list-tax.component.html',
  styleUrl: './list-tax.component.css'
})
export class ListTaxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly taxService = inject(TaxService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly chartAccountService = inject(ChartAccountService);

  taxes: TaxList[] = [];
  filteredTaxes: TaxList[] = [];
  loading: boolean = false;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  accounts: any[] = [];

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.loadTaxes();
  }

  /**
   * Carga la lista de impuestos desde el servicio
   */
  loadTaxes(): void {
    if (this.entData?.id) {
      this.loading = true;
      
      // Cargar impuestos primero
      this.taxService.getTaxes(this.entData.id).subscribe({
        next: (taxes) => {
          // Mostrar impuestos inmediatamente con códigos de cuenta
          this.taxes = taxes.map((tax: any) => ({
            ...tax,
            depositAccountName: tax.depositAccount || tax.depositAccountName || 'Cargando...',
            refundAccountName: tax.refundAccount || tax.refundAccountName || 'Cargando...'
          }));
          this.filteredTaxes = [...this.taxes];
          this.loading = false;
          
          // Cargar nombres de cuentas en segundo plano
          this.loadAccountNames();
        },
        error: (error) => {
          console.error('Error al cargar los impuestos:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los impuestos'
          });
          this.loading = false;
        }
      });
    }
  }

  /**
   * Carga los nombres de las cuentas en segundo plano
   */
  private loadAccountNames(): void {
    this.chartAccountService.getListAccounts(this.entData.id).subscribe({
      next: (accounts) => {
        this.accounts = this.flattenAccounts(accounts);
        // Actualizar nombres de cuentas sin mostrar loading
        this.taxes = this.mapTaxesWithAccountNames(this.taxes);
        this.filteredTaxes = [...this.taxes];
      },
      error: (error) => {
        console.warn('No se pudieron cargar los nombres de las cuentas:', error);
        // Mantener los códigos de cuenta si falla
      }
    });
  }

  /**
   * Aplana la estructura jerárquica de cuentas
   */
  private flattenAccounts(accounts: any[]): any[] {
    const result: any[] = [];
    
    const flatten = (items: any[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };
    
    flatten(accounts);
    return result;
  }

  /**
   * Mapea los impuestos con los nombres de las cuentas
   */
  private mapTaxesWithAccountNames(taxes: any[]): TaxList[] {
    return taxes.map(tax => {
      const depositAccount = this.accounts.find(acc => acc.code === tax.depositAccount);
      const refundAccount = this.accounts.find(acc => acc.code === tax.refundAccount);
      
      return {
        ...tax,
        depositAccountName: depositAccount ? `${depositAccount.code} - ${depositAccount.description}` : tax.depositAccount || 'No especificada',
        refundAccountName: refundAccount ? `${refundAccount.code} - ${refundAccount.description}` : tax.refundAccount || 'No especificada'
      };
    });
  }



  /**
   * Navega al componente de creación de impuestos
   */
  createTax(): void {
    this.router.navigate(['/gen-masters/taxes/create']);
  }

  /**
   * Navega al componente de edición de impuestos
   */
  editTax(tax: TaxList): void {
    this.router.navigate(['/gen-masters/taxes/edit', tax.id], {
      state: { taxData: tax }
    });
  }

  /**
   * Confirma y elimina un impuesto
   */
  deleteTax(tax: TaxList): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el impuesto "${tax.description}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.taxService.deleteTax(tax.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Impuesto eliminado exitosamente'
            });
            this.loadTaxes(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error al eliminar el impuesto:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el impuesto'
            });
          }
        });
      }
    });
  }

  /**
   * Formatea el porcentaje para mostrar
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }


}