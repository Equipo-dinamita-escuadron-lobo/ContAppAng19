import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-bank-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, SelectModule],
  templateUrl: './bank-edit.component.html',
  styleUrl: './bank-edit.component.css',
  providers: [MessageService]
})
export class BankEditComponent implements OnInit {
  form: FormGroup;
  currenciesOptions: { label: string; value: string }[] = [];
  bankId: number | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private bankService: BankService,
    private localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, BankService.validateBankCode]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      moneda: ['', [Validators.required]]
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
        this.form.patchValue({
          codigo: bank.codigo,
          nombre: bank.nombre,
          moneda: bank.moneda
        });
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
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
      codigo: this.form.value.codigo,
      nombre: this.form.value.nombre,
      moneda: this.form.value.moneda,
      status: true
    };

    this.bankService.update(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Banco actualizado correctamente.'
        });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message
        });
      }
    });
  }
}
