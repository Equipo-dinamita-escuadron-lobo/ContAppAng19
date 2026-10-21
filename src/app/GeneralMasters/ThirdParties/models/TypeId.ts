export interface TypeId {
  id?: number;
  entId: String;
  typeId: string;
  typeIdname: string;
  status: boolean;
  classification: 'NATURAL_PERSON' | 'LEGAL_ENTITY';
}
