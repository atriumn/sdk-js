import { WebSocketTransport } from './transport/websocket';
import { Transport } from './transport/types';
import {
  AtriumClientConfig,
  ConnectionState,
  RequestOptions,
  Tool,
  ToolResult,
  Resource,
  ResourceContent,
  InitializeParams,
  InitializeResult,
  TraitAnalysis,
  JobAnalysis,
  Evidence,
  Trait
} from './types';

export class AtriumClient {
  private transport: Transport;
  private config: AtriumClientConfig;
  private connectionState: ConnectionState;
  private isInitialized = false;
  private serverCapabilities: any = null;

  constructor(config: AtriumClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      clientType: 'web',
      ...config
    };

    this.connectionState = {
      status: 'disconnected'
    };

    this.transport = new WebSocketTransport({
      endpoint: this.config.endpoint,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    this.setupTransportListeners();
  }

  async connect(): Promise<void> {
    if (this.connectionState.status === 'connected') {
      return;
    }

    this.connectionState.status = 'connecting';

    try {
      await this.transport.connect();
      await this.initialize();
      this.connectionState.status = 'connected';
      this.connectionState.lastConnected = new Date();
    } catch (error) {
      this.connectionState.status = 'error';
      this.connectionState.lastError = error as Error;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.connectionState.status = 'disconnected';
    this.isInitialized = false;
  }

  get isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  get status(): ConnectionState {
    return { ...this.connectionState };
  }

  async executeTask(toolName: string, params: any, _options?: RequestOptions): Promise<ToolResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    const response = await this.transport.sendRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    });

    if (response.error) {
      throw new Error(`Tool execution failed: ${response.error.message}`);
    }

    return response.result;
  }

  async listTools(): Promise<Tool[]> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    const response = await this.transport.sendRequest({
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {}
    });

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    return response.result.tools || [];
  }

  async readResource(uri: string): Promise<ResourceContent> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    const response = await this.transport.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/read',
      params: { uri }
    });

    if (response.error) {
      throw new Error(`Failed to read resource: ${response.error.message}`);
    }

    return response.result;
  }

  async listResources(): Promise<Resource[]> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    const response = await this.transport.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {}
    });

    if (response.error) {
      throw new Error(`Failed to list resources: ${response.error.message}`);
    }

    return response.result.resources || [];
  }

  async extractTraits(documentText: string): Promise<TraitAnalysis> {
    const result = await this.executeTask('extract_traits', { 
      document_text: documentText 
    });
    
    if (result.isError) {
      throw new Error('Failed to extract traits');
    }
    
    return result.content[0]?.text ? JSON.parse(result.content[0].text) as TraitAnalysis : result as unknown as TraitAnalysis;
  }

  async analyzeJob(jobDescription: string): Promise<JobAnalysis> {
    const result = await this.executeTask('analyze_job', { 
      job_description: jobDescription 
    });
    
    if (result.isError) {
      throw new Error('Failed to analyze job');
    }
    
    return result.content[0]?.text ? JSON.parse(result.content[0].text) as JobAnalysis : result as unknown as JobAnalysis;
  }

  async getEvidence(): Promise<Evidence[]> {
    const resources = await this.listResources();
    const evidenceResources = resources.filter(r => r.uri.includes('/evidence/'));
    
    const evidencePromises = evidenceResources.map(async (resource) => {
      const content = await this.readResource(resource.uri);
      return JSON.parse(content.text || '{}') as Evidence;
    });

    return Promise.all(evidencePromises);
  }

  async getTraits(): Promise<Trait[]> {
    const resources = await this.listResources();
    const traitResources = resources.filter(r => r.uri.includes('/traits/'));
    
    const traitPromises = traitResources.map(async (resource) => {
      const content = await this.readResource(resource.uri);
      return JSON.parse(content.text || '{}') as Trait;
    });

    return Promise.all(traitPromises);
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const initParams: InitializeParams = {
      protocolVersion: '2024-11-05',
      capabilities: {
        experimental: {},
        roots: {
          listChanged: true
        },
        sampling: {}
      },
      clientInfo: {
        name: '@atriumn/sdk-js',
        version: '0.1.0'
      }
    };

    const response = await this.transport.sendRequest({
      jsonrpc: '2.0',
      method: 'initialize',
      params: initParams
    });

    if (response.error) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    }

    const result = response.result as InitializeResult;
    this.serverCapabilities = result.capabilities;
    this.isInitialized = true;

    await this.transport.send({
      jsonrpc: '2.0',
      method: 'initialized',
      params: {}
    });
  }

  private setupTransportListeners(): void {
    this.transport.on('connect', () => {
      this.connectionState.status = 'connected';
      this.connectionState.lastConnected = new Date();
    });

    this.transport.on('disconnect', () => {
      this.connectionState.status = 'disconnected';
      this.isInitialized = false;
    });

    this.transport.on('error', (error: Error) => {
      this.connectionState.status = 'error';
      this.connectionState.lastError = error;
    });

    this.transport.on('message', (message) => {
      console.debug('Received message:', message);
    });
  }
}