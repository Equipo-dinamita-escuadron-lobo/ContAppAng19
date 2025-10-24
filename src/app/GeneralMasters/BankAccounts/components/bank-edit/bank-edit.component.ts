import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-bank-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, MultiSelectModule],
  templateUrl: './bank-edit.component.html',
  styleUrl: './bank-edit.component.css',
  providers: [MessageService]
})
export class BankEditComponent implements OnInit {
  form: FormGroup;
  currenciesOptions: { label: string; value: string }[] = [];
  bankId: number | null = null;
  loading = false;
  originalFormValue: any = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly messageService: MessageService,
    private readonly bankService: BankService,
    private readonly localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, BankService.validateBankCode]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      currencies: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Cargar opciones de monedas
    this.currenciesOptions = this.bankService.getCurrencies().map(currency => ({
      label: currency.description,
      value: currency.code
    }));

    // Obtener ID del banco desde la ruta
    this.route.params.subscribe(params => {
      this.bankId = +params['id'];
      if (this.bankId) {
        this.loadBankData();
      }
    });
  }

  private loadBankData(): void {
    if (!this.bankId) return;

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
    this.bankService.findById(this.bankId, enterpriseId).subscribe({
      next: (bank) => {
        const formData = {
          code: bank.code,
          name: bank.name,
          currencies: bank.currencies
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
    this.router.navigate(['/gen-masters/bank-accounts/banks']);
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

    if (!this.bankId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'ID del banco no válido'
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
      id: this.bankId,
      idEnterprise: enterpriseId,
      code: this.form.value.code,
      name: this.form.value.name,
      currencies: this.form.value.currencies,
      status: true
    };

    this.bankService.update(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualización exitosa',
          detail: 'Banco actualizado correctamente.'
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
