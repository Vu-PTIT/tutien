const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const client = path.join(root, 'client');
const sourceExtensions = new Set(['.gd', '.godot', '.tres', '.tscn']);
const sources = [];
const imports = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) sources.push(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.import')) imports.push(fullPath);
  }
}

collect(client);

function generatedByImport(resourcePath) {
  const resourceUri = `res://${resourcePath}`;
  for (const importPath of imports) {
    const config = fs.readFileSync(importPath, 'utf8');
    if (!config.includes(resourceUri)) continue;
    const source = config.match(/^source_file\s*=\s*"res:\/\/([^"\n]+)"/m);
    if (source && fs.existsSync(path.join(client, source[1]))) return true;
  }
  return false;
}

function dynamicResourceExists(resourcePath) {
  if (!resourcePath.includes('%d')) return false;
  const directory = path.dirname(path.join(client, resourcePath));
  if (!fs.existsSync(directory)) return false;
  const expression = new RegExp(`^${path.basename(resourcePath).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('%d', '\\d+')}$`);
  return fs.readdirSync(directory).some((name) => expression.test(name));
}

const missing = [];
let references = 0;
for (const sourcePath of sources) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  for (const match of source.matchAll(/res:\/\/([^"'`\s,)]+)/g)) {
    const resourcePath = match[1].replace(/::[^/]+$/, '');
    references += 1;
    if (!fs.existsSync(path.join(client, resourcePath)) && !generatedByImport(resourcePath) && !dynamicResourceExists(resourcePath)) {
      const line = source.slice(0, match.index).split('\n').length;
      missing.push(`${path.relative(root, sourcePath)}:${line}: ${resourcePath}`);
    }
  }
}

if (missing.length > 0) {
  throw new Error(`Missing Godot resources:\n${missing.join('\n')}`);
}

console.log(`PASS Godot scene/resource audit: ${sources.length} source files, ${references} resource references.`);
