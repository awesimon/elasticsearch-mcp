# Elasticsearch MCP 测试套件

这个测试套件用于测试Elasticsearch MCP服务器的各个功能模块。测试使用Jest框架，并且需要一个正在运行的Elasticsearch实例。

## 测试环境要求

1. Node.js 版本 >= 16
2. 本地运行的Elasticsearch 实例 (默认位于 `http://localhost:9200`)
3. 必要的NPM依赖已安装

## 安装依赖

首先，确保已安装所有依赖：

```bash
npm install
```

## 运行测试

要运行所有测试：

```bash
npm test
```

要进入监视模式，自动重新运行测试：

```bash
npm run test:watch
```

要运行特定的测试文件：

```bash
npm test -- tests/indexManagement.test.ts
```

## 测试说明

测试套件涵盖了以下功能模块：

1. **索引管理测试**：测试索引创建、映射管理、模板等功能
2. **文档操作测试**：测试文档的索引、更新、删除和批量操作
3. **搜索操作测试**：测试基本搜索、高级搜索、多重搜索和计数功能
4. **集群管理测试**：测试集群健康状态、统计信息和节点信息

## 疑难解答

1. **连接错误**：确保Elasticsearch正在运行，并且可以通过http://localhost:9200访问
2. **权限问题**：如果使用的是有安全设置的Elasticsearch，请在 `tests/helpers/setup.ts` 中更新客户端配置
3. **超时问题**：对于较大的测试操作，如果遇到超时，可以在jest.config.js中增加 `testTimeout` 的值 