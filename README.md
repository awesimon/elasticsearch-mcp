# Elasticsearch MCP Server

[English](./README.md) | [中文](./README.zh-CN.md)

[![smithery badge](https://smithery.ai/badge/@awesimon/elasticsearch-mcp)](https://smithery.ai/server/@awesimon/elasticsearch-mcp)

MCP Server for connecting to your Elasticsearch cluster directly from any MCP Client (like Claude Desktop, Cursor).

This server connects agents to your Elasticsearch data using the Model Context Protocol. It allows you to interact with your Elasticsearch indices through natural language conversations.


## Demo

[![Elasticsearch MCP Demo](https://img.youtube.com/vi/Wqw1XL8de5A/0.jpg)](https://www.youtube.com/watch?v=Wqw1XL8de5A "Elasticsearch MCP Demo")

## Feature Overview

### Available Features

#### Cluster Management
* `elasticsearch_health`: Get Elasticsearch cluster health status, optionally including index-level details

#### Index Operations
* `list_indices`: List available Elasticsearch indices, support regex
* `create_index`: Create Elasticsearch index with optional settings and mappings
* `reindex`: Reindex data from a source index to a target index with optional query and script

#### Mapping Management
* `get_mappings`: Get field mappings for a specific Elasticsearch index
* `create_mapping`: Create or update mapping structure for an Elasticsearch index

#### Search & Data Operations
* `search`: Perform an Elasticsearch search with the provided query DSL
* `bulk`: Bulk data into an Elasticsearch index

#### Template Management
* `create_index_template`: Create or update an index template
* `get_index_template`: Get information about index templates
* `delete_index_template`: Delete an index template

### How It Works

1. The MCP Client analyzes your request and determines which Elasticsearch operations are needed.
2. The MCP server carries out these operations (listing indices, fetching mappings, performing searches).
3. The MCP Client processes the results and presents them in a user-friendly format.

## Getting Started

### Prerequisites

* An Elasticsearch instance
* Elasticsearch authentication credentials (API key or username/password)
* MCP Client (e.g. Claude Desktop, Cursor)

### Installation & Setup

#### Using the Published NPM Package

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
           "ES_HOST": "your-elasticsearch-host",
           "ES_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

2. **Start a Conversation**
   - Open a new conversation in your MCP Client.
   - The MCP server should connect automatically.
   - You can now ask questions about your Elasticsearch data.

### Configuration Options

The Elasticsearch MCP Server supports configuration options to connect to your Elasticsearch:

> [!NOTE]
> You must provide either an API key or both username and password for authentication.

| Environment Variable | Description | Required |
|---------------------|-------------|----------|
| `ES_HOST` | Your Elasticsearch instance URL(s) - supports single URL or comma-separated multiple URLs (also supports legacy `HOST`) | Yes |
| `ES_API_KEY` | Elasticsearch API key for authentication (also supports legacy `API_KEY`) | No |
| `ES_USERNAME` | Elasticsearch username for basic authentication (also supports legacy `USERNAME`) | No |
| `ES_PASSWORD` | Elasticsearch password for basic authentication (also supports legacy `PASSWORD`) | No |
| `ES_CA_CERT` | Path to custom CA certificate for Elasticsearch SSL/TLS (also supports legacy `CA_CERT`) | No |

### Multiple URLs Configuration

You can configure multiple Elasticsearch nodes for high availability and load balancing:

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
        "ES_HOST": "https://es-node1:9200,https://es-node2:9200,https://es-node3:9200",
        "ES_API_KEY": "your-api-key"
      }
    }
  }
}
```

The client will automatically handle failover and load balancing between the configured nodes.

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

4. **Run locally in Claude Desktop App**
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
           "ES_HOST": "your-elasticsearch-host",
           "ES_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

5. **Run locally in Cursor Editor**
   - Open **Cursor Editor**
   - Go to **Cursor Settings > MCP**
   - Click `Add new global MCP Server` and add a new MCP Server with the following configuration:
   ```json
   {
     "mcpServers": {
       "elasticsearch-mcp": {
         "command": "node",
         "args": [
           "/path/to/your/project/dist/index.js"
         ],
         "env": {
           "ES_HOST": "your-elasticsearch-host",
           "ES_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

6. **Debugging with MCP Inspector**
   ```bash
   ES_HOST=your-elasticsearch-url ES_API_KEY=your-api-key npm run inspector
   ```

   This will start the MCP Inspector, allowing you to debug and analyze requests. You should see:

   ```bash
   Starting MCP inspector...
   ⚙️ Proxy server listening on port 6277
   🔍 MCP Inspector is up and running at http://127.0.0.1:6274 🚀
   ```

## Example Queries

> [!TIP]
> Here are some natural language queries you can try with your MCP Client.

#### Cluster Management
* "What is the health status of my Elasticsearch cluster?"
* "How many active nodes are in my cluster?"

#### Index Operations
* "What indices do I have in my Elasticsearch cluster?"
* "Create a new index called 'users' with 3 shards and 1 replica."
* "Reindex data from 'old_index' to 'new_index'."

#### Mapping Management
* "Show me the field mappings for the 'products' index."
* "Add a keyword type field called 'tags' to the 'products' index."

#### Search & Data Operations
* "Find all orders over $500 from last month."
* "Which products received the most 5-star reviews?"
* "Bulk import these customer records into the 'customers' index."

#### Template Management
* "Create an index template for logs with pattern 'logs-*'."
* "Show me all my index templates."
* "Delete the 'outdated_template' index template."

If you encounter issues, feel free to open an issue on the GitHub repository.