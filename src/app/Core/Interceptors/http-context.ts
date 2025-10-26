import { HttpContextToken } from '@angular/common/http';

/**
 * Esta bandera, cuando se establece en true, le dice al
 * auth.interceptor.ts que NO debe añadir el token de autorización.
 */
export const BYPASS_AUTH = new HttpContextToken<boolean>(() => false);