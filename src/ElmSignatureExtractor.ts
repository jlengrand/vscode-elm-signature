import * as vscode from 'vscode';

import {ElmParser} from './ElmParser';
import {Utils} from './Utils';

export class ElmFile{
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

export class ElmSignatureExtractor{
    private elmSignatures : Array<ElmFile> = [];

    private elmSignatureExtractor : ElmParser = new ElmParser();
    private utils : Utils = new Utils();

    public async updateDataFound() {
        const elmFiles = await vscode.workspace.findFiles('**/*.elm', '**/{elm-stuff,node_modules}/**');

        this.elmSignatures = [];
        elmFiles.forEach(async (elmFile) => {
            const elmDoc = await vscode.workspace.openTextDocument(elmFile);
            this.elmSignatures.push(new ElmFile(this.utils.basename(elmDoc.fileName), this.elmSignatureExtractor.extract(elmDoc)));
        });
    }

    getSignatures(): Array<ElmFile>{
        return this.elmSignatures;
    }

    dispose(){

    }
}