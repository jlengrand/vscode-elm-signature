'use strict';
import * as vscode from 'vscode';
import {ElmSignatureExtractor} from './ElmSignatureExtractor';

export function activate(context: vscode.ExtensionContext) {

    let elmSignatureExtractor = new ElmSignatureExtractor();
    const elmSignatureProvider = new ElmSignatureProvider(elmSignatureExtractor);
    let elmSignatureController = new ElmSignatureController(elmSignatureExtractor, elmSignatureProvider);

    vscode.window.registerTreeDataProvider('elmSignatures', elmSignatureProvider);
    context.subscriptions.push(elmSignatureExtractor);
    context.subscriptions.push(elmSignatureController);
}

export function deactivate() {
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

class ElmFileItem extends vscode.TreeItem{
    signatures: ElmSignatureItem[];

    constructor(fileName: string){
        super(fileName, vscode.TreeItemCollapsibleState.Expanded);
    }

    setSignatures(signatures : ElmSignatureItem[]){
        this.signatures = signatures;
    }
}

class ElmSignatureItem extends vscode.TreeItem{
    file: ElmFileItem;

    constructor(label, file: ElmFileItem){
        super(label, vscode.TreeItemCollapsibleState.None);
        this.file = file;
    }
}

class ElmSignatureProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

    private signatureTree : ElmSignatureItem[] | ElmFileItem[] = null;
    private elmSignatureExtractor: ElmSignatureExtractor;

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    
    constructor(elmSignatureExtractor:ElmSignatureExtractor){
        this.elmSignatureExtractor = elmSignatureExtractor;
    }

    refresh(){
        this.signatureTree = null;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
    }

    getParent(element: vscode.TreeItem): vscode.TreeItem | null {
		if (element instanceof ElmSignatureItem) {
			return element.file;
		}
		if (element instanceof ElmFileItem) {
			return null;
		}
		return null;
	}

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]>{
		if (!this.signatureTree) {
            let allSign = [];

            const elmFiles = this.elmSignatureExtractor.getSignatures();
    
            for (let elmFile of elmFiles) {
                const fileName = elmFile.fileName()
                const signatures = elmFile.signatures();
    
                const fileItem = new ElmFileItem(fileName);
                const signatureItems = signatures.map(sign  => new ElmSignatureItem(sign, fileItem)); 
                fileItem.setSignatures(signatureItems);
    
                allSign.push(fileItem);
            }

            this.signatureTree = allSign;
		}
		if (element instanceof ElmSignatureItem) {
			return [];
		}
		if (element instanceof ElmFileItem) {
			return element.signatures;
		}
		if (!element) {
			if (this.signatureTree) {
				return this.signatureTree;
			}
		}
		return [];
    }
}