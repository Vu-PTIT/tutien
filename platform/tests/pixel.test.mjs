import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PALETTE, SPRITES, HOUSES, dayTint, textWidth } from '../src/pixel.mjs';
import { ICON_GRIDS } from '../src/art.mjs';
// Guards for docs/game-design/12-art-bible.md §5 and 11-world-bible.md §6.
const LINH = '#3FD6B8', ODD = '#8F6BFF';
test('master palette stays within 96 colours',()=>{
 assert.ok(new Set(Object.values(PALETTE).map(c=>c.toUpperCase())).size<=96);
});
test('teal is reserved for linh energy and purple for ngoài chuẩn',()=>{
 for(const [key,col] of Object.entries(PALETTE)){
  if(col.toUpperCase()===LINH||col.toUpperCase()==='#B8FFF0')assert.match(key,/^linh/,key);
  if(col.toUpperCase()===ODD)assert.match(key,/^odd/,key);
 }
 for(const file of ['src/pixel.mjs','src/art.mjs','src/app.mjs']){
  const src=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').toUpperCase();
  assert.ok(src.split(LINH).length-1<=(file==='src/pixel.mjs'?1:0),`${file} uses linh teal outside the palette`);
  assert.ok(!src.includes(ODD)||file==='src/pixel.mjs',file);
 }
 for(const def of Object.values(ICON_GRIDS))for(const [k,v] of Object.entries(def))if(k!=='rows')assert.notEqual(String(v).toUpperCase(),LINH);
});
test('sprites only reference palette colours',()=>{
 for(const [name,s] of Object.entries(SPRITES))for(const row of s.rows)for(const ch of row){
  if(ch==='.')continue;const key=s.key[ch];assert.ok(key,`${name}: unknown char ${ch}`);
  assert.ok(PALETTE[key]||['body','bodyD'].includes(key),`${name}: ${key}`);
 }
});
test('pixel icons are square 16×16 grids with every colour defined',()=>{
 for(const [name,def] of Object.entries(ICON_GRIDS)){
  assert.equal(def.rows.length,16,name);
  for(const row of def.rows){assert.equal(row.length,16,name);for(const ch of row)if(ch!=='.'&&ch!=='o')assert.ok(def[ch],`${name}: ${ch}`);}
 }
});
test('signboard text fits its house front',()=>{
 for(const h of HOUSES)if(h.sign)assert.ok(textWidth(h.sign)<=h.w-10,h.sign);
});
test('time-of-day tint follows the art bible keys',()=>{
 assert.deepEqual(dayTint(12).rgb,[255,255,255]);
 assert.deepEqual(dayTint(17.5).rgb,[255,217,168]);
 assert.ok(dayTint(21).dark>.4&&dayTint(2).dark>dayTint(21).dark);
 assert.ok(dayTint(7).dark<.1);
});
