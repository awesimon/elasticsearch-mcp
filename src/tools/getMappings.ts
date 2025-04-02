import { Client } from "@elastic/elasticsearch";

export async function getMappings(esClient: Client, index: string) {
  try {
    const mappingResponse = await esClient.indices.getMapping({
      index,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Index mapping: ${index}`,
        },
        {
          type: "text" as const,
          text: `Index ${index} mapping: ${JSON.stringify(
            mappingResponse[index]?.mappings || {},
            null,
            2
          )}`,
        },
      ],
    };
  } catch (error) {
    console.error(
      `Failed to get mapping: ${
        error instanceof Error ? error.message : String(error)
      }`
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