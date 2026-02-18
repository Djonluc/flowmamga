const fs = require('fs');
const content = fs.readFileSync('src-tauri/Cargo.lock', 'utf8');
const blocks = content.split('[[package]]');
for (const block of blocks) {
    if (block.includes('name = "tauri"') && !block.includes('name = "tauri-')) {
        console.log(block.trim());
    }
}
