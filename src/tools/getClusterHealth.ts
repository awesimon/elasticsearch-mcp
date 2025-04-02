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
      text: `集群名称: ${response.cluster_name}\n状态: ${response.status}\n节点数: ${response.number_of_nodes}\n数据节点数: ${response.number_of_data_nodes}\n活跃分片数: ${response.active_shards}\n活跃主分片数: ${response.active_primary_shards}\n重定位分片数: ${response.relocating_shards}\n初始化分片数: ${response.initializing_shards}\n未分配分片数: ${response.unassigned_shards}\n待处理任务数: ${response.number_of_pending_tasks}\n`
    });

    // 如果请求了索引级别的健康状态
    if (includeIndices && response.indices) {
      const indicesHealth: string[] = [];
      
      for (const [indexName, indexHealth] of Object.entries(response.indices)) {
        indicesHealth.push(`索引: ${indexName}\n  状态: ${indexHealth.status}\n  主分片数: ${indexHealth.number_of_shards}\n  副本数: ${indexHealth.number_of_replicas}\n  活跃分片数: ${indexHealth.active_shards}\n  活跃主分片数: ${indexHealth.active_primary_shards}\n  未分配分片数: ${indexHealth.unassigned_shards}`);
      }

      if (indicesHealth.length > 0) {
        content.push({
          type: "text" as const,
          text: `\n索引健康状态:\n${indicesHealth.join('\n\n')}`
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