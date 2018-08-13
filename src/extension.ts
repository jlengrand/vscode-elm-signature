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
    private elmSignatureDisplayer: ElmSignatureDisplayer;

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    
    constructor(elmSignatureDisplayer:ElmSignatureDisplayer){
        this.elmSignatureDisplayer = elmSignatureDisplayer;
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

            const elmFiles = this.elmSignatureDisplayer.getSignatures();
    
            for (let elmFile of elmFiles) {
                const fileName = elmFile.fileName()
                const signatures = elmFile.signatures();
    
                const fileItem = new ElmFileItem(fileName);
                const signatureItems = signatures.map(sign  => new ElmSignatureItem(sign, fileItem)); 
                fileItem.setSignatures(signatureItems);
    
                allSign.push(fileItem);
                allSign = allSign.concat(signatureItems);
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