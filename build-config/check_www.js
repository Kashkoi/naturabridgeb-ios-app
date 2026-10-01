// Static consistency checks for www/index.html: script syntax, duplicate ids, ids and handlers
// used but not defined, and leftover sample data. Run: node build-config/check_www.js
const fs = require('fs');
const path = require('path');
const h = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
let failed = false;

[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new Function(m[1]); console.log('inline script', i, 'ok'); }
  catch (e) { failed = true; console.log('inline script', i, 'ERROR', e.message); }
});

const ids = [...h.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
console.log('ids:', ids.length, 'duplicates:', dup);
if (dup.length) failed = true;

const createdAtRuntime = new Set(['hdr-logout']);
const used = [...new Set([...h.matchAll(/getElementById\((['"])([A-Za-z0-9_-]+)\1\)/g)].map(m => m[2]))]
  .filter(x => !ids.includes(x) && !createdAtRuntime.has(x));
console.log('ids used but missing from the page:', used);
if (used.length) failed = true;

const handlers = [...new Set([...h.matchAll(/on(?:click|input|change|blur|focus)="([A-Za-z_]+)\(/g)].map(m => m[1]))]
  .filter(fn => !new RegExp('function\\s+' + fn + '\\s*\\(').test(h));
console.log('handlers without a definition:', handlers);
if (handlers.length) failed = true;

const sample = ['hdr-credits', '$99', 'hERG IC50', '_usedCredits', 's-results', '1 credit', 'Turmeric + Warfarin'].filter(x => h.includes(x));
console.log('sample or dead data left in the page:', sample);
if (sample.length) failed = true;

process.exit(failed ? 1 : 0);
