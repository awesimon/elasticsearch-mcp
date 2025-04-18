import { Client } from "@elastic/elasticsearch";

/**
 * Bulk import documents into Elasticsearch
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param documents Array of documents to import
 * @param idField Optional field to use as document ID
 * @returns Operation result information
 */
export async function bulkImport(
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

    // Prepare bulk operations data
    const operations: Record<string, any>[] = [];
    
    for (const doc of documents) {
      const action: Record<string, any> = {
        index: { _index: index }
      };
      
      // If ID field is specified and exists in the document, use it as document ID
      if (idField && doc[idField]) {
        action.index._id = doc[idField];
      }
      
      operations.push(action);
      operations.push(doc);
    }

    // Execute bulk operation
    const response = await esClient.bulk({
      refresh: true,  // Immediately refresh index to make data searchable
      operations
    });

    // Process results
    const content: { type: "text"; text: string }[] = [];
    
    // Count successful and failed operations
    const successCount = response.items.filter(item => !item.index?.error).length;
    const failureCount = response.items.filter(item => item.index?.error).length;
    
    content.push({
      type: "text" as const,
      text: `Bulk import completed:\nTotal documents: ${documents.length}\nSuccessfully imported: ${successCount}\nFailed: ${failureCount}\nProcessing time: ${response.took}ms`
    });

    // If there are failed operations, add detailed information
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

/**
 * Index a single document
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param document Document to index
 * @param id Optional document ID
 * @returns Operation result information
 */
export async function indexDocument(
  esClient: Client,
  index: string,
  document: Record<string, any>,
  id?: string
) {
  try {
    const params: {
      index: string;
      document: Record<string, any>;
      id?: string;
      refresh?: boolean;
    } = {
      index,
      document,
      refresh: true
    };

    if (id) {
      params.id = id;
    }

    const response = await esClient.index(params);

    return {
      content: [
        {
          type: "text" as const,
          text: `Document indexed successfully:\nIndex: ${response._index}\nID: ${response._id}\nVersion: ${response._version}\nResult: ${response.result}`
        }
      ]
    };
  } catch (error) {
    console.error(`Document indexing failed: ${error instanceof Error ? error.message : String(error)}`);
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
 * Delete a document by ID
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param id Document ID to delete
 * @returns Operation result information
 */
export async function deleteDocument(
  esClient: Client,
  index: string,
  id: string
) {
  try {
    const response = await esClient.delete({
      index,
      id,
      refresh: true
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Document deleted:\nIndex: ${response._index}\nID: ${response._id}\nResult: ${response.result}`
        }
      ]
    };
  } catch (error) {
    console.error(`Document deletion failed: ${error instanceof Error ? error.message : String(error)}`);
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
 * Update a document partially
 * @param esClient Elasticsearch client instance
 * @param index Target index name
 * @param id Document ID to update
 * @param doc Document partial update
 * @returns Operation result information
 */
export async function updateDocument(
  esClient: Client,
  index: string,
  id: string,
  doc: Record<string, any>
) {
  try {
    const response = await esClient.update({
      index,
      id,
      doc,
      refresh: true
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Document updated:\nIndex: ${response._index}\nID: ${response._id}\nVersion: ${response._version}\nResult: ${response.result}`
        }
      ]
    };
  } catch (error) {
    console.error(`Document update failed: ${error instanceof Error ? error.message : String(error)}`);
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