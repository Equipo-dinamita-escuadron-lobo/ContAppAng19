export interface DecodedToken {
  exp: number;
  iat: number;
  sub: string; // Subject (usualmente el ID de usuario)
  realm_access?: {
    roles: string[];
  };
}
