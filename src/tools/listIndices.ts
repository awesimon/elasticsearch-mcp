import { Client } from "@elastic/elasticsearch";

/**
 * 获取并可选地过滤Elasticsearch索引列表
 * @param esClient Elasticsearch客户端实例
 * @param pattern 可选的过滤模式（支持通配符，如"log-*"）
 * @returns 包含索引信息的响应对象
 */
export async function listIndices(esClient: Client, pattern?: string) {
  try {
    const response = await esClient.cat.indices({
      format: "json",
      index: pattern || "*" // if pattern is undefined, use "*" as default
    });

    const indicesInfo = response.map((index) => ({
      index: index.index,
      health: index.health,
      status: index.status,
      docsCount: index.docsCount,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${indicesInfo.length} indices`,
        },
        {
          type: "text" as const,
          text: JSON.stringify(indicesInfo, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(
      `Failed to list indices: ${error instanceof Error ? error.message : String(error)
      }`
    );
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)
            }`,
        },
      ],
    };
  }
} 