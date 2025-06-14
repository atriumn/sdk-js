# @atriumn/sdk-js

JavaScript SDK for Universal MCP - enables web apps to communicate with the Universal MCP Server using the MCP protocol.

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

// Connect to the server
await client.connect();

// Extract traits from text
const analysis = await client.extractTraits('Job candidate description here...');
console.log(analysis.traits);

// Analyze a job description
const jobAnalysis = await client.analyzeJob('Software engineer job posting...');
console.log(jobAnalysis.requiredTraits);

// Execute custom tools
const result = await client.executeTask('custom_tool', { param: 'value' });

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

### Idynic Integration
- `extractTraits()` - Extract personality traits from text
- `analyzeJob()` - Analyze job descriptions for requirements
- `getEvidence()` - Retrieve supporting evidence
- `getTraits()` - Get available trait definitions

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

##### Idynic Convenience Methods
- `extractTraits(text: string): Promise<TraitAnalysis>` - Extract traits from text
- `analyzeJob(description: string): Promise<JobAnalysis>` - Analyze job description
- `getEvidence(): Promise<Evidence[]>` - Get all evidence
- `getTraits(): Promise<Trait[]>` - Get all traits

## Configuration

```typescript
interface AtriumClientConfig {
  apiKey: string;          // Your API key
  endpoint: string;        // WebSocket endpoint URL
  clientType?: string;     // Client identifier (default: 'web')
  timeout?: number;        // Request timeout in ms (default: 30000)
  retryAttempts?: number;  // Max retry attempts (default: 3)
  retryDelay?: number;     // Base retry delay in ms (default: 1000)
}
```

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

function TraitExtractor() {
  const { client, connected } = useAtriumClient({
    apiKey: process.env.REACT_APP_API_KEY,
    endpoint: 'wss://mcp.atriumn.com'
  });

  const [text, setText] = useState('');
  const [traits, setTraits] = useState(null);

  const extractTraits = async () => {
    if (connected && text) {
      const analysis = await client.extractTraits(text);
      setTraits(analysis.traits);
    }
  };

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
      />
      <button onClick={extractTraits} disabled={!connected}>
        Extract Traits
      </button>
      {traits && (
        <ul>
          {traits.map(trait => (
            <li key={trait.id}>{trait.name}: {trait.confidence}</li>
          ))}
        </ul>
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
  const result = await client.executeTask('analyze_text', { text: 'example' });
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