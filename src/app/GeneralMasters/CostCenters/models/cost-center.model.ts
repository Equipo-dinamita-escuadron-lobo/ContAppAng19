export interface CostCenter {
  id?: number;
  idEnterprise: string;
  code: string; 
  name: string;
  parentId?: number | null;
}

export interface CostCenterNode extends CostCenter {
  children?: CostCenterNode[];
  showChildren?: boolean;
}


