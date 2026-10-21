export interface Criteria {
  criteriaType: string;
  criteriaRange: { fromRange: number | null; toRange: number | null } | null;
  costCenterId: number | null;
  thirdPartyId: number | null;
  startDate: any;
  endDate: any;
}
