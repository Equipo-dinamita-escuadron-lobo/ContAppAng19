import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TreasuryApiService } from '../../../Shared/treasury-api.service';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { AgingReportFilter, AgingReportResponse } from '../Models/AgingReport';

@Injectable({ providedIn: 'root' })
export class AgingReportService {
  constructor(private readonly api: TreasuryApiService, private readonly accounts: ChartAccountService) {}

  getAgingReport(enterpriseId: string, filters: AgingReportFilter): Observable<AgingReportResponse> {
    const cutoff = (filters.cutoffDate ?? new Date()).toISOString().slice(0, 10);
    const supplierId = filters.supplierId ? Number(filters.supplierId) : undefined;
    return this.api.aging(enterpriseId, cutoff, supplierId, filters.accountTypeStart, filters.document).pipe(map(items => {
      const lines = items.map(item => ({
        id: item.invoiceId,
        accountDescription: `${item.accountCode} · ${item.reference} · Proveedor ${item.supplierId}`,
        totalDue: item.current + item.days1to30 + item.days31to60 + item.days61to90 + item.days91Plus,
        current: item.current, days1to30: item.days1to30, days31to60: item.days31to60,
        days61to90: item.days61to90, days91to180: item.days91Plus,
        days181to260: 0, daysOver260: 0, status: 'ACTIVE',
      }));
      const totals = lines.reduce((sum, line) => ({
        totalDue: sum.totalDue + line.totalDue, current: sum.current + line.current,
        days1to30: sum.days1to30 + line.days1to30, days31to60: sum.days31to60 + line.days31to60,
        days61to90: sum.days61to90 + line.days61to90, days91to180: sum.days91to180 + line.days91to180,
        days181to260: 0, daysOver260: 0,
      }), { totalDue: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days91to180: 0, days181to260: 0, daysOver260: 0 });
      return { reportDate: new Date(cutoff), supplierName: filters.supplierName ?? '', lines, totals };
    }));
  }

  getAccountTypes(enterpriseId: string): Observable<{label: string; value: string}[]> {
    return this.accounts.getListAuxiliaryAccounts(enterpriseId).pipe(map(accounts => accounts
      .filter(account => account.status !== false)
      .map(account => ({ label: `${account.code} - ${account.description}`, value: account.code }))));
  }

  exportAgingReport(enterpriseId: string, filters: AgingReportFilter, format: 'excel' | 'pdf'): Observable<Blob> {
    return this.getAgingReport(enterpriseId, filters).pipe(map(report => {
      const rows = report.lines.map(line => [line.accountDescription, line.totalDue, line.current, line.days1to30,
        line.days31to60, line.days61to90, line.days91to180].join(','));
      return new Blob([['Documento,Total,Vigente,1-30,31-60,61-90,91+', ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    }));
  }
}
