export { AtriumClient } from './client';
export { WebSocketTransport } from './transport/websocket';
export { JwtManager } from './auth/jwt-manager';

export type {
  AtriumClientConfig,
  ConnectionState,
  RequestOptions,
  Tool,
  ToolResult,
  Resource,
  ResourceContent,
  McpMessage,
  McpRequest,
  McpResponse,
  McpError,
  ServerCapabilities,
  ClientCapabilities,
  InitializeParams,
  InitializeResult
} from './types';

export type {
  Transport,
  TransportConfig
} from './transport/types';

export type {
  AuthToken,
  AuthConfig,
  JwtPayload
} from './auth/auth-types';