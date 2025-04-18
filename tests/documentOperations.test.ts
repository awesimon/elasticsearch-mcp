import { createClient, cleanupTestIndex } from './helpers/setup.js';
import { 
  bulkImport, 
  indexDocument, 
  updateDocument, 
  deleteDocument 
} from '../src/tools/documentOperations.js';
// 引入Jest类型
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

describe('文档操作工具测试', () => {
  const client = createClient();
  const testIndex = 'test-document-operations';
  
  // 在所有测试开始前创建测试索引
  beforeAll(async () => {
    await cleanupTestIndex(client, testIndex);
    
    // 创建测试索引
    await client.indices.create({
      index: testIndex,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text' },
          content: { type: 'text' },
          tags: { type: 'keyword' },
          counter: { type: 'integer' }
        }
      }
    });
  });
  
  // 测试批量导入文档
  test('应该可以批量导入文档', async () => {
    const documents = [
      { id: 'doc1', title: 'Document 1', content: 'This is the first document', tags: ['test', 'first'] },
      { id: 'doc2', title: 'Document 2', content: 'This is the second document', tags: ['test', 'second'] },
      { id: 'doc3', title: 'Document 3', content: 'This is the third document', tags: ['test', 'third'] }
    ];
    
    const result = await bulkImport(client, testIndex, documents, 'id');
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Bulk import completed');
    expect(result.content[0].text).toContain('Successfully imported: 3');
    
    // 验证文档是否真的已导入
    await client.indices.refresh({ index: testIndex });
    const searchResult = await client.search({
      index: testIndex,
      query: { match_all: {} }
    });
    
    // 处理ES 7.x和8.x的API差异
    const totalHits = typeof searchResult.hits.total === 'number' 
      ? searchResult.hits.total 
      : searchResult.hits.total?.value;
    expect(totalHits).toBe(3);
  });
  
  // 测试索引单个文档
  test('应该可以索引单个文档', async () => {
    const document = {
      id: 'doc4',
      title: 'Document 4',
      content: 'This is the fourth document',
      tags: ['test', 'fourth']
    };
    
    const result = await indexDocument(client, testIndex, document, 'doc4');
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Document indexed successfully');
    expect(result.content[0].text).toContain('ID: doc4');
    
    // 验证文档是否已添加
    await client.indices.refresh({ index: testIndex });
    const getResult = await client.get({
      index: testIndex,
      id: 'doc4'
    });
    
    expect(getResult.found).toBe(true);
    expect(getResult._source).toEqual(document);
  });
  
  // 测试更新文档
  test('应该可以更新文档', async () => {
    const docUpdate = {
      content: 'This is the updated content for document 4',
      counter: 42
    };
    
    const result = await updateDocument(client, testIndex, 'doc4', docUpdate);
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Document updated');
    
    // 验证文档是否已更新
    await client.indices.refresh({ index: testIndex });
    const getResult = await client.get({
      index: testIndex,
      id: 'doc4'
    });
    
    // 使用类型断言解决unknown类型问题
    const source = getResult._source as Record<string, any>;
    expect(source.content).toBe('This is the updated content for document 4');
    expect(source.counter).toBe(42);
    expect(source.title).toBe('Document 4'); // 原字段应该保留
  });
  
  // 测试删除文档
  test('应该可以删除文档', async () => {
    const result = await deleteDocument(client, testIndex, 'doc1');
    
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Document deleted');
    
    // 验证文档是否已删除
    await client.indices.refresh({ index: testIndex });
    
    try {
      await client.get({
        index: testIndex,
        id: 'doc1'
      });
      fail('Should have thrown document not found error');
    } catch (error) {
      expect((error as {statusCode?: number}).statusCode).toBe(404);
    }
    
    // 确认其他文档仍然存在
    const searchResult = await client.search({
      index: testIndex,
      query: { match_all: {} }
    });
    
    // 处理ES 7.x和8.x的API差异
    const totalHits = typeof searchResult.hits.total === 'number' 
      ? searchResult.hits.total 
      : searchResult.hits.total?.value;
    expect(totalHits).toBe(3); // 从4篇减少到3篇
  });
  
  // 在所有测试结束后清理
  afterAll(async () => {
    await cleanupTestIndex(client, testIndex);
    await client.close();
  });
}); 