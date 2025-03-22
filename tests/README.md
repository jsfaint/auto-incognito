# Auto-Incognito 测试文档

> 中文测试文档 - 本仓库的单元测试说明和使用方法

## 测试架构

测试使用Jest框架进行单元测试，并使用jest-chrome库模拟Chrome浏览器API。

## 测试覆盖的主要功能

1. **基本模拟API测试** - `tests/simple.test.js`
   - 测试Chrome存储API的模拟实现
   - 验证基本的存储操作

2. **黑名单管理** - `tests/blacklist-simple.test.js`
   - 添加URL到黑名单
   - 检查URL是否在黑名单中
   - 获取所有黑名单项

## 运行测试

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
npx jest tests/simple.test.js
```

## 注意事项

1. 测试中使用的是模拟的Chrome API，而不是真实的浏览器环境。
2. 在`tests/setup.js`中配置了全局测试环境。
3. 当前的测试设计方法比复杂的测试更稳定，能够避免内存问题。
4. 如有代码修改，请确保先运行测试以确保功能正常。

## 未来测试计划

1. 添加更多组件的测试用例
2. 提高测试覆盖率
3. 添加端到端测试