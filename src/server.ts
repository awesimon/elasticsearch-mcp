import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchConfig, createClientOptions } from "./config/schema.js";
import { listIndices } from "./tools/listIndices.js";
import { getMappings } from "./tools/getMappings.js";
import { search } from "./tools/search.js";

export { listIndices, getMappings, search }; 

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

  return server;
} 