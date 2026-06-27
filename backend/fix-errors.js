const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/OneDrive/Desktop/workpulse/backend/src/routes';
const files = fs.readdirSync(dir);

let totalReplaced = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace standard 500 error catches with throw err
  const regex = /res\.status\(500\)\.json\(\{\s*success:\s*false,\s*message:\s*err\.message\s*\}\);/g;
  const newContent = content.replace(regex, 'throw err;');
  
  // Replace 400 error catches as well if they just output err.message
  const regex400 = /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*message:\s*err\.message\s*\}\);/g;
  const finalContent = newContent.replace(regex400, 'throw err;');

  if (content !== finalContent) {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    totalReplaced++;
    console.log(`Updated ${f}`);
  }
});

console.log(`Total files updated: ${totalReplaced}`);
