import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(value: number | null | undefined, currency: string = 'COP', locale: string = 'es-CO'): string {
    if (value === null || value === undefined) return '$ 0';

    try {
      return value.toLocaleString(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
      });
    } catch (error) {
      // Fallback en caso de error de formateo
      return `$ ${value.toLocaleString()}`;
    }
  }
}