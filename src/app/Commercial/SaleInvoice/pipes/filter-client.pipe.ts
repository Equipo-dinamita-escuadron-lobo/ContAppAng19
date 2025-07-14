import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterClient'
})
export class FilterClientPipe implements PipeTransform {

  transform(items: any[], filterList: string): any[] {
    if ((!filterList || filterList.trim() === '')) {
      return items;
    }

    return items.filter(item => item.names.toLowerCase().includes(filterList.toLowerCase())
      || item.socialReason.toLowerCase().includes(filterList.toLowerCase())
      || item.idNumber.toString().includes(filterList)
      || item.typeId.toString().toLowerCase().includes(filterList.toLowerCase())
      || item.email.toLowerCase().includes(filterList.toLowerCase()));
  }
}
