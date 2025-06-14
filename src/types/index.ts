export * from './mcp-types';

export interface AtriumClientConfig {
  apiKey?: string;
  endpoint: string;
  clientType?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastError?: Error;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
}