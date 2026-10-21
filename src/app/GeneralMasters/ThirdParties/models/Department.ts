import { Country } from "./Country";

/**
 * Interface for Department/State data
 * Matches backend StateResponse structure
 */
export interface Department {
  stateCode: string;
  stateName: string;
  country?: Country;
  countryCode: string;
}
