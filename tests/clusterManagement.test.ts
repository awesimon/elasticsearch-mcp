import { createClient } from './helpers/setup.js';
import { 
  getClusterHealth, 
  getClusterStats, 
  getNodesInfo 
} from '../src/tools/clusterManagement.js';
// 引入Jest类型
import { describe, expect, test, afterAll } from '@jest/globals';

describe('集群管理工具测试', () => {
  const client = createClient();
  
  // 测试获取集群健康状态
  test('应该可以获取集群健康状态', async () => {
    // 不包含索引详情
    const basicResult = await getClusterHealth(client, false);
    
    expect(basicResult).toHaveProperty('content');
    expect(basicResult.content.length).toBeGreaterThan(0);
    expect(basicResult.content[0].text).toContain('Cluster Name:');
    expect(basicResult.content[0].text).toContain('Status:');
    expect(basicResult.content[0].text).toContain('Nodes:');
    
    // 包含索引详情
    const detailedResult = await getClusterHealth(client, true);
    
    expect(detailedResult).toHaveProperty('content');
    // 注意：如果集群中没有索引，可能不会有第二个内容块
    if (detailedResult.content.length > 1) {
      expect(detailedResult.content[1].text).toContain('Indices Health Status:');
    }
  });
  
  // 测试获取集群统计信息
  test('应该可以获取集群统计信息', async () => {
    const result = await getClusterStats(client);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(0);
    
    // 检查集群概览信息
    expect(result.content[0].text).toContain('Cluster:');
    expect(result.content[0].text).toContain('Status:');
    
    // 检查节点统计信息
    expect(result.content[1].text).toContain('Nodes:');
    
    // 检查索引统计信息
    expect(result.content[2].text).toContain('Indices:');
  });
  
  // 测试获取节点信息
  test('应该可以获取节点信息', async () => {
    const result = await getNodesInfo(client);
    
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].text).toContain('Cluster Name:');
    expect(result.content[0].text).toContain('Total Nodes:');
    
    // 检查详细节点信息
    if (result.content.length > 1) {
      expect(result.content[1].text).toContain('Node ID:');
    }
  });
  
  // 在所有测试结束后关闭客户端
  afterAll(async () => {
    await client.close();
  });
}); 