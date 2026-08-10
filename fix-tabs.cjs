const fs = require('fs');

let code = fs.readFileSync('src/components/admin/UnifiedCmsManager.jsx', 'utf8');

const tabs = ['hero', 'portfolio', 'sewouts', 'team', 'faqs', 'testimonials', 'globals'];

for (let tab of tabs) {
  const searchStr = `{activeTab === '${tab}' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}`;
  const replaceStr = `{activeTab === '${tab}' && (<>\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}`;
  code = code.replace(searchStr, replaceStr);
}

code = code.replace(/\n      \)\}/g, '\n      </>)}');

fs.writeFileSync('src/components/admin/UnifiedCmsManager.jsx', code);
console.log('Fixed syntax error in UnifiedCmsManager.jsx');
