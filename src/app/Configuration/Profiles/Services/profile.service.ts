import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Profile } from '../Models/Profile';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = environment.API_URL + 'keycloak/profile/';

  constructor(private http: HttpClient) {}

  getAllProfiles(): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.apiUrl + 'findAll');
  }

  // Método para obtener la cantidad de perfiles
  getProfilesCount(): Observable<number> {
    return this.getAllProfiles().pipe(
      map((profiles) => profiles.length) // Devuelve la cantidad de perfiles
    );
  }
}
