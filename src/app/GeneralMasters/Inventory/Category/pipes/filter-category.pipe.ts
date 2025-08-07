import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterCategory'
})
export class FilterCategoryPipe implements PipeTransform {

  transform(items: any[], filterCategory: string): any[] {
    if (!filterCategory || filterCategory.trim() === '') {
      return items;
    }

    // Verificar si el filtro es un número
    const isNumberFilter = !isNaN(parseFloat(filterCategory)) && isFinite(+filterCategory);

    return items.filter(item => {
      const idMatch = isNumberFilter && item.id === parseInt(filterCategory); // Comparar como número
      const nameMatch = item.name.toLowerCase().includes(filterCategory.toLowerCase());
      const descriptionMatch = item.description.toLowerCase().includes(filterCategory.toLowerCase());

      return idMatch || nameMatch || descriptionMatch;
    });
  }

}
