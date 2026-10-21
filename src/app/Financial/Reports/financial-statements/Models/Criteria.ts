export type FinancialStatementCriteriaType =
  | 'NUMBER_CLASS'
  | 'GROUP'
  | 'ACCOUNT'
  | 'SUB_ACCOUNT'
  | 'AUXILIARY_ACCOUNT'
  | 'ACCOUNT_RANGE';

export interface CriteriaRange {
  from: number | null;
  to: number | null;
}

export interface Criteria {
  criteriaType: FinancialStatementCriteriaType | '' | null;
  criteriaRange: CriteriaRange | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  previousStartDate?: string | Date | null;
  previousEndDate?: string | Date | null;
  currentCutoffDate?: string | Date | null;
  previousCutoffDate?: string | Date | null;
}
