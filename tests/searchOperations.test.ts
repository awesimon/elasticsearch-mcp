import { createClient, cleanupTestIndex } from './helpers/setup.js';
import { search, msearch, countDocuments } from '../src/tools/searchOperations.js';
// 引入Jest类型
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

describe('搜索操作工具测试', () => {
  const client = createClient();
  const testIndex = 'test-search-operations';
  
  // 在所有测试开始前准备测试数据
  beforeAll(async () => {
    await cleanupTestIndex(client, testIndex);
    
    // 创建测试索引
    await client.indices.create({
      index: testIndex,
      mappings: {
        properties: {
          title: { type: 'text' },
          content: { type: 'text' },
          tags: { type: 'keyword' },
          date: { type: 'date' },
          views: { type: 'integer' }
        }
      }
    });
    
    // 添加测试数据
    const documents = [
      {
        title: 'Elasticsearch Guide',
        content: 'A comprehensive guide to using Elasticsearch for search and analytics.',
        tags: ['search', 'guide', 'elasticsearch'],
        date: '2023-01-01',
        views: 100
      },
      {
        title: 'Advanced Search Techniques', 
        content: 'Learn about advanced search techniques including fuzzy matching and highlighting.',
        tags: ['search', 'advanced', 'techniques'],
        date: '2023-01-15',
        views: 75
      },
      {
        title: 'Data Analytics with Elasticsearch',
        content: 'How to use Elasticsearch for data analytics and visualization.',
        tags: ['analytics', 'elasticsearch', 'data'],
        date: '2023-02-01',
        views: 120
      },
      {
        title: 'Beginners Tutorial',
        content: 'Get started with Elasticsearch - a beginners tutorial.',
        tags: ['beginner', 'tutorial'],
        date: '2023-02-15',
        views: 200
      }
    ];
    
    const operations = documents.flatMap(doc => [
      { index: { _index: testIndex } },
      doc
    ]);
    
    await client.bulk({
      refresh: true,
      operations
    });
  });
  
  // 测试基本搜索功能
  test('应该可以执行基本搜索', async () => {
    const queryBody = {
      query: {
        match: {
          content: 'elasticsearch'
        }
      }
    };
    
    const result = await search(client, testIndex, queryBody);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(1); // 元数据 + 至少一个结果
    
    // 检查返回的匹配结果包含"elasticsearch"
    const metadataText = result.content[0].text;
    expect(metadataText).toContain('Total search results');
    
    // 至少应该有匹配的结果
    expect(metadataText).not.toContain('Total search results: 0');
  });
  
  // 测试复杂搜索和高亮
  test('应该可以执行复杂搜索并返回高亮', async () => {
    const queryBody = {
      query: {
        bool: {
          must: [
            { match: { content: 'search' } }
          ],
          filter: [
            { range: { views: { gte: 50 } } }
          ]
        }
      },
      sort: [
        { views: { order: 'desc' } }
      ]
    };
    
    const result = await search(client, testIndex, queryBody);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(1);
    
    // 检查高亮是否存在
    let hasHighlights = false;
    for (let i = 1; i < result.content.length; i++) {
      if (result.content[i].text.includes('(Highlight)')) {
        hasHighlights = true;
        break;
      }
    }
    
    expect(hasHighlights).toBe(true);
  });
  
  // 测试多重搜索功能
  test('应该可以执行多重搜索', async () => {
    const searches = [
      {
        index: testIndex,
        queryBody: {
          query: { match: { tags: 'elasticsearch' } }
        }
      },
      {
        index: testIndex,
        queryBody: {
          query: { match: { tags: 'tutorial' } }
        }
      }
    ];
    
    const result = await msearch(client, searches);
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Multi-search completed');
    
    // 检查包含两个搜索结果集
    expect(result.content.some(item => item.text.includes('Search 1'))).toBe(true);
    expect(result.content.some(item => item.text.includes('Search 2'))).toBe(true);
  });
  
  // 测试文档计数功能
  test('应该可以计算文档数量', async () => {
    // 计算所有文档
    const allResult = await countDocuments(client, testIndex);
    expect(allResult).toHaveProperty('content');
    expect(allResult.content[0].text).toContain('Document count: 4');
    
    // 计算满足特定查询的文档
    const queryResult = await countDocuments(client, testIndex, {
      term: { tags: 'elasticsearch' }
    });
    
    expect(queryResult).toHaveProperty('content');
    expect(queryResult.content[0].text).toContain('Document count: 2');
  });
  
  // 在所有测试结束后清理
  afterAll(async () => {
    await cleanupTestIndex(client, testIndex);
    await client.close();
  });
}); 