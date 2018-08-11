'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "vscode-elm-signature" is now active!');
    vscode.window.showInformationMessage('Congratulations, your extension "vscode-elm-signature" is now active!');

    let elmSignatureDisplayer = new ElmSignatureDisplayer();
    let elmSignaturecontroller = new ElmSignatureController(elmSignatureDisplayer);

    context.subscriptions.push(elmSignatureDisplayer);
    context.subscriptions.push(elmSignaturecontroller);
}

export function deactivate() {
}

class ElmSignatureDisplayer{

    private _statusBarItem: vscode.StatusBarItem =  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    private saveCounter : number = 0;
    private elmFilesCounter : number = 0;

    public updateDataFound() {
        this.saveCounter++;

        const elmDocuments = vscode.workspace.textDocuments.filter(doc => doc.fileName.endsWith('.elm'));
        this.elmFilesCounter = elmDocuments.length;

        this._statusBarItem.text = `${this.saveCounter} times saved. ${this.elmFilesCounter} elm files found`;
        this._statusBarItem.show();

    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class ElmSignatureController {

    private elmSignatureDisplayer: ElmSignatureDisplayer;
    private _disposable: vscode.Disposable;

    constructor(elmSignatureDisplayer: ElmSignatureDisplayer) {
        this.elmSignatureDisplayer = elmSignatureDisplayer;

        let subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
        this.elmSignatureDisplayer.updateDataFound();

        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        console.log('EVENT!!!');
        vscode.window.showInformationMessage('EVENT!');

        this.elmSignatureDisplayer.updateDataFound();
    }
}