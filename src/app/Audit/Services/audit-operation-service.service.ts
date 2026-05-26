import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OperationAuditFilters } from '../Models/operations/OperationAuditFilters';
import { PageResponse } from '../Models/common/PageResponse';
import { OperationAudit } from '../Models/operations/OperationAudit';
import { LocalStorageMethods } from '../../Shared/Methods/local-storage.method';
import { ModuleTableResponse } from '../Models/operations/ModuleTableResponse';
import { ExportOperationFilters } from '../Models/export/ExportOperationFilters';

@Injectable({
    providedIn: 'root'
})
export class AuditOperationServiceService { 

    private readonly http = inject(HttpClient);
    constructor(private localStorageMethods: LocalStorageMethods) {}
    private readonly apiUrl = `${environment.API_URL}audit/operations`;
    private readonly exportUrl = `${environment.API_URL}audit/operations/export`;

    getOperations(filters: OperationAuditFilters, auditType: string): Observable<PageResponse<OperationAudit>> {
        const enterpriseId =
            auditType === 'system'
            ? 'SYSTEM'
            : this.localStorageMethods.getIdEnterprise();
        
        let params = new HttpParams()
            .set('dateFrom', filters.dateFrom)
            .set('dateTo', filters.dateTo)
            .set('enterpriseId', enterpriseId);
        
        if (filters.moduleName && filters.moduleName.trim()) {
            params = params.set('moduleName', filters.moduleName.trim());
        }

        if (filters.affectedTable && filters.affectedTable.trim()) {
            params = params.set('affectedTable', filters.affectedTable.trim());
        }
        
        if (filters.userName && filters.userName.trim()) {
            params = params.set('userName', filters.userName.trim());
        }

        if (filters.userRole) {
            params = params.set('userRole', filters.userRole);
        }

        if (filters.operationType) {
            params = params.set('operationType', filters.operationType);
        }

        if (filters.page !== undefined) {
            params = params.set('page', filters.page.toString());
        }

        if (filters.size !== undefined) {
            params = params.set('size', filters.size.toString());
        }

        if (filters.sortField) {
            params = params.set('sortField', filters.sortField);
        }

        if (filters.sortDirection) {
            params = params.set('sortDirection', filters.sortDirection);
        }

        return this.http.get<PageResponse<OperationAudit>>(this.apiUrl, { params });
    }

    initiateExport(filters: ExportOperationFilters, auditType: string): Observable<{ jobId: string }> {
        const enterpriseId =
            auditType === 'system'
            ? 'SYSTEM'
            : this.localStorageMethods.getIdEnterprise();
        const body = {
            enterpriseId: enterpriseId,
            enterpriseName: this.localStorageMethods.getEnterpriseName(),
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            moduleName: filters.moduleName ?? null,
            affectedTable: filters.affectedTable ?? null,
            userName: filters.userName ?? null,
            userRole: filters.userRole ?? null,
            operationType: filters.operationType ?? null,
            registerId: filters.registerId ?? null,
            exportFormat: 'EXCEL'
        };
        return this.http.post<{ jobId: string }>(this.exportUrl, body);
    }

    getModulesAndTables(auditType: string): Observable<ModuleTableResponse[]> {
        const enterpriseId =
            auditType === 'system'
            ? 'SYSTEM'
            : this.localStorageMethods.getIdEnterprise();
        return this.http.get<ModuleTableResponse[]>(
            `${this.apiUrl}/modules-tables`,
            { 
                headers: {
                    'X-Enterprise-Id': enterpriseId
                }
             }
        );
    }
}
