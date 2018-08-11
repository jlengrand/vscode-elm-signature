'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-elm-signature" is now active!');
    vscode.window.showInformationMessage('Congratulations, your extension "vscode-elm-signature" is now active!');

    let elmSignatureDisplayer = new ElmSignatureDisplayer();
    let elmSignaturecontroller = new ElmSignatureController(elmSignatureDisplayer);

    context.subscriptions.push(elmSignatureDisplayer);
    context.subscriptions.push(elmSignaturecontroller);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class ElmSignatureDisplayer{

    private _statusBarItem: vscode.StatusBarItem =  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    private saveCounter : number = 0;
    private elmFilesCounter : number = 0;

    public updateDataFound() {
        this.saveCounter++;

        this._statusBarItem.text = `${this.saveCounter} times saved`;
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

        //TODO : Change those events
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

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