import { Client } from "@elastic/elasticsearch";

export async function createIndexTemplate(
  esClient: Client,
  name: string,
  indexPatterns: string[],
  template: Record<string, any>,
  priority?: number,
  version?: number
) {
  try {
    const body: Record<string, any> = {
      index_patterns: indexPatterns,
      template: {
        settings: template.settings || {},
        mappings: template.mappings || {},
        aliases: template.aliases || {}
      }
    };

    // Add optional parameters if provided
    if (priority !== undefined) {
      body.priority = priority;
    }

    if (version !== undefined) {
      body.version = version;
    }

    const response = await esClient.indices.putIndexTemplate({
      name,
      body
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Index template "${name}" created successfully.`
        },
        {
          type: "text" as const,
          text: `Index patterns: ${indexPatterns.join(", ")}`
        },
        {
          type: "text" as const,
          text: response.acknowledged 
            ? "Template was acknowledged by the cluster."
            : "Template was not acknowledged. Check cluster status."
        }
      ]
    };
  } catch (error) {
    console.error(`Create index template failed: ${error instanceof Error ? error.message : String(error)}`);
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

export async function getIndexTemplate(
  esClient: Client,
  name?: string
) {
  try {
    const params: Record<string, any> = {};
    if (name) {
      params.name = name;
    }
    
    const response = await esClient.indices.getIndexTemplate(params);

    const templates = response.index_templates || [];
    const content = templates.map(template => {
      const patterns = template.index_template.index_patterns || [];
      const version = template.index_template.version || "Not specified";
      const priority = template.index_template.priority || "Not specified";
      
      let patternsText = "";
      if (Array.isArray(patterns)) {
        patternsText = patterns.join(", ");
      } else if (typeof patterns === "string") {
        patternsText = patterns;
      }
      
      return {
        type: "text" as const,
        text: `Template: ${template.name}\nIndex patterns: ${patternsText}\nVersion: ${version}\nPriority: ${priority}\n`
      };
    });

    if (content.length === 0) {
      content.push({
        type: "text" as const,
        text: name 
          ? `No template found with name "${name}"`
          : "No index templates found"
      });
    }

    return {
      content
    };
  } catch (error) {
    console.error(`Get index template failed: ${error instanceof Error ? error.message : String(error)}`);
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

export async function deleteIndexTemplate(
  esClient: Client,
  name: string
) {
  try {
    const response = await esClient.indices.deleteIndexTemplate({
      name
    });

    return {
      content: [
        {
          type: "text" as const,
          text: response.acknowledged 
            ? `Index template "${name}" deleted successfully.`
            : `Index template delete request sent, but not acknowledged. Check cluster status.`
        }
      ]
    };
  } catch (error) {
    console.error(`Delete index template failed: ${error instanceof Error ? error.message : String(error)}`);
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