import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 链接注释定义提供器
 * 提供从注释链接跳转到定义的功能
 */
export class LinkCommentDefinitionProvider implements vscode.DefinitionProvider {

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Location | vscode.Location[] | undefined> {
        // 检查当前位置是否在链接内
        const linkRange = this.findLinkAtPosition(document, position);
        if (!linkRange) {
            return undefined;
        }

        // 解析链接内容
        const linkText = document.getText(linkRange);
        const parsed = this.parseLink(linkText);
        if (!parsed) {
            return undefined;
        }

        // 查找目标文件和符号
        const targetLocation = await this.resolveTarget(document, parsed.filePath, parsed.symbolName);
        return targetLocation;
    }

    /**
     * 查找指定位置所在的链接范围
     */
    private findLinkAtPosition(document: vscode.TextDocument, position: vscode.Position): vscode.Range | undefined {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // 查找所有链接 - 支持 [desc](file@symbol) 和 [desc](@symbol)
        const linkPattern = /\[([^\]]+)\]\(([^)]*?@[^)]+)\)/g;
        let match;

        while ((match = linkPattern.exec(lineText)) !== null) {
            const startPos = new vscode.Position(position.line, match.index);
            const endPos = new vscode.Position(position.line, match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            if (range.contains(position)) {
                return range;
            }
        }

        return undefined;
    }

    /**
     * 解析链接语法: [description](file.ext@symbolName) 或 [description](@symbolName)
     */
    private parseLink(linkText: string): { filePath: string | null; symbolName: string } | undefined {
        const match = linkText.match(/\[([^\]]+)\]\(([^)]*?)@([^)]+)\)/);
        if (!match) {
            return undefined;
        }

        const filePath = match[2]; // 可能为空字符串
        return {
            filePath: filePath || null,  // 如果为空字符串，则表示当前文件
            symbolName: match[3]
        };
    }

    /**
     * 解析目标文件路径和符号名称，返回对应的位置
     */
    private async resolveTarget(
        sourceDocument: vscode.TextDocument,
        filePath: string | null,
        symbolName: string
    ): Promise<vscode.Location | undefined> {
        let targetUri: vscode.Uri;

        // 如果没有指定文件路径，使用当前文件
        if (!filePath) {
            targetUri = sourceDocument.uri;
        } else if (filePath.includes('/') || filePath.includes('\\')) {
            // 包含路径分隔符，视为相对或绝对路径
            if (path.isAbsolute(filePath)) {
                targetUri = vscode.Uri.file(filePath);
            } else {
                // 相对于当前文件的目录
                const currentDir = path.dirname(sourceDocument.uri.fsPath);
                targetUri = vscode.Uri.file(path.join(currentDir, filePath));
            }
        } else {
            // 只有文件名，使用同级目录
            const currentDir = path.dirname(sourceDocument.uri.fsPath);
            targetUri = vscode.Uri.file(path.join(currentDir, filePath));
        }

        // 如果是当前文件，直接搜索
        if (targetUri.toString() === sourceDocument.uri.toString()) {
            const symbolPosition = this.findSymbolPosition(sourceDocument, symbolName);
            if (symbolPosition) {
                return new vscode.Location(targetUri, symbolPosition);
            }
            vscode.window.showWarningMessage(`Symbol "${symbolName}" not found in current file`);
            return undefined;
        }

        // 检查文件是否存在
        try {
            await vscode.workspace.fs.stat(targetUri);
        } catch {
            // 文件不存在
            vscode.window.showWarningMessage(`File not found: ${targetUri.fsPath}`);
            return undefined;
        }

        // 打开文档并搜索符号
        const targetDocument = await vscode.workspace.openTextDocument(targetUri);
        const symbolPosition = this.findSymbolPosition(targetDocument, symbolName);

        if (symbolPosition) {
            return new vscode.Location(targetUri, symbolPosition);
        }

        vscode.window.showWarningMessage(`Symbol "${symbolName}" not found in ${filePath || 'current file'}`);
        return undefined;
    }

    /**
     * 在文档中查找符号定义的位置
     * 支持多种语言的定义模式
     */
    private findSymbolPosition(document: vscode.TextDocument, symbolName: string): vscode.Position | undefined {
        const text = document.getText();
        const lines = text.split('\n');

        // 根据文件扩展名确定语言
        const ext = path.extname(document.uri.fsPath).toLowerCase();
        const language = this.getLanguageFromFileExt(ext);

        // 遍历所有行查找符号定义
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // 根据语言使用不同的匹配模式
            if (this.matchesSymbolDefinition(language, trimmedLine, symbolName)) {
                // 找到符号定义，返回该行中符号名称的位置
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
    private getLanguageFromFileExt(ext: string): string {
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
    private matchesSymbolDefinition(language: string, line: string, symbolName: string): boolean {
        // 移除注释和空白字符
        const trimmedLine = line.split('//')[0].split('#')[0].trim();

        switch (language) {
            case 'python':
                // Python: def function_name, class ClassName
                return /^\s*(def|class)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

            case 'javascript':
            case 'typescript':
                // JS/TS: function name, const name =, class name, export function, etc.
                return /(function\s+\w+|const\s+\w+\s*=|class\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{|export\s+(const|function|class)\s+\w+)/.test(trimmedLine) &&
                       trimmedLine.includes(symbolName);

            case 'php':
                // PHP: function name, class name
                return /^\s*(function|class)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

            case 'java':
                // Java: public/private/protected type name, class/interface name
                return /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{?/.test(trimmedLine) ||
                       /^\s*(class|interface)\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

            case 'go':
                // Go: func name
                return /^\s*func\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

            case 'rust':
                // Rust: fn name, pub fn name
                return /^\s*(pub\s+)?fn\s+/.test(trimmedLine) && trimmedLine.includes(symbolName);

            case 'cpp':
            case 'c':
                // C/C++: type name, class name
                return /^\s*(\w+\s+)+\w+\s*\([^)]*\)\s*{?/.test(trimmedLine) && !trimmedLine.startsWith('//') && trimmedLine.includes(symbolName);

            default:
                // 默认：查找包含符号名称且可能是定义的行
                return trimmedLine.includes(symbolName) &&
                       (trimmedLine.includes('function') || trimmedLine.includes('def') || trimmedLine.includes('class'));
        }
    }
}
