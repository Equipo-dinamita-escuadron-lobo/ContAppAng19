import { Criteria } from '../Criteria';
import { FinancialStatementType } from '../eFinancialStatementType';

export interface FinancialStatementHistoryItemResponse {
  reportId: string;
  type: FinancialStatementType;
  entId: string;
  criteria: Criteria | null;
  reportCreatedAt: string;
  state: string;
  deliveryWay: string;
  eventAt: string;
  downloadUrl?: string | null;
}
