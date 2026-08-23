import * as React from "react";

import { canUseWebSerial, setUseFileTransfer, setUseBluetoothWebSerial } from "./deploy";
import { projectView } from "./extension";


enum UploadMethod {
    None,
    FileTransfer,
    // HID,
    Bluetooth
}

let dontShowBluetoothTransferDialog = false;
// let dontShowFileTransferDialog = false;

let confirmAsync: (options: any) => Promise<number>;

export function setConfirmAsync(fn: (options: any) => Promise<number>) {
    confirmAsync = fn;
}

// export function setDontShowFileTransferDialog(value: boolean) {
//     dontShowFileTransferDialog = value;
// }

// export function shouldShowFileTransferDialog(): boolean {
//     return !dontShowFileTransferDialog;
// }

export function showDownloadDialog(projectName: string): Promise<void> {
    if (!confirmAsync) {
        console.error("Download dialog is not initialized.");
        return Promise.resolve();
    }

    // https://msdn.microsoft.com/en-us/library/cc848897.aspx
    // "For security reasons, data URIs are restricted to downloaded resources.
    // Data URIs cannot be used for navigation, for scripting, or to populate frame or iframe elements"
    const downloadFile = !pxt.BrowserUtils.isIE() && !pxt.BrowserUtils.isEdge();
    const docUrl = pxt.appTarget.appTheme.usbDocs ? pxt.appTarget.appTheme.usbDocs : false;
    let selectedTransport = UploadMethod.None;

    const jsx =
        <div className="ui grid stackable">
            <div className="column five wide download-hint">
                <div className="ui header">{lf("First time here?")}</div>
                <strong style={{ fontSize: "small" }}>{lf("You must have version 1.10E or above of the firmware")}</strong>
                <div style={{ justifyContent: "center", display: "flex", padding: "1rem" }}>
                    <img className="ui image" src="/static/download/firmware.png" style={{ height: "100px" }} />
                </div>
                <a href="/troubleshoot" target="_blank">{lf("Check your firmware version here and update if needed")}</a>
            </div>
            <div className="column eleven wide">
                <div className="ui grid">
                    <div className="row">
                        <div className="column">
                            <div className="ui two column grid padded">
                                <div className="column">
                                    <div className="ui">
                                        <div className="image">
                                            <img className="ui medium rounded image" src="/static/download/connect.svg" style={{ height: "109px", width: "261px", marginBottom: "1rem" }} />
                                        </div>
                                        <div className="content">
                                            <div className="description">
                                                <span className="ui yellow circular label">1</span>
                                                <strong>{lf("Connect the EV3 to your computer with a USB cable")}</strong>
                                                <br />
                                                <span style={{ fontSize: "small" }}>{lf("Use the miniUSB port on the top of the EV3 Brick")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="ui">
                                        <div className="image">
                                            <img className="ui medium rounded image" src="/static/download/transfer.svg" style={{ height: "109px", width: "261px", marginBottom: "1rem" }} />
                                        </div>
                                        <div className="content">
                                            <div className="description">
                                                <span className="ui yellow circular label">2</span>
                                                <strong>{lf("Move the .uf2 file to the EV3 Brick")}</strong>
                                                <br />
                                                <span style={{ fontSize: "small" }}>{lf("Locate the downloaded .uf2 file and drag it to the EV3 USB drive")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>;

    return confirmAsync({
        header: lf("Download to your EV3"),
        jsx,
        hasCloseIcon: true,
        hideCancel: true,
        hideAgree: false,
        agreeLbl: lf("I got it"),
        className: 'downloaddialog',
        buttons: [
            canUseWebSerial() && {
                label: lf("Bluetooth"),
                icon: "bluetooth",
                className: "bluetooth focused",
                onclick: () => {
                    selectedTransport = UploadMethod.Bluetooth;
                }
            }, downloadFile && {
                label: projectName + ".uf2",
                icon: "download",
                className: "lightgrey focused",
                onclick: () => {
                    selectedTransport = UploadMethod.FileTransfer;
                }
            }, docUrl && {
                label: lf("Help"),
                icon: "help",
                className: "lightgrey",
                url: docUrl
            }
        ]
        //timeout: 20000
    }).then(() => {
        switch (selectedTransport) {
            case UploadMethod.FileTransfer:
                pxt.tickEvent("upload.fileTransfer");
                setUseFileTransfer();
                return projectView.compile();
            case UploadMethod.Bluetooth:
                pxt.tickEvent("upload.bluetooth");
                setUseBluetoothWebSerial();
                return explainWebSerialPairingAsync()
                    .then(() => projectView.compile());
            default:
                return;
        }
    });
}

export function showFileTransferDialog() {
    return (
        <div className="ui grid stackable">
            <div className="column five wide download-hint">
                <div className="ui header">
                    {lf("First time here?")}
                </div>

                <strong style={{ fontSize: "small" }}>
                    {lf("You must have version 1.10E or above of the firmware")}
                </strong>

                <div style={{
                    justifyContent: "center",
                    display: "flex",
                    padding: "1rem"
                }}>
                    <img
                        className="ui image"
                        src="/static/download/firmware.png"
                        style={{ height: "100px" }}
                    />
                </div>

                <a href="/troubleshoot" target="_blank">
                    {lf("Check your firmware version here and update if needed")}
                </a>
            </div>

            <div className="column eleven wide">
                <div className="ui grid">
                    <div className="row">
                        <div className="column">
                            <div className="ui two column grid padded">
                                <div className="column">
                                    <div className="ui">
                                        <div className="image">
                                            <img
                                                className="ui medium rounded image"
                                                src="/static/download/connect.svg"
                                                style={{
                                                    height: "109px",
                                                    width: "261px",
                                                    marginBottom: "1rem"
                                                }}
                                            />
                                        </div>

                                        <div className="content">
                                            <div className="description">
                                                <span className="ui yellow circular label">1</span>
                                                <strong>
                                                    {lf("Connect the EV3 to your computer with a USB cable")}
                                                </strong>
                                                <br />
                                                <span style={{ fontSize: "small" }}>
                                                    {lf("Use the miniUSB port on the top of the EV3 Brick")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="column">
                                    <div className="ui">
                                        <div className="image">
                                            <img
                                                className="ui medium rounded image"
                                                src="/static/download/transfer.svg"
                                                style={{
                                                    height: "109px",
                                                    width: "261px",
                                                    marginBottom: "1rem"
                                                }}
                                            />
                                        </div>

                                        <div className="content">
                                            <div className="description">
                                                <span className="ui yellow circular label">2</span>
                                                <strong>
                                                    {lf("Move the .uf2 file to the EV3 Brick")}
                                                </strong>
                                                <br />
                                                <span style={{ fontSize: "small" }}>
                                                    {lf("Locate the downloaded .uf2 file and drag it to the EV3 USB drive")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="row" style={{ paddingTop: 0 }}>
                        <div className="column">
                            <div className="ui toggle checkbox">
                                <input
                                    type="checkbox"
                                    onChange={e => {
                                        dontShowFileTransferDialog = e.currentTarget.checked;
                                    }}
                                />
                                <label>{lf("Don't show this again")}</label>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

function explainWebSerialPairingAsync(): Promise<void> {
    if (dontShowBluetoothTransferDialog || !confirmAsync) return Promise.resolve();
    if (!dontShowBluetoothTransferDialog) dontShowBluetoothTransferDialog = true;
    
    return confirmAsync({
        header: lf("Bluetooth pairing"),
        hasCloseIcon: false,
        hideCancel: true,
        buttons: [{
            label: lf("Help"),
            icon: "question circle",
            className: "lightgrey",
            url: "/bluetooth"
        }],
        jsx: <div>
            <p>{lf("Bluetooth download uses Web Serial. Your browser will ask you to select a serial port.")}</p>
            <p>{lf("Make sure your EV3 is turned on and already paired with your computer.")}</p>
            <p>{lf("Close EV3 Lab or EV3 Classroom, Port View, and any other applications that may be using the EV3 Bluetooth connection.")}</p>
            <p>
                {pxt.BrowserUtils.isWindows()
                    ? lf("On Windows, look for 'Serial Port' or 'Standard Serial over Bluetooth link'.")
                    : lf("On macOS, look for 'cu.EV3-SerialPort'.")}
            </p>
            {pxt.BrowserUtils.isWindows() && (
                <p>{lf("Windows 10 provides the device name to the browser, but Windows 11 does not.")}</p>
            )}
            <p>{lf("Try to avoid selecting unrelated COM ports or USB devices.")}</p>
        </div>
    }).then(() => {})
}

export function bluetoothTryAgainAsync(): Promise<void> {
    return confirmAsync({
        header: lf("Bluetooth download failed..."),
        jsx: <ul>
            <li>{lf("Make sure you exit the 'Port View' apps or other EV3 apps.")}</li>
            <li>{lf("Exit the pop-up windows on the EV3.")}</li>
            <li>{lf("Close EV3 Lab or EV3 Classroom or other MakeCode editor tabs as they may be using the COM port.")}</li>
            <li>{lf("Try restarting the MakeCode editor tab.")}</li>
        </ul>,
        hasCloseIcon: true,
        hideCancel: false,
        hideAgree: false,
        agreeLbl: lf("Try again")
    }).then(r => {});
}

export function showEv3BusyDialogAsync(): Promise<void> {
    return confirmAsync({
        header: lf("EV3 is busy"),
        body: lf("The EV3 brick is currently running a program. Please stop it and try again."),
        hasCloseIcon: false,
        hideCancel: true,
        hideAgree: false,
        agreeLbl: lf("OK")
    }).then(r => {});
}