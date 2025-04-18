import { Client } from "@elastic/elasticsearch";

// 检测Elasticsearch版本
async function detectESVersion(esClient: Client): Promise<number> {
  try {
    const info = await esClient.info();
    const versionStr = info.version?.number || '';
    return parseInt(versionStr.split('.')[0], 10) || 8; // 默认假设为8
  } catch (error) {
    console.warn('无法检测ES版本，默认使用8.x兼容模式:', error);
    return 8; // 检测失败时默认为8
  }
}

// Create Index function
export async function createIndex(
  esClient: Client,
  index: string,
  settings?: Record<string, any>,
  mappings?: Record<string, any>
) {
  try {
    const majorVersion = await detectESVersion(esClient);
    const body: Record<string, any> = {};
    
    if (settings) {
      body.settings = settings;
    }
    
    if (mappings) {
      body.mappings = mappings;
    }

    let response;
    if (majorVersion >= 8) {
      response = await esClient.indices.create({
        index,
        ...body
      });
    } else {
      // ES 7.x 的API调用格式
      response = await esClient.indices.create({
        index,
        body
      });
    }

    const content: { type: "text"; text: string }[] = [];
    
    if (response.acknowledged) {
      content.push({
        type: "text" as const,
        text: `Index "${index}" created successfully!\nShards acknowledged: ${response.shards_acknowledged ? 'Confirmed' : 'Pending confirmation'}`
      });
    } else {
      content.push({
        type: "text" as const,
        text: `Index "${index}" creation request sent, but not acknowledged. Please check cluster status.`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to create index: ${error instanceof Error ? error.message : String(error)}`);
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

// Get Mappings function
export async function getMappings(
  esClient: Client,
  index: string
) {
  try {
    const response = await esClient.indices.getMapping({
      index
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Mappings for index "${index}":`,
        },
        {
          type: "text" as const,
          text: JSON.stringify(response[index]?.mappings || {}, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`Failed to get mappings: ${error instanceof Error ? error.message : String(error)}`);
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

// List Indices function
export async function listIndices(
  esClient: Client, 
  pattern?: string
) {
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
      `Failed to list indices: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        },
      ],
    };
  }
}

// Create Index Template function
export async function createIndexTemplate(
  esClient: Client,
  name: string,
  indexPatterns: string[],
  template: Record<string, any>
) {
  try {
    const majorVersion = await detectESVersion(esClient);
    let response;
    
    if (majorVersion >= 8) {
      // Elasticsearch 8.x的API结构已改变，template不再是直接传递的参数
      // 而是需要拆分为mappings、settings等
      const templateParams: any = {
        name,
        index_patterns: indexPatterns
      };

      // 如果template中包含mappings、settings等，直接展开
      if (template.mappings || template.settings || template.aliases) {
        Object.assign(templateParams, template);
      } else {
        // 否则假设整个template对象就是一个完整配置
        templateParams.template = template;
      }

      response = await esClient.indices.putIndexTemplate(templateParams);
    } else {
      // Elasticsearch 7.x使用遗留的模板API
      response = await esClient.indices.putTemplate({
        name,
        body: {
          index_patterns: indexPatterns,
          ...template
        }
      });
    }

    const content: { type: "text"; text: string }[] = [];
    
    if (response.acknowledged) {
      content.push({
        type: "text" as const,
        text: `Index template "${name}" created successfully!`
      });
    } else {
      content.push({
        type: "text" as const,
        text: `Index template "${name}" creation request sent, but not acknowledged. Please check settings.`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to create index template: ${error instanceof Error ? error.message : String(error)}`);
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

// Reindex function
export async function reindex(
  esClient: Client,
  sourceIndex: string,
  targetIndex: string,
  script?: Record<string, any>
) {
  try {
    const majorVersion = await detectESVersion(esClient);
    const reindexParams: any = majorVersion >= 8 ? 
      {
        refresh: true,
        body: {
          source: {
            index: sourceIndex
          },
          dest: {
            index: targetIndex
          }
        }
      } : 
      {
        body: {
          source: {
            index: sourceIndex
          },
          dest: {
            index: targetIndex
          }
        },
        refresh: true
      };

    if (script) {
      reindexParams.body.script = script;
    }

    const response = await esClient.reindex(reindexParams);
    
    // 处理可能不同的响应格式
    const total = response.total || 0;
    const created = response.created || 0;
    const updated = response.updated || 0;
    const failed = (response.failures?.length || 0);
    const took = response.took || 0;

    return {
      content: [
        {
          type: "text" as const,
          text: `Reindex operation completed from "${sourceIndex}" to "${targetIndex}".\nTotal: ${total}\nCreated: ${created}\nUpdated: ${updated}\nFailed: ${failed}\nProcessing time: ${took}ms`
        }
      ]
    };
  } catch (error) {
    console.error(`Reindex operation failed: ${error instanceof Error ? error.message : String(error)}`);
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

// Create Mapping function
export async function createMapping(
  esClient: Client,
  index: string,
  mappings: Record<string, any>
) {
  try {
    const majorVersion = await detectESVersion(esClient);
    let response;
    
    if (majorVersion >= 8) {
      response = await esClient.indices.putMapping({
        index,
        ...(mappings.properties ? mappings : { properties: mappings })
      });
    } else {
      // Elasticsearch 7.x需要不同的参数格式
      response = await esClient.indices.putMapping({
        index,
        body: mappings.properties ? mappings : { properties: mappings }
      });
    }

    const content: { type: "text"; text: string }[] = [];
    
    if (response.acknowledged) {
      content.push({
        type: "text" as const,
        text: `Mapping for index "${index}" updated successfully!`
      });
    } else {
      content.push({
        type: "text" as const,
        text: `Mapping update request sent, but not acknowledged. Please check settings.`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to update mapping: ${error instanceof Error ? error.message : String(error)}`);
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