import { ThirdType } from "./ThirdType";
import { TypeId } from "./TypeId";
import { ePersonType } from "./ePersonType";
import { eThirdGender } from "./eThirdGender";
import { eTypeId } from "./eTypeId";


export interface Third {
    thId: number;
    entId: String;
    typeId: TypeId;
    thirdTypes: ThirdType[];// You'll need to define or reference the actual enum or replace this with the correct type.
    rutPath?: string;
    personType: ePersonType; // Same as above, define or reference the actual enum.
    names?: string;
    lastNames?: string;
    socialReason?: string;
    gender?: eThirdGender | null; // And again, define or reference the actual enum.
    idNumber: number;
    verificationNumber?: number;
    state: boolean;
    photoPath?: string;
    country: number;
    province: number;
    city: number;
    address: string;
    phoneNumber: string;
    email: string;
    creationDate: string;
    updateDate: string;
  }
