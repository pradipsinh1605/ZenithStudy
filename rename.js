const fs = require('fs');
const path = require('path');

const searchDir = __dirname;
const ignoredDirs = new Set(['.git', 'node_modules', '.next']);
const ignoredFiles = new Set(['package-lock.json', 'rename.js', 'rename.py']);

function replaceFunc(match) {
    if (match === "StudyBuddy") return "Learnixio";
    if (match === "studybuddy") return "learnixio";
    if (match === "STUDYBUDDY") return "LEARNIXIO";
    if (match === "Study Buddy") return "Learnixio";
    if (match === "study buddy") return "learnixio";
    if (match === "Studybuddy") return "Learnixio";
    if (match[0] === match[0].toLowerCase()) return "learnixio";
    return "Learnixio";
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (ignoredDirs.has(file)) return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (!ignoredFiles.has(file) && file.match(/\.(ts|tsx|js|jsx|json|md|sql|html|css|txt)$/)) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk(searchDir);

files.forEach(filePath => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const regex = /study\s*buddy/gi;
        if (content.match(regex)) {
            const newContent = content.replace(regex, replaceFunc);
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`Updated ${filePath}`);
        }
    } catch (e) {
        console.error(`Error processing ${filePath}: ${e}`);
    }
});

console.log("Done");
