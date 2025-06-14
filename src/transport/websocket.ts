import { Transport, TransportConfig } from './types';
import { McpMessage, McpRequest, McpResponse } from '../types/mcp-types';

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null;
  private readonly config: TransportConfig;
  private readonly eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private readonly pendingRequests: Map<string | number, {
    resolve: (response: McpResponse) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private requestIdCounter = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: TransportConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Check if we're in Node.js environment
        if (typeof window === 'undefined' && typeof require !== 'undefined') {
          // Node.js environment - use ws library with headers support
          try {
            const WebSocket = require('ws');
            this.ws = new WebSocket(this.config.endpoint, {
              headers: this.config.headers
            });
          } catch (error) {
            // Fallback to standard WebSocket if ws package not available
            this.ws = new (globalThis.WebSocket || require('ws'))(this.config.endpoint);
          }
        } else {
          // Browser environment - WebSocket doesn't support headers directly
          // For browsers, we'll pass auth via query parameters as a fallback
          let endpoint = this.config.endpoint;
          if (this.config.headers?.Authorization) {
            const url = new URL(endpoint);
            url.searchParams.set('authorization', this.config.headers.Authorization.replace('Bearer ', ''));
            endpoint = url.toString();
          }
          this.ws = new WebSocket(endpoint);
        }

        const onOpen = (): void => {
          this.reconnectAttempts = 0;
          this.emit('connect');
          resolve();
        };

        const onError = (event: Event): void => {
          const error = new Error(`WebSocket connection failed: ${event}`);
          this.emit('error', error);
          reject(error);
        };

        const onMessage = (event: MessageEvent): void => {
          try {
            const message: McpMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.emit('error', new Error(`Invalid JSON received: ${error}`));
          }
        };

        const onClose = (event: CloseEvent): void => {
          this.ws = null;
          this.emit('disconnect');
          
          if (!event.wasClean && this.reconnectAttempts < (this.config.retryAttempts || 3)) {
            this.scheduleReconnect();
          }
        };

        if (this.ws) {
          this.ws.addEventListener('open', onOpen);
          this.ws.addEventListener('error', onError);
          this.ws.addEventListener('message', onMessage);
          this.ws.addEventListener('close', onClose);
        } else {
          reject(new Error('Failed to create WebSocket instance'));
        }

      } catch (error) {
        reject(new Error(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  async send(message: McpMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async sendRequest(request: McpRequest): Promise<McpResponse> {
    const id = request.id || this.generateRequestId();
    const requestWithId = { ...request, id };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.send(requestWithId).catch((error) => {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private handleMessage(message: McpMessage): void {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      clearTimeout(pending.timeout);

      if (message.error) {
        const error = new Error(message.error.message);
        (error as any).code = message.error.code;
        (error as any).data = message.error.data;
        pending.reject(error);
      } else {
        pending.resolve(message as McpResponse);
      }
    } else {
      this.emit('message', message);
    }
  }

  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    const delay = this.config.retryDelay! * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        this.emit('error', error);
        if (this.reconnectAttempts < (this.config.retryAttempts || 3)) {
          this.scheduleReconnect();
        }
      }
    }, delay);
  }
}