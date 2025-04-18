import { createClient, checkConnection } from './helpers/setup.js';

describe('Elasticsearch连接测试', () => {
  const client = createClient();
  
  test('应该能够连接到Elasticsearch服务器', async () => {
    const isConnected = await checkConnection(client);
    expect(isConnected).toBe(true);
  });
  
  test('应该能获取集群信息', async () => {
    const info = await client.info();
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('cluster_name');
    expect(info).toHaveProperty('version');
  });
  
  afterAll(async () => {
    await client.close();
  });
}); 