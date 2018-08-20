import * as vscode from 'vscode';
import {SimpleSignatureParser} from './ElmParsers';
import * as Parsimmon from 'parsimmon';
import { print } from 'util';

/* Should actually become a Parser one day :) */
export class ElmParser {

    private elmSignature : string = "\\w+ :(.*)";
    private elmSignatureRegexp : RegExp = new RegExp(this.elmSignature, "g");

    extract(elmdocument: vscode.TextDocument) : string[] {
        const matches = [];
        for (let index = 0; index < elmdocument.lineCount; index++) {
            const line = elmdocument.lineAt(index);
            try {
                const parseResult = SimpleSignatureParser.parse(line.text);
                if (parseResult.status === true) {
                    matches.push(parseResult.value.join(" "));
                }
                // else {
                //     console.log(Parsimmon.formatError(line.text, parseResult));
                // }
            } 
            catch (error) {
                console.log(error); 
            }
        }
        return matches;
    }
}