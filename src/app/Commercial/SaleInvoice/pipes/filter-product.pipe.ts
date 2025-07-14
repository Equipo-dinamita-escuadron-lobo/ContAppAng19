import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterProduct'
})
export class FilterProductPipe implements PipeTransform {

  transform(items: any[], filterList: string): any[] {
    if ((!filterList || filterList.trim() === '')) {
      return items;
    }

    return items.filter(item => item.itemType.toLowerCase().includes(filterList.toLowerCase())
      || item.code.toLowerCase().includes(filterList.toLowerCase())
      || item.description.toLowerCase().includes(filterList.toLowerCase())
    );
  }
}
