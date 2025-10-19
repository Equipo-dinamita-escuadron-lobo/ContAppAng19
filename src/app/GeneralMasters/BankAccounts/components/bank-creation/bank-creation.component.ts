import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { HttpClient } from '@angular/common/http';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { environment } from '../../../../../environments/environment';

interface Currency {
  code: string;
  description: string;
}

interface BankCreateRequest {
  idEnterprise: string;
  codigo: string;
  nombre: string;
  moneda: string;
}

@Component({
  selector: 'app-bank-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, Toast, SelectModule],
  templateUrl: './bank-creation.component.html',
  styleUrl: './bank-creation.component.css',
  providers: [MessageService]
})
export class BankCreationComponent implements OnInit {
  form: FormGroup;
  currenciesOptions: { label: string; value: string }[] = [];

  private readonly BANK_API = environment.API_URL + 'accountCatalogue/banks';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private http: HttpClient,
    private localStorageMethod: LocalStorageMethods
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$'), Validators.maxLength(10)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      moneda: ['', [Validators.required]]
    });
  }

  /**CAMBIAR LISTAR DESDE EL BACKEND */
  ngOnInit(): void {
    this.currenciesOptions = [
      { label: 'COP - Peso Colombiano', value: 'COP' },
      { label: 'USD - Dólar Estadounidense', value: 'USD' },
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'GBP - Libra Esterlina', value: 'GBP' },
      { label: 'CHF - Franco Suizo', value: 'CHF' },
      { label: 'JPY - Yen Japonés', value: 'JPY' }
    ];
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

    const payload: BankCreateRequest = {
      idEnterprise: enterpriseId,
      codigo: this.form.value.codigo,
      nombre: this.form.value.nombre,
      moneda: this.form.value.moneda
    };

    this.http.post<any>(`${this.BANK_API}/create`, payload).subscribe({
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
        if (err?.status === 409) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'El código del banco ya existe'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Error al crear el banco'
          });
        }
      }
    });
  }
}
