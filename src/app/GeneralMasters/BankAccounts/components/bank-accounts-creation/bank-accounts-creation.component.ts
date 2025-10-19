import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { HttpClient } from '@angular/common/http';
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { environment } from '../../../../../environments/environment';

interface Bank {
  id: number;
  codigo: string;
  nombre: string;
  moneda: string;
  status: boolean;
}

interface AccountType {
  code: string;
  description: string;
}

interface BankAccountCreateRequest {
  idEnterprise: string;
  accountNumber: number;
  bankId: number;
  accountType: string;
  cuentaContable: string;
  status?: boolean;
}

@Component({
  selector: 'app-bank-accounts-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast, SelectModule],
  templateUrl: './bank-accounts-creation.component.html',
  styleUrl: './bank-accounts-creation.component.css',
  providers: [MessageService]
})
export class BankAccountsCreationComponent implements OnInit {
  form: FormGroup;
  banksOptions: { label: string; value: number }[] = [];
  accountTypesOptions: { label: string; value: string }[] = [];
  auxiliaryAccountsOptions: { label: string; value: string }[] = [];

  private readonly BANK_API = environment.API_URL + 'accountCatalogue/banks';
  private readonly BANK_ACCOUNT_API = environment.API_URL + 'accountCatalogue/bank-accounts';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private http: HttpClient,
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

    // Cargar tipos de cuenta
    this.accountTypesOptions = [
      { label: 'Cuenta de Ahorros', value: 'AHORROS' },
      { label: 'Cuenta Corriente', value: 'CORRIENTE' }
    ];

    // Cargar bancos
    if (enterpriseId) {
      this.loadBanks(enterpriseId);
      this.loadAuxiliaryAccounts(enterpriseId);
    }
  }

  private loadBanks(enterpriseId: string): void {
    this.http.get<any>(`${this.BANK_API}/findAllByStatus/${enterpriseId}?status=true&page=0&size=100`)
      .subscribe({
        next: (response) => {
          const banks = response.content || [];
          this.banksOptions = banks.map((bank: Bank) => ({
            label: `${bank.codigo} - ${bank.nombre}`,
            value: bank.id
          }));
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los bancos disponibles'
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

  goBack(): void {
    this.router.navigate(['/gen-masters/bank-accounts/list']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

    const payload: BankAccountCreateRequest = {
      idEnterprise: enterpriseId,
      accountNumber: Number(this.form.value.accountNumber),
      bankId: this.form.value.bankId,
      accountType: this.form.value.accountType,
      cuentaContable: this.form.value.cuentaContable,
      status: true
    };

    this.http.post<any>(`${this.BANK_ACCOUNT_API}/create`, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Cuenta bancaria creada correctamente.'
        });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicado',
            detail: 'Ya existe una cuenta bancaria con este número.'
          });
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo crear la cuenta bancaria'
        });
      }
    });
  }
}
