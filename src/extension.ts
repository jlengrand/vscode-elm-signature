'use strict';
import * as vscode from 'vscode';
import {ElmSignatureExtractor} from './ElmSignatureExtractor';

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

class ElmFilterItem extends vscode.TreeItem{
    public readonly theCommand: vscode.Command = {
		title: 'filter signature',
		command: 'extension.filterElmSignatures'
	};

    constructor(){
        super('Filter signatures', vscode.TreeItemCollapsibleState.None);
        this.command = this.theCommand;
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

class FilterableTreeItem extends vscode.TreeItem{

    protected visible: boolean = true;

    isVisible(): boolean{
        return this.visible;
    }

    toggle(){
        this.visible = !this.visible;
    }

    setVisibility(visible: boolean){
        this.visible = visible;
    }
}

class ElmSignatureItem extends FilterableTreeItem{
    file: ElmFileItem;

    constructor(label, file: ElmFileItem){
        super(label, vscode.TreeItemCollapsibleState.None);
        this.file = file;
    }
}

class ElmSignatureProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    protected signatureTree : ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[] = null;
    private elmSignatureExtractor: ElmSignatureExtractor;

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    
    constructor(elmSignatureExtractor:ElmSignatureExtractor){
        this.elmSignatureExtractor = elmSignatureExtractor;
    }

    refresh(resetTree: boolean = true){
        if(resetTree){
            this.signatureTree = null;
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        if (element instanceof ElmSignatureItem){
            return element.isVisible() ? element : null;
        }
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
            const filterItem = new ElmFilterItem();
            let allSign = [];
            allSign.push(filterItem);

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
        if(element instanceof ElmFilterItem){
            return [];
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

class ElmFilterableSignatureProvider extends ElmSignatureProvider{

    filter(filterValue: string){
        this.filterTree(this.signatureTree, filterValue);
        this.refresh(false);
    }

    private filterTree(tree: ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[], filterValue: string){
        for(let item of tree){
            if(item instanceof ElmSignatureItem){
                if(item.label && !item.label.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())){
                    item.setVisibility(false);
                }
            }
            if (item instanceof ElmFileItem) {
                this.filterTree(item.signatures, filterValue);
            }
        }
    }

    resetFilter(){
        this.resetFilterTree(this.signatureTree);
    }

    private resetFilterTree(tree: ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[]){
        for(let item of tree){
            if(item instanceof ElmSignatureItem){
                item.setVisibility(true);
            }
            if (item instanceof ElmFileItem) {
                this.resetFilterTree(item.signatures);
            }
        }
    }
}