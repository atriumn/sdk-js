import { AuthToken, AuthConfig, JwtPayload } from './auth-types';

export class JwtManager {
  private config: AuthConfig;
  private currentToken: AuthToken | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: AuthConfig) {
    this.config = {
      tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
      ...config
    };
  }

  async getValidToken(): Promise<string> {
    if (!this.currentToken || this.isTokenExpiringSoon(this.currentToken)) {
      await this.refreshToken();
    }

    return this.currentToken!.token;
  }

  setToken(token: string): void {
    const payload = this.parseJwtPayload(token);
    const expiresAt = new Date(payload.exp * 1000);

    this.currentToken = {
      token,
      payload,
      expiresAt
    };

    this.scheduleTokenRefresh();
  }

  clearToken(): void {
    this.currentToken = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  isTokenValid(): boolean {
    if (!this.currentToken) {
      return false;
    }

    return new Date() < this.currentToken.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    if (!this.config.refreshEndpoint) {
      throw new Error('No refresh endpoint configured');
    }

    try {
      const response = await fetch(this.config.refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.token) {
        this.setToken(data.token);
      } else {
        throw new Error('No token in refresh response');
      }
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error}`);
    }
  }

  private parseJwtPayload(token: string): JwtPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error(`Failed to parse JWT: ${error}`);
    }
  }

  private isTokenExpiringSoon(token: AuthToken): boolean {
    const now = new Date();
    const threshold = new Date(token.expiresAt.getTime() - this.config.tokenRefreshThreshold!);
    return now >= threshold;
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentToken || !this.config.refreshEndpoint) {
      return;
    }

    const refreshTime = this.currentToken.expiresAt.getTime() - this.config.tokenRefreshThreshold!;
    const delay = refreshTime - Date.now();

    if (delay > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Scheduled token refresh failed:', error);
        }
      }, delay);
    }
  }
}