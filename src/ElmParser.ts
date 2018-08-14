import * as vscode from 'vscode';

/* Should actually become a Parser one day :) */
export class ElmParser {

    private elmSignature : string = "\\w+ :(.*)";
    private elmSignatureRegexp : RegExp = new RegExp(this.elmSignature, "g");

    extract(elmdocument: vscode.TextDocument) : string[] {
        const text = elmdocument.getText();
        return  text.match(this.elmSignatureRegexp);
    }
}