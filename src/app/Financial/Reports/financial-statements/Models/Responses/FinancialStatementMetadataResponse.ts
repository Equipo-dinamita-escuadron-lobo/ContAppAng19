import { Criteria } from '../Criteria';
import { FinancialStatementType } from '../eFinancialStatementType';

export interface FinancialStatementMetadataResponse {
  reportId: string;
  type: FinancialStatementType;
  entId: string;
  criteria: Criteria | null;
  createdAt: string;
  downloadUrl?: string | null;
}
