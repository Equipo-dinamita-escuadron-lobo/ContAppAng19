import { Injectable } from '@angular/core';

/**
 * Interfaz para representar un día festivo
 */
export interface ColombianHoliday {
  name: string;
  date: Date;
  isMovable: boolean;
  description: string;
}

/**
 * Servicio para manejar los días festivos oficiales de Colombia
 * Implementa la Ley Emiliani (Ley 51 de 1983) para traslados al lunes
 */
@Injectable({
  providedIn: 'root'
})
export class ColombianHolidaysService {
  // Cache de festivos por año para evitar recálculos
  private holidaysCache = new Map<number, Set<string>>();
  private holidaysDataCache = new Map<number, ColombianHoliday[]>();

  /**
   * Obtiene todos los días festivos para un año específico
   * @param year Año para calcular los festivos
   * @returns Array de días festivos
   */
  getHolidaysForYear(year: number): ColombianHoliday[] {
    const holidays: ColombianHoliday[] = [];

    // Festivos de fecha fija
    holidays.push(...this.getFixedDateHolidays(year));
    
    // Festivos de fecha móvil (basados en Pascua)
    holidays.push(...this.getMovableDateHolidays(year));

    return holidays;
  }

  /**
   * Verifica si una fecha específica es festiva
   * OPTIMIZADO: Usa cache de Set para búsqueda O(1)
   * @param date Fecha a verificar
   * @returns true si es festiva
   */
  isHoliday(date: Date): boolean {
    const year = date.getFullYear();
    
    // Lazy load: cargar festivos solo cuando se necesitan
    if (!this.holidaysCache.has(year)) {
      this.loadHolidaysForYear(year);
    }
    
    // Búsqueda O(1) en Set
    const dateKey = this.getDateKey(date);
    return this.holidaysCache.get(year)!.has(dateKey);
  }

  /**
   * Obtiene el festivo para una fecha específica
   * OPTIMIZADO: Usa cache para evitar recálculos
   * @param date Fecha a verificar
   * @returns Festivo si existe, null si no
   */
  getHolidayForDate(date: Date): ColombianHoliday | null {
    const year = date.getFullYear();
    
    // Lazy load: cargar festivos solo cuando se necesitan
    if (!this.holidaysDataCache.has(year)) {
      this.loadHolidaysForYear(year);
    }
    
    const holidays = this.holidaysDataCache.get(year)!;
    
    return holidays.find(holiday => 
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getFullYear() === date.getFullYear()
    ) || null;
  }

  /**
   * Obtiene festivos de fecha fija
   * @param year Año
   * @returns Array de festivos de fecha fija
   */
  private getFixedDateHolidays(year: number): ColombianHoliday[] {
    const holidays: ColombianHoliday[] = [
      {
        name: 'Año Nuevo',
        date: new Date(year, 0, 1), // 1 de enero
        isMovable: false,
        description: 'Celebración del inicio del año'
      },
      {
        name: 'Día del Trabajo',
        date: new Date(year, 4, 1), // 1 de mayo
        isMovable: false,
        description: 'Día internacional del trabajo'
      },
      {
        name: 'Día de la Independencia',
        date: new Date(year, 6, 20), // 20 de julio
        isMovable: false,
        description: 'Declaración de independencia de Colombia'
      },
      {
        name: 'Batalla de Boyacá',
        date: new Date(year, 7, 7), // 7 de agosto
        isMovable: false,
        description: 'Batalla decisiva para la independencia'
      },
      {
        name: 'Inmaculada Concepción',
        date: new Date(year, 11, 8), // 8 de diciembre
        isMovable: false,
        description: 'Celebración religiosa católica'
      },
      {
        name: 'Navidad',
        date: new Date(year, 11, 25), // 25 de diciembre
        isMovable: false,
        description: 'Celebración del nacimiento de Jesucristo'
      }
    ];

    // Agregar festivos que se trasladan al lunes siguiente (Ley Emiliani)
    holidays.push(...this.getEmilianiLawHolidays(year));

    return holidays;
  }

  /**
   * Obtiene festivos que siguen la Ley Emiliani (traslado al lunes)
   * @param year Año
   * @returns Array de festivos con traslado
   */
  private getEmilianiLawHolidays(year: number): ColombianHoliday[] {
    const holidays: ColombianHoliday[] = [];

    // Día de los Reyes Magos (6 de enero)
    const reyesDate = new Date(year, 0, 6);
    holidays.push({
      name: 'Día de los Reyes Magos',
      date: this.moveToNextMonday(reyesDate),
      isMovable: true,
      description: 'Epifanía del Señor'
    });

    // Día de San José (19 de marzo)
    const sanJoseDate = new Date(year, 2, 19);
    holidays.push({
      name: 'Día de San José',
      date: this.moveToNextMonday(sanJoseDate),
      isMovable: true,
      description: 'Festividad de San José'
    });

    // San Pedro y San Pablo (29 de junio)
    const sanPedroDate = new Date(year, 5, 29);
    holidays.push({
      name: 'San Pedro y San Pablo',
      date: this.moveToNextMonday(sanPedroDate),
      isMovable: true,
      description: 'Festividad de los apóstoles'
    });

    // Asunción de la Virgen (15 de agosto)
    const asuncionDate = new Date(year, 7, 15);
    holidays.push({
      name: 'Asunción de la Virgen',
      date: this.moveToNextMonday(asuncionDate),
      isMovable: true,
      description: 'Asunción de María al cielo'
    });

    // Día de la Raza (12 de octubre)
    const razaDate = new Date(year, 9, 12);
    holidays.push({
      name: 'Día de la Raza',
      date: this.moveToNextMonday(razaDate),
      isMovable: true,
      description: 'Descubrimiento de América'
    });

    // Todos los Santos (1 de noviembre)
    const santosDate = new Date(year, 10, 1);
    holidays.push({
      name: 'Todos los Santos',
      date: this.moveToNextMonday(santosDate),
      isMovable: true,
      description: 'Festividad de todos los santos'
    });

    // Independencia de Cartagena (11 de noviembre)
    const cartagenaDate = new Date(year, 10, 11);
    holidays.push({
      name: 'Independencia de Cartagena',
      date: this.moveToNextMonday(cartagenaDate),
      isMovable: true,
      description: 'Independencia de Cartagena de Indias'
    });

    return holidays;
  }

  /**
   * Obtiene festivos de fecha móvil (basados en Pascua)
   * @param year Año
   * @returns Array de festivos de fecha móvil
   */
  private getMovableDateHolidays(year: number): ColombianHoliday[] {
    const easterDate = this.calculateEasterDate(year);
    const holidays: ColombianHoliday[] = [];

    // Jueves Santo (3 días antes de Pascua)
    const holyThursday = new Date(easterDate);
    holyThursday.setDate(easterDate.getDate() - 3);
    holidays.push({
      name: 'Jueves Santo',
      date: holyThursday,
      isMovable: true,
      description: 'Última Cena de Jesucristo'
    });

    // Viernes Santo (2 días antes de Pascua)
    const goodFriday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 2);
    holidays.push({
      name: 'Viernes Santo',
      date: goodFriday,
      isMovable: true,
      description: 'Muerte de Jesucristo en la cruz'
    });

    // Ascensión del Señor (39 días después de Pascua, trasladado al lunes)
    const ascensionDate = new Date(easterDate);
    ascensionDate.setDate(easterDate.getDate() + 39);
    holidays.push({
      name: 'Ascensión del Señor',
      date: this.moveToNextMonday(ascensionDate),
      isMovable: true,
      description: 'Ascensión de Jesucristo al cielo'
    });

    // Corpus Christi (60 días después de Pascua, trasladado al lunes)
    const corpusDate = new Date(easterDate);
    corpusDate.setDate(easterDate.getDate() + 60);
    holidays.push({
      name: 'Corpus Christi',
      date: this.moveToNextMonday(corpusDate),
      isMovable: true,
      description: 'Cuerpo y Sangre de Jesucristo'
    });

    // Sagrado Corazón de Jesús (68 días después de Pascua, trasladado al lunes)
    const sagradoCorazonDate = new Date(easterDate);
    sagradoCorazonDate.setDate(easterDate.getDate() + 68);
    holidays.push({
      name: 'Sagrado Corazón de Jesús',
      date: this.moveToNextMonday(sagradoCorazonDate),
      isMovable: true,
      description: 'Devoción al Sagrado Corazón'
    });

    return holidays;
  }

  /**
   * Calcula la fecha de Pascua usando el algoritmo de Meeus/Jones/Butcher
   * @param year Año
   * @returns Fecha de Pascua
   */
  private calculateEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  /**
   * Mueve una fecha al lunes siguiente si no es lunes
   * @param date Fecha original
   * @returns Fecha trasladada al lunes siguiente
   */
  private moveToNextMonday(date: Date): Date {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 1) { // Ya es lunes
      return date;
    }
    
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const mondayDate = new Date(date);
    mondayDate.setDate(date.getDate() + daysToAdd);
    
    return mondayDate;
  }

  /**
   * Carga los festivos de un año en el cache
   * @param year Año a cargar
   */
  private loadHolidaysForYear(year: number): void {
    const holidays = this.getHolidaysForYear(year);
    
    // Crear Set de claves de fecha para búsqueda rápida
    const holidaySet = new Set<string>();
    holidays.forEach(holiday => {
      const key = this.getDateKey(holiday.date);
      holidaySet.add(key);
    });
    
    this.holidaysCache.set(year, holidaySet);
    this.holidaysDataCache.set(year, holidays);
  }

  /**
   * Genera una clave única para una fecha (YYYY-MM-DD)
   * @param date Fecha
   * @returns Clave string
   */
  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Limpia el cache de festivos
   */
  clearCache(): void {
    this.holidaysCache.clear();
    this.holidaysDataCache.clear();
  }
}
