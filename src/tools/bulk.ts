import { Client } from "@elastic/elasticsearch";

export async function bulk(
  esClient: Client,
  index: string,
  documents: Record<string, any>[],
  idField?: string
) {
  try {
    if (!documents || documents.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: No documents provided for import"
          }
        ]
      };
    }

    // 准备批量操作的数据
    const operations: Record<string, any>[] = [];
    
    for (const doc of documents) {
      const action: Record<string, any> = {
        index: { _index: index }
      };
      
      // 如果指定了ID字段且文档中存在该字段，使用该值作为文档ID
      if (idField && doc[idField]) {
        action.index._id = doc[idField];
      }
      
      operations.push(action);
      operations.push(doc);
    }

    // 执行批量操作
    const response = await esClient.bulk({
      refresh: true,  // 立即刷新索引，使数据可搜索
      operations
    });

    // 处理结果
    const content: { type: "text"; text: string }[] = [];
    
    // 统计成功和失败的操作
    const successCount = response.items.filter(item => !item.index?.error).length;
    const failureCount = response.items.filter(item => item.index?.error).length;
    
    content.push({
      type: "text" as const,
      text: `Bulk import completed:\nTotal documents: ${documents.length}\nSuccessfully imported: ${successCount}\nFailed: ${failureCount}\nProcessing time: ${response.took}ms`
    });

    // 如果有失败的操作，添加详细信息
    if (failureCount > 0) {
      const errors = response.items
        .filter(item => item.index?.error)
        .map(item => {
          const error = item.index?.error;
          const id = item.index?._id || 'unknown';
          return `ID: ${id} - Error type: ${error?.type}, Reason: ${error?.reason}`;
        });
      
      content.push({
        type: "text" as const,
        text: `Failed details:\n${errors.join('\n')}`
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Bulk import failed: ${error instanceof Error ? error.message : String(error)}`);
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