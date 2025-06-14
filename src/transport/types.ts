import { McpMessage, McpRequest, McpResponse } from '../types/mcp-types';

export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: McpMessage): Promise<void>;
  sendRequest(request: McpRequest): Promise<McpResponse>;
  on(event: 'message', listener: (message: McpMessage) => void): void;
  on(event: 'connect', listener: () => void): void;
  on(event: 'disconnect', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  readonly isConnected: boolean;
}

export interface TransportConfig {
  endpoint: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}