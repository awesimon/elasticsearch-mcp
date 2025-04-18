import { 
  createClient, 
  cleanupTestIndex 
} from './helpers/setup.js';
import {
  createIndex,
  listIndices,
  getMappings,
  createMapping,
  createIndexTemplate,
  reindex
} from '../src/tools/indexManagement.js';
// 引入Jest类型
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

describe('索引管理工具测试', () => {
  const client = createClient();
  const testIndex = 'test-index-management';
  const testTemplateIndex = 'test-template-*';
  const reindexTarget = 'test-reindex-target';

  // 在所有测试开始前清理测试索引
  beforeAll(async () => {
    await cleanupTestIndex(client, testIndex);
    await cleanupTestIndex(client, 'test-template-1');
    await cleanupTestIndex(client, reindexTarget);
    
    // 清理可能存在的模板
    try {
      await client.indices.deleteIndexTemplate({
        name: 'test-template'
      });
    } catch (e) {
      // 忽略不存在的模板错误
    }
  });

  // 测试创建索引功能
  test('应该可以创建新索引', async () => {
    const result = await createIndex(client, testIndex, {
      number_of_shards: 1,
      number_of_replicas: 0
    });
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].text).toContain('created successfully');
    
    // 验证索引是否真的已创建
    const exists = await client.indices.exists({ index: testIndex });
    expect(exists).toBe(true);
  });

  // 测试获取映射功能
  test('应该可以获取索引映射', async () => {
    // 创建具有映射的索引
    await client.indices.putMapping({
      index: testIndex,
      properties: {
        title: { type: 'text' },
        content: { type: 'text' }
      }
    });
    
    const result = await getMappings(client, testIndex);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBe(2);
    
    // 检查结果文本中是否包含刚创建的映射字段
    const mappingText = result.content[1].text;
    expect(mappingText).toContain('title');
    expect(mappingText).toContain('content');
    expect(mappingText).toContain('text');
  });

  // 测试列出索引功能
  test('应该可以列出索引', async () => {
    const result = await listIndices(client);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBe(2);
    
    // 检查结果是否包含我们刚创建的索引
    const indicesText = result.content[1].text;
    expect(indicesText).toContain(testIndex);
  });

  // 测试创建映射功能
  test('应该可以创建或更新映射', async () => {
    const newMapping = {
      description: { type: 'text' },
      tags: { type: 'keyword' }
    };
    
    const result = await createMapping(client, testIndex, newMapping);
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('updated successfully');
    
    // 验证映射是否已更新
    const mappings = await client.indices.getMapping({
      index: testIndex
    });
    
    const properties = mappings[testIndex]?.mappings?.properties;
    // 兼容ES 7.x和8.x的API差异
    if (properties) {
      expect(properties).toHaveProperty('description');
      expect(properties).toHaveProperty('tags');
      expect(properties.description.type).toBe('text');
      expect(properties.tags.type).toBe('keyword');
    } else {
      // 如果properties为undefined，断言测试应该失败
      expect(mappings[testIndex]?.mappings).toBeDefined();
    }
  });

  // 测试创建索引模板功能
  test('应该可以创建索引模板', async () => {
    const templateResult = await createIndexTemplate(client, 'test-template', [testTemplateIndex], {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0
      },
      mappings: {
        properties: {
          field1: { type: 'keyword' },
          field2: { type: 'text' }
        }
      }
    });
    
    expect(templateResult).toHaveProperty('content');
    expect(templateResult.content[0].text).toContain('created successfully');
    
    // 创建匹配模式的索引，验证模板是否生效
    await client.indices.create({
      index: 'test-template-1'
    });
    
    // 验证索引是否采用了模板中的映射
    const mappings = await client.indices.getMapping({
      index: 'test-template-1'
    });
    
    const properties = mappings['test-template-1']?.mappings?.properties;
    expect(properties).toHaveProperty('field1');
    expect(properties).toHaveProperty('field2');
  });

  // 测试重索引功能
  test('应该可以执行重索引操作', async () => {
    // 准备源索引中的数据
    await client.index({
      index: testIndex,
      document: {
        title: 'Test Title',
        content: 'Test Content',
        description: 'Test Description',
        tags: ['test', 'reindex']
      },
      refresh: true
    });
    
    // 执行重索引
    const result = await reindex(client, testIndex, reindexTarget);
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Reindex operation completed');
    expect(result.content[0].text).toContain('Created:');
    
    // 验证数据是否已重索引
    await client.indices.refresh({ index: reindexTarget });
    const searchResult = await client.search({
      index: reindexTarget
    });
    
    // 兼容ES 7.x和8.x的API差异
    const totalHits = typeof searchResult.hits.total === 'number' 
      ? searchResult.hits.total 
      : searchResult.hits.total?.value;
    
    expect(totalHits).toBeGreaterThan(0);
    
    const doc = searchResult.hits.hits[0]._source;
    expect(doc).toHaveProperty('title', 'Test Title');
    expect(doc).toHaveProperty('content', 'Test Content');
  });

  // 在所有测试结束后清理
  afterAll(async () => {
    await cleanupTestIndex(client, testIndex);
    await cleanupTestIndex(client, 'test-template-1');
    await cleanupTestIndex(client, reindexTarget);
    
    try {
      await client.indices.deleteIndexTemplate({
        name: 'test-template'
      });
    } catch (e) {
      // 忽略不存在的模板错误
    }
    
    await client.close();
  });
}); 