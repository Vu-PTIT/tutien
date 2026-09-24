// Decode every PNG stream, including assets that a headless map test may not visit.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../client/assets');
const table = Array.from({length:256}, (_, n) => {
  for (let i=0;i<8;i++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
let count = 0;
function scan(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir,e.name);
    if (e.isDirectory()) { scan(file); continue; }
    if (!file.endsWith('.png')) continue;
    const b = fs.readFileSync(file), chunks = [];
    assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);
    let pos=8, ended=false;
    while (pos < b.length) {
      assert.ok(pos+12<=b.length,'Truncated chunk: '+file);
      const length=b.readUInt32BE(pos), end=pos+12+length;
      assert.ok(end<=b.length,'Truncated payload: '+file);
      const type=b.toString('ascii',pos+4,pos+8);
      assert.equal(crc(b.subarray(pos+4,end-4)),b.readUInt32BE(end-4),'CRC: '+file+' '+type);
      if (type==='IDAT') chunks.push(b.subarray(pos+8,end-4));
      if (type==='IEND') { ended=true; assert.equal(end,b.length,'Trailing PNG data: '+file); }
      pos=end;
    }
    assert.ok(ended && chunks.length,'Missing PNG chunks: '+file);
    const w=b.readUInt32BE(16), h=b.readUInt32BE(20), depth=b[24], color=b[25];
    const channels=({0:1,2:3,3:1,4:2,6:4})[color];
    assert.ok(w>0 && h>0 && channels,'Invalid PNG header: '+file);
    assert.equal(b[28],0,'Audit expects non-interlaced PNG: '+file);
    const stride=Math.ceil(w*channels*depth/8)+1;
    const raw=zlib.inflateSync(Buffer.concat(chunks));
    assert.equal(raw.length,stride*h,'Incomplete pixel stream: '+file);
    for(let y=0;y<h;y++) assert.ok(raw[y*stride]<=4,'Invalid PNG filter: '+file);
    count++;
  }
}
scan(root);
console.log('PASS PNG integrity: '+count+' files; chunk CRC, decompression, scanline sizes.');
