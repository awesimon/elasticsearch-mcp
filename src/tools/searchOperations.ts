import { Client, estypes } from "@elastic/elasticsearch";

/**
 * Perform search operations on Elasticsearch
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param queryBody Query body with search parameters
 * @returns Search results
 */
export async function search(
  esClient: Client,
  index: string,
  queryBody: Record<string, any>
) {
  try {
    const mappingResponse = await esClient.indices.getMapping({
      index,
    });

    const indexMappings = mappingResponse[index]?.mappings || {};

    const searchRequest: estypes.SearchRequest = {
      index,
      ...queryBody,
    };

    // Enable highlighting for text fields
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

/**
 * Perform multi-search operations on Elasticsearch
 * @param esClient Elasticsearch client instance
 * @param searches Array of search requests
 * @returns Combined search results
 */
export async function msearch(
  esClient: Client,
  searches: Array<{
    index: string;
    queryBody: Record<string, any>;
  }>
) {
  try {
    if (!searches || searches.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: No search requests provided"
          }
        ]
      };
    }

    // Prepare msearch request body
    const operations: Record<string, any>[] = [];
    
    for (const search of searches) {
      // Header
      operations.push({ index: search.index });
      // Body
      operations.push(search.queryBody);
    }

    // Execute msearch operation
    const response = await esClient.msearch({
      searches: operations
    });

    // Process results
    const content: { type: "text"; text: string }[] = [
      {
        type: "text" as const,
        text: `Multi-search completed with ${response.responses.length} results`
      }
    ];

    // Add each search result
    response.responses.forEach((result, index) => {
      const searchInfo = searches[index];
      
      // Check if result is an error response
      if ('error' in result) {
        content.push({
          type: "text" as const,
          text: `\nSearch ${index + 1} (Index: ${searchInfo.index}):\nError: ${JSON.stringify(result.error)}`
        });
        return;
      }
      
      // Handle successful search result
      const searchResult = result as estypes.SearchResponse<unknown>;
      const totalHits = typeof searchResult.hits.total === "number"
        ? searchResult.hits.total
        : searchResult.hits.total?.value || 0;
      
      content.push({
        type: "text" as const,
        text: `\nSearch ${index + 1} (Index: ${searchInfo.index}):\nTotal hits: ${totalHits}\nResults: ${searchResult.hits.hits.length}`
      });

      // Add hit details
      if (searchResult.hits.hits.length > 0) {
        searchResult.hits.hits.forEach(hit => {
          content.push({
            type: "text" as const,
            text: `  ID: ${hit._id}, Score: ${hit._score}\n  Source: ${JSON.stringify(hit._source, null, 2)}`
          });
        });
      }
    });

    return {
      content
    };
  } catch (error) {
    console.error(`Multi-search failed: ${error instanceof Error ? error.message : String(error)}`);
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
 * Count documents that match a query
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param query Query to match documents
 * @returns Count information
 */
export async function countDocuments(
  esClient: Client,
  index: string,
  query?: Record<string, any>
) {
  try {
    const countParams: {
      index: string;
      query?: Record<string, any>;
    } = {
      index
    };

    if (query) {
      countParams.query = query;
    }

    const response = await esClient.count(countParams);

    return {
      content: [
        {
          type: "text" as const,
          text: `Document count: ${response.count}`
        }
      ]
    };
  } catch (error) {
    console.error(`Count operation failed: ${error instanceof Error ? error.message : String(error)}`);
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