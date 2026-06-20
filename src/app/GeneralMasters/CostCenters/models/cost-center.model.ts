export interface CostCenter {
  id?: number;
  idEnterprise: string;
  code: string; 
  name: string;
  parentId?: number | null;
  status?: boolean;
}

export interface CostCenterNode extends CostCenter {
  children?: CostCenterNode[];
  showChildren?: boolean;
}


