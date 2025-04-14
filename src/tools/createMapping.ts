import { Client } from "@elastic/elasticsearch";

export async function createMapping(
  esClient: Client,
  index: string,
  mappings: Record<string, any>
) {
  try {
    // check if index exists
    const indexExists = await esClient.indices.exists({ index });
    
    let response;
    const content: { type: "text"; text: string }[] = [];
    
    if (!indexExists) {
      // if index does not exist, create it and apply mapping
      response = await esClient.indices.create({
        index,
        mappings
      });
      
      content.push({
        type: "text" as const,
        text: `Index "${index}" does not exist. Created new index and applied mapping.`
      });
    } else {
      // if index exists, update mapping
      response = await esClient.indices.putMapping({
        index,
        ...mappings
      });
      
      content.push({
        type: "text" as const,
        text: `Updated mapping for index "${index}".`
      });
    }

    // get current mapping structure
    const updatedMappings = await esClient.indices.getMapping({ index });
    
    content.push({
      type: "text" as const,
      text: `\nCurrent mapping structure:\n${JSON.stringify(updatedMappings[index].mappings, null, 2)}`
    });

    return {
      content
    };
  } catch (error) {
    console.error(`Failed to set mapping: ${error instanceof Error ? error.message : String(error)}`);
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