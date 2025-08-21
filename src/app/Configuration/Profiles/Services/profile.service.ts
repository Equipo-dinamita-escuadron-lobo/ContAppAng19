import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Profile,
  ProfileCreateRequest,
  ProfileList,
  ProfileUpdateRequest,
} from '../Models/Profile';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = environment.API_URL + 'keycloak/profile/';

  constructor(private http: HttpClient) {}

  getAllProfiles(): Observable<ProfileList[]> {
    const url = this.apiUrl + 'findAll';
    return this.http.get<ProfileList[]>(url);
  }

  getProfilesCount(): Observable<number> {
    return this.getAllProfiles().pipe(map((profiles) => profiles.length));
  }

  createProfile(profile: ProfileCreateRequest): Observable<Profile> {
    const url = this.apiUrl + 'create';
    return this.http.post<Profile>(url, profile);
  }

  deleteProfile(id: string): Observable<Profile> {
    const url = `${this.apiUrl}delete/${id}`;
    return this.http.delete<Profile>(url);
  }

  getProfileById(profileId: string): Observable<Profile> {
    const url = `${this.apiUrl}findById/${profileId}`;
    return this.http.get<Profile>(url);
  }

  updateProfile(
    profileId: string,
    profile: ProfileUpdateRequest
  ): Observable<Profile> {
    const url = `${this.apiUrl}update/${profileId}`;
    return this.http.put<Profile>(url, profile);
  }

  findByName(profileName: string): Observable<Profile[]> {
    const url = `${this.apiUrl}findByName/${profileName}`;
    return this.http.get<Profile[]>(url);
  }
}
