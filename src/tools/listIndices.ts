import { Client } from "@elastic/elasticsearch";

/**
 * 获取并可选地过滤Elasticsearch索引列表
 * @param esClient Elasticsearch客户端实例
 * @param pattern 可选的过滤模式（正则表达式字符串）
 * @returns 包含索引信息的响应对象
 */
export async function listIndices(esClient: Client, pattern?: string) {
  try {
    const response = await esClient.cat.indices({ format: "json" });
    
    // 应用过滤（如果提供了有效模式）
    let filteredIndices = [...response];
    
    if (pattern) {
      try {
        const regex = new RegExp(pattern, 'i');
        filteredIndices = response.filter(index => 
          regex.test(index.index || '')
        );
      } catch (e) {
        console.warn(`无效的正则表达式模式: ${pattern}`);
        // 仍使用未过滤的结果
      }
    }

    const indicesInfo = filteredIndices.map((index) => ({
      index: index.index,
      health: index.health,
      status: index.status,
      docsCount: index.docsCount,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${indicesInfo.length} indices${pattern ? ` (matching "${pattern}")` : ''}`,
        },
        {
          type: "text" as const,
          text: JSON.stringify(indicesInfo, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(
      `Failed to get index list: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
} 