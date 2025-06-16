/*
Run ``node npm-install-subfolders.js`` right in the repository root. This will scan through the widget folders and install all dependencies.
Run ``node npm-install-subfolders.js -- -af`` to perform an ``npm audit fix`` in the same subfolders.
*/

const { execSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const initialDir = process.cwd(); // Store the initial working directory

const findDirectSubfolders = (dir) => {
    const subfolders = [];
    const items = readdirSync(dir);

    items.forEach(item => {
        const fullPath = join(dir, item);
        if (statSync(fullPath).isDirectory()) {
            // Check if the directory contains a package.json file
            if (readdirSync(fullPath).includes('package.json')) {
                subfolders.push(fullPath);
            }
        }
    });

    return subfolders;
}

const processSubfolders = (subfolders) => {
    subfolders.forEach(folder => {
        try {
            console.log(`Installing npm packages in ${folder}...`);
            process.chdir(folder);
            modeFlag==="af" ? execSync('npm audit fix', { stdio: 'inherit' }) : execSync('npm install', { stdio: 'inherit' });
        } catch (error) {
            console.error(`Failed to install in ${folder}: ${error}`);
            // process.exit(1);
        } finally {
            process.chdir(initialDir); // Always return to the initial directory
        }
    });
}

let rootDir = './widgets';
let modeFlag = null;

const args = process.argv.slice(2);
args.forEach((arg, index) => {
  if (arg === '--path') {
    rootDir = args[index + 1]; // The value after --path
  } else if (arg.startsWith('-')) {
    modeFlag = arg.slice(1); // Extract the flag part, e.g., "af" from "-af"
  }
});

// const rootDir = process.argv.length>2 ? resolve(process.argv[2]) : resolve('./widgets'); // Ensure rootDir is an absolute path
console.log(`Searching for widget folders in rootDir '${rootDir}'`);

const subfolders = findDirectSubfolders(rootDir);
console.log('Widget folders found:', subfolders);

processSubfolders(subfolders);
