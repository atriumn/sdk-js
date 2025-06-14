export * from './mcp-types';
export * from './idynic-types';

export interface AtriumClientConfig {
  apiKey: string;
  endpoint: string;
  clientType?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
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