const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('route.js')) results.push(file);
    }
  });
  return results;
}
const routes = walk('app/api');
routes.forEach(route => {
  let content = fs.readFileSync(route, 'utf8');
  if (content.includes("import { createAdminClient } from '/supabase/admin';")) {
    const depth = route.split(path.sep).length - 1;
    let prefix = '';
    for(let i=0; i<depth; i++) prefix += '../';
    const correctPath = prefix + 'src/lib/supabase/admin';
    content = content.replace("import { createAdminClient } from '/supabase/admin';", `import { createAdminClient } from '${correctPath}';`);
    fs.writeFileSync(route, content);
    console.log('Fixed', route);
  }
});
