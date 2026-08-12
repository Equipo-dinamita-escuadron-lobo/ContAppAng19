import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { PaymentMethodsServiceService } from '../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { ChartAccountService } from '../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { BankAccountsService } from '../../../GeneralMasters/BankAccounts/services/bank-accounts.service';
import { TreasuryApiService } from '../Shared/treasury-api.service';
import { Payable, PaymentSchedule, PaymentVoucher } from '../Shared/treasury-api.models';
import {
  accountingEntryStatusLabel,
  scheduleStatusLabel,
  voucherStatusFilterOptions,
  voucherStatusLabel,
} from '../Shared/treasury-status-labels';

@Component({
  selector: 'app-treasury-operations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './treasury-operations.component.html',
  styleUrl: './treasury-operations.component.css'
})
export class TreasuryOperationsComponent implements OnInit {
  payables: Payable[] = [];
  vouchers: PaymentVoucher[] = [];
  schedules: PaymentSchedule[] = [];
  writeOffs: any[] = [];
  methods: any[] = [];
  banks: any[] = [];
  accounts: any[] = [];
  bankOptions: { id: number; label: string }[] = [];
  accountOptions: { id: number; label: string }[] = [];
  selected = new Set<number>();
  amounts: Record<number, number> = {};
  paymentMethodId?: number;
  bankAccountId?: number;
  executionDate = '';
  observations = '';
  editingVoucherId?: number;
  counterpartAccountId?: number;
  writeOffReason = '';
  busy = false;
  error = '';
  voucherNumberFilter = '';
  voucherStatusFilter = '';
  accountingEntry: any = null;
  accountingMovements: { account: string; description: string; debit: number; credit: number }[] = [];
  accountingDebitTotal = 0;
  accountingCreditTotal = 0;

  readonly voucherStatusOptions = voucherStatusFilterOptions();

  statusLabel = voucherStatusLabel;
  scheduleLabel = scheduleStatusLabel;
  writeOffLabel = voucherStatusLabel;
  accountingStatusLabel = accountingEntryStatusLabel;

  private readonly enterpriseId: string;

  constructor(
    private readonly api: TreasuryApiService,
    private readonly storage: LocalStorageMethods,
    private readonly paymentMethods: PaymentMethodsServiceService,
    private readonly chart: ChartAccountService,
    private readonly bankAccounts: BankAccountsService
  ) {
    this.enterpriseId = this.storage.getIdEnterprise();
  }

  ngOnInit() { this.reload(); }

  reload() {
    if (!this.enterpriseId) {
      this.error = 'Seleccione una empresa activa.';
      return;
    }
    this.busy = true;
    this.error = '';
    forkJoin({
      payables: this.api.pending(this.enterpriseId),
      vouchers: this.api.vouchers(this.enterpriseId, {
        voucherNumber: this.voucherNumberFilter,
        status: this.voucherStatusFilter
      }),
      schedules: this.api.schedules(this.enterpriseId),
      writeOffs: this.api.writeOffs(this.enterpriseId),
      methods: this.paymentMethods.findAllActive(this.enterpriseId),
      banks: this.bankAccounts.findAllActive(this.enterpriseId),
      accounts: this.chart.getListAuxiliaryAccounts(this.enterpriseId)
    }).subscribe({
      next: data => {
        this.payables = data.payables;
        this.vouchers = data.vouchers.content;
        this.schedules = data.schedules;
        this.writeOffs = data.writeOffs;
        this.methods = data.methods.content;
        this.banks = data.banks.content;
        this.bankOptions = this.banks.map((bank: any) => ({
          id: bank.id,
          label: `${bank.bank?.name || 'Banco'} - ${bank.accountNumber}`
        }));
        this.accounts = data.accounts.filter((a: any) => a.status !== false);
        this.accountOptions = this.accounts.map((account: any) => ({
          id: account.id,
          label: `${account.code} - ${account.description}`
        }));
        this.payables.forEach(p => this.amounts[p.id] ??= p.availableAmount);
        this.busy = false;
      },
      error: err => {
        this.error = err?.error?.message ?? 'No fue posible cargar Tesorería.';
        this.busy = false;
      }
    });
  }

  toggle(id: number, checked: boolean) {
    checked ? this.selected.add(id) : this.selected.delete(id);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'POSTED':
      case 'SCHEDULED':
        return 'success';
      case 'DRAFT':
      case 'POSTING':
      case 'VOIDING':
        return 'info';
      case 'FAILED':
      case 'VOID_FAILED':
        return 'danger';
      case 'VOIDED':
      case 'CANCELLED':
        return 'secondary';
      default:
        return 'warning';
    }
  }

  private details() {
    return this.payables
      .filter(p => this.selected.has(p.id))
      .map(p => ({ supplierId: p.supplierId, invoiceId: p.id, amount: Number(this.amounts[p.id]) }));
  }

  get selectedMethod(): any {
    return this.methods.find(method => method.id === Number(this.paymentMethodId));
  }

  get requiresBankAccount(): boolean {
    return Boolean(this.selectedMethod?.requiresBankAccount);
  }

  paymentMethodChanged() {
    if (!this.requiresBankAccount) this.bankAccountId = undefined;
  }

  private paymentSelectionValid(): boolean {
    if (!this.paymentMethodId) {
      this.error = 'Seleccione un metodo de pago activo.';
      return false;
    }
    if (this.requiresBankAccount && !this.bankAccountId) {
      this.error = 'El metodo seleccionado exige una cuenta bancaria.';
      return false;
    }
    if (!this.requiresBankAccount && this.bankAccountId) {
      this.error = 'El metodo seleccionado no admite cuenta bancaria.';
      return false;
    }
    return true;
  }

  createVoucher() {
    if (!this.paymentSelectionValid() || !this.details().length) return;
    if (!this.amountsWithinAvailable()) return;
    const paymentMethodId = this.paymentMethodId!;
    const request = {
      enterpriseId: this.enterpriseId,
      issueDate: new Date().toISOString().slice(0, 10),
      paymentMethodId,
      bankAccountId: this.bankAccountId,
      observations: this.observations,
      details: this.details()
    };
    this.run(this.editingVoucherId
      ? this.api.updateVoucher(this.editingVoucherId, request)
      : this.api.createVoucher(request));
  }

  edit(voucher: PaymentVoucher) {
    this.editingVoucherId = voucher.id;
    this.paymentMethodId = voucher.paymentMethodId;
    this.bankAccountId = voucher.bankAccountId;
    this.observations = voucher.observations ?? '';
    this.selected.clear();
    voucher.details.forEach(detail => {
      this.selected.add(detail.invoiceId);
      this.amounts[detail.invoiceId] = detail.amountPaid;
    });
  }

  schedule() {
    if (!this.paymentSelectionValid() || !this.executionDate || !this.details().length) return;
    if (!this.amountsWithinAvailable()) return;
    const paymentMethodId = this.paymentMethodId!;
    this.run(this.api.createSchedule({
      enterpriseId: this.enterpriseId,
      issueDate: new Date().toISOString().slice(0, 10),
      executionDate: this.executionDate,
      paymentMethodId,
      bankAccountId: this.bankAccountId,
      observations: this.observations,
      details: this.details()
    }));
  }

  /** Evita enviar montos mayores al saldo disponible (el backend también rechaza). */
  private amountsWithinAvailable(): boolean {
    for (const payable of this.payables) {
      if (!this.selected.has(payable.id)) continue;
      const amount = Number(this.amounts[payable.id] ?? 0);
      if (amount > Number(payable.availableAmount)) {
        this.error = `El pago de la factura ${payable.reference} (${amount}) supera el saldo disponible (${payable.availableAmount}).`;
        return false;
      }
    }
    return true;
  }

  writeOff() {
    const account = this.accounts.find(a => a.id === Number(this.counterpartAccountId));
    if (!account || !this.writeOffReason || !this.details().length) return;
    this.run(this.api.createWriteOff({
      enterpriseId: this.enterpriseId,
      reason: this.writeOffReason,
      counterpartAccountId: account.id,
      counterpartAccountCode: account.code,
      details: this.details()
    }));
  }

  post(voucher: PaymentVoucher) { this.run(this.api.postVoucher(voucher.id, this.enterpriseId)); }
  remove(voucher: PaymentVoucher) { this.run(this.api.deleteVoucher(voucher.id, this.enterpriseId)); }
  void(voucher: PaymentVoucher) {
    const reason = window.prompt('Motivo de anulación');
    if (reason) this.run(this.api.voidVoucher(voucher.id, this.enterpriseId, reason));
  }
  showAccounting(voucher: PaymentVoucher) {
    this.busy = true;
    this.accountingEntry = null;
    this.accountingMovements = [];
    this.accountingDebitTotal = 0;
    this.accountingCreditTotal = 0;
    this.api.accountingEntry(voucher.id).subscribe({
      next: value => {
        const entry = value?.data ?? value;
        this.accountingEntry = entry;
        const movements = entry?.movements ?? entry?.details ?? [];
        this.accountingMovements = (movements as any[]).map((m: any) => ({
          account: String(m.accountCode ?? m.account ?? m.accountId ?? ''),
          description: String(m.description ?? ''),
          debit: Number(m.debit ?? 0),
          credit: Number(m.credit ?? 0),
        }));
        this.accountingDebitTotal = this.accountingMovements.reduce((s, m) => s + m.debit, 0);
        this.accountingCreditTotal = this.accountingMovements.reduce((s, m) => s + m.credit, 0);
        this.busy = false;
      },
      error: err => {
        this.error = err?.error?.message ?? 'No fue posible consultar el asiento.';
        this.busy = false;
      }
    });
  }
  cancel(schedule: PaymentSchedule) { this.run(this.api.cancelSchedule(schedule.id)); }
  retry(schedule: PaymentSchedule) { this.run(this.api.retrySchedule(schedule.id)); }
  confirmWriteOff(item: any) { this.run(this.api.confirmWriteOff(item.id)); }
  voidWriteOff(item: any) { this.run(this.api.voidWriteOff(item.id)); }
  changeDueDate(payable: Payable) {
    const dueDate = window.prompt('Nuevo vencimiento (AAAA-MM-DD)', payable.dueDate);
    const reason = dueDate && window.prompt('Motivo del cambio');
    if (dueDate && reason) this.run(this.api.changeDueDate(payable.id, this.enterpriseId, dueDate, reason));
  }

  private run(request: any) {
    this.busy = true;
    this.error = '';
    request.subscribe({
      next: () => {
        this.selected.clear();
        this.editingVoucherId = undefined;
        this.reload();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'La operación fue rechazada.';
        this.busy = false;
      }
    });
  }
}
