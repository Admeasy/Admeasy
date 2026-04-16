const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

// Fixed path: go up one level from scratch folder
const rootPath = path.join(__dirname, '..');
const clientPath = path.join(rootPath, 'Client', 'src');

console.log(`Searching in: ${clientPath}`);

walkDir(clientPath, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const originalContent = content;
        
        // Remove dark: variants from Tailwind classes
        // Improved regex to handle classes like dark:bg-slate-900/50
        content = content.replace(/\bdark:[a-z0-9\- \.\/\[\]\:\%]+/gi, "");

        // Clean up formatting issues caused by removal
        content = content.replace(/  +/g, ' ');
        content = content.replace(/ \"/g, '"');
        content = content.replace(/ \'/g, "'");
        content = content.replace(/ \`/g, '`');
        content = content.replace(/\" /g, '"');
        content = content.replace(/\' /g, "'");
        content = content.replace(/\` /g, '`');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned: ${filePath}`);
        }
    }
});

// Also clean index.html in Client root
const indexHtmlPath = path.join(rootPath, 'Client', 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let content = fs.readFileSync(indexHtmlPath, 'utf8');
    let original = content;
    content = content.replace(/\bdark:[a-z0-9\- \.\/\[\]\:\%]+/gi, "");
    if (content !== original) {
        fs.writeFileSync(indexHtmlPath, content, 'utf8');
        console.log(`Cleaned: ${indexHtmlPath}`);
    }
}
