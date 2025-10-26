import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { PaymentMethodsServiceService } from '../../services/payment-methods-service.service';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { Account } from '../../../AccountCatalogue/models/ChartAccount';
import { AccountingAccountOption, PaymentMethod } from '../../models/PaymentMethods';
import { PaymentMethodsUtils } from '../../utils/payment-methods.utils';

@Component({
  selector: 'app-payment-methods-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, SelectModule, TooltipModule],
  templateUrl: './payment-methods-edit.component.html',
  styleUrl: './payment-methods-edit.component.css',
  providers: [MessageService]
})
export class PaymentMethodsEditComponent implements OnInit {
  form: FormGroup;
  id!: number;
  accountingAccountsOptions: AccountingAccountOption[] = [];
  initialValue: any = {};
  isEditMode: boolean = true; // Siempre es true en este componente de edición
  accountingAccountLocked: boolean = true; // La cuenta contable siempre está bloqueada en edición

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
      accountingAccount: [null, []], // Inicialmente habilitado, se deshabilitará después de cargar datos
      accountingAccountId: [null, []] // Campo oculto para almacenar el ID
    });
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    if (!enterpriseId || !this.id) return;

    // Cargar cuentas auxiliares para el dropdown primero
    this.loadAccountingAccounts(enterpriseId, () => {
      // Una vez cargadas las cuentas, cargar los datos del método de pago
      this.loadPaymentMethodData(enterpriseId);
    });
  }

  private loadPaymentMethodData(enterpriseId: string): void {
    this.service.findById(this.id, enterpriseId).subscribe({
      next: (paymentMethod: PaymentMethod) => {
        // Obtener el ID de la cuenta contable
        let accountId: number | null = paymentMethod.accountingAccountId;
        
        // Si accountingAccountId es null, intentar encontrar la cuenta por el código
        if (!accountId && paymentMethod.accountingAccount) {
          const accountCode = paymentMethod.accountingAccount.split(' - ')[0];
          const foundAccount = this.accountingAccountsOptions.find(option => option.code === accountCode);
          accountId = foundAccount?.value || null;
        }

        this.form.patchValue({
          name: paymentMethod.name,
          accountingAccount: accountId,
          accountingAccountId: accountId
        });

        // Deshabilitar el campo accountingAccount después de cargar los datos
        this.form.get('accountingAccount')?.disable();

        // NOTA: accountingAccount está bloqueado, por lo que no se compara en hasChanges()
        this.initialValue = {
          name: paymentMethod.name
        };
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

  private loadAccountingAccounts(enterpriseId: string, callback?: () => void): void {
    this.chartAccountService.getListAccounts(enterpriseId).subscribe({
      next: (accounts: Account[]) => {
        // Obtener solo las cuentas auxiliares (8 dígitos) que son las que se usan para registrar movimientos
        const auxiliaryAccounts: Account[] = [];
        for (const account of accounts) {
          PaymentMethodsUtils.collectAuxiliaryAccounts(account, auxiliaryAccounts);
        }

        // Filtrar cuentas válidas
        const validAuxiliaryAccounts = PaymentMethodsUtils.filterValidAuxiliaryAccounts(auxiliaryAccounts);

        this.accountingAccountsOptions = validAuxiliaryAccounts
          .filter((account: Account) => account.id !== undefined)
          .map((account: Account) => ({
            label: `${account.code} - ${account.description}`,
            value: account.id!, // Usar ID como value (ya filtrado)
            code: account.code // Mantener código para referencia
          }));

        // Ejecutar callback si se proporciona
        if (callback) {
          callback();
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
    // Solo comparar el campo 'name' ya que 'accountingAccount' está bloqueado
    const currentName = this.form.get('name')?.value;
    return this.initialValue.name !== currentName;
  }

  onSubmit() {
    if (this.form.invalid || !this.hasChanges()) {
      this.form.markAllAsTouched();
      return;
    }

    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    // Usamos getRawValue() para incluir valores de campos deshabilitados
    const formValues = this.form.getRawValue();

    // Para edición, obtener el ID de la cuenta contable
    // Como el campo está deshabilitado, el valor debería ser el ID original
    const accountingAccountId = formValues.accountingAccountId;

    const payload = {
      id: this.id,
      idEnterprise: enterpriseId,
      name: formValues.name,
      accountingAccountId: accountingAccountId
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