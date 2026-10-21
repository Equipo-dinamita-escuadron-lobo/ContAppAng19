import { Department } from "./Department";

/**
 * Interface for City data
 * Matches backend CityResponse structure
 */
export interface City {
  cityCode: string;
  cityName: string;
  state?: Department;
  stateCode: string;
  countryCode: string;
}
