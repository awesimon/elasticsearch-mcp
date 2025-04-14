import { Client } from "@elastic/elasticsearch";

export async function getClusterHealth(
  esClient: Client,
  includeIndices: boolean = false
) {
  try {
    const response = await esClient.cluster.health({
      level: includeIndices ? "indices" : "cluster"
    });

    const content: { type: "text"; text: string }[] = [];

    // 添加集群状态概述
    content.push({
      type: "text" as const,
      text: `Cluster Name: ${response.cluster_name}\nStatus: ${response.status}\nNodes: ${response.number_of_nodes}\nData Nodes: ${response.number_of_data_nodes}\nActive Shards: ${response.active_shards}\nActive Primary Shards: ${response.active_primary_shards}\nRelocating Shards: ${response.relocating_shards}\nInitializing Shards: ${response.initializing_shards}\nUnassigned Shards: ${response.unassigned_shards}\nPending Tasks: ${response.number_of_pending_tasks}\n`
    });

    // 如果请求了索引级别的健康状态
    if (includeIndices && response.indices) {
      const indicesHealth: string[] = [];
      
      for (const [indexName, indexHealth] of Object.entries(response.indices)) {
        indicesHealth.push(`Index: ${indexName}\n  Status: ${indexHealth.status}\n  Primary Shards: ${indexHealth.number_of_shards}\n  Replicas: ${indexHealth.number_of_replicas}\n  Active Shards: ${indexHealth.active_shards}\n  Active Primary Shards: ${indexHealth.active_primary_shards}\n  Unassigned Shards: ${indexHealth.unassigned_shards}`);
      }

      if (indicesHealth.length > 0) {
        content.push({
          type: "text" as const,
          text: `\nIndices Health Status:\n${indicesHealth.join('\n\n')}`
        });
      }
    }

    return {
      content
    };
  } catch (error) {
    console.error(`获取集群健康状态失败: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `错误: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}