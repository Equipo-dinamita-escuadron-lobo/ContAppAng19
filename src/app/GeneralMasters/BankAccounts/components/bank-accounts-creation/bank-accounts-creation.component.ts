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
import { ChartAccountService } from '../../../AccountCatalogue/services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService } from '../../services/bank.service';
import { BankAccountsService } from '../../services/bank-accounts.service';

@Component({
  selector: 'app-bank-accounts-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, SelectModule],
  templateUrl: './bank-accounts-creation.component.html',
  styleUrl: './bank-accounts-creation.component.css'
})
export class BankAccountsCreationComponent implements OnInit {
  form: FormGroup;
  banksOptions: { label: string; value: number }[] = [];
  accountTypesOptions: { label: string; value: string }[] = [];
  auxiliaryAccountsOptions: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly bankService: BankService,
    private readonly bankAccountsService: BankAccountsService,
    private readonly chartAccountService: ChartAccountService,
    private readonly localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      accountNumber: ['', [Validators.required, Validators.pattern('^[0-9]{8,16}$')]],
      bankId: [null, [Validators.required]],
      accountType: ['', [Validators.required]],
      accountingAccountId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const enterpriseId = this.localStorageMethod.getIdEnterprise();

    // Cargar tipos de cuenta desde el servicio
    this.accountTypesOptions = this.bankAccountsService.getAccountTypes().map(type => ({
      label: type.description,
      value: type.code
    }));

    // Cargar bancos y cuentas contables
    if (enterpriseId) {
      this.loadBanks(enterpriseId);
      this.loadAuxiliaryAccounts(enterpriseId);
    }
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
        this.auxiliaryAccountsOptions = accounts
          .filter(account => account.id != null)
          .map(account => ({
            label: `${account.code} - ${account.description}`,
            value: account.id!
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

    const payload = {
      idEnterprise: enterpriseId,
      accountNumber: this.form.value.accountNumber,
      bankId: this.form.value.bankId,
      accountType: this.form.value.accountType,
      accountingAccountId: this.form.value.accountingAccountId
    };

    this.bankAccountsService.create(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Cuenta bancaria creada correctamente.'
        });
        this.goBack();
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
