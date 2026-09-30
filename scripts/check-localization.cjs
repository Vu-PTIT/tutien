const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'client/translations/game.csv');

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) throw new Error('Translation CSV has an unclosed quoted field.');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function listFiles(directory, extension) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...listFiles(fullPath, extension));
    else if (entry.isFile() && fullPath.endsWith(extension)) results.push(fullPath);
  }
  return results;
}

function unquoteGodotString(value, file, lineNumber) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${path.relative(root, file)}:${lineNumber} has an invalid string literal: ${error.message}`);
  }
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = rows.shift();
if (JSON.stringify(header) !== JSON.stringify(['keys', 'vi', 'en'])) {
  throw new Error(`Expected CSV headers keys,vi,en; got ${JSON.stringify(header)}`);
}

const translations = new Map();
for (const [index, row] of rows.entries()) {
  if (row.length !== 3) throw new Error(`CSV row ${index + 2} has ${row.length} columns instead of 3.`);
  const [key, vietnamese, english] = row;
  if (!key.trim() || !vietnamese.trim() || !english.trim()) {
    throw new Error(`CSV row ${index + 2} has an empty key or translation.`);
  }
  if (translations.has(key)) throw new Error(`Duplicate translation key: ${JSON.stringify(key)}`);
  translations.set(key, { vietnamese, english });
}

const missing = [];
for (const file of listFiles(path.join(root, 'client/scenes'), '.tscn')) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(/^\s*(?:text|tooltip_text|placeholder_text)\s*=\s*("(?:\\.|[^"\\])*")\s*$/);
    if (!match) return;
    const value = unquoteGodotString(match[1], file, index + 1);
    if (value && !translations.has(value)) missing.push(`${path.relative(root, file)}:${index + 1}: ${JSON.stringify(value)}`);
  });
}

for (const file of listFiles(path.join(root, 'client/scripts'), '.gd')) {
  const source = fs.readFileSync(file, 'utf8');
  const expression = /\btr\(("(?:\\.|[^"\\])*")\)/g;
  for (const match of source.matchAll(expression)) {
    const value = unquoteGodotString(match[1], file, source.slice(0, match.index).split('\n').length);
    if (!translations.has(value)) missing.push(`${path.relative(root, file)}: tr(${JSON.stringify(value)})`);
  }
}

const mapCatalogPath = path.join(root, 'client/data/map_catalog.json');
const mapCatalog = JSON.parse(fs.readFileSync(mapCatalogPath, 'utf8'));
const translatedMapFields = new Set([
  'name', 'summary', 'details', 'route_label', 'region_title', 'region_body',
  'label', 'display_name', 'action_label', 'message', 'repeat_message', 'quest_body_after'
]);
function checkMapCopy(value, field = '') {
  if (Array.isArray(value)) {
    value.forEach((item) => checkMapCopy(item, field));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => checkMapCopy(child, key));
  } else if (typeof value === 'string' && translatedMapFields.has(field) && value.trim() && !translations.has(value)) {
    missing.push(`client/data/map_catalog.json [${field}]: ${JSON.stringify(value)}`);
  }
}
checkMapCopy(mapCatalog);

if (missing.length > 0) {
  throw new Error(`Missing localization entries:\n${missing.join('\n')}`);
}

if (translations.size < 400) throw new Error(`Expected broad Vietnamese/English coverage; found only ${translations.size} entries.`);
console.log(`PASS localization: ${translations.size} entries; all scene labels and tr() keys are covered.`);
