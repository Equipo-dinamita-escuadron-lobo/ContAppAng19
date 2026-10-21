import { AuditDateType } from "../enums/AuditDateType";


export interface DocumentEventFilters { 
    dateFrom: string;     
    dateTo: string;
    dateType?: AuditDateType;
    documentType?: string;
    documentCode?: string;
    thirdPartyName?: string;
    createdBy?: string;
    page?: number;
    size?: number;
    sortField?: string;
    sortDirection?: 'ASC' | 'DESC';
}