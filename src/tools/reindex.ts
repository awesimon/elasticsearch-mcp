import { Client, estypes } from "@elastic/elasticsearch";

export async function reindex(
  esClient: Client,
  sourceIndex: string,
  destIndex: string,
  script?: Record<string, any>,
  query?: Record<string, any>
) {
  try {
    const reindexRequest: estypes.ReindexRequest = {
      source: {
        index: sourceIndex
      },
      dest: {
        index: destIndex
      },
      wait_for_completion: false // Async operation for large indices
    };

    // Add query if provided
    if (query) {
      reindexRequest.source.query = query;
    }

    // Add script if provided
    if (script) {
      reindexRequest.script = script;
    }

    const response = await esClient.reindex(reindexRequest);

    const taskId = response.task;
    
    return {
      content: [
        {
          type: "text" as const,
          text: `Reindex operation started. Task ID: ${taskId}`
        },
        {
          type: "text" as const,
          text: `Source index: ${sourceIndex} -> Destination index: ${destIndex}`
        },
        {
          type: "text" as const,
          text: `Use Task API to monitor progress: GET _tasks/${taskId}`
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