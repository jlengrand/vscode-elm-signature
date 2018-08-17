'use strict';
import * as vscode from 'vscode';
import {ElmSignatureExtractor} from './ElmSignatureExtractor';
import {ElmFilterableSignatureProvider, ElmSignatureProvider} from './ElmSignatureProvider';

let elmSignatureProvider: ElmFilterableSignatureProvider;

export async function activate(context: vscode.ExtensionContext) {

    let elmSignatureExtractor = new ElmSignatureExtractor();
    elmSignatureProvider = new ElmFilterableSignatureProvider(elmSignatureExtractor);
    let elmSignatureController = new ElmSignatureController(elmSignatureProvider);

    vscode.window.registerTreeDataProvider('elmSignatures', elmSignatureProvider);
    vscode.commands.registerCommand('extension.filterElmSignatures', _ => vscode.commands.executeCommand('vscode.filterElmSignatures', filterSignatures()));

    context.subscriptions.push(elmSignatureExtractor);
    context.subscriptions.push(elmSignatureController);
}

export function deactivate() {
}

async function filterSignatures() {
    const filterValue = await vscode.window.showInputBox();

    if (filterValue == undefined || filterValue.length < 1) {
        elmSignatureProvider.resetFilter();
    }

    elmSignatureProvider.filter(filterValue);
}

class ElmSignatureController {

    private elmSignatureProvider: ElmSignatureProvider;
    private _disposable: vscode.Disposable;

    constructor(elmSignatureProvider: ElmSignatureProvider) {
        this.elmSignatureProvider = elmSignatureProvider;

        let subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
        this._disposable = vscode.Disposable.from(...subscriptions);

        this.elmSignatureProvider.refresh();
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this.elmSignatureProvider.refresh();
    }
}
