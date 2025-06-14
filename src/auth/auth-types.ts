export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

export interface AuthToken {
  token: string;
  payload: JwtPayload;
  expiresAt: Date;
}

export interface AuthConfig {
  apiKey: string;
  refreshEndpoint?: string;
  tokenRefreshThreshold?: number; // milliseconds before expiry to refresh
}