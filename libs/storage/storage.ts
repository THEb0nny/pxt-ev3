enum CSVSeparator {
    //% block="comma"
    Comma = ",",
    //% block="semicolon"
    Semicolon = ";"
}

//% color="#FE5722" weight=5 icon="\uf1c0"
namespace storage {

    //% shim=storage::__unlink
    function __unlink(filename: string): void { }
    //% shim=storage::__truncate
    function __truncate(filename: string): void { }

    let csvSeparator: CSVSeparator = CSVSeparator.Comma;


    function toCSV(data: number[], sep: string) {
        let s = "";
        for (const d of data) {
            if (s) s += sep;
            s = s + d;
        }
        s += "\r\n";
        return s;
    }


    /**
     * Set for CSV file separator.
     * It is necessary to use depending on your regional settings of the application displaying CSV. By default, a comma is used.
     * @param sep separator character, eg: CSVSeparator.Comma
     */
    //% blockId=storageSetCSVSeparator
    //% block="storage CSV set $sep|separator"
    //% weight=80
    //% blockGap=8
    //% inlineInputMode=inline
    //% subcategory="Extra"
    //% group="Manage"
    export function setCSVSeparator(sep: CSVSeparator) {
        csvSeparator = sep;
    }


    //% fixedInstances
    export class Storage {

        constructor() {
        }

        protected mapFilename(filename: string) {
            return filename;
        }

        private getFile(filename: string): MMap {
            filename = this.mapFilename(filename);
            let r = control.mmap(filename, 0, 0);
            if (!r) {
                __mkdir(this.dirname(filename));
                __truncate(filename);
                r = control.mmap(filename, 0, 0);
            }
            if (!r) control.panic(906);
            return r
        }

        dirname(filename: string) {
            let last = 0;
            for (let i = 0; i < filename.length; ++i) {
                if (filename[i] == "/") last = i;
            }
            return filename.substr(0, last);
        }

        /**
         * Append string data to a new or existing file.
         * If you plan to save a text file to the EV3's permanent memory, then you should use the rtf format, as it is displayed and readable in the EV3 interface.
         * If you specify PathName/data.rtf, you can save the file in a folder.
         * All user folders can be manually deleted on the controller.
         * @param filename the file name to append data, eg: "data.rtf"
         * @param data the data to append
         */
        //% blockId=storageAppend
        //% block="storage $source|$filename|append $data"
        //% weight=94
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Write"
        append(filename: string, data: string): void {
            this.appendBuffer(filename, __stringToBuffer(data));
        }

        /**
         * Appends a new line of data in the file.
         * If you plan to save a text file to the EV3's permanent memory, then you should use the rtf format, as it is displayed and readable in the EV3 interface.
         * If you specify PathName/data.rtf, you can save the file in a folder.
         * All user folders can be manually deleted on the controller.
         * @param filename the file name to append data, eg: "data.rtf"
         * @param data the data to append
         */
        //% blockId=storageAppendLine
        //% block="storage $source|$filename|append line $data"
        //% weight=93
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Write"
        appendLine(filename: string, data: string): void {
            this.append(filename, data + "\r\n");
        }

        /** Append a buffer to a new or existing file. */
        appendBuffer(filename: string, data: Buffer): void {
            let f = this.getFile(filename);
            f.lseek(0, SeekWhence.End);
            f.write(data);
        }

        /**
         * Append a row of CSV headers.
         * If you plan to store CSV in the EV3's persistent memory, the EV3 interface does not display this format.
         * @param filename the file name to append data, eg: "data.csv"
         * @param headers the data to append
         */
        //% blockId=storageAppendCSVHeaders
        //% block="storage $source|$filename|append CSV headers $headers"
        //% weight=89
        //% blockGap=8
        //% inlineInputMode=inline
        //% subcategory="Extra"
        //% group="Write"
        appendCSVHeaders(filename: string, headers: string[]) {
            let s = "";
            for (const d of headers) {
                if (s) s += csvSeparator;
                s = s + d;
            }
            s += "\r\n";
            this.append(filename, s);
        }

        /**
         * Append a row of CSV data.
         * If you plan to store CSV in the EV3's persistent memory, the EV3 interface does not display this format.
         * @param filename the file name to append data, eg: "data.csv"
         * @param data the data to append
         */
        //% blockId=storageAppendCSV
        //% block="storage $source|$filename|append CSV $data"
        //% weight=88
        //% blockGap=8
        //% inlineInputMode=inline
        //% subcategory="Extra"
        //% group="Write"
        appendCSV(filename: string, data: number[]) {
            let s = toCSV(data, csvSeparator);
            this.append(filename, s);
        }

        /**
         * Read CSV row as array of strings.
         * @param filename the CSV file name, eg: "data.csv"
         * @param row CSV row number starting from 0
         */
        //% blockId=storageReadCSVRow
        //% block="storage $source|read CSV $filename|row $row"
        //% weight=87
        //% blockGap=8
        //% inlineInputMode=inline
        //% subcategory="Extra"
        //% group="Read"
        readCSVRow(filename: string, row: number): string[] {
            const text = this.read(filename);
            let rows = text.split("\n"); // Split file into rows
            // Remove \r from row endings
            for (let i = 0; i < rows.length; i++) {
                rows[i] = rows[i].replace("\r", "");
            }
            if (row < 0 || row >= rows.length) return []; // Row does not exist
            if (!rows[row]) return []; // Empty rows
            return rows[row].split(csvSeparator); // Split CSV columns
        }

        /**
         * Overwrite file with string data.
         * If you plan to save a text file to the EV3's permanent memory, then you should use the rtf format, as it is displayed and readable in the EV3 interface.
         * @param filename the file name to append data, eg: "data.rtf"
         * @param data the data to append
         */
        //% blockId=storageOverwrite
        //% block="storage $source|$filename|overwrite with|$data"
        //% weight=95
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Write"
        overwrite(filename: string, data: string): void {
            this.overwriteWithBuffer(filename, __stringToBuffer(data));
        }

        /** Overwrite file with a buffer. */
        overwriteWithBuffer(filename: string, data: Buffer): void {
            __truncate(this.mapFilename(filename));
            this.appendBuffer(filename, data);
        }

        /**
         * Tests if a file exists.
         * @param filename the file name to append data, eg: "data.rtf"
         */
        //% blockId=storageExists
        //% block="storage $source|$filename|exists"
        //% weight=99
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Read"
        exists(filename: string): boolean {
            return !!control.mmap(this.mapFilename(filename), 0, 0);
        }

        /**
         * Delete a file, or do nothing if it doesn't exist.
         * @param filename the file name to append data, eg: "data.rtf"
         */
        //% blockId=storageRemove
        //% block="storage $source|remove $filename"
        //% weight=97
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Manage"
        remove(filename: string): void {
            __unlink(this.mapFilename(filename));
        }

        /**
         * Return the size of the file, or -1 if it doesn't exists.
         * @param filename the file name to append data, eg: "data.rtf"
         */
        //% blockId=storageSize
        //% block="storage $source|$filename|size"
        //% weight=98
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Read"
        size(filename: string): int32 {
            let f = control.mmap(this.mapFilename(filename), 0, 0);
            if (!f) return -1;
            return f.lseek(0, SeekWhence.End);
        }

        /**
         * Read contents of file as a string.
         * @param filename the file name to append data, eg: "data.rtf"
         */
        //% blockId=storageRead
        //% block="storage $source|read $filename|as string"
        //% weight=96
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Read"
        read(filename: string): string {
            return __bufferToString(this.readAsBuffer(filename));
        }

        /** Read contents of file as a buffer. */
        readAsBuffer(filename: string): Buffer {
            let f = this.getFile(filename);
            let sz = f.lseek(0, SeekWhence.End);
            let b = output.createBuffer(sz);
            f.lseek(0, SeekWhence.Set);
            f.read(b);
            return b;
        }

        /**
         * Resizing the size of a file to stay under the limit.
         * @param filename name of the file to drop, eg: "data.rtf"
         * @param size maximum length
         */
        //% blockId=storageLimit
        //% block="storage $source|limit $filename|to $size|bytes"
        //% weight=100
        //% blockGap=8
        //% inlineInputMode=inline
        //% group="Manage"
        limit(filename: string, size: number) {
            if (!this.exists(filename) || size < 0) return;

            const sz = storage.temporary.size(filename);
            if (sz > size) {
                let buf = storage.temporary.readAsBuffer(filename);
                buf = buf.slice(buf.length / 2);
                storage.temporary.overwriteWithBuffer(filename, buf);
            }
        }
    }


    class TemporaryStorage extends Storage {
        constructor() {
            super();
        }

        protected mapFilename(filename: string) {
            if (filename[0] == '/') filename = filename.slice(1);
            return '/tmp/logs/' + filename;
        }
    }

    /**
     * Temporary storage in memory, deleted when the device restarts.
     */
    //% whenUsed fixedInstance
    //% block="temporary"
    export const temporary: Storage = new TemporaryStorage();

    
    class PermanentStorage extends Storage {
        constructor() {
            super();
        }

        protected mapFilename(filename: string) {
            // Save simple filenames into BrkProg_SAVE:
            // data.rtf -> /home/root/lms2012/prjs/BrkProg_SAVE/data.rtf
            if (filename.indexOf("/") < 0) {
                return "/home/root/lms2012/prjs/BrkProg_SAVE/" + filename;
            }

            // Save relative paths inside prjs:
            // MyPath/data.rtf -> /home/root/lms2012/prjs/MyPath/data.rtf
            if (filename[0] != "/") {
                return "/home/root/lms2012/prjs/" + filename;
            }

            // Keep absolute Linux paths unchanged:
            // /home/root/data.rtf
            // /media/card/data.rtf
            // /mnt/ramdisk/data.rtf
            return filename;
        }
    }

    /**
     * Permanent internal storage on the brick, must be deleted with code.
     */
    //% whenUsed fixedInstance
    //% block="permanent"
    export const permanent: Storage = new PermanentStorage();


    class ExternalStorage extends Storage {
        constructor() {
            super();
        }

        protected mapFilename(filename: string) {
            if (filename[0] == '/') filename = filename.slice(1);
            return '/media/card/' + filename;
        }
    }

    /**
     * Permanent external storage on the sd card.
     */
    //% whenUsed fixedInstance
    //% block="external"
    export const external: Storage = new ExternalStorage();


    // Automatically send console output to temp storage
    storage.temporary.remove("console.txt");
    console.addListener(function(line) {
        const fn = "console.txt";
        const t = control.millis();
        storage.temporary.appendLine(fn, `${t}> ${line}`);
        storage.temporary.limit(fn, 65536);
    });

}