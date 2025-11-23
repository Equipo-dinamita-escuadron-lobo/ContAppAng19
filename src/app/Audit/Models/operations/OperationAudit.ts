import { OperationType } from "../enums/OperationType";
import { UserRole } from "../enums/UserRole";

export interface OperationAudit {

    userName: string;
    userRole: UserRole;
    operationAt: string;
    moduleName: string;
    affectedTable: string;
    registerId: string;
    operationType: OperationType;
    dataObject: any;
}
