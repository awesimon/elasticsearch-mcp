import { Client } from "@elastic/elasticsearch";

/**
 * Get Elasticsearch cluster health status
 * @param esClient Elasticsearch client instance
 * @param includeIndices Whether to include indices-level health information
 * @returns Cluster health information
 */
export async function getClusterHealth(
  esClient: Client,
  includeIndices: boolean = false
) {
  try {
    const response = await esClient.cluster.health({
      level: includeIndices ? "indices" : "cluster"
    });

    const content: { type: "text"; text: string }[] = [];

    // Add cluster status overview
    content.push({
      type: "text" as const,
      text: `Cluster Name: ${response.cluster_name}\nStatus: ${response.status}\nNodes: ${response.number_of_nodes}\nData Nodes: ${response.number_of_data_nodes}\nActive Shards: ${response.active_shards}\nActive Primary Shards: ${response.active_primary_shards}\nRelocating Shards: ${response.relocating_shards}\nInitializing Shards: ${response.initializing_shards}\nUnassigned Shards: ${response.unassigned_shards}\nPending Tasks: ${response.number_of_pending_tasks}\n`
    });

    // If indices-level health information was requested
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
    console.error(`Failed to get cluster health: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

/**
 * Get Elasticsearch cluster stats
 * @param esClient Elasticsearch client instance
 * @returns Cluster statistics information
 */
export async function getClusterStats(
  esClient: Client
) {
  try {
    const response = await esClient.cluster.stats();

    const content: { type: "text"; text: string }[] = [];

    // Add cluster overview
    content.push({
      type: "text" as const,
      text: `Cluster: ${response.cluster_name}\nStatus: ${response.status}\nTimestamp: ${response.timestamp}\nUUID: ${response.cluster_uuid}`
    });

    // Add node statistics
    const nodeStats = response.nodes;
    content.push({
      type: "text" as const,
      text: `\nNodes:\nTotal: ${nodeStats.count.total}`
    });

    // Add index statistics
    const indexStats = response.indices;
    content.push({
      type: "text" as const,
      text: `\nIndices:\nCount: ${indexStats.count}\nShards: ${indexStats.shards.total}\nDocuments: ${indexStats.docs.count}\nSize: ${indexStats.store.size}`
    });

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to get cluster stats: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

/**
 * Get Elasticsearch nodes info
 * @param esClient Elasticsearch client instance
 * @returns Nodes information
 */
export async function getNodesInfo(
  esClient: Client
) {
  try {
    const response = await esClient.nodes.info();

    const content: { type: "text"; text: string }[] = [];
    
    content.push({
      type: "text" as const,
      text: `Cluster Name: ${response.cluster_name}\nTotal Nodes: ${Object.keys(response.nodes).length}`
    });

    // Process each node
    const nodesInfo: string[] = [];
    
    for (const [nodeId, nodeInfo] of Object.entries(response.nodes)) {
      let nodeDetails = `Node ID: ${nodeId}\nName: ${nodeInfo.name}\nTransport Address: ${nodeInfo.transport_address}\nVersion: ${nodeInfo.version}`;
      
      if (nodeInfo.roles) {
        nodeDetails += `\nRoles: ${nodeInfo.roles.join(', ')}`;
      }
      
      if (nodeInfo.os) {
        nodeDetails += `\nOS: ${nodeInfo.os.name || 'Unknown'} ${nodeInfo.os.version || ''}`;
      }
      
      if (nodeInfo.jvm) {
        nodeDetails += `\nJVM: ${nodeInfo.jvm.vm_name || 'Unknown'} (${nodeInfo.jvm.version || 'Unknown'})`;
      }
      
      nodesInfo.push(nodeDetails);
    }

    if (nodesInfo.length > 0) {
      content.push({
        type: "text" as const,
        text: `\nNodes Information:\n${nodesInfo.join('\n\n')}`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to get nodes info: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
} 