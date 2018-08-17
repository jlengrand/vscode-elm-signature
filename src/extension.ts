'use strict';
import * as vscode from 'vscode';
import {ElmSignatureExtractor} from './ElmSignatureExtractor';
import {ElmFilterableSignatureProvider, ElmSignatureProvider} from './ElmSignatureProvider';

let elmSignatureProvider: ElmFilterableSignatureProvider;

export async function activate(context: vscode.ExtensionContext) {

    let elmSignatureExtractor = new ElmSignatureExtractor();
    elmSignatureProvider = new ElmFilterableSignatureProvider(elmSignatureExtractor);
    let elmSignatureController = new ElmSignatureController(elmSignatureExtractor, elmSignatureProvider);

    vscode.window.registerTreeDataProvider('elmSignatures', elmSignatureProvider);
    vscode.commands.registerCommand('extension.filterElmSignatures', moduleName => vscode.commands.executeCommand('vscode.filterElmSignatures', filterSignatures()));

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

    private elmSignatureExtractor: ElmSignatureExtractor;
    private elmSignatureProvider: ElmSignatureProvider;
    private _disposable: vscode.Disposable;

    constructor(elmSignatureDisplayer: ElmSignatureExtractor, elmSignatureProvider: ElmSignatureProvider) {
        this.elmSignatureExtractor = elmSignatureDisplayer;
        this.elmSignatureProvider = elmSignatureProvider;

        let subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
        this.elmSignatureExtractor.updateDataFound();

        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this.elmSignatureExtractor.updateDataFound();
        this.elmSignatureProvider.refresh();
    }
}
