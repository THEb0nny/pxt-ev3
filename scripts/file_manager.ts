// CONSTANTS & ASSETS
// Authentic 8x8 bold font from original stable pxt-ev3 (file_manager.pdf from 2019)
const originalBoldFont: image.Font = {
    charWidth: 8,
    charHeight: 8,
    data: hex`2000000000000000000021000000065f5f060000220000030300030300002300147f7f147f7f14002400242e6b6b3a1200002500466630180c6662002600307a4f5d377a4800270004070300000000002800001c3e634100000029000041633e1c0000002a00082a3e1c1c3e2a082b0008083e3e080800002c000080e060000000002d0008080808080800002e0000006060000000002f006030180c0603010030003e7f71594d7f3e00310040427f7f404000003200627359496f6600003300226349497f3600003400181c16537f7f50003500276745457d39000036003c7e4b49793000003700030371790f0700003800367f49497f3600003900064f49693f1e00003a0000006666000000003b000080e666000000003c00081c3663410000003d0024242424242400003e00004163361c0800003f00020351590f06000040003e7f415d5d1f1e0041007c7e13137e7c00004200417f7f49497f360043001c3e6341416322004400417f7f41633e1c004500417f7f495d4163004600417f7f491d01030047001c3e63415173720048007f7f08087f7f0000490000417f7f410000004a00307040417f3f01004b00417f7f081c7763004c00417f7f41406070004d007f7f0e1c0e7f7f004e007f7f060c187f7f004f001c3e6341633e1c005000417f7f49090f060051001e3f21717f5e00005200417f7f09197f66005300266f4d5973320000540003417f7f4103000055007f7f40407f7f000056001f3f60603f1f000057007f7f3018307f7f00580043673c183c6743005900074f78784f0700005a00476371594d6773005b00007f7f41410000005c000103060c183060005d000041417f7f0000005e00080c0603060c08005f008080808080808080600000000307040000006100207454543c7840006200417f3f48487830006300387c44446c2800006400307848493f7f40006500387c54545c1800006600487e7f4903020000670098bca4a4f87c04006800417f7f08047c7800690000447d7d400000006a0060e08080fd7d00006b00417f7f10386c44006c0000417f7f400000006d007c7c18381c7c78006e007c7c04047c7800006f00387c44447c380000700084fcf8a4243c18007100183c24a4f8fc84007200447c784c041c18007300485c545474240000740000043e7f4424000075003c7c40403c7c400076001c3c60603c1c000077003c7c7038707c3c007800446c3810386c440079009cbca0a0fc7c00007a004c64745c4c6400007b0008083e77414100007c0000000077770000007d004141773e080800007e0002030103020301007f000000000000000000`
};

// NATIVE PLATFORM SHIMS
//% shim=pxt::listPrjFiles
function getPrjs(): string[] {
    return ["pxt.rbf", "test.rbf", "Untitled-1.rbf", "Untitled-1.rtf", "data.csv"];
}

//% shim=pxt::deletePrjFile
function delPrj(fn: string): void {
    console.log("Delete: " + fn);
    return;
}

// TYPES & INTERFACES
const enum ItemKind {
    File,
    Divider,
    Cancel,
    Delete
}

interface MenuItem {
    kind: ItemKind;
    fileName?: string;
    selected?: boolean;
}

// FILE SYSTEM UTILITIES
function hasFileExtension(fileName: string): boolean {
    if (!fileName || fileName.length < 3) return false;
    for (let i = fileName.length - 2; i > 0; --i) {
        if (fileName.charAt(i) == ".") return true;
    }
    return false;
}

function endsWith(str: string, suffix: string): boolean {
    if (str.length < suffix.length) return false;
    return str.substr(str.length - suffix.length, suffix.length) == suffix;
}

// Filter out non-manageable items:
// 1. Folders (such as CVS, Project) which do not have file extensions
// 2. Internal .elf binaries paired with .rbf programs
function isManageableFile(fileName: string): boolean {
    if (!fileName || fileName.charAt(0) == ".") return false;
    if (endsWith(fileName, ".elf")) return false;
    // Valid EV3 files always have an extension; folders (e.g. CVS, Project) do not
    return hasFileExtension(fileName);
}

// FILE MANAGER CONTROLLER
class FileManager {
    private items: MenuItem[] = [];
    private cursor: number = 0;
    private scrollTop: number = 0;
    private confirmDelete: boolean = false;

    constructor() {
        this.initItems();
    }

    private initItems() {
        const rawFiles = getPrjs();
        const validFiles = rawFiles.filter(isManageableFile);

        for (let i = 0; i < validFiles.length; ++i) {
            this.items.push({
                kind: ItemKind.File,
                fileName: validFiles[i],
                selected: false
            });
        }

        // Visual separator line
        this.items.push({ kind: ItemKind.Divider });

        // Action buttons
        this.items.push({ kind: ItemKind.Cancel });
        this.items.push({ kind: ItemKind.Delete });

        // If file list is empty, place cursor directly on [ Cancel ]
        this.cursor = validFiles.length > 0 ? 0 : 1;
    }

    public countSelected(): number {
        let count = 0;
        for (let i = 0; i < this.items.length; ++i) {
            if (this.items[i].kind == ItemKind.File && this.items[i].selected) {
                count++;
            }
        }
        return count;
    }

    public moveCursor(delta: number) {
        this.confirmDelete = false;
        let nextCursor = this.cursor + delta;

        // Automatically step over divider lines
        while (nextCursor >= 0 && nextCursor < this.items.length && this.items[nextCursor].kind == ItemKind.Divider) {
            nextCursor += delta;
        }

        if (nextCursor >= 0 && nextCursor < this.items.length) {
            this.cursor = nextCursor;
        }
        this.render();
    }

    public handleSelect() {
        const item = this.items[this.cursor];
        if (!item) return;

        if (item.kind == ItemKind.File) {
            item.selected = !item.selected;
            this.moveCursor(1);
        } else if (item.kind == ItemKind.Cancel) {
            control.reset();
        } else if (item.kind == ItemKind.Delete) {
            const count = this.countSelected();
            if (count == 0) return;

            if (this.confirmDelete) {
                this.executeDeletion();
            } else {
                this.confirmDelete = true;
                this.render();
            }
        }
    }

    private executeDeletion() {
        brick.clearScreen();
        screen.print("deleting...", 0, 5 * brick.lineHeight(), 1, originalBoldFont);

        for (let i = 0; i < this.items.length; ++i) {
            const item = this.items[i];
            if (item.kind == ItemKind.File && item.selected && item.fileName) {
                const fn = item.fileName;
                if (endsWith(fn, ".rbf")) {
                    delPrj(fn.substr(0, fn.length - 4) + ".elf");
                    delPrj(fn);
                } else {
                    delPrj(fn);
                }
            }
        }

        pause(1000);
        control.reset();
    }

    public render() {
        // Adjust vertical scroll view window
        if (this.cursor < this.scrollTop + 2) {
            this.scrollTop = this.cursor - 2;
        } else if (this.cursor > this.scrollTop + 11) {
            this.scrollTop = this.cursor - 11;
        }
        if (this.scrollTop < 0) {
            this.scrollTop = 0;
        }

        const selectedCount = this.countSelected();
        brick.clearScreen();

        const lineHeight = brick.lineHeight();
        for (let i = 0; i < 12; ++i) {
            const idx = this.scrollTop + i;
            if (idx >= this.items.length) break;

            const y = i * lineHeight;
            const item = this.items[idx];

            if (item.kind == ItemKind.File && item.fileName) {
                let displayName = item.fileName;
                // Hide extension only for program files (.rbf)
                if (endsWith(displayName, ".rbf")) {
                    displayName = displayName.substr(0, displayName.length - 4);
                }
                const text = (idx == this.cursor ? ">" : " ") + (item.selected ? "*" : " ") + " " + displayName;
                screen.print(text, 0, y, 1, originalBoldFont);
            } else if (item.kind == ItemKind.Divider) {
                screen.drawLine(4, y + 4, screen.width - 4, y + 4, 1);
            } else if (item.kind == ItemKind.Cancel) {
                const text = (idx == this.cursor ? "> [ Cancel ]" : "  [ Cancel ]");
                screen.print(text, 0, y, 1, originalBoldFont);
            } else if (item.kind == ItemKind.Delete) {
                const label = this.confirmDelete ? "Enter to confirm" : "Delete " + selectedCount + " file(s)";
                const text = (idx == this.cursor ? "> [ " + label + " ]" : "  [ " + label + " ]");
                screen.print(text, 0, y, 1, originalBoldFont);
            }
        }
    }
}

// APPLICATION ENTRY POINT
function main() {
    const manager = new FileManager();

    brick.buttonDown.onEvent(ButtonEvent.Pressed, () => manager.moveCursor(1));
    brick.buttonUp.onEvent(ButtonEvent.Pressed, () => manager.moveCursor(-1));
    brick.buttonEnter.onEvent(ButtonEvent.Pressed, () => manager.handleSelect());

    brick.showString("", 1);
    manager.render();
}

main();
