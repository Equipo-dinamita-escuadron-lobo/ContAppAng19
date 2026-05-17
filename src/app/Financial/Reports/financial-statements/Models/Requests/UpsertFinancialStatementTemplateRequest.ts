export interface UpsertFinancialStatementTemplateRequest {
  id?: number;
  enterpriseId: string;
  name: string;
  pathLogotype?: string;
  alignment?: string;
  font?: string;
  fontSize?: number;
  mainColor?: string;
  isDefault?: boolean;
}
