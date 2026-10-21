export interface CostCenter {
  id?: number;
  idEnterprise: string;
  code: string;
  name: string;
  parentId?: number | null;
  status?: boolean;
  usageCount?: number;
}

export interface CostCenterNode extends CostCenter {
  children?: CostCenterNode[];
  showChildren?: boolean;
  usageCount?: number;
}


