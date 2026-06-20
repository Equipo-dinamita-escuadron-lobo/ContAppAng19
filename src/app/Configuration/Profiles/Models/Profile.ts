export interface Profile {
  id: string;
  name: string;
  description: string;
}

export interface ProfileCreateRequest {
  name: string;
  description: string;
}

export interface ProfileList {
  id: string;
  name: string;
  description: string;
}

export interface ProfileUpdateRequest {
  id: string;
  name: string;
  description: string;
}
