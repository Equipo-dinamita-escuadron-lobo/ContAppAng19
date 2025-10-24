import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService } from '../../services/bank.service';
import { BankAccountsService } from '../../services/bank-accounts.service';

@Component({
  selector: 'app-bank-accounts-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast, SelectModule],
  templateUrl: './bank-accounts-edit.component.html',
  styleUrl: './bank-accounts-edit.component.css',
  providers: [MessageService]
})
export class BankAccountsEditComponent implements OnInit {
  form: FormGroup;
  banksOptions: { label: string; value: number }[] = [];
  accountTypesOptions: { label: string; value: string }[] = [];
  auxiliaryAccountsOptions: { label: string; value: string }[] = [];
  accountId: number | null = null;
  loading = false;
  originalFormValue: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private bankService: BankService,
    private bankAccountsService: BankAccountsService,
    private chartAccountService: ChartAccountService,
    private localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      accountNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(20)]],
      bankId: [null, [Validators.required]],
      accountType: ['', [Validators.required]],
      cuentaContable: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const enterpriseId = this.localStorageMethod.getIdEnterprise();

    // Cargar tipos de cuenta desde el servicio
    this.accountTypesOptions = this.bankAccountsService.getAccountTypes().map(type => ({
      label: type.description,
      value: type.code
    }));

    // Obtener ID de la cuenta desde la ruta
    this.route.params.subscribe(params => {
      this.accountId = +params['id'];
      if (this.accountId && enterpriseId) {
        this.loadBanks(enterpriseId);
        this.loadAuxiliaryAccounts(enterpriseId);
        this.loadAccountData();
      }
    });
  }

  private loadBanks(enterpriseId: string): void {
    this.bankService.findAllActive(enterpriseId)
      .subscribe({
        next: (response) => {
          this.banksOptions = response.content.map(bank => ({
            label: `${bank.code} - ${bank.name}`,
            value: bank.id!
          }));
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

  private loadAuxiliaryAccounts(enterpriseId: string): void {
    this.chartAccountService.getListAuxiliaryAccounts(enterpriseId).subscribe({
      next: (accounts) => {
        this.auxiliaryAccountsOptions = accounts.map(account => ({
          label: `${account.code} - ${account.description}`,
          value: account.code
        }));
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las cuentas contables'
        });
      }
    });
  }

  private loadAccountData(): void {
    if (!this.accountId) return;

    const enterpriseId = this.localStorageMethod.getIdEnterprise();
    if (!enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la empresa'
      });
      return;
    }

    this.loading = true;
    this.bankAccountsService.findById(this.accountId, enterpriseId).subscribe({
      next: (account) => {
        const formData = {
          accountNumber: account.accountNumber.toString(),
          bankId: account.bank.id,
          accountType: account.accountType,
          cuentaContable: account.cuentaContable
        };
        this.form.patchValue(formData);
        this.originalFormValue = { ...formData };
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: error.title || 'Error',
          detail: error.message
        });
        this.loading = false;
        setTimeout(() => this.goBack(), 2000);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/bank-accounts/list']);
  }

  hasChanges(): boolean {
    if (!this.originalFormValue) return false;
    const currentValue = this.form.value;
    return JSON.stringify(currentValue) !== JSON.stringify(this.originalFormValue);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.accountId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'ID de la cuenta no válido'
      });
      return;
    }

    const enterpriseId = this.localStorageMethod.getIdEnterprise();

    if (!enterpriseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la empresa'
      });
      return;
    }

    const payload = {
      id: this.accountId,
      idEnterprise: enterpriseId,
      accountNumber: this.form.value.accountNumber,
      bankId: this.form.value.bankId,
      accountType: this.form.value.accountType,
      cuentaContable: this.form.value.cuentaContable,
      status: true
    };

    this.bankAccountsService.update(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualización exitosa',
          detail: 'Cuenta bancaria actualizada correctamente.'
        });
        setTimeout(() => {
          this.goBack();
        }, 1000);
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
}
