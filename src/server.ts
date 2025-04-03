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
import { bulk } from "./tools/bulk.js";
import { reindex } from "./tools/reindex.js";
import { createIndexTemplate, getIndexTemplate, deleteIndexTemplate } from "./tools/createIndexTemplate.js";

export { 
  listIndices, 
  getMappings, 
  search, 
  getClusterHealth, 
  createIndex, 
  createMapping, 
  bulk, 
  reindex, 
  createIndexTemplate,
  getIndexTemplate,
  deleteIndexTemplate
}; 

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

  // Get the health status of the Elasticsearch cluster, optionally include index-level details
  server.tool(
    "elasticsearch_health",
    "Get the health status of the Elasticsearch cluster, optionally include index-level details",
    {
      includeIndices: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include index-level details"),
    },
    async ({ includeIndices }) => {
      return await getClusterHealth(esClient, includeIndices);
    }
  );

  // Create an Elasticsearch index, optionally configure settings and mappings
  server.tool(
    "create_index",
    "Create an Elasticsearch index, optionally configure settings and mappings",
    {
      index: z
        .string()
        .trim()
        .min(1, "Index name is required")
        .describe("Name of the Elasticsearch index to create"),
      
      settings: z
        .record(z.any())
        .optional()
        .describe("Index settings, such as number of shards and replicas"),
      
      mappings: z
        .record(z.any())
        .optional()
        .describe("Index mappings, defining field types, etc.")
    },
    async ({ index, settings, mappings }) => {
      return await createIndex(esClient, index, settings, mappings);
    }
  );

  // Create or update the mapping structure of an Elasticsearch index
  server.tool(
    "create_mapping",
    "Create or update the mapping structure of an Elasticsearch index",
    {
      index: z
        .string()
        .trim()
        .min(1, "Index name is required")
        .describe("Elasticsearch index name"),
      
      mappings: z
        .record(z.any())
        .describe("Index mappings, defining field types, etc.")
    },
    async ({ index, mappings }) => {
      return await createMapping(esClient, index, mappings);
    }
  );

  // Bulk import data into an Elasticsearch index
  server.tool(
    "bulk",
    "Bulk data into an Elasticsearch index",
    {
      index: z
        .string()
        .trim()
        .min(1, "Index name is required")
        .describe("Target Elasticsearch index name"),
      
      documents: z
        .array(z.record(z.any()))
        .min(1, "At least one document is required")
        .describe("Array of documents to import"),
      
      idField: z
        .string()
        .optional()
        .describe("Optional document ID field name, if specified, the value of this field will be used as the document ID")
    },
    async ({ index, documents, idField }) => {
      return await bulk(esClient, index, documents, idField);
    }
  );

  // Reindex from source to target index with optional query and script
  server.tool(
    "reindex",
    "Reindex data from a source index to a target index",
    {
      sourceIndex: z
        .string()
        .trim()
        .min(1, "Source index name is required")
        .describe("Name of the source Elasticsearch index"),
      
      destIndex: z
        .string()
        .trim()
        .min(1, "Destination index name is required")
        .describe("Name of the destination Elasticsearch index"),
      
      query: z
        .record(z.any())
        .optional()
        .describe("Optional query to filter which documents to reindex"),
      
      script: z
        .record(z.any())
        .optional()
        .describe("Optional script to transform documents during reindex")
    },
    async ({ sourceIndex, destIndex, query, script }) => {
      return await reindex(esClient, sourceIndex, destIndex, script, query);
    }
  );

  // Create or update an index template
  server.tool(
    "create_index_template",
    "Create or update an Elasticsearch index template",
    {
      name: z
        .string()
        .trim()
        .min(1, "Template name is required")
        .describe("Name of the index template"),
      
      indexPatterns: z
        .array(z.string())
        .min(1, "At least one index pattern is required")
        .describe("Array of index patterns this template applies to"),
      
      template: z
        .record(z.any())
        .describe("Template configuration including settings, mappings, and aliases"),
      
      priority: z
        .number()
        .optional()
        .describe("Optional template priority - higher values have higher precedence"),
      
      version: z
        .number()
        .optional()
        .describe("Optional template version number")
    },
    async ({ name, indexPatterns, template, priority, version }) => {
      return await createIndexTemplate(esClient, name, indexPatterns, template, priority, version);
    }
  );

  // Get index templates
  server.tool(
    "get_index_template",
    "Get information about Elasticsearch index templates",
    {
      name: z
        .string()
        .optional()
        .describe("Optional template name filter - if omitted, all templates are returned")
    },
    async ({ name }) => {
      return await getIndexTemplate(esClient, name);
    }
  );

  // Delete an index template
  server.tool(
    "delete_index_template",
    "Delete an Elasticsearch index template",
    {
      name: z
        .string()
        .trim()
        .min(1, "Template name is required")
        .describe("Name of the template to delete")
    },
    async ({ name }) => {
      return await deleteIndexTemplate(esClient, name);
    }
  );

  return server;
} 