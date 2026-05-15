import { AuditDateType } from "../enums/AuditDateType";
import { DocumentOperationType } from "../enums/DocumentOperationType";


export interface DocumentExportFilters {
    dateFrom: string;     
    dateTo: string;
    dateType?: AuditDateType;
    documentCode?: string;
    documentType?: string;
    thirdPartyName?: string;
    operationType?: DocumentOperationType;
    userName?: string;
}