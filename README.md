# @atriumn/sdk-js

MCP client SDK for web and mobile apps in the Atriumn ecosystem. Enables seamless communication with MCP servers using the Model Context Protocol.

## Installation

```bash
npm install @atriumn/sdk-js
```

## Quick Start

```javascript
import { AtriumClient } from '@atriumn/sdk-js';

const client = new AtriumClient({
    apiKey: 'your-api-key',
    endpoint: 'wss://mcp.atriumn.com',
    clientType: 'web'
});

// Connect to the MCP server
await client.connect();

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Execute a tool
const result = await client.executeTask('your_tool_name', { 
    param1: 'value1',
    param2: 'value2'
});
console.log('Tool result:', result);

// List available resources
const resources = await client.listResources();
console.log('Available resources:', resources);

// Read a resource
const content = await client.readResource('resource://example');
console.log('Resource content:', content);

// Disconnect when done
await client.disconnect();
```

## Core Features

### Connection Management
- WebSocket transport for MCP protocol
- Automatic reconnection with exponential backoff
- Connection state monitoring
- Graceful error handling

### Tool Execution
- Dynamic tool discovery and listing
- Type-safe tool execution
- Request/response correlation
- Timeout and retry logic

### Resource Access
- Read resources from the MCP server
- List available resources
- Efficient resource management

### Authentication
- JWT token management
- Automatic token refresh
- API key support
- Secure authentication flow

## API Reference

### AtriumClient

#### Constructor
```typescript
new AtriumClient(config: AtriumClientConfig)
```

#### Methods

##### Connection
- `connect(): Promise<void>` - Connect to the MCP server
- `disconnect(): Promise<void>` - Disconnect from the server
- `isConnected: boolean` - Check connection status
- `status: ConnectionState` - Get detailed connection state

##### Tools
- `listTools(): Promise<Tool[]>` - List available tools
- `executeTask(toolName: string, params: any): Promise<ToolResult>` - Execute a tool

##### Resources
- `listResources(): Promise<Resource[]>` - List available resources
- `readResource(uri: string): Promise<ResourceContent>` - Read a resource

## Configuration

```typescript
interface AtriumClientConfig {
  apiKey?: string;         // Your API key (automatically adds Authorization header)
  endpoint: string;        // WebSocket endpoint URL
  clientType?: string;     // Client identifier (default: 'web')
  timeout?: number;        // Request timeout in ms (default: 30000)
  retryAttempts?: number;  // Max retry attempts (default: 3)
  retryDelay?: number;     // Base retry delay in ms (default: 1000)
  headers?: Record<string, string>; // Custom headers for WebSocket connection
}
```

## Authentication & Headers

### Automatic Authorization Header
```javascript
const client = new AtriumClient({
  apiKey: 'your-jwt-token',
  endpoint: 'wss://mcp.atriumn.com'
});
// Automatically adds: Authorization: Bearer your-jwt-token
```

### Custom Headers
```javascript
const client = new AtriumClient({
  endpoint: 'wss://mcp.atriumn.com',
  headers: {
    'Authorization': 'Bearer custom-token',
    'X-Client-Version': '1.0.0',
    'X-Custom-Header': 'value'
  }
});
```

### Browser vs Node.js Behavior
- **Node.js**: Headers are sent directly via the `ws` library
- **Browser**: Authorization header is converted to query parameter (`?authorization=token`) due to WebSocket API limitations

## React Integration

```jsx
import { AtriumClient } from '@atriumn/sdk-js';
import { useState, useEffect } from 'react';

function useAtriumClient(config) {
  const [client] = useState(() => new AtriumClient(config));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    client.connect().then(() => setConnected(true));
    return () => client.disconnect();
  }, [client]);

  return { client, connected };
}

function ToolExecutor() {
  const { client, connected } = useAtriumClient({
    apiKey: process.env.REACT_APP_ATRIUMN_API_KEY,
    endpoint: 'wss://mcp.atriumn.com'
  });

  const [tools, setTools] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (connected) {
      client.listTools().then(setTools);
    }
  }, [client, connected]);

  const executeTool = async (toolName, params) => {
    if (connected) {
      const toolResult = await client.executeTask(toolName, params);
      setResult(toolResult);
    }
  };

  return (
    <div>
      <h3>Available Tools:</h3>
      <ul>
        {tools.map(tool => (
          <li key={tool.name}>
            <strong>{tool.name}</strong>: {tool.description}
            <button onClick={() => executeTool(tool.name, {})}>
              Execute
            </button>
          </li>
        ))}
      </ul>
      {result && (
        <div>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

The SDK provides comprehensive error handling:

```javascript
try {
  await client.connect();
  const result = await client.executeTask('analyze_data', { data: 'example' });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Request timed out, retrying...');
  } else if (error.message.includes('not connected')) {
    console.log('Client disconnected, reconnecting...');
    await client.connect();
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { AtriumClient, Tool, ToolResult, Resource } from '@atriumn/sdk-js';

const client: AtriumClient = new AtriumClient({
  apiKey: 'your-key',
  endpoint: 'wss://mcp.atriumn.com'
});

const tools: Tool[] = await client.listTools();
const result: ToolResult = await client.executeTask('tool_name', {});
const resources: Resource[] = await client.listResources();
```

## MCP Protocol Compliance

This SDK implements the Model Context Protocol (MCP) specification:

- **Protocol Version**: 2024-11-05
- **Transport**: WebSocket
- **Message Format**: JSON-RPC 2.0
- **Authentication**: Bearer tokens
- **Capabilities**: Tools, Resources, Prompts

## Browser Compatibility

- Chrome 58+
- Firefox 52+
- Safari 11+
- Edge 79+

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
- [GitHub Issues](https://github.com/atriumn/sdk-js/issues)
- [Documentation](https://github.com/atriumn/sdk-js#readme)