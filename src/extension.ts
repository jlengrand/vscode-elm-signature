'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let elmSignatureDisplayer = new ElmSignatureDisplayer();
    const elmSignatureProvider = new ElmSignatureProvider(elmSignatureDisplayer);
    let elmSignaturecontroller = new ElmSignatureController(elmSignatureDisplayer, elmSignatureProvider);

    vscode.window.registerTreeDataProvider('elmSignatures', elmSignatureProvider);
    context.subscriptions.push(elmSignatureDisplayer);
    context.subscriptions.push(elmSignaturecontroller);
}

export function deactivate() {
}

class ElmFile{
    private _fileName: string;
    private _signatures : string[] = [];

    constructor(fileName: string, signatures: string[]){
        this._fileName = fileName;
        this._signatures = signatures;
    }

    fileName() : string{
        return this._fileName;
    }

    signatures() : string[]{
        return this._signatures;
    }
}

class Utils{
    // TODO: Extract workspace part only
    basename(path) {
        return path.split('/').reverse()[0];
    }
}

class ElmSignatureDisplayer{

    private _statusBarItem: vscode.StatusBarItem =  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    private saveCounter : number = 0;
    private elmFilesCounter : number = 0;
    private elmSignatures : Array<ElmFile> = [];

    private elmSignatureExtractor : ElmSignatureExtractor = new ElmSignatureExtractor();
    private utils : Utils = new Utils();

    public updateDataFound() {
        this.saveCounter++;

        const elmDocuments = vscode.workspace.textDocuments.filter(doc => doc.fileName.endsWith('.elm'));
        this.elmFilesCounter = elmDocuments.length;

        elmDocuments.forEach(elmDoc => {
            this.elmSignatures.push(new ElmFile(this.utils.basename(elmDoc.fileName), this.elmSignatureExtractor.extract(elmDoc)));
        });

        this._statusBarItem.text = `${this.saveCounter} times saved. ${this.elmFilesCounter} elm files found`;
        this._statusBarItem.show();

    }

    dispose() {
        this._statusBarItem.dispose();
    }

    getSignatures(): Array<ElmFile>{
        return this.elmSignatures;
    }
}

class ElmSignatureController {

    private elmSignatureDisplayer: ElmSignatureDisplayer;
    private elmSignatureProvider: ElmSignatureProvider;
    private _disposable: vscode.Disposable;

    constructor(elmSignatureDisplayer: ElmSignatureDisplayer, elmSignatureProvider: ElmSignatureProvider) {
        this.elmSignatureDisplayer = elmSignatureDisplayer;
        this.elmSignatureProvider = elmSignatureProvider;

        let subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
        this.elmSignatureDisplayer.updateDataFound();

        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this.elmSignatureDisplayer.updateDataFound();
        this.elmSignatureProvider.refresh();
    }
}

class ElmSignatureExtractor {

    private elmSignature : string = "\\w+ :(.*)";
    private elmSignatureRegexp : RegExp = new RegExp(this.elmSignature, "g");

    extract(elmdocument: vscode.TextDocument) : string[] {
        const text = elmdocument.getText();
        return  text.match(this.elmSignatureRegexp);
    }
}

class ElmSignatureProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

    private elmSignatureDisplayer: ElmSignatureDisplayer;

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    
    constructor(elmSignatureDisplayer:ElmSignatureDisplayer){
        this.elmSignatureDisplayer = elmSignatureDisplayer;
    }

    refresh(){
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]>{
        var elmFiles = this.elmSignatureDisplayer.getSignatures();
        const signatures  = elmFiles.map(file => file.signatures());
        const allSign = [].concat.apply([], signatures);
        return allSign.map(s => new vscode.TreeItem(s));
    }
}