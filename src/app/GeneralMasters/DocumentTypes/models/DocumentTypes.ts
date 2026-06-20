export interface DocumentType {
  id?: number;
  idEnterprise: string;
  prefix: string;
  name: string;
  documentClassId: number;
  moduleId: number;
  status: boolean;
}

export interface DocumentTypeList extends DocumentType {
  className?: string;
  moduleName?: string;
}

