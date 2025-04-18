import { Client } from '@elastic/elasticsearch';

// 创建连接到本地Elasticsearch节点的客户端
export function createClient(): Client {
  return new Client({
    node: 'http://10.41.0.150:9200'
  });
}

// 创建测试索引
export async function createTestIndex(client: Client, indexName: string): Promise<void> {
  // 检查索引是否存在
  const exists = await client.indices.exists({ index: indexName });
  
  // 如果存在则删除
  if (exists) {
    await client.indices.delete({ index: indexName });
  }
  
  // 创建测试索引
  await client.indices.create({
    index: indexName,
    mappings: {
      properties: {
        title: { type: 'text' },
        content: { type: 'text' },
        tags: { type: 'keyword' },
        created: { type: 'date' },
        priority: { type: 'integer' }
      }
    },
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0
    }
  });
}

// 准备测试数据
export async function prepareTestData(client: Client, indexName: string): Promise<void> {
  // 添加一些测试文档
  const operations = [
    { title: 'Test Document 1', content: 'This is a test document with some content.', tags: ['test', 'document'], created: '2023-01-01', priority: 1 },
    { title: 'Another Test', content: 'Another test document for testing purposes with different content.', tags: ['test', 'another'], created: '2023-01-02', priority: 2 },
    { title: 'Important Document', content: 'This document is marked as important and should be prioritized.', tags: ['important', 'priority'], created: '2023-01-03', priority: 5 }
  ].flatMap(doc => [
    { index: { _index: indexName } },
    doc
  ]);

  await client.bulk({
    refresh: true,
    operations
  });
}

// 清理测试索引
export async function cleanupTestIndex(client: Client, indexName: string): Promise<void> {
  const exists = await client.indices.exists({ index: indexName });
  if (exists) {
    await client.indices.delete({ index: indexName });
  }
}

// 检查Elasticsearch连接
export async function checkConnection(client: Client): Promise<boolean> {
  try {
    const response = await client.ping();
    return response;
  } catch (error) {
    console.error('Elasticsearch connection failed:', error);
    return false;
  }
} 