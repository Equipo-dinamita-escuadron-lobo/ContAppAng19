import { Criteria } from '../Criteria';
import { FinancialStatementType } from '../eFinancialStatementType';

export interface GenerateFinancialStatementRequest {
  entId: string;
  userId: number;
  type: FinancialStatementType;
  criteria: Criteria;
}

