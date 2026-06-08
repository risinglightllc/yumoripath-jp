const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// Touch to force fresh build
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('Touched package.json');