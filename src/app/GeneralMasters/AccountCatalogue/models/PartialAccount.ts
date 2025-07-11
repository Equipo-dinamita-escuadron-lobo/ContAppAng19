import { Account } from "./ChartAccount";

interface PartialAccount {
    code: string;
    subAccounts: Account[];
    showSubAccounts?: boolean;
}