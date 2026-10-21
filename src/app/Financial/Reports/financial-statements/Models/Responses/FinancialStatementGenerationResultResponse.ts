import { FinancialStatementAnnotationResponse } from './FinancialStatementAnnotationResponse';
import { FinancialStatementMetadataResponse } from './FinancialStatementMetadataResponse';
import { FinancialStatementRowResponse } from './FinancialStatementRowResponse';

export interface FinancialStatementGenerationResultResponse {
  financialStatement: FinancialStatementMetadataResponse;
  financialStatementData: FinancialStatementRowResponse[];
  annotations: FinancialStatementAnnotationResponse[];
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  totalEquity?: number | null;
}
