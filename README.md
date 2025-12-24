# Link Symbol Comment
 [![GitHub](https://img.shields.io/badge/GitHub-link--symbol--comment-blue?logo=github)](https://github.com/meetrice/link-symbol-comment)

在代码注释中创建可点击的链接，快速跳转到函数定义。

![Link Symbol Comment 演示](https://github.com/meetrice/link-symbol-comment/blob/main/assets/linksymbolscreenshot.gif?raw=true)

## 特性

- 📝 **简单语法**: 使用 `[描述](文件@函数名)` 或 `[描述](@函数名)` 格式
- 🎯 **快速跳转**: Ctrl/Cmd + 点击链接即可跳转
- 🌐 **多语言支持**: Python, JavaScript, TypeScript, PHP, Java, C/C++, Go, Rust
- ✨ **简洁显示**: 光标不在行上时，只显示描述文本
- 🔗 **跨文件跳转**: 支持跳转到其他文件的函数

## 语法

### 跳转到其他文件

```python
# 参见 [greet 函数](utils.py@greet)
# 参见 [DataProcessor 类](utils.py@DataProcessor)
```

### 跳转到当前文件

```python
# 参见 [main 函数](@main)
# 参见 [greet 函数](@greet)
```

## 使用示例

### Python 示例

```python
"""
## 模块结构

├── [greet 问好函数](@greet)
├── [calculate_sum 求和函数](@calculate_sum)
├── [DataProcessor 数据处理类](@DataProcessor)
└── [main 主函数](@main)
"""

def greet(name):
    """向用户问好"""
    return f"Hello, {name}!"

def main():
    processor = DataProcessor()
    result = processor.process("test")
```

### JavaScript 示例

```javascript
// 参见 [helper 函数](utils.js@helper)
// 参见 [main 函数](@main)

function main() {
    // 主函数
}
```

## 安装

在 VSCode 扩展市场搜索 "Link Symbol Comment" 并安装。

## 使用方法

1. 在注释中使用链接语法
2. 链接会显示为蓝色下划线
3. 按住 `Ctrl` (Windows/Linux) 或 `Cmd` (Mac) 并点击链接
4. 或者右键选择 "Go to Definition"

## 支持的语言

| 语言 | 文件扩展名 |
|------|-----------|
| Python | .py |
| JavaScript | .js, .mjs |
| TypeScript | .ts, .tsx |
| PHP | .php |
| Java | .java |
| C/C++ | .c, .cpp, .h, .hpp |
| Go | .go |
| Rust | .rs |

## 配置

无需额外配置，安装后即可使用。

## 发布

首次发布版本: 1.0.0

## 许可证

MIT

## 反馈

如有问题或建议，请在 GitHub 提交 Issue。
