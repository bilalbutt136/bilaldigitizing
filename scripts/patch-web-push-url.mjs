import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'node_modules', 'web-push', 'src', 'web-push-lib.js');

if (!fs.existsSync(target)) process.exit(0);

let source = fs.readFileSync(target, 'utf8');
const before = source;

source = source
  .replace(/const url = require\('url'\);\r?\n/, '')
  .replace('const parsedUrl = url.parse(subscription.endpoint);', 'const parsedUrl = new URL(subscription.endpoint);')
  .replace('const urlParts = url.parse(requestDetails.endpoint);', 'const urlParts = new URL(requestDetails.endpoint);')
  .replace('httpsOptions.path = urlParts.path;', 'httpsOptions.path = urlParts.pathname + urlParts.search;');

if (source !== before) {
  fs.writeFileSync(target, source);
  console.log('[postinstall] Patched web-push to use the WHATWG URL API.');
}
