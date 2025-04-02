import { Client } from "@elastic/elasticsearch";

export async function createMapping(
  esClient: Client,
  index: string,
  mappings: Record<string, any>
) {
  try {
    // 检查索引是否存在
    const indexExists = await esClient.indices.exists({ index });
    
    let response;
    const content: { type: "text"; text: string }[] = [];
    
    if (!indexExists) {
      // 如果索引不存在，创建新索引并设置映射
      response = await esClient.indices.create({
        index,
        mappings
      });
      
      content.push({
        type: "text" as const,
        text: `索引 "${index}" 不存在，已创建新索引并应用映射。`
      });
    } else {
      // 如果索引存在，更新映射
      response = await esClient.indices.putMapping({
        index,
        ...mappings
      });
      
      content.push({
        type: "text" as const,
        text: `已更新索引 "${index}" 的映射。`
      });
    }

    // 获取更新后的映射
    const updatedMappings = await esClient.indices.getMapping({ index });
    
    content.push({
      type: "text" as const,
      text: `\n当前映射结构:\n${JSON.stringify(updatedMappings[index].mappings, null, 2)}`
    });

    return {
      content
    };
  } catch (error) {
    console.error(`设置映射失败: ${error instanceof Error ? error.message : String(error)}`);
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