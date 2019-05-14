"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
// class definition
class IDLRoutineHelper {
    constructor(connection, documents) {
        this.connection = connection;
        this.documents = documents;
        this.routines = this._parseRoutines();
    }
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    completion(_textDocumentPosition) {
        return this.routines.docs;
    }
    postCompletion(item) {
        // // get the id
        // const key = item.data.toString();
        // // check if function or procedure
        // switch (true) {
        // 	default:
        // 		// do nothing
        // }
        return item;
    }
    _parseRoutines() {
        // load our different routines
        const idlRoutines = require("../../routines/idl.json");
        // give proper symbol
        idlRoutines.docs.forEach((item, idx) => {
            // get key as string
            const str = idx.toString();
            // check for our system variable !null
            if (item.label === null) {
                item.label = "!null";
            }
            // handle setting proper information for our data things and such
            switch (true) {
                case idlRoutines.functions[str]:
                    item.insertText = item.label + "(";
                    item.kind = vscode_languageserver_1.CompletionItemKind.Function;
                    break;
                case idlRoutines.procedures[str]:
                    item.insertText = item.label + ",";
                    item.kind = vscode_languageserver_1.CompletionItemKind.Function;
                    break;
                case item.label.startsWith("!"):
                    item.kind = vscode_languageserver_1.CompletionItemKind.Constant;
                    break;
                default:
                    item.kind = vscode_languageserver_1.CompletionItemKind.Text;
            }
            // check if we are an ENVI task, replace with ENVITask('TaskName')
            if (item.label.startsWith("ENVI") && item.label.endsWith("Task")) {
                item.insertText =
                    "ENVITask('" +
                        item.label.substr(0, item.label.length - 4).substr(4) +
                        "')";
            }
            // check if we are an IDL task, replace with ENVITask('TaskName')
            if (item.label.startsWith("IDL") && item.label.endsWith("Task")) {
                item.insertText =
                    "IDLTask('" +
                        item.label.substr(0, item.label.length - 4).substr(3) +
                        "')";
            }
            // save change
            idlRoutines.docs[idx] = item;
        });
        return idlRoutines;
    }
}
exports.IDLRoutineHelper = IDLRoutineHelper;
//# sourceMappingURL=idl-routine-helper.js.map