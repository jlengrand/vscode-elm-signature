import * as vscode from 'vscode';
import {ElmSignatureExtractor} from './ElmSignatureExtractor';

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

class ElmFileItem extends FilterableTreeItem{
    signatures: ElmSignatureItem[];

    constructor(fileName: string){
        super(fileName, vscode.TreeItemCollapsibleState.Expanded);
    }

    setSignatures(signatures : ElmSignatureItem[]){
        this.signatures = signatures;
    }
}

class ElmSignatureItem extends FilterableTreeItem{
    file: ElmFileItem;

    constructor(label, file: ElmFileItem){
        super(label, vscode.TreeItemCollapsibleState.None);
        this.file = file;
    }
}


export class ElmSignatureProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    protected signatureTree : ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[] = null;
    private elmSignatureExtractor: ElmSignatureExtractor;

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    
    constructor(elmSignatureExtractor:ElmSignatureExtractor){
        this.elmSignatureExtractor = elmSignatureExtractor;
    }

    async refresh(resetTree: boolean = true){
        if(resetTree){
            await this.elmSignatureExtractor.updateDataFound();
            this.signatureTree = null;
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        if (element instanceof ElmSignatureItem || element instanceof ElmFileItem){
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

export class ElmFilterableSignatureProvider extends ElmSignatureProvider{

    filter(filterValue: string){
        this.filterTreeItems(this.signatureTree, filterValue);
        this.filterParents(this.signatureTree);
        this.refresh(false);
    }

    private filterParents(tree: ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[]){
        for(let item of tree){
            if(item instanceof ElmFileItem && !item.signatures.every(sign => sign.isVisible())){
                item.setVisibility(false);
            }
        }
    }

    private filterTreeItems(tree: ElmSignatureItem[] | ElmFileItem[] | ElmFilterItem[], filterValue: string){
        for(let item of tree){
            if(item instanceof ElmSignatureItem){
                if(item.label && !item.label.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())){
                    item.setVisibility(false);
                }
            }
            if (item instanceof ElmFileItem) {
                this.filterTreeItems(item.signatures, filterValue);
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