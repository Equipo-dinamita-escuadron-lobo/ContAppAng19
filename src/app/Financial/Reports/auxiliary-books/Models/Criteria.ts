export interface Criteria {
  criteriaType: string;
  criteriaRange: { from: number | null; to: number | null } | null;
  costCenterId: number | null;
  thirdPartyId: number | null;
  startDate: any;
  endDate: any;
}
