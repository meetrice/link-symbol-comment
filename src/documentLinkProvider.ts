import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 文档链接提供器
 * 为注释中的链接语法创建可点击的 DocumentLink
 * 支持 Ctrl+Click (Windows/Linux) 或 Cmd+Click (Mac) 跳转
 */
export class LinkCommentDocumentLinkProvider implements vscode.DocumentLinkProvider {

    provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentLink[]> {
        const links: vscode.DocumentLink[] = [];
        // 支持 [desc](file@symbol) 和 [desc](@symbol)
        const linkPattern = /\[([^\]]+)\]\(([^)]*?@[^)]+)\)/g;

        const text = document.getText();
        let match;

        while ((match = linkPattern.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // 解析链接
            const parsed = this.parseLink(match[0]);
            if (!parsed) {
                continue;
            }

            // 创建一个 URI scheme 触发跳转命令
            const commandUri = vscode.Uri.parse(
                `command:linkSymbolComment.jump?${encodeURIComponent(JSON.stringify([parsed.filePath, parsed.symbolName]))}`
            );

            const link = new vscode.DocumentLink(range, commandUri);
            const targetDesc = parsed.filePath ? `${parsed.filePath}@${parsed.symbolName}` : `current file @${parsed.symbolName}`;
            link.tooltip = `Click to go to ${targetDesc}`;
            links.push(link);
        }

        return links;
    }

    /**
     * 解析链接语法 - 支持 [desc](file@symbol) 和 [desc](@symbol)
     */
    private parseLink(linkText: string): { filePath: string | null; symbolName: string } | null {
        const match = linkText.match(/\[([^\]]+)\]\(([^)]*?)@([^)]+)\)/);
        if (!match) {
            return null;
        }

        const filePath = match[2]; // 可能为空字符串
        return {
            filePath: filePath || null,  // 如果为空字符串，则表示当前文件
            symbolName: match[3]
        };
    }
}

/**
 * 注册跳转命令
 */
export function registerJumpCommand(context: vscode.ExtensionContext): void {
    const jumpCommand = vscode.commands.registerCommand(
        'linkSymbolComment.jump',
        async (filePath: string | null, symbolName: string) => {
            await jumpToSymbol(filePath, symbolName);
        }
    );

    context.subscriptions.push(jumpCommand);
}

/**
 * 跳转到指定文件和符号
 */
async function jumpToSymbol(filePath: string | null, symbolName: string): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    let targetUri: vscode.Uri;

    // 如果没有指定文件路径，使用当前文件
    if (!filePath) {
        targetUri = activeEditor.document.uri;
    } else if (filePath.includes('/') || filePath.includes('\\')) {
        if (path.isAbsolute(filePath)) {
            targetUri = vscode.Uri.file(filePath);
        } else {
            const currentDir = path.dirname(activeEditor.document.uri.fsPath);
            targetUri = vscode.Uri.file(path.join(currentDir, filePath));
        }
    } else {
        const currentDir = path.dirname(activeEditor.document.uri.fsPath);
        targetUri = vscode.Uri.file(path.join(currentDir, filePath));
    }

    // 如果是当前文件，直接跳转
    if (targetUri.toString() === activeEditor.document.uri.toString()) {
        const position = findSymbolPosition(activeEditor.document, symbolName);
        if (position) {
            activeEditor.selection = new vscode.Selection(position, position.translate(0, symbolName.length));
            activeEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        } else {
            vscode.window.showWarningMessage(`Symbol "${symbolName}" not found in current file`);
        }
        return;
    }

    // 检查文件是否存在
    try {
        await vscode.workspace.fs.stat(targetUri);
    } catch {
        vscode.window.showWarningMessage(`File not found: ${targetUri.fsPath}`);
        return;
    }

    // 打开文档
    const document = await vscode.workspace.openTextDocument(targetUri);
    const editor = await vscode.window.showTextDocument(document);

    // 查找符号位置
    const position = findSymbolPosition(document, symbolName);

    if (position) {
        // 跳转到符号位置并高亮
        editor.selection = new vscode.Selection(position, position.translate(0, symbolName.length));
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } else {
        vscode.window.showWarningMessage(`Symbol "${symbolName}" not found in ${filePath || 'current file'}`);
    }
}

/**
 * 在文档中查找符号定义的位置
 */
function findSymbolPosition(document: vscode.TextDocument, symbolName: string): vscode.Position | undefined {
    const text = document.getText();
    const lines = text.split('\n');

    const ext = path.extname(document.uri.fsPath).toLowerCase();
    const language = getLanguageFromFileExt(ext);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (matchesSymbolDefinition(language, trimmedLine, symbolName)) {
            const symbolIndex = line.indexOf(symbolName);
            if (symbolIndex !== -1) {
                return new vscode.Position(i, symbolIndex);
            }
        }
    }

    return undefined;
}

/**
 * 根据文件扩展名获取语言类型
 */
function getLanguageFromFileExt(ext: string): string {
    const languageMap: { [key: string]: string } = {
        '.py': 'python',
        '.js': 'javascript',
        '.mjs': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.jsx': 'javascript',
        '.php': 'php',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.go': 'go',
        '.rs': 'rust',
        '.rb': 'ruby',
        '.cs': 'csharp',
    };

    return languageMap[ext] || 'javascript';
}

/**
 * 检查行是否匹配符号定义
 */
function matchesSymbolDefinition(language: string, line: string, symbolName: string): boolean {
    const trimmedLine = line.split('//')[0].split('#')[0].trim();

    switch (language) {
        case 'python':
            return /^\s*(def|class)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

        case 'javascript':
        case 'typescript':
            return /(function\s+\w+|const\s+\w+\s*=|class\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{|export\s+(const|function|class)\s+\w+)/.test(trimmedLine) &&
                   trimmedLine.includes(symbolName);

        case 'php':
            return /^\s*(function|class)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

        case 'java':
            return /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{?/.test(trimmedLine) ||
                   /^\s*(class|interface)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

        case 'go':
            return /^\s*func\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

        case 'rust':
            return /^\s*(pub\s+)?fn\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

        case 'cpp':
        case 'c':
            return /^\s*(\w+\s+)+\w+\s*\([^)]*\)\s*{?/.test(trimmedLine) && !trimmedLine.startsWith('//') && trimmedLine.includes(symbolName);

        default:
            return trimmedLine.includes(symbolName) &&
                   (trimmedLine.includes('function') || trimmedLine.includes('def') || trimmedLine.includes('class'));
    }
}
