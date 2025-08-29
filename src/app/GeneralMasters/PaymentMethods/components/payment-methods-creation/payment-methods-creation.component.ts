import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { PaymentMethodsServiceService } from '../../services/payment-methods-service.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { Account } from '../../../AccountCatalogue/models/ChartAccount';
import { AccountingAccountOption } from '../../models/PaymentMethods';


@Component({
  selector: 'app-payment-methods-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, SelectModule],
  templateUrl: './payment-methods-creation.component.html',
  styleUrl: './payment-methods-creation.component.css',
  providers: [MessageService]
})
export class PaymentMethodsCreationComponent {
  form: FormGroup;
  accountingAccountsOptions: AccountingAccountOption[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private service: PaymentMethodsServiceService,
    private chartAccountService: ChartAccountService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      accountingAccount: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';

    if (enterpriseId) {
      // Cargar todas las cuentas contables activas para el dropdown

      this.chartAccountService.getListAccounts(enterpriseId).subscribe({
        next: (accounts: Account[]) => {
          if (accounts.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Sin cuentas',
              detail: 'No se encontraron cuentas contables para esta empresa.',
              life: 5000
            });
            return;
          }

          // Obtener solo las cuentas hoja (auxiliares) que son las de último nivel sin hijos
          const auxiliaryAccounts: Account[] = [];
          accounts.forEach(account => {
            this.collectLeaves(account, auxiliaryAccounts);
          });

          // Filtrar cuentas válidas (con código y descripción)
          const validAuxiliaryAccounts = auxiliaryAccounts.filter((account: Account) => {
            const hasCode = account.code && account.code.trim() !== '';
            const hasDescription = account.description && account.description.trim() !== '';
            const isValid = hasCode && hasDescription;

            return isValid;
          });

          this.accountingAccountsOptions = validAuxiliaryAccounts.map((account: Account) => ({
            label: `${account.code} - ${account.description}`,
            value: account.code
          }));

          if (this.accountingAccountsOptions.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Sin cuentas auxiliares',
              detail: 'No se encontraron cuentas auxiliares disponibles.',
              life: 5000
            });
          }
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de conexión',
            detail: 'No se pudieron cargar las cuentas contables. Verifique la conexión con el servidor.',
            life: 5000
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empresa no encontrada',
        detail: 'No se pudo identificar la empresa actual.',
        life: 5000
      });
    }
  }

  goBack() {
    this.router.navigate(['/gen-masters/payment-methods/list']);
  }

  /**
   * Recorre recursivamente una estructura de cuentas y recoge todos los elementos hoja (cuentas auxiliares)
   * Si el nodo actual tiene hijos, se recursiona sobre ellos. Si no tiene hijos, se agrega a la lista de hojas.
   *
   * @param item - El nodo actual de la cuenta que se está procesando
   * @param leaves - La lista acumulada de hojas donde se agregarán los nodos sin hijos
   * @returns Una lista de cuentas que son hojas (cuentas auxiliares sin hijos)
   */
  private collectLeaves(item: Account, leaves: Account[]): Account[] {
    if (item.children && item.children.length > 0) {
      // Recorrer todos los hijos recursivamente
      item.children.forEach(child => this.collectLeaves(child, leaves));
    } else {
      // Si no hay hijos, agregar el nodo actual a la lista de hojas (cuentas auxiliares)
      leaves.push(item);
    }
    return leaves;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = {
      idEnterprise: enterpriseId,
      ...this.form.value,
      status: true // Por defecto activo
    };

    this.service.create(payload as any).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Método de pago creado correctamente.'
        });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        if (err?.status === 409) {
          const msg: string = err?.error?.message || err?.error?.detail || '';
          const nameMatch = msg.match(/nombre\s+'([^']+)'/i) || msg.match(/nombre\s*[:=]\s*([A-Za-zÀ-ÿ0-9\s]+)/i);
          if (nameMatch) {
            const n = (nameMatch[1] || nameMatch[0])?.toString().replace(/^[^']*'|'/g,'');
            this.messageService.add({
              severity: 'error',
              summary: 'Nombre duplicado',
              detail: `El método de pago "${n}" ya existe.`
            });
            return;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicado',
            detail: 'Ya existe un método de pago con el mismo nombre.'
          });
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el método de pago'
        });
      }
    });
  }
}