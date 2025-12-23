# Link Symbol Comment - 测试指南

## 插件已成功打包！

生成的文件：`link-symbol-comment-0.0.1.vsix`

## 安装和测试步骤

### 方法 1: 通过 VSIX 文件安装（推荐）

1. **安装插件**
   ```bash
   code --install-extension link-symbol-comment-0.0.1.vsix
   ```

   或者在 VSCode 中：
   - 打开命令面板 (Cmd/Ctrl + Shift + P)
   - 输入 "Install from VSIX"
   - 选择生成的 `link-symbol-comment-0.0.1.vsix` 文件

2. **重新加载 VSCode**
   - 按 Cmd/Ctrl + Shift + P
   - 输入 "Reload Window"

3. **测试功能**
   - 打开 `test-files/app.js` 文件
   - 观察第 6-8 行的注释链接

### 方法 2: 调试模式运行

1. 在当前项目打开 VSCode
2. 按 `F5` 键启动扩展开发主机
3. 在新打开的 VSCode 窗口中：
   - 打开 `test-files/app.js` 文件
   - 测试链接功能

## 测试用例

### 测试文件：test-files/app.js

```javascript
// 参见 [greet 函数](utils.py@greet)
// 参见 [calculate_sum 函数](utils.py@calculate_sum)
// 参见 [DataProcessor 类](utils.py@DataProcessor)
```

### 测试步骤

#### 1. 视觉测试

- [ ] 链接显示为蓝色下划线
- [ ] 光标不在链接行时，链接保持蓝色样式
- [ ] 光标移到链接行时，链接恢复为普通文本样式

#### 2. 跳转测试（Ctrl/Cmd + Click）

1. 按住 `Ctrl` (Windows/Linux) 或 `Cmd` (Mac)
2. 点击 `[greet 函数]` 链接
3. [ ] 应该跳转到 `utils.py` 的第 5 行 (`def greet(name):`)
4. [ ] 目标文件在新标签页或当前标签页打开
5. [ ] 光标定位到函数定义处

#### 3. Go to Definition 测试

1. 将光标放在链接文本上
2. 右键点击
3. 选择 "Go to Definition" 或按 `F12`
4. [ ] 应该跳转到目标符号

#### 4. 错误处理测试

1. 创建一个指向不存在文件的链接：
   ```javascript
   // [测试](nonexistent.py@test)
   ```
2. 尝试点击
3. [ ] 应该显示警告消息 "File not found"

## 链接语法格式

### 基本语法
```
[显示文本](文件名@符号名)
```

### 示例

1. **同级目录文件**
   ```
   [greet](utils.py@greet)
   [calculate_sum](utils.py@calculate_sum)
   ```

2. **相对路径**（需确认是否支持）
   ```
   [func](../other/utils.py@function_name)
   ```

3. **绝对路径**（需确认是否支持）
   ```
   [func](/path/to/file.py@function_name)
   ```

## 支持的语言

| 语言 | 文件扩展名 | 状态 |
|------|-----------|------|
| Python | .py | ✅ |
| JavaScript | .js, .mjs | ✅ |
| TypeScript | .ts, .tsx | ✅ |
| PHP | .php | ✅ |
| Java | .java | ✅ |
| C/C++ | .c, .cpp, .h, .hpp | ✅ |
| Go | .go | ✅ |
| Rust | .rs | ✅ |

## 已知限制

1. 符号搜索使用简单的正则表达式匹配
2. 可能无法识别复杂的定义模式
3. 需要文件存在才能跳转
4. 不支持动态生成的符号

## 调试信息

如果插件不工作，请检查：

1. **查看开发者工具**
   - Help > Toggle Developer Tools
   - 查看 Console 中的错误消息

2. **检查扩展是否激活**
   - 打开命令面板
   - 输入 "Extensions: Show Installed Extensions"
   - 找到 "Link Symbol Comment"
   - 确认已启用

3. **查看输出日志**
   - View > Output
   - 选择 "Extension Host" 频道
   - 应该看到：`Link Symbol Comment extension is now active!`

## 下一步改进建议

1. ✅ 支持相对路径
2. ✅ 改进符号搜索（使用 VSCode 的符号索引）
3. ✅ 支持跨工作区跳转
4. ✅ 添加配置选项（颜色、样式等）
5. ✅ 支持更多语言特性（命名空间、类方法等）

## 问题反馈

如果发现问题，请记录：
1. 操作步骤
2. 预期行为
3. 实际行为
4. 截图（如果有）
