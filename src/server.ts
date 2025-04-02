import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchConfig, createClientOptions } from "./config/schema.js";
import { listIndices } from "./tools/listIndices.js";
import { getMappings } from "./tools/getMappings.js";
import { search } from "./tools/search.js";
import { getClusterHealth } from "./tools/getClusterHealth.js";
import { createIndex } from "./tools/createIndex.js";
import { createMapping } from "./tools/createMapping.js";
import { bulkImport } from "./tools/bulkImport.js";

export { listIndices, getMappings, search, getClusterHealth, createIndex, createMapping, bulkImport }; 

export async function createElasticsearchMcpServer(
  config: ElasticsearchConfig
) {
  const clientOptions = createClientOptions(config);
  const esClient = new Client(clientOptions);

  const server = new McpServer({
    name: "mcp-server-elasticsearch",
    version: "1.0.0",
  });

  // list all indices
  server.tool(
    "list_indices",
    "List all available Elasticsearch indices, support regex",
    {
      pattern: z
        .string()
        .optional()
        .describe("Optional regex pattern to filter indices by name"),
    },
    async ({ pattern }) => {
      return await listIndices(esClient, pattern);
    }
  );

  // get mappings for a specific index
  server.tool(
    "get_mappings",
    "Get field mappings for a specific Elasticsearch index",
    {
      index: z
        .string()
        .trim()
        .min(1, "Index name is required")
        .describe("Name of the Elasticsearch index to get mappings for"),
    },
    async ({ index }) => {
      return await getMappings(esClient, index);
    }
  );

  // search with query DSL
  server.tool(
    "search",
    "Perform an Elasticsearch search with the provided query DSL. Highlights are always enabled.",
    {
      index: z
        .string()
        .trim()
        .min(1, "Index name is required")
        .describe("Name of the Elasticsearch index to search"),

      queryBody: z
        .record(z.any())
        .refine(
          (val) => {
            try {
              JSON.parse(JSON.stringify(val));
              return true;
            } catch (e) {
              return false;
            }
          },
          {
            message: "queryBody must be a valid Elasticsearch query DSL object",
          }
        )
        .describe(
          "Complete Elasticsearch query DSL object that can include query, size, from, sort, etc."
        ),
    },
    async ({ index, queryBody }) => {
      return await search(esClient, index, queryBody);
    }
  );

  // 获取集群健康状态
  server.tool(
    "elasticsearch_health",
    "获取Elasticsearch集群健康状态，可选包含索引级别详情",
    {
      includeIndices: z
        .boolean()
        .optional()
        .default(false)
        .describe("是否包含各索引的健康状态详情"),
    },
    async ({ includeIndices }) => {
      return await getClusterHealth(esClient, includeIndices);
    }
  );

  // 创建索引
  server.tool(
    "create_index",
    "创建Elasticsearch索引，可选配置设置和映射",
    {
      index: z
        .string()
        .trim()
        .min(1, "索引名称为必填项")
        .describe("要创建的Elasticsearch索引名称"),
      
      settings: z
        .record(z.any())
        .optional()
        .describe("索引设置，如分片数、副本数等"),
      
      mappings: z
        .record(z.any())
        .optional()
        .describe("索引映射定义，定义字段类型等")
    },
    async ({ index, settings, mappings }) => {
      return await createIndex(esClient, index, settings, mappings);
    }
  );

  // 创建/更新映射
  server.tool(
    "create_mapping",
    "创建或更新Elasticsearch索引的映射结构",
    {
      index: z
        .string()
        .trim()
        .min(1, "索引名称为必填项")
        .describe("Elasticsearch索引名称"),
      
      mappings: z
        .record(z.any())
        .describe("索引映射定义JSON对象")
    },
    async ({ index, mappings }) => {
      return await createMapping(esClient, index, mappings);
    }
  );

  // 批量导入数据
  server.tool(
    "bulk_import",
    "批量导入数据到Elasticsearch索引",
    {
      index: z
        .string()
        .trim()
        .min(1, "索引名称为必填项")
        .describe("目标Elasticsearch索引名称"),
      
      documents: z
        .array(z.record(z.any()))
        .min(1, "至少需要一个文档")
        .describe("要导入的文档数组"),
      
      idField: z
        .string()
        .optional()
        .describe("可选的文档ID字段名，如果指定，将使用文档中该字段的值作为文档ID")
    },
    async ({ index, documents, idField }) => {
      return await bulkImport(esClient, index, documents, idField);
    }
  );

  return server;
} 