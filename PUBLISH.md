# 发布 VSCode 插件到市场指南

## 前置条件

### 1. 创建发布者账号
- 访问: https://marketplace.visualstudio.com/manage
- 创建新的 publisher
- 记录你的 Publisher ID

### 2. 创建 Personal Access Token
- 访问: https://dev.azure.com/
- User Settings -> Personal access tokens -> + New Token
- Scopes: Marketplace -> Manage -> Publish
- 复制 token（只显示一次）

## 修改 package.json

将以下占位符替换为实际值：
- `YOUR_PUBLISHER_ID` -> 你的 Publisher ID
- `YOUR_USERNAME` -> 你的 GitHub 用户名
- `YOUR_REPO` -> 你的仓库名称

## 发布步骤

### 1. 安装发布工具
```bash
npm install -g vsce
```

### 2. 登录
```bash
vsce login YOUR_PUBLISHER_ID
# 输入你的 Personal Access Token
```

### 3. 发布
```bash
vsce publish
```

## 发布后

- 插件会出现在: https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_ID.link-symbol-comment
- 用户可以在 VSCode 扩展市场搜索并安装

## 更新插件

修改 version 后重新发布：
```bash
vsce publish
```
