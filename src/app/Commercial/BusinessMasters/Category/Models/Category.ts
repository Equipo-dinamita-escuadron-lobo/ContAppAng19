export interface Category {
    id: number; 
    name: string; 
    description: string;
    enterpriseId:string;
    state:string;
        //cuentas
    inventoryId:number; //Todo: Agregar el atributo inventory de tipo inventario
    costId:number //Todo: Agregar el atributo cost de tipo costo
    saleId:number //Todo: Agregar el atributo Sale de tipo venta
    returnId:number //Todo: Agregar el atributo return de tipo devolución
}
export interface CategoryList {
    id: number; 
    name: string; 
    description: string;
    enterpriseId:string;
    state:string;
        //cuentas
    inventoryName:string; 
    costName:string 
    saleName:string 
    returnName:string 
}