import { Enterprise } from './../../../GeneralMasters/Enterprise/models/enterprise';
export interface Tag{
    id:number;
    EnterpriseId:number;
    title:string;
    description:string;

}