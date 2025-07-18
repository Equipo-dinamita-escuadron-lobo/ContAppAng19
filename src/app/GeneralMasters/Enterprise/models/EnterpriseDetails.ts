export interface EnterpriseDetails{
    id?:string;
    name: String;
    nit: String;
    phone: String;
    branch: String;
    email: String;
    logo: string;
    /* Descomentar cuando este implementado
    taxLiabilities: TaxLiability[];
    taxPayerType: TaxPayerType;
    enterpriseType: EnterpriseType;
    personType: PersonType;
    location: LocationDetails;
    */
    taxLiabilities: any[];
    taxPayerType: any;
    enterpriseType: any;
    personType: any;
    location: any;
    dv: String;
    mainActivity?:number;
    secondaryActivity?: number;
}