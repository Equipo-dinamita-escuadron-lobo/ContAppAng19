import { OperationType } from "../enums/OperationType";

export interface OperationAudit {
    userName: string;
    userRole: string[];
    operationAt: string;
    moduleName: string;
    affectedTable: string;
    operationType: OperationType;
    dataObject: any;
}
