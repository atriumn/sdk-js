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
  TraitAnalysis,
  JobAnalysis,
  Evidence,
  Trait,
  PersonProfile,
  WorkExperience,
  MatchResult,
  Skill,
  ExperienceLevel,
  SalaryRange
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