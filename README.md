# Elasticsearch MCP Server

[English](./README.md) | [中文](./README.zh-CN.md)

MCP Server for connecting to your Elasticsearch cluster directly from any MCP Client (like Claude Desktop, Cursor).

This server connects agents to your Elasticsearch data using the Model Context Protocol. It allows you to interact with your Elasticsearch indices through natural language conversations.

## Demo

[![Elasticsearch MCP Demo](https://img.youtube.com/vi/iJ1NPzAQ3bU/0.jpg)](https://www.youtube.com/watch?v=iJ1NPzAQ3bU "Elasticsearch MCP Demo")

## Feature Overview

### Available Features

* `list_indices`: List available Elasticsearch indices, support regex
* `get_mappings`: Get field mappings for a specific Elasticsearch index
* `search`: Perform an Elasticsearch search with the provided query DSL
* `elasticsearch_health`: Get Elasticsearch cluster health status, optionally including index-level details
* `create_index`: Create Elasticsearch index with optional settings and mappings
* `create_mapping`: Create or update mapping structure for an Elasticsearch index
* `bulk_import`: Bulk import data into an Elasticsearch index

### How It Works

1. The MCP Client analyzes your request and determines which Elasticsearch operations are needed
2. The MCP server carries out these operations (listing indices, fetching mappings, performing searches)
3. The MCP Client processes the results and presents them in a user-friendly format

## Getting Started

### Prerequisites

* An Elasticsearch instance
* Elasticsearch authentication credentials (API key or username/password)
* MCP Client (e.g. Claude Desktop, Cursor)

### Installation & Setup

#### Using the Published NPM Package (coming soon)

> [!TIP]
> The easiest way to use Elasticsearch MCP Server is through the published npm package.

1. **Configure MCP Client**
   - Open your MCP Client. See the [list of MCP Clients](https://modelcontextprotocol.io/clients), here we are configuring Claude Desktop.
   - Go to **Settings > Developer > MCP Servers**
   - Click `Edit Config` and add a new MCP Server with the following configuration:

   ```json
   {
     "mcpServers": {
       "elasticsearch-mcp": {
         "command": "npx",
         "args": [
           "-y",
           "@awesome-ai/elasticsearch-mcp"
         ],
         "env": {
           "HOST": "your-elasticsearch-host",
           "API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

2. **Start a Conversation**
   - Open a new conversation in your MCP Client
   - The MCP server should connect automatically
   - You can now ask questions about your Elasticsearch data

### Configuration Options

The Elasticsearch MCP Server supports configuration options to connect to your Elasticsearch:

> [!NOTE]
> You must provide either an API key or both username and password for authentication.

| Environment Variable | Description | Required |
|---------------------|-------------|----------|
| `HOST` | Your Elasticsearch instance URL | Yes |
| `API_KEY` | Elasticsearch API key for authentication | No |
| `USERNAME` | Elasticsearch username for basic authentication | No |
| `PASSWORD` | Elasticsearch password for basic authentication | No |
| `CA_CERT` | Path to custom CA certificate for Elasticsearch SSL/TLS | No |

## Local Development

> [!NOTE]
> If you want to modify or extend the MCP Server, follow these local development steps.

1. **Use the correct Node.js version**
   ```bash
   nvm use
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Run locally in Claude Desktop App, (also support Cusor)**
   - Open **Claude Desktop App**
   - Go to **Settings > Developer > MCP Servers**
   - Click `Edit Config` and add a new MCP Server with the following configuration:
   ```json
   {
     "mcpServers": {
       "elasticsearch-mcp": {
         "command": "node",
         "args": [
           "/path/to/your/project/dist/index.js"
         ],
         "env": {
           "HOST": "your-elasticsearch-host",
           "API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

5. **Debugging with MCP Inspector**
   ```bash
   HOST=your-elasticsearch-url API_KEY=your-api-key npm run inspector
   ```

   This will start the MCP Inspector, allowing you to debug and analyze requests. You should see:

   ```bash
   Starting MCP inspector...
   Proxy server listening on port 3000

   🔍 MCP Inspector is up and running at http://localhost:5173 🚀
   ```
## Example Queries

> [!TIP]
> Here are some natural language queries you can try with your MCP Client.

* "What indices do I have in my Elasticsearch cluster?"
* "Show me the field mappings for the 'products' index."
* "Find all orders over $500 from last month."
* "Which products received the most 5-star reviews?"
* "What is the health status of my Elasticsearch cluster?"
* "Create a new index called 'users' with 3 shards and 1 replica."
* "Add a keyword type field called 'tags' to the 'products' index."
* "Bulk import these customer records into the 'customers' index."

If you encounter issues, feel free to open an issue on the GitHub repository.

## Inspired by
- [mcp-server-elasticsearch](https://github.com/elastic/mcp-server-elasticsearch).