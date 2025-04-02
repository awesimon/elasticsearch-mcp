import { z } from "zod";
import { ClientOptions } from "@elastic/elasticsearch";
import fs from "fs";

// 配置验证模式
export const ConfigSchema = z
  .object({
    url: z
      .string()
      .trim()
      .min(1, "Elasticsearch URL cannot be empty")
      .url("Invalid Elasticsearch URL format")
      .describe("Elasticsearch server URL"),

    apiKey: z
      .string()
      .optional()
      .describe("API key for Elasticsearch authentication"),

    username: z
      .string()
      .optional()
      .describe("Username for Elasticsearch authentication"),

    password: z
      .string()
      .optional()
      .describe("Password for Elasticsearch authentication"),

    caCert: z
      .string()
      .optional()
      .describe("Path to custom CA certificate for Elasticsearch"),
  });

export type ElasticsearchConfig = z.infer<typeof ConfigSchema>;

// 根据配置创建客户端选项
export function createClientOptions(config: ElasticsearchConfig): ClientOptions {
  const validatedConfig = ConfigSchema.parse(config);
  const { url, apiKey, username, password, caCert } = validatedConfig;

  const clientOptions: ClientOptions = {
    node: url,
  };

  // 设置认证
  if (apiKey) {
    clientOptions.auth = { apiKey };
  } else if (username && password) {
    clientOptions.auth = { username, password };
  }

  // 如果提供了证书，设置 SSL/TLS
  if (caCert) {
    try {
      const ca = fs.readFileSync(caCert);
      clientOptions.tls = { ca };
    } catch (error) {
      console.error(
        `Failed to read certificate file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return clientOptions;
}

// 从环境变量创建配置
export function loadConfigFromEnv(): ElasticsearchConfig {
  return {
    url: process.env.HOST || "",
    apiKey: process.env.API_KEY || "",
    username: process.env.USERNAME || "",
    password: process.env.PASSWORD || "",
    caCert: process.env.CA_CERT || "",
  };
} 