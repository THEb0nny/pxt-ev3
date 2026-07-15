/// <reference path="../node_modules/pxt-core/localtypings/pxtarget.d.ts" />
/// <reference path="../node_modules/pxt-core/built/pxtcompiler.d.ts" />
/// <reference path="../node_modules/pxt-core/built/pxtlib.d.ts" />
/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>

import { deployCoreAsync } from "./deploy";
import { showUploadDialogAsync } from "./dialogs";

export let projectView: pxt.editor.IProjectView;

let projectPxtJson: any = null;

async function loadProjectPxtJson(view: any): Promise<boolean> {
    const mainEditor: any = view.editor || view.blocksEditor;
    if (mainEditor?.currFile?.epkg?.files?.["pxt.json"]) {
        projectPxtJson = JSON.parse(mainEditor.currFile.epkg.files["pxt.json"].content);
        return true;
    }
    return false;
}

pxt.editor.initExtensionsAsync = function (opts: pxt.editor.ExtensionOptions): Promise<pxt.editor.ExtensionResult> {
    pxt.debug('loading pxt-ev3 target extensions...')
    projectView = opts.projectView;
    
    loadProjectPxtJson(projectView).catch(console.error);

    const res: pxt.editor.ExtensionResult = {
        deployAsync: deployCoreAsync,
        showUploadInstructionsAsync: showUploadDialogAsync
    };

    /*
    initAsync().catch(e => {
        // probably no HID - we'll try this again upon deployment
    })
    initAsync().catch(console.error);
    */
    return Promise.resolve<pxt.editor.ExtensionResult>(res);
};

(window as any).reloadProjectPxtJson = async () => await loadProjectPxtJson(projectView);
(window as any).getPxtJson = async (): Promise<any> => {
    await (window as any).reloadProjectPxtJson();
    return projectPxtJson;
};