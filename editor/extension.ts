/// <reference path="../node_modules/pxt-core/localtypings/pxtarget.d.ts" />
/// <reference path="../node_modules/pxt-core/built/pxtcompiler.d.ts" />
/// <reference path="../node_modules/pxt-core/built/pxtlib.d.ts" />
/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>


import { deployCoreAsync, isDeployTransportSelected, resetDeployTransport } from "./deploy";
import { setConfirmAsync, showDownloadDialog, showFileTransferDialog } from "./dialogs";

export let projectView: pxt.editor.IProjectView;

let projectPxtJson: JSON;

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
        initAsync: async ({ confirmAsync }) => {
            setConfirmAsync(confirmAsync);
        },
        onDownloadButtonClick: async () => {
            if (isDeployTransportSelected()) {
                return projectView.compile();
            }

            const pxtJson = await (window as any).getPxtJson();
            const projectName = pxtJson?.name || "pxt";

            await showDownloadDialog(projectName);
        },
        showUploadInstructionsAsync: (fn, url, confirmAsync) => {
            return showFileTransferDialog(fn, url, confirmAsync);
        },
        getDownloadMenuItems: () => [
            // {
            //     text: lf("Download as File"),
            //     icon: "download",
            //     onClick: () => {
            //         pxt.tickEvent("upload.fileTransfer");
            //         setUseFileTransfer();
            //         return projectView.compile();
            //     }
            // },
            isDeployTransportSelected() && {
                text: lf("Upload method"),
                icon: "exchange",
                onClick: () => {
                    resetDeployTransport();

                    const pxtJson = (window as any).getPxtJson();
                    const projectName = pxtJson?.name || "pxt";

                    return showDownloadDialog(projectName);
                }
            },
            {
                text: lf("Help"),
                icon: "help",
                onClick: () => {
                    window.open("/troubleshoot", "_blank");
                }
            }
        ].filter(Boolean)
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