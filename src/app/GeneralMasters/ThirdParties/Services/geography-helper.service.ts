import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GeographyService } from './geography.service';
import { Country } from '../models/Country';
import { Department } from '../models/Department';
import { City } from '../models/City';

/**
 * Interfaz para opciones de select
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Servicio helper para cargar datos geográficos
 */
@Injectable({
  providedIn: 'root'
})
export class GeographyHelperService {

  constructor(private readonly geographyService: GeographyService) { }

  /**
   * Carga los países y los transforma en opciones para select
   * @returns Observable con las opciones de países
   */
  loadCountriesAsOptions(): Observable<SelectOption[]> {
    return this.geographyService.getAllCountries().pipe(
      map((countries: Country[]) => 
        countries.map(country => ({
          label: country.countryName,
          value: country.countryCode
        }))
      )
    );
  }

  /**
   * Carga los países sin transformar
   * @returns Observable con la lista de países
   */
  loadCountries(): Observable<Country[]> {
    return this.geographyService.getAllCountries();
  }

  /**
   * Carga los departamentos/estados de un país y los transforma en opciones para select
   * @param countryCode Código del país (por defecto 'COL' para Colombia)
   * @returns Observable con las opciones de departamentos
   */
  loadDepartmentsAsOptions(countryCode: string = 'COL'): Observable<SelectOption[]> {
    return this.geographyService.getStatesByCountry(countryCode).pipe(
      map((departments: Department[]) => 
        departments.map(dept => ({
          label: dept.stateName,
          value: dept.stateCode
        }))
      )
    );
  }

  /**
   * Carga los departamentos sin transformar
   * @param countryCode Código del país (por defecto 'COL' para Colombia)
   * @returns Observable con la lista de departamentos
   */
  loadDepartments(countryCode: string = 'COL'): Observable<Department[]> {
    return this.geographyService.getStatesByCountry(countryCode);
  }

  /**
   * Carga las ciudades de un departamento y las transforma en opciones para select
   * @param departmentCode Código del departamento
   * @param countryCode Código del país (por defecto 'COL' para Colombia)
   * @returns Observable con las opciones de ciudades
   */
  loadCitiesAsOptions(departmentCode: string, countryCode: string = 'COL'): Observable<SelectOption[]> {
    return this.geographyService.getCitiesByState(departmentCode, countryCode).pipe(
      map((cities: City[]) => 
        cities.map(city => ({
          label: city.cityName,
          value: city.cityCode
        }))
      )
    );
  }

  /**
   * Carga las ciudades sin transformar
   * @param departmentCode Código del departamento
   * @param countryCode Código del país (por defecto 'COL' para Colombia)
   * @returns Observable con la lista de ciudades
   */
  loadCities(departmentCode: string, countryCode: string = 'COL'): Observable<City[]> {
    return this.geographyService.getCitiesByState(departmentCode, countryCode);
  }

  /**
   * Carga todas las ubicaciones geográficas en paralelo
   * @param countryCode Código del país (por defecto 'COL')
   * @returns Promise con todas las ubicaciones cargadas
   */
  async loadAllLocations(countryCode: string = 'COL'): Promise<{
    countries: SelectOption[],
    departments: SelectOption[]
  }> {
    const [countries, departments] = await Promise.all([
      this.loadCountriesAsOptions().toPromise(),
      this.loadDepartmentsAsOptions(countryCode).toPromise()
    ]);

    return {
      countries: countries || [],
      departments: departments || []
    };
  }

  /**
   * Obtiene el nombre de un país por su código
   * @param countryCode Código del país
   * @param countries Lista de opciones de países
   * @returns Nombre del país o cadena vacía
   */
  getCountryName(countryCode: string, countries: SelectOption[]): string {
    const country = countries.find(c => c.value === countryCode);
    return country ? country.label : '';
  }

  /**
   * Obtiene el nombre de un departamento por su código
   * @param departmentCode Código del departamento
   * @param departments Lista de opciones de departamentos
   * @returns Nombre del departamento o cadena vacía
   */
  getDepartmentName(departmentCode: string, departments: SelectOption[]): string {
    const department = departments.find(d => d.value === departmentCode);
    return department ? department.label : '';
  }

  /**
   * Obtiene el nombre de una ciudad por su código
   * @param cityCode Código de la ciudad
   * @param cities Lista de opciones de ciudades
   * @returns Nombre de la ciudad o cadena vacía
   */
  getCityName(cityCode: string, cities: SelectOption[]): string {
    const city = cities.find(c => c.value === cityCode);
    return city ? city.label : '';
  }
}
