# Elasticsearch MCP Server Changelog

All significant project changes will be documented in this file.

## [1.0.6] - 2024-05-17

### New Features
- Added `reindex` tool, supporting data reindexing from source to target index
  - Supports optional query filtering
  - Supports optional script processing of data
  - Asynchronous processing for large indices, returns task ID for monitoring
- Added index template management functionality
  - `createIndexTemplate`: Create or update index templates
  - `getIndexTemplate`: Get index template information
  - `deleteIndexTemplate`: Delete index templates
- Added Smithery configuration support, improving deployment and integration processes

### Improvements
- Simultaneously supports environment variables with `ES_` prefix and without prefix
  - Example: Supports both `ES_HOST` and `HOST`
  - Simplifies compatibility with different environments
- Improved Cursor editor integration, fixed previously existing bugs
- Updated project documentation, including detailed configuration guides and usage examples
- Added demo video links showcasing main features

### Bug Fixes
- Fixed integration issues in Cursor editor
- Fixed environment variable processing logic, improving configuration reliability

### Development Tools
- Added Dockerfile support for containerized deployment
- Improved build process and development environment configuration

## [1.0.5] - 2024-05-10

### Major Updates
- Initial version release
- Implemented basic Elasticsearch operations support:
  - Cluster health status query
  - Index list query
  - Mapping management
  - Search functionality
  - Bulk data import 