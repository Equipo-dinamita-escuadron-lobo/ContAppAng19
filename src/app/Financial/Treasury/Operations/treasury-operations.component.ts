import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { PaymentMethodsServiceService } from '../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { ChartAccountService } from '../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { BankAccountsService } from '../../../GeneralMasters/BankAccounts/services/bank-accounts.service';
import { TreasuryApiService } from '../Shared/treasury-api.service';
import { Payable, PaymentSchedule, PaymentVoucher } from '../Shared/treasury-api.models';

@Component({
  selector: 'app-treasury-operations', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './treasury-operations.component.html', styleUrl: './treasury-operations.component.css'
})
export class TreasuryOperationsComponent implements OnInit {
  payables: Payable[] = []; vouchers: PaymentVoucher[] = []; schedules: PaymentSchedule[] = []; writeOffs: any[] = [];
  methods: any[] = []; banks: any[] = []; accounts: any[] = []; selected = new Set<number>(); amounts: Record<number, number> = {};
  paymentMethodId?: number; bankAccountId?: number; executionDate = ''; observations = '';
  editingVoucherId?: number;
  counterpartAccountId?: number; writeOffReason = ''; busy = false; error = '';
  voucherNumberFilter = ''; voucherStatusFilter = ''; accountingEntry: any = null;
  private readonly enterpriseId: string;
  constructor(private readonly api: TreasuryApiService, private readonly storage: LocalStorageMethods,
    private readonly paymentMethods: PaymentMethodsServiceService, private readonly chart: ChartAccountService,
    private readonly bankAccounts: BankAccountsService) {
    this.enterpriseId = this.storage.getIdEnterprise();
  }
  ngOnInit() { this.reload(); }
  reload() {
    if (!this.enterpriseId) { this.error = 'Seleccione una empresa activa.'; return; }
    this.busy = true; this.error = '';
    forkJoin({ payables: this.api.pending(this.enterpriseId), vouchers: this.api.vouchers(this.enterpriseId,{voucherNumber:this.voucherNumberFilter,status:this.voucherStatusFilter}),
      schedules: this.api.schedules(this.enterpriseId), writeOffs: this.api.writeOffs(this.enterpriseId),
      methods: this.paymentMethods.findAllActive(this.enterpriseId), banks: this.bankAccounts.findAllActive(this.enterpriseId), accounts: this.chart.getListAuxiliaryAccounts(this.enterpriseId) })
      .subscribe({ next: data => { this.payables = data.payables; this.vouchers = data.vouchers.content;
        this.schedules = data.schedules; this.writeOffs = data.writeOffs; this.methods = data.methods.content; this.banks = data.banks.content;
        this.accounts = data.accounts.filter(a => a.status !== false); this.payables.forEach(p => this.amounts[p.id] ??= p.availableAmount); this.busy = false; },
        error: err => { this.error = err?.error?.message ?? 'No fue posible cargar Tesorería.'; this.busy = false; } });
  }
  toggle(id: number, checked: boolean) { checked ? this.selected.add(id) : this.selected.delete(id); }
  private details() { return this.payables.filter(p => this.selected.has(p.id)).map(p => ({ supplierId: p.supplierId,
    invoiceId: p.id, amount: Number(this.amounts[p.id]) })); }
  get selectedMethod(): any { return this.methods.find(method => method.id === Number(this.paymentMethodId)); }
  get requiresBankAccount(): boolean { return Boolean(this.selectedMethod?.requiresBankAccount); }
  paymentMethodChanged() { if (!this.requiresBankAccount) this.bankAccountId = undefined; }
  private paymentSelectionValid(): boolean { if (!this.paymentMethodId) { this.error='Seleccione un metodo de pago activo.';return false; }if(this.requiresBankAccount&&!this.bankAccountId){this.error='El metodo seleccionado exige una cuenta bancaria.';return false;}if(!this.requiresBankAccount&&this.bankAccountId){this.error='El metodo seleccionado no admite cuenta bancaria.';return false;}return true; }
  createVoucher() {
    if (!this.paymentSelectionValid() || !this.details().length) return;
    const paymentMethodId = this.paymentMethodId!;
    const request = { enterpriseId: this.enterpriseId, issueDate: new Date().toISOString().slice(0, 10),
      paymentMethodId, bankAccountId: this.bankAccountId, observations: this.observations, details: this.details() };
    this.run(this.editingVoucherId ? this.api.updateVoucher(this.editingVoucherId, request) : this.api.createVoucher(request));
  }
  edit(voucher: PaymentVoucher) { this.editingVoucherId = voucher.id; this.paymentMethodId = voucher.paymentMethodId;
    this.bankAccountId = voucher.bankAccountId; this.observations = voucher.observations ?? ''; this.selected.clear();
    voucher.details.forEach(detail => { this.selected.add(detail.invoiceId); this.amounts[detail.invoiceId] = detail.amountPaid; }); }
  schedule() {
    if (!this.paymentSelectionValid() || !this.executionDate || !this.details().length) return;
    const paymentMethodId = this.paymentMethodId!;
    this.run(this.api.createSchedule({ enterpriseId: this.enterpriseId, issueDate: new Date().toISOString().slice(0, 10),
      executionDate: this.executionDate, paymentMethodId, bankAccountId: this.bankAccountId,
      observations: this.observations, details: this.details() }));
  }
  writeOff() {
    const account = this.accounts.find(a => a.id === Number(this.counterpartAccountId));
    if (!account || !this.writeOffReason || !this.details().length) return;
    this.run(this.api.createWriteOff({ enterpriseId: this.enterpriseId, reason: this.writeOffReason,
      counterpartAccountId: account.id, counterpartAccountCode: account.code, details: this.details() }));
  }
  post(voucher: PaymentVoucher) { this.run(this.api.postVoucher(voucher.id, this.enterpriseId)); }
  remove(voucher: PaymentVoucher) { this.run(this.api.deleteVoucher(voucher.id, this.enterpriseId)); }
  void(voucher: PaymentVoucher) { const reason = window.prompt('Motivo de anulación'); if (reason) this.run(this.api.voidVoucher(voucher.id, this.enterpriseId, reason)); }
  showAccounting(voucher: PaymentVoucher) { this.busy=true;this.api.accountingEntry(voucher.id).subscribe({next:value=>{this.accountingEntry=value;this.busy=false;},error:err=>{this.error=err?.error?.message??'No fue posible consultar el asiento.';this.busy=false;}}); }
  cancel(schedule: PaymentSchedule) { this.run(this.api.cancelSchedule(schedule.id)); }
  retry(schedule: PaymentSchedule) { this.run(this.api.retrySchedule(schedule.id)); }
  confirmWriteOff(item: any) { this.run(this.api.confirmWriteOff(item.id)); }
  voidWriteOff(item: any) { this.run(this.api.voidWriteOff(item.id)); }
  changeDueDate(payable: Payable) { const dueDate = window.prompt('Nuevo vencimiento (AAAA-MM-DD)', payable.dueDate);
    const reason = dueDate && window.prompt('Motivo del cambio'); if (dueDate && reason) this.run(this.api.changeDueDate(payable.id, this.enterpriseId, dueDate, reason)); }
  private run(request: any) { this.busy = true; this.error = ''; request.subscribe({ next: () => { this.selected.clear(); this.editingVoucherId = undefined; this.reload(); },
    error: (err: any) => { this.error = err?.error?.message ?? 'La operación fue rechazada.'; this.busy = false; } }); }
}
