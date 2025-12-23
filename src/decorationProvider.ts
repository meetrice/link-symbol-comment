import * as vscode from 'vscode';

/**
 * 链接注释装饰器提供器
 * 负责在注释中渲染链接样式，当光标不在该行时只显示简短文本
 */
export class LinkCommentDecorationProvider {
    private decorationTypeReplace: vscode.TextEditorDecorationType;
    private decorationTypeHide: vscode.TextEditorDecorationType;

    constructor() {
        // 替换链接文本为简短描述的装饰器
        this.decorationTypeReplace = vscode.window.createTextEditorDecorationType({
            // 使用 CSS 完全隐藏原文
            textDecoration: 'none; color: transparent; display: none;',
            opacity: '0',
            before: {
                contentText: '',  // 这里的文本会在每个 decoration 上动态设置
                color: '#3794ff',
                textDecoration: 'underline',
                margin: '0',
            }
        });

        // 用于隐藏的装饰器（使用背景色遮盖）
        this.decorationTypeHide = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'transparent',
            color: 'transparent',
            textDecoration: 'none; color: transparent; opacity: 0;',
        });
    }

    /**
     * 更新当前活动编辑器的装饰器
     */
    updateDecorations(): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        const replaceDecorations: vscode.DecorationOptions[] = [];
        const hideRanges: vscode.Range[] = [];

        const cursorLine = activeEditor.selection.active.line;
        // 匹配 [desc](file@symbol) 或 [desc](@symbol) 格式
        const linkPattern = /\[([^\]]+)\]\(([^)]*?@[^)]+)\)/g;

        const text = document.getText();
        let match;

        while ((match = linkPattern.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // 提取描述文本
            const description = match[1];

            if (startPos.line === cursorLine) {
                // 光标在当前行 - 不做装饰，显示完整语法
                // 不添加任何装饰器，让原文正常显示
            } else {
                // 光标不在当前行 - 替换为简短文本
                hideRanges.push(range);

                replaceDecorations.push({
                    range: range,
                    renderOptions: {
                        before: {
                            contentText: description,
                        }
                    }
                });
            }
        }

        // 应用装饰器 - 先隐藏，再显示替换文本
        activeEditor.setDecorations(this.decorationTypeHide, hideRanges);
        activeEditor.setDecorations(this.decorationTypeReplace, replaceDecorations);
    }

    dispose(): void {
        this.decorationTypeReplace.dispose();
        this.decorationTypeHide.dispose();
    }
}
