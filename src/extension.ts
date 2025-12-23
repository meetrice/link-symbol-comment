import * as vscode from 'vscode';
import { LinkCommentDecorationProvider } from './decorationProvider';
import { LinkCommentDefinitionProvider } from './definitionProvider';
import { LinkCommentDocumentLinkProvider, registerJumpCommand } from './documentLinkProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Link Symbol Comment extension is now active!');

    const supportedLanguages = ['python', 'javascript', 'typescript', 'php', 'java', 'cpp', 'c', 'go', 'rust'];

    // 注册装饰器（用于渲染链接样式）
    const decorationProvider = new LinkCommentDecorationProvider();

    // 注册定义提供器（用于跳转到定义）
    const definitionProvider = new LinkCommentDefinitionProvider();
    supportedLanguages.forEach(lang => {
        const disposable = vscode.languages.registerDefinitionProvider(lang, definitionProvider);
        context.subscriptions.push(disposable);
    });

    // 注册文档链接提供器（用于 Ctrl+Click 跳转）
    const documentLinkProvider = new LinkCommentDocumentLinkProvider();
    supportedLanguages.forEach(lang => {
        const disposable = vscode.languages.registerDocumentLinkProvider(lang, documentLinkProvider);
        context.subscriptions.push(disposable);
    });

    // 注册跳转命令
    registerJumpCommand(context);

    // 监听光标位置变化，更新装饰器
    const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
        decorationProvider.updateDecorations();
    });
    context.subscriptions.push(activeEditorChangeListener);

    const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection(() => {
        decorationProvider.updateDecorations();
    });
    context.subscriptions.push(selectionChangeListener);

    // 初始化装饰器
    if (vscode.window.activeTextEditor) {
        decorationProvider.updateDecorations();
    }
}

export function deactivate() {}
