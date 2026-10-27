const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { buildFileManagerPdf } = require('./pack_file_manager_to_pdf');

const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, 'temp_build_fm');
const platformCppPath = path.join(rootDir, 'libs/core/platform.cpp');
let originalPlatformCpp = null;

try {
    console.log('1. Preparing project for compilation...');
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'pxt.json'), JSON.stringify({
        name: 'File_manager',
        dependencies: {
            'ev3': 'file:../libs/ev3'
        },
        files: [
            'main.ts'
        ]
    }, null, 4));

    fs.copyFileSync(
        path.join(__dirname, 'file_manager.ts'),
        path.join(tempDir, 'main.ts')
    );

    // Temporarily enable deletePrjFile and listPrjFiles shims in platform.cpp
    originalPlatformCpp = fs.readFileSync(platformCppPath, 'utf8');
    const patchedPlatformCpp = originalPlatformCpp.replace(/\/\/\s+%/g, '//%');
    fs.writeFileSync(platformCppPath, patchedPlatformCpp);

    console.log('2. Compiling TypeScript with PXT CLI...');
    execSync('cd temp_build_fm; node ../node_modules/pxt-core/built/pxt.js build', {
        cwd: rootDir,
        shell: 'powershell.exe',
        stdio: 'inherit'
    });

    const builtUf2 = path.join(tempDir, 'built/binary.uf2');
    if (!fs.existsSync(builtUf2)) {
        throw new Error('binary.uf2 was not generated');
    }

    console.log('3. Packaging docs/file-manager.pdf...');
    const outPdf = path.join(rootDir, 'docs/file-manager.pdf');
    buildFileManagerPdf(builtUf2, outPdf);

    console.log('\nDone! Generated:', outPdf);
} finally {
    // Restore platform.cpp to original state
    if (originalPlatformCpp !== null) {
        fs.writeFileSync(platformCppPath, originalPlatformCpp);
    }
    // Clean up temporary build folder
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
