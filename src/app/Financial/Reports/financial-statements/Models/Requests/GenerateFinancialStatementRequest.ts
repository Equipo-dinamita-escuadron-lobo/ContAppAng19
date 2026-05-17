import { Criteria } from '../Criteria';
import { FinancialStatementType } from '../eFinancialStatementType';

export interface GenerateFinancialStatementRequest {
  entId: string;
  type: FinancialStatementType;
  criteria: Criteria;
}
