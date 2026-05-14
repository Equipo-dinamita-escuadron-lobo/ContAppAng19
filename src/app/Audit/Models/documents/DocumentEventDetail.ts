import { DocumentEventOperationType } from "../enums/DocumentEventOperationType";


export interface DocumentEventDetail {
    operationType: DocumentEventOperationType;
    userName: string;
    userRoles: string[];
    operationAt: string;
    documentData: any;
}