import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-bank-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, MultiSelectModule],
  templateUrl: './bank-creation.component.html',
  styleUrl: './bank-creation.component.css',
  providers: [MessageService]
})
export class BankCreationComponent implements OnInit {
  form: FormGroup;
  currenciesOptions: { label: string; value: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private bankService: BankService,
    private localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, BankService.validateBankCode]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      currencies: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.currenciesOptions = this.bankService.getCurrencies().map(currency => ({
      label: currency.description,
      value: currency.code
    }));
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/bank-accounts/banks']);
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
      code: this.form.value.code,
      name: this.form.value.name,
      currencies: this.form.value.currencies
    };

    this.bankService.create(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Banco creado correctamente.'
        });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: err.title || 'Error',
          detail: err.message
        });
      }
    });
  }
}
