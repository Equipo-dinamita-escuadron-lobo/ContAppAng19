import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OperationAuditFilters } from '../Models/operations/OperationAuditFilters';
import { PageResponse } from '../Models/common/PageResponse';
import { OperationAudit } from '../Models/operations/OperationAudit';
import { LocalStorageMethods } from '../../Shared/Methods/local-storage.method';

@Injectable({
    providedIn: 'root'
})
export class AuditOperationServiceService { 

    private readonly http = inject(HttpClient);
    constructor(private localStorageMethods: LocalStorageMethods) {}
    private readonly apiUrl = `${environment.API_URL}audit/operations`;

    getOperations(filters: OperationAuditFilters): Observable<PageResponse<OperationAudit>> {
        let params = new HttpParams() 
            .set('dateFrom', filters.dateFrom)
            .set('dateTo', filters.dateTo);
        
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

        if (filters.registerId && filters.registerId.trim()) {
            params = params.set('registerId', filters.registerId.trim());
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

        const enterpriseId = this.localStorageMethods.getIdEnterprise();

        return this.http.get<PageResponse<OperationAudit>>(this.apiUrl, {
            params,
            headers: {
                'X-Enterprise-Id': enterpriseId
            }
        });
    }
}
