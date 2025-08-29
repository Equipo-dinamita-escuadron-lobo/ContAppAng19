import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { PaymentMethodsServiceService } from '../../services/payment-methods-service.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { Account } from '../../../AccountCatalogue/models/ChartAccount';
import { AccountingAccountOption, PaymentMethod } from '../../models/PaymentMethods';
import { PaymentMethodsUtils } from '../../utils/payment-methods.utils';

@Component({
  selector: 'app-payment-methods-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, SelectModule],
  templateUrl: './payment-methods-edit.component.html',
  styleUrl: './payment-methods-edit.component.css',
  providers: [MessageService]
})
export class PaymentMethodsEditComponent implements OnInit {
  form: FormGroup;
  id!: number;
  accountingAccountsOptions: AccountingAccountOption[] = [];
  initialValue: any = {};

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
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
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    if (!enterpriseId || !this.id) return;

    // Cargar cuentas auxiliares para el dropdown
    this.loadAccountingAccounts(enterpriseId);

    // Cargar datos del método de pago
    this.service.findById(this.id, enterpriseId).subscribe({
      next: (paymentMethod: PaymentMethod) => {
        this.form.patchValue({
          name: paymentMethod.name,
          accountingAccount: paymentMethod.accountingAccount
        });
        this.initialValue = this.form.getRawValue();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el método de pago'
        });
      }
    });
  }

  private loadAccountingAccounts(enterpriseId: string): void {
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

        // Obtener solo las cuentas hoja (auxiliares)
        const auxiliaryAccounts: Account[] = [];
        accounts.forEach(account => {
          PaymentMethodsUtils.collectLeaves(account, auxiliaryAccounts);
        });

        // Filtrar cuentas válidas
        const validAuxiliaryAccounts = PaymentMethodsUtils.filterValidAuxiliaryAccounts(auxiliaryAccounts);

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
  }

  goBack() {
    this.router.navigate(['/gen-masters/payment-methods/list']);
  }

  hasChanges(): boolean {
    return JSON.stringify(this.initialValue) !== JSON.stringify(this.form.getRawValue());
  }

  onSubmit() {
    if (this.form.invalid || !this.hasChanges()) {
      this.form.markAllAsTouched();
      return;
    }

    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = {
      id: this.id,
      idEnterprise: enterpriseId,
      ...this.form.value
    };

    this.service.update(payload as any).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualización exitosa',
          detail: 'Método de pago actualizado correctamente.'
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
              summary: 'Nombre ya existente',
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
          detail: 'No se pudo actualizar el método de pago'
        });
      }
    });
  }
}