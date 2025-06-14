import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtriumClient } from './client';

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // OPEN
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// @ts-expect-error - mocking global WebSocket
global.WebSocket = vi.fn(() => mockWebSocket);

describe('AtriumClient', () => {
  let client: AtriumClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new AtriumClient({
      apiKey: 'test-api-key',
      endpoint: 'wss://test.example.com'
    });
  });

  it('should create a client with correct configuration', () => {
    expect(client).toBeInstanceOf(AtriumClient);
    expect(client.isConnected).toBe(false);
  });

  it('should have correct status initially', () => {
    const status = client.status;
    expect(status.status).toBe('disconnected');
    expect(status.lastConnected).toBeUndefined();
    expect(status.lastError).toBeUndefined();
  });

  it('should throw error when executing task while disconnected', async () => {
    await expect(
      client.executeTask('test_tool', { param: 'value' })
    ).rejects.toThrow('Client is not connected');
  });

  it('should throw error when listing tools while disconnected', async () => {
    await expect(client.listTools()).rejects.toThrow('Client is not connected');
  });

  it('should throw error when reading resources while disconnected', async () => {
    await expect(
      client.readResource('test://resource')
    ).rejects.toThrow('Client is not connected');
  });

  it('should throw error when listing resources while disconnected', async () => {
    await expect(client.listResources()).rejects.toThrow('Client is not connected');
  });
});