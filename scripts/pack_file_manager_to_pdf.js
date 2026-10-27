const fs = require('fs');
const path = require('path');

/**
 * Packs an EV3 UF2 file (ELF) into an EV3-executable UF2 bundle with an .rbf launcher,
 * and appends it to a PDF template to produce a polyglot PDF installer.
 *
 * @param {string} rawUf2Path - Path to compiled binary.uf2 (ELF wrapped in UF2 blocks)
 * @param {string} outputPath - Output file path (.pdf or .uf2)
 * @param {string} [pdfTemplatePath] - Path to base PDF template
 */
function buildFileManagerPdf(
    rawUf2Path,
    outputPath = path.join(__dirname, '../docs/file-manager.pdf'),
    pdfTemplatePath = path.join(__dirname, '../docs/file-manager.pdf')
) {
    if (!fs.existsSync(rawUf2Path)) {
        console.error(`Error: Input UF2 file not found: ${rawUf2Path}`);
        process.exit(1);
    }

    const rawUf2Buf = fs.readFileSync(rawUf2Path);
    const appName = 'File_manager';

    // RBF launcher template (LEGO Mindstorms Robot Bytecode)
    // Runs the ELF binary via system call: ../prjs/BrkProg_SAVE/File_manager.elf
    const rbfTemplate = '4c45474f580000006d000100000000001c000000000000000e000000821b038405018130813e805374617274696e672e2e2e0084006080XX00448581644886488405018130813e80427965210084000a';
    const elfPath = '../prjs/BrkProg_SAVE/' + appName + '.elf';
    const rbfHex = rbfTemplate.replace('XX', Buffer.from(elfPath, 'utf8').toString('hex'));
    const rbfBin = Buffer.from(rbfHex, 'hex');
    rbfBin.writeUInt16LE(rbfBin.length, 4);

    const oldNumBlocks = rawUf2Buf.length / 512;
    const totalBlocks = oldNumBlocks + 1;

    const elfFilename = 'Projects/BrkProg_SAVE/' + appName + '.elf';
    const rbfFilename = 'Projects/BrkProg_SAVE/' + appName + '.rbf';

    const outUf2 = Buffer.alloc(totalBlocks * 512);
    rawUf2Buf.copy(outUf2, 0);

    // Update block count and set file path for all ELF blocks
    for (let i = 0; i < oldNumBlocks; i++) {
        const offset = i * 512;
        outUf2.writeUInt32LE(totalBlocks, offset + 24);
        outUf2.fill(0, offset + 288, offset + 508);
        outUf2.write(elfFilename, offset + 288, 'utf8');
    }

    // Append RBF launcher block
    const rbfOffset = oldNumBlocks * 512;
    outUf2.writeUInt32LE(0x0A324655, rbfOffset + 0);
    outUf2.writeUInt32LE(0x9E5D5157, rbfOffset + 4);
    outUf2.writeUInt32LE(0x00001000, rbfOffset + 8); // flags: familyID present
    outUf2.writeUInt32LE(0, rbfOffset + 12);
    outUf2.writeUInt32LE(256, rbfOffset + 16);
    outUf2.writeUInt32LE(oldNumBlocks, rbfOffset + 20); // block number
    outUf2.writeUInt32LE(totalBlocks, rbfOffset + 24); // total blocks
    outUf2.writeUInt32LE(rbfBin.length, rbfOffset + 28); // file size
    rbfBin.copy(outUf2, rbfOffset + 32);
    outUf2.write(rbfFilename, rbfOffset + 288, 'utf8');
    outUf2.writeUInt32LE(0x0AB16F30, rbfOffset + 508);

    if (outputPath.endsWith('.uf2')) {
        fs.writeFileSync(outputPath, outUf2);
        console.log(`Successfully generated UF2: ${outputPath} (${outUf2.length} bytes)`);
        return;
    }

    // Embed in PDF
    if (!fs.existsSync(pdfTemplatePath)) {
        console.error(`Error: PDF template not found: ${pdfTemplatePath}`);
        process.exit(1);
    }

    const pdfBuf = fs.readFileSync(pdfTemplatePath);
    const magic = Buffer.from([0x55, 0x46, 0x32, 0x0A]);
    const idx = pdfBuf.indexOf(magic);
    let cleanPdf = (idx !== -1) ? pdfBuf.slice(0, idx) : pdfBuf;
    const rem = cleanPdf.length % 512;
    if (rem !== 0) {
        cleanPdf = Buffer.concat([cleanPdf, Buffer.alloc(512 - rem, 0x20)]);
    }

    const finalBuffer = Buffer.concat([cleanPdf, outUf2]);
    fs.writeFileSync(outputPath, finalBuffer);
    console.log(`Successfully generated PDF: ${outputPath} (${finalBuffer.length} bytes)`);
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const inputUf2 = args[0] || path.join(__dirname, '../temp_build/built/binary.uf2');
    const outputPdf = args[1] || path.join(__dirname, '../docs/file-manager.pdf');
    buildFileManagerPdf(inputUf2, outputPdf);
}

module.exports = { buildFileManagerPdf };
