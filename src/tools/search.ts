import { Client, estypes } from "@elastic/elasticsearch";

export async function search(
  esClient: Client,
  index: string,
  queryBody: Record<string, any>
) {
  try {
    // 获取映射以识别文本字段
    const mappingResponse = await esClient.indices.getMapping({
      index,
    });

    const indexMappings = mappingResponse[index]?.mappings || {};

    const searchRequest: estypes.SearchRequest = {
      index,
      ...queryBody,
    };

    // 始终启用高亮显示
    if (indexMappings.properties) {
      const textFields: Record<string, estypes.SearchHighlightField> = {};

      for (const [fieldName, fieldData] of Object.entries(
        indexMappings.properties
      )) {
        if (fieldData.type === "text" || "dense_vector" in fieldData) {
          textFields[fieldName] = {};
        }
      }

      searchRequest.highlight = {
        fields: textFields,
        pre_tags: ["<em>"],
        post_tags: ["</em>"],
      };
    }

    const result = await esClient.search(searchRequest);

    // 提取查询起始位置
    const from = queryBody.from || 0;

    const contentFragments = result.hits.hits.map((hit) => {
      const highlightedFields = hit.highlight || {};
      const sourceData = hit._source || {};

      let content = "";

      for (const [field, highlights] of Object.entries(highlightedFields)) {
        if (highlights && highlights.length > 0) {
          content += `${field} (Highlight): ${highlights.join(" ... ")}\n`;
        }
      }

      for (const [field, value] of Object.entries(sourceData)) {
        if (!(field in highlightedFields)) {
          content += `${field}: ${JSON.stringify(value)}\n`;
        }
      }

      return {
        type: "text" as const,
        text: content.trim(),
      };
    });

    const metadataFragment = {
      type: "text" as const,
      text: `Total search results: ${
        typeof result.hits.total === "number"
          ? result.hits.total
          : result.hits.total?.value || 0
      }, Displaying ${result.hits.hits.length} records starting from position ${from}`,
    };

    return {
      content: [metadataFragment, ...contentFragments],
    };
  } catch (error) {
    console.error(
      `Search failed: ${error instanceof Error ? error.message : String(error)}`
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