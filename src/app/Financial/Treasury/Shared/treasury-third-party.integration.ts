/** Resolución de nombres de proveedores desde Terceros (solo visualización). */
export function buildThirdPartyNameMap(thirds: Array<{
  thId?: number;
  socialReason?: string;
  names?: string;
  lastNames?: string;
}>): Map<number, string> {
  return new Map(
    (thirds || []).map((third) => {
      const name =
        (third.socialReason as string) ||
        [third.names, third.lastNames].filter(Boolean).join(' ') ||
        `Proveedor ${third.thId}`;
      return [Number(third.thId), String(name)] as [number, string];
    }),
  );
}

export function resolveSupplierName(map: Map<number, string>, supplierId: number): string {
  return map.get(Number(supplierId)) || `Proveedor ${supplierId}`;
}
