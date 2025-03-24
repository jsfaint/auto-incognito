# Auto-Incognito 测试指南

本目录包含Auto-Incognito浏览器扩展的单元测试。测试使用[Bun](https://bun.sh/)作为测试运行器和执行环境。

## 测试结构

测试文件组织如下：

- `test/mocks/` - 包含模拟的Chrome API
- `test/lib/` - 包含对lib目录下核心功能模块的测试
- `test/` - 包含对根目录下JavaScript文件的测试

## 如何运行测试

确保已安装Bun，然后执行以下命令：

### 安装依赖

```bash
bun install
```

### 运行所有测试

```bash
bun test
```

### 以监视模式运行测试

在开发过程中，可以使用监视模式，当文件变化时自动重新运行测试：

```bash
bun test:watch
```

### 生成测试覆盖率报告

```bash
bun test:coverage
```

## 模拟对象

为了在测试环境中模拟Chrome浏览器扩展API，我们使用了自定义的模拟对象：

- `chrome.storage` - 模拟本地和同步存储功能
- `chrome.tabs` - 模拟标签页操作和事件
- `chrome.windows` - 模拟窗口创建功能
- `chrome.webNavigation` - 模拟网页导航事件
- `chrome.history` - 模拟历史记录操作

## 扩展测试

如需为新功能添加测试，请遵循以下建议：

1. 为每个功能模块创建单独的测试文件
2. 使用`describe`块组织测试
3. 每个测试应聚焦于单一功能或场景
4. 使用`beforeEach`重置模拟对象状态
5. 测试文件命名应遵循`[filename].test.js`格式 