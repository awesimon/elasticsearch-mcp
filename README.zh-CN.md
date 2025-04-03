# Elasticsearch MCP 服务器

[English](./README.md) | [中文](./README.zh-CN.md)

MCP 服务器用于从任何 MCP 客户端（如 Claude Desktop、Cursor）直接连接到您的 Elasticsearch 集群。

该服务器使用模型上下文协议（Model Context Protocol）将智能体连接到您的 Elasticsearch 数据。它允许您通过自然语言对话与 Elasticsearch 索引进行交互。

## Demo

[![Elasticsearch MCP Demo](https://img.youtube.com/vi/iJ1NPzAQ3bU/0.jpg)](https://www.youtube.com/watch?v=iJ1NPzAQ3bU "Elasticsearch MCP Demo")

## 功能概述

### 可用工具

* `list_indices`: 列出可用的 Elasticsearch 索引，支持正则表达式
* `get_mappings`: 获取特定 Elasticsearch 索引的字段映射
* `search`: 使用提供的查询 DSL 执行 Elasticsearch 搜索
* `elasticsearch_health`: 获取 Elasticsearch 集群健康状态，可选择包括索引级别的详细信息
* `create_index`: 创建 Elasticsearch 索引，可选择设置和映射
* `create_mapping`: 为 Elasticsearch 索引创建或更新映射结构
* `bulk_import`: 批量导入数据到 Elasticsearch 索引

### 工作原理

1. MCP 客户端分析您的请求并确定需要哪些 Elasticsearch 操作
2. MCP 服务器执行这些操作（列出索引、获取映射、执行搜索）
3. MCP 客户端处理结果并以用户友好的格式呈现

## 示例查询

> [!TIP]
> 以下是您可以在 MCP 客户端中尝试的一些自然语言查询。

* "我的 Elasticsearch 集群中有哪些索引？"
* "显示 'products' 索引的字段映射。"
* "查找上个月超过 500 美元的所有订单。"
* "哪些产品收到了最多的五星评价？"
* "我的 Elasticsearch 集群的健康状态如何？"
* "创建一个名为 'users' 的新索引，有 3 个分片和 1 个副本。"
* "向 'products' 索引添加一个名为 'tags' 的关键字类型字段。"
* "将这些客户记录批量导入到 'customers' 索引中。"

## 入门指南

### 前提条件

* Elasticsearch 实例
* Elasticsearch 认证凭据（API 密钥或用户名/密码）
* MCP 客户端（如 Claude Desktop、Cursor）

### 安装与设置

#### 使用已发布的 NPM 包（即将推出）

> [!TIP]
> 使用 Elasticsearch MCP 服务器最简单的方法是通过已发布的 npm 包。

1. **配置 MCP 客户端**
   - 打开您的 MCP 客户端。查看 [MCP 客户端列表](https://modelcontextprotocol.io/clients)，这里我们配置的是 Claude Desktop。
   - 转到 **设置 > 开发者 > MCP 服务器**
   - 点击 `编辑配置` 并添加一个新的 MCP 服务器，配置如下：

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
           "HOST": "你的-elasticsearch-主机",
           "API_KEY": "你的-api-密钥"
         }
       }
     }
   }
   ```

2. **开始对话**
   - 在 MCP 客户端中打开新对话
   - MCP 服务器应自动连接
   - 现在您可以询问关于 Elasticsearch 数据的问题

### 配置选项

Elasticsearch MCP 服务器支持以下配置选项来连接到您的 Elasticsearch：

> [!NOTE]
> 您必须提供 API 密钥或同时提供用户名和密码进行身份验证。

| 环境变量 | 描述 | 必需 |
|---------------------|-------------|----------|
| `HOST` | 您的 Elasticsearch 实例 URL | 是 |
| `API_KEY` | 用于身份验证的 Elasticsearch API 密钥 | 否 |
| `USERNAME` | 用于基本身份验证的 Elasticsearch 用户名 | 否 |
| `PASSWORD` | 用于基本身份验证的 Elasticsearch 密码 | 否 |
| `CA_CERT` | Elasticsearch SSL/TLS 的自定义 CA 证书路径 | 否 |

## 本地开发

> [!NOTE]
> 如果您想修改或扩展 MCP 服务器，请按照以下本地开发步骤操作。

1. **使用正确的 Node.js 版本**
   ```bash
   nvm use
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **在 Claude Desktop 应用中本地运行（也支持 Cursor）**
   - 打开 **Claude Desktop 应用**
   - 转到 **设置 > 开发者 > MCP 服务器**
   - 点击 `编辑配置` 并添加一个新的 MCP 服务器，配置如下：
   ```json
   {
     "mcpServers": {
       "elasticsearch-mcp": {
         "command": "node",
         "args": [
           "/path/to/your/project/dist/index.js"
         ],
         "env": {
           "HOST": "你的-elasticsearch-主机",
           "API_KEY": "你的-api-密钥"
         }
       }
     }
   }
   ```

5. **使用 MCP Inspector 进行调试**
   ```bash
   HOST=your-elasticsearch-url API_KEY=your-api-key npm run inspector
   ```

   这将启动 MCP Inspector，允许您调试和分析请求。您应该会看到：

   ```bash
   Starting MCP inspector...
   Proxy server listening on port 3000

   🔍 MCP Inspector is up and running at http://localhost:5173 🚀
   ```

## Inspired by
- [mcp-server-elasticsearch](https://github.com/elastic/mcp-server-elasticsearch).

如果您遇到问题，请随时在 GitHub 仓库上提出 issue。 