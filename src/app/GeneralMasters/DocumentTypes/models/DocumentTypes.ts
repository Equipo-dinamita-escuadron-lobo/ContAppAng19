export interface DocumentType {
  id?: number;
  idEnterprise: string;
  prefix: string;
  name: string;
  documentClassId: number;
  module: string;
  status: boolean;
  isDeleted: boolean;
}

export interface DocumentTypeList extends DocumentType {
  className?: string;
}

