export interface UpsertFinancialStatementTemplateRequest {
  entId: string;
  name: string;
  pathLogotype?: string;
  alignment?: string;
  font?: string;
  fontSize?: number;
  mainColor?: string;
  isDefault: boolean;
}

