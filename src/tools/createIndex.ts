import { Client } from "@elastic/elasticsearch";

export async function createIndex(
  esClient: Client,
  index: string,
  settings?: Record<string, any>,
  mappings?: Record<string, any>
) {
  try {
    const body: Record<string, any> = {};
    
    if (settings) {
      body.settings = settings;
    }
    
    if (mappings) {
      body.mappings = mappings;
    }

    const response = await esClient.indices.create({
      index,
      ...body
    });

    const content: { type: "text"; text: string }[] = [];
    
    if (response.acknowledged) {
      content.push({
        type: "text" as const,
        text: `索引 "${index}" 创建成功！\n分片数: ${response.shards_acknowledged ? '已确认' : '等待确认'}`
      });
    } else {
      content.push({
        type: "text" as const,
        text: `索引 "${index}" 创建请求已发送，但未得到确认。请检查集群状态。`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`创建索引失败: ${error instanceof Error ? error.message : String(error)}`);
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