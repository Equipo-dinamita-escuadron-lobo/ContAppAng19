import { Criteria } from './Criteria';
import { AuxiliaryBookType } from './eAuxiliaryBookType';

export interface GenerateAuxiliaryBookRequest {
  entId: string;
  userId: number;
  type: AuxiliaryBookType;
  criteria: Criteria;
}
