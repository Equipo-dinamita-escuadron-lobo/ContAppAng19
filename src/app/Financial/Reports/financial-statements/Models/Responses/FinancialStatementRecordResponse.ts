import { FinancialStatementGenerationResultResponse } from './FinancialStatementGenerationResultResponse';
import { FinancialStatementMetadataResponse } from './FinancialStatementMetadataResponse';

export type FinancialStatementRecordResponse =
  | FinancialStatementGenerationResultResponse
  | FinancialStatementMetadataResponse;
