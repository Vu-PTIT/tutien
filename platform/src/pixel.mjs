// Pixel scenes drawn in code, following docs/game-design/11-world-bible.md and 12-art-bible.md:
// HD pixel, straight top-down 3/4, warm "Hà Nội afternoon" palette, cool purple shadows,
// and linh energy expressed only as light. Every pixel lands on an integer coordinate of a
// low-resolution canvas that the browser scales by a whole-number factor.

/** Master palette (12 §5.2). Teal (linh*) and purple (odd*) are reserved, see 11 §6. */
export const PALETTE = {
 paper:'#F7F1E3', ink:'#2B2735', cream:'#FFE7A8',
 shade:'#2E2A4A', shadeL:'#4A4368',
 wallY:'#E6B85C', wallYL:'#F2D38C', wallYD:'#B98A3E',
 tile:'#C2603E', tileL:'#D9805C', tileD:'#93452D',
 sign:'#D8443A', signD:'#9E2F2A',
 tin:'#6F8FA8', tinL:'#8FAABF', tinD:'#4F6B85',
 leaf:'#5E9E4A', leafL:'#8CC266', leafD:'#3C6E3A', leafDD:'#2C4F33',
 asphalt:'#4A4E5C', asphaltL:'#575C6B', asphaltD:'#3E4150',
 conc:'#BDB6A6', concL:'#D9D2C1', concD:'#8F897E',
 pave:'#CDBFA2', paveL:'#DDD2B8', paveD:'#B3A386',
 mint:'#A9C6A0', mintL:'#C4DAB9', mintD:'#7F9F7A',
 sky:'#B8CCD8', skyL:'#D3E1E9', skyD:'#8EA6B7',
 rose:'#E3B4A6', roseL:'#F0CDBF', roseD:'#BE8B7E',
 chalk:'#ECE6D8', chalkL:'#F8F4EA', chalkD:'#C4BAA6',
 shut:'#A6ABB3', shutL:'#C4C8CE', shutD:'#7D828C',
 inox:'#D9DEE2', inoxL:'#F4F6F7', inoxD:'#9FA8B0',
 wood:'#8A5A3C', woodL:'#B07A52', woodD:'#5E3D2B',
 room:'#4A3F55', roomD:'#352D40',
 water:'#5C8FA8', waterL:'#86B6C6', waterD:'#46738E', waterDD:'#375D78', foam:'#CFE6EA',
 pad:'#6E9E4A', padD:'#4E7A38', lotus:'#E9A3B5',
 bloom:'#D65C8E', bloomD:'#A8416C',
 skin:'#F0C49A', skinD:'#C99470', skin2:'#C98E64', skin2D:'#A06A48',
 hair:'#2F2836', hairL:'#4A3E4E', hairB:'#7A4E35',
 tee:'#F2EEE4', teeD:'#C8C0B0', jacket:'#D9A23A', jacketD:'#A9772A',
 denim:'#4A5A82', denimD:'#33405F', khaki:'#A89A72', khakiD:'#7E7354',
 shoe:'#EDE7DA', shoeD:'#B7AE9E',
 blue:'#3F7FBF', blueD:'#2C5C8E', warn:'#F2C230', warnD:'#B98E1E',
 lamp:'#FFD27A', lampCore:'#FFF3C4',
 linh:'#3FD6B8', linhCore:'#B8FFF0',
 odd:'#8F6BFF',
};
const P = PALETTE;

/** Time-of-day modulate colours (12 §5.3), interpolated by local hour. */
const DAY_KEYS = [[0,'#3C3F6E'],[4.5,'#3C3F6E'],[5.5,'#6A6FA8'],[6.5,'#E8EEF5'],[9,'#FFFFFF'],[15.5,'#FFFFFF'],[17,'#FFD9A8'],[18,'#FFD9A8'],[19,'#6A6FA8'],[22,'#6A6FA8'],[23.5,'#3C3F6E'],[24,'#3C3F6E']];
const hex2rgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
export function dayTint(hour){
 const h=((Number(hour)%24)+24)%24;
 let i=0; while(i<DAY_KEYS.length-2&&DAY_KEYS[i+1][0]<=h)i++;
 const [h0,c0]=DAY_KEYS[i],[h1,c1]=DAY_KEYS[i+1],t=h1===h0?0:(h-h0)/(h1-h0);
 const a=hex2rgb(c0),b=hex2rgb(c1),rgb=a.map((v,k)=>Math.round(v+(b[k]-v)*t));
 const dark=1-(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)/255;
 return {rgb,css:`rgb(${rgb.join(',')})`,dark};
}

/* ---------- tiny Vietnamese pixel font for signboards (3×5 caps + diacritics) ---------- */
const GLYPH = {
 A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',
 F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',
 K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',
 P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
 U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',
 Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
 '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
};
const MARKS = { '̀':[[0,-2],[1,-1]], '́':[[2,-2],[1,-1]], '̉':[[0,-3],[1,-3],[1,-2]], '̃':[[0,-1],[1,-2],[2,-2]],
 '̂':[[0,-1],[1,-2],[2,-1]], '̆':[[0,-2],[2,-2],[1,-1]], '̣':[[1,6]] };
export function textWidth(str){let w=0;for(const ch of str.toUpperCase().normalize('NFD')){if(MARKS[ch])continue;if(ch==='̛'){w+=1;continue;}w+=ch===' '?3:ch==='Đ'?5:4;}return Math.max(0,w-1);}
function drawText(c,str,x,y,color){
 let cx=x,last=0;c.fillStyle=color;
 for(const ch of str.toUpperCase().normalize('NFD')){
  if(MARKS[ch]){for(const [dx,dy] of MARKS[ch])c.fillRect(last+dx,y+dy,1,1);continue;}
  if(ch==='̛'){c.fillRect(cx-1,y-1,1,1);c.fillRect(cx-1,y,1,1);cx+=1;continue;}
  if(ch===' '){cx+=3;continue;}
  let g=GLYPH[ch],off=0;
  if(ch==='Đ'){g=GLYPH.D;off=1;c.fillRect(cx,y+2,2,1);}
  if(!g){cx+=4;continue;}
  for(let i=0;i<15;i++)if(g[i]==='1')c.fillRect(cx+off+i%3,y+(i/3|0),1,1);
  last=cx+off;cx+=4+off;
 }
}

/* ---------- drawing helpers ---------- */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=(c,x,y,w,h,col)=>{if(w<=0||h<=0)return;c.fillStyle=col;c.fillRect(x|0,y|0,w|0,h|0);};
/** Rect with a 1px material-coloured outline (selout, 12 §6). */
const RO=(c,x,y,w,h,fill,line)=>{R(c,x,y,w,h,line);R(c,x+1,y+1,w-2,h-2,fill);};
function ellipse(c,cx,cy,rx,ry,col){for(let dy=-ry;dy<=ry;dy++){const half=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));R(c,cx-half,cy+dy,half*2+1,1,col);}}
/** Lit blob: outline, body, light top-left, dark bottom-right. */
function blob(c,cx,cy,rx,ry,{line,base,light,dark}){
 ellipse(c,cx,cy,rx+1,ry+1,line);ellipse(c,cx,cy,rx,ry,dark);ellipse(c,cx-1,cy-1,rx-1,ry-1,base);ellipse(c,cx-Math.ceil(rx/3),cy-Math.ceil(ry/2.2),Math.ceil(rx/2.2),Math.ceil(ry/3),light);
}
function shadowBlob(c,cx,cy,rx,ry,a=.35){c.save();c.globalAlpha=a;ellipse(c,cx,cy,rx,ry,P.shade);c.restore();}

/** Sprite from a palette-keyed character grid. */
export const SPRITES = {
 // xe ga seen from the side, ~1.8 m long (12 §3: 32 px ≈ 1 m, compressed)
 scooter:{key:{k:'ink',b:'body',B:'bodyD',s:'roomD',w:'hair',h:'inox',l:'lampCore',m:'inoxL',f:'shutD'},rows:[
  '..........................kk......',
  '.........................kmmk.....',
  '..........................kk......',
  '.........................kfk......',
  '........................kbbk......',
  '....kkkkkkkkkk.........kbbbk......',
  '...kssssssssssk.......kbbbbk......',
  '...kssssssssssk......kbbbbbk......',
  '...kkkkkkkkkkkkk....kbbbbbbk......',
  '..kbbbbbbbbbbbbbkkkkkbbbbbbbk.....',
  '.kbbbbbbbbbbbbbbbbbbbbbbbbbbblk...',
  '.kbbbbbbbbbbbbbbbbbbbbbbbbbbbblk..',
  '.kBBbbbbbbbbbbbbbbbbbbbbbbbbBBkk..',
  '..kBBBBBBBBkkkkkkkkkkkkBBBBBBk....',
  '..kkwwwwkkk..........kkwwwwkk.....',
  '.kwwhhhhwwk.........kwwhhhhwwk....',
  '.kwhhkkhhwk.........kwhhkkhhwk....',
  '.kwwhhhhwwk.........kwwhhhhwwk....',
  '..kkwwwwkk...........kkwwwwkk.....',
  '....kkkk...............kkkk.......']},
};
function sprite(c,name,x,y,colors={},flip=false){
 const s=SPRITES[name];const w=Math.max(...s.rows.map(r=>r.length));
 s.rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='.')continue;const key=s.key[ch];const col=colors[key]||P[key];if(!col)continue;R(c,flip?x+w-1-i:x+i,y+j,1,1,col);}});
}

/* ---------- paper-doll person (12 §6): one body template, layers swapped by palette ---------- */
export function drawPerson(c,x,y,o={},frame=0){
 const sk=o.skin||'skin',skin=P[sk],skinD=P[sk+'D'],hair=P[o.hair||'hair'],top=P[o.top||'tee'],topD=P[(o.top||'tee')+'D'];
 const legs=P[o.pants||'denim'],legsD=P[(o.pants||'denim')+'D'],line=P.ink;
 const breathe=(frame%4===1||frame%4===2)?1:0,sit=o.pose==='sit';
 shadowBlob(c,x,y,8,2,.32);
 // legs + shoes (sitting, seen from the front: knees forward, shorter silhouette)
 const legTop=sit?y-9:y-15;
 for(const lx of[x-6,x+1]){RO(c,lx,legTop,6,y-2-legTop,legs,line);R(c,lx+1,legTop+1,1,y-4-legTop,legsD);if(sit)R(c,lx+1,legTop+1,4,1,P.chalkL);RO(c,lx-1,y-3,7,3,P.shoe,line);}
 // torso: shoulders taper to the waist, light from the top-left (12 §7)
 const by=(sit?y-10:y-16)-breathe,bt=by-13;
 R(c,x-7,bt,14,13,line);R(c,x-6,bt+1,12,12,top);R(c,x-6,bt+1,12,1,P.chalkL);R(c,x+3,bt+2,3,11,topD);
 R(c,x-6,by-1,12,2,line);R(c,x-5,by-1,10,1,topD);
 if(o.print)R(c,x-3,bt+5,4,3,P[o.print]);
 R(c,x-2,bt-1,4,2,skinD); // neck
 // arms hang at the sides with a 1px gap; hands in skin tone
 for(const [ax,dark] of[[x-10,false],[x+7,true]]){RO(c,ax,bt+1,4,10,top,line);if(dark)R(c,ax+1,bt+2,2,8,topD);RO(c,ax,bt+10,4,3,skin,line);}
 // head: rounded, big eyes (12 §2.1)
 const hy=bt-14;
 R(c,x-6,hy,12,14,line);R(c,x-7,hy+2,14,10,line);R(c,x-5,hy+1,10,12,skin);R(c,x-6,hy+3,12,8,skin);R(c,x+3,hy+3,3,9,skinD);R(c,x+2,hy+12,2,1,skinD);
 // hair: cap with an uneven fringe, longer at the sides
 R(c,x-6,hy-1,12,2,line);R(c,x-7,hy+1,14,3,line);R(c,x-5,hy,10,4,hair);R(c,x-6,hy+2,12,2,hair);
 for(const [fx,fh] of[[-5,2],[-3,1],[-1,2],[1,1],[3,2]])R(c,x+fx,hy+4,2,fh,hair);
 R(c,x-7,hy+4,2,o.long?10:5,hair);R(c,x+5,hy+4,2,o.long?10:4,hair);R(c,x-4,hy,4,1,P.hairL);
 if(o.hat){const h=P[o.hat],hd=P[o.hat+'D']||line;RO(c,x-9,hy+1,18,3,h,hd);R(c,x-6,hy-3,12,5,h);R(c,x-6,hy-4,12,1,hd);R(c,x-5,hy-2,4,1,P.chalkL);}
 // face
 R(c,x-4,hy+7,2,3,line);R(c,x+2,hy+7,2,3,line);R(c,x-4,hy+7,1,1,P.chalkL);R(c,x+2,hy+7,1,1,P.chalkL);
 R(c,x-6,hy+10,2,1,P.lotus);R(c,x+4,hy+10,2,1,P.lotus);R(c,x-1,hy+11,2,1,skinD);
}

/* ---------- the hub slice: a ngõ + lakeside in Căn cứ Thăng Long (11 §4.1, 12 §13.1) ---------- */
const Y = {roof:0,facade:24,sign:48,ground:61,walk:104,lane:124,curb:150,lake:157};
export const WORLD_H = 232;
export const HOUSES = [
 {w:72,wall:'mint',roof:'tank',shutter:'closed',balcony:true,ac:true},
 {w:88,wall:'wallY',roof:'garden',shop:'tea',sign:'TRÀ ĐÁ',signColor:'sign',balcony:true},
 {w:64,wall:'rose',roof:'rack',shop:'grocery',sign:'TẠP HOÁ',signColor:'blue'},
 {w:80,wall:'chalk',roof:'tin',shutter:'closed',balcony:true,bloom:true},
 {w:72,wall:'sky',roof:'tank',shop:'pho',sign:'PHỞ BÒ',signColor:'warn'},
 {w:104,wall:'wallY',roof:'tile',french:true},
 {w:64,wall:'mint',roof:'rack',shop:'repair',sign:'SỬA XE',signColor:'sign'},
 {w:80,wall:'rose',roof:'garden',shutter:'closed',balcony:true,ac:true},
 {w:72,wall:'chalk',roof:'tank',shop:'grocery',sign:'CƠM',signColor:'blue',balcony:true},
 {w:88,wall:'sky',roof:'tin',shutter:'closed',bloom:true},
 {w:72,wall:'wallY',roof:'rack',shop:'tea',sign:'CÀ PHÊ',signColor:'sign'},
 {w:80,wall:'mint',roof:'garden',shutter:'closed',balcony:true},
];
export const WORLD_W = HOUSES.reduce((s,h)=>s+h.w,0);
const POLES=[150,470,800], TREES=[228,612,920], DOCK={x:300,w:30};
const SHADES={mint:['mint','mintL','mintD'],wallY:['wallY','wallYL','wallYD'],rose:['rose','roseL','roseD'],chalk:['chalk','chalkL','chalkD'],sky:['sky','skyL','skyD']};

function drawRoof(c,x,w,h,rand,lights){
 const r=h.roof;
 if(r==='tin'){R(c,x,0,w,Y.facade,P.tinD);for(let i=x+1;i<x+w-1;i++)R(c,i,0,1,Y.facade-2,(i-x)%4===0?P.tinD:(i-x)%4===1?P.tinL:P.tin);R(c,x,Y.facade-2,w,2,P.tinD);return;}
 if(r==='tile'){R(c,x,0,w,Y.facade,P.tileD);for(let j=1;j<Y.facade-2;j++)R(c,x+1,j,w-2,1,j%4===0?P.tileD:j%4===1?P.tileL:P.tile);for(let j=2;j<Y.facade-2;j+=4)for(let i=x+2+(j%8?2:0);i<x+w-2;i+=5)R(c,i,j,1,3,P.tileD);R(c,x,Y.facade-2,w,2,P.tileD);return;}
 // flat concrete roof with parapet, seen from above
 R(c,x,0,w,Y.facade,P.concD);R(c,x+1,1,w-2,Y.facade-4,P.concL);R(c,x+1,Y.facade-3,w-2,1,P.conc);R(c,x+2,2,w-4,1,P.chalkL);
 for(let i=0;i<5;i++)R(c,x+3+(rand()*(w-8)|0),4+(rand()*14|0),2,1,P.conc);
 if(r==='tank'){const tx=x+w-26;shadowBlob(c,tx+12,15,11,3,.3);RO(c,tx,5,22,10,P.inox,P.inoxD);R(c,tx+1,6,20,2,P.inoxL);R(c,tx+1,12,20,2,P.inoxD);R(c,tx+6,5,1,10,P.inoxD);R(c,tx+15,5,1,10,P.inoxD);RO(c,x+6,8,8,8,P.chalk,P.chalkD);R(c,x+8,10,4,4,P.hair);}
 if(r==='rack'){const cols=[P.sign,P.blue,P.warn,P.tee,P.bloom,P.mint];R(c,x+4,4,1,14,P.inoxD);R(c,x+w-5,4,1,14,P.inoxD);for(const ly of[6,13]){R(c,x+4,ly,w-8,1,P.inoxD);for(let i=x+7;i<x+w-9;i+=7+(rand()*3|0))RO(c,i,ly+1,5,5,cols[rand()*cols.length|0],P.shadeL);}}
 if(r==='garden'){for(let row=0;row<2;row++)for(let i=x+4;i<x+w-12;i+=12){const py=4+row*9;RO(c,i,py,10,7,P.chalkL,P.chalkD);ellipse(c,i+5,py+2,4,2,P.leafD);ellipse(c,i+4,py+1,3,1,P.leafL);lights.push({kind:'linh',x:i+5,y:py+1});}
  // greenhouse frame for medicinal herbs (11 §4.1 "mái nhà kính dược liệu")
  R(c,x+w-11,3,8,17,P.inoxD);R(c,x+w-10,4,6,15,P.skyL);R(c,x+w-10,4,2,15,P.chalkL);ellipse(c,x+w-7,15,2,2,P.leaf);lights.push({kind:'linh',x:x+w-7,y:12});}
}
function drawFacade(c,x,w,h,rand,lights){
 const [wall,wallL,wallD]=SHADES[h.wall].map(k=>P[k]);
 R(c,x,Y.facade,w,Y.walk-Y.facade,wall);R(c,x,Y.facade,w,1,wallL);R(c,x+w-2,Y.facade,2,Y.walk-Y.facade,wallD);R(c,x,Y.facade,1,Y.walk-Y.facade,wallD);
 // upper floor (compressed, 12 §3): window, balcony, AC unit
 if(h.french){
  for(const wx of[x+8,x+w/2-6|0,x+w-24]){RO(c,wx,Y.facade+4,16,20,P.leafD,P.leafDD);for(let j=Y.facade+6;j<Y.facade+23;j+=2)R(c,wx+1,j,14,1,P.leaf);R(c,wx+7,Y.facade+5,1,18,P.leafDD);R(c,wx-1,Y.facade+3,18,1,P.chalkL);}
  R(c,x,Y.sign-2,w,3,P.chalkL);R(c,x,Y.sign+1,w,1,wallD);
  for(const wx of[x+8,x+w/2-6|0,x+w-24]){RO(c,wx,Y.ground-6,16,Y.walk-Y.ground+6,P.leafD,P.leafDD);for(let j=Y.ground-4;j<Y.walk-1;j+=2)R(c,wx+1,j,14,1,P.leaf);R(c,wx+7,Y.ground-5,1,Y.walk-Y.ground+4,P.leafDD);}
  RO(c,x+w/2-20|0,Y.sign+3,12,9,P.chalkL,P.chalkD);R(c,x+w/2-18|0,Y.sign+5,8,1,P.sign);R(c,x+w/2-18|0,Y.sign+8,6,1,P.ink);
  lights.push({kind:'window',x:x+w/2-6|0,y:Y.facade+5,w:15,h:18});
  return;
 }
 const ww=Math.min(26,w-24),wx=x+(w-ww)/2|0;
 RO(c,wx,Y.facade+3,ww,15,P.room,wallD);R(c,wx+1,Y.facade+4,ww-2,2,P.skyD);R(c,wx+2,Y.facade+4,3,6,P.skyL);R(c,wx+ww/2|0,Y.facade+4,1,13,wallD);
 lights.push({kind:'window',x:wx+1,y:Y.facade+4,w:ww-2,h:13});
 if(h.balcony){R(c,wx-4,Y.facade+13,ww+8,1,P.hair);for(let i=wx-4;i<wx+ww+4;i+=2)R(c,i,Y.facade+14,1,7,P.hair);R(c,wx-4,Y.facade+20,ww+8,2,P.hairL);R(c,wx-4,Y.facade+22,ww+8,1,P.shade);
  if(h.bloom||rand()<.6){for(let i=0;i<4;i++){const bx=wx-3+(rand()*(ww+4)|0);R(c,bx,Y.facade+11,3,3,P.bloom);R(c,bx+1,Y.facade+12,1,1,P.bloomD);R(c,bx,Y.facade+14,2,3,P.leafD);}}}
 if(h.ac){RO(c,x+4,Y.facade+6,11,8,P.chalkL,P.chalkD);for(let j=Y.facade+8;j<Y.facade+13;j+=2)R(c,x+6,j,6,1,P.chalkD);}
 // signboard with fictional Vietnamese names (12 §7)
 if(h.sign){const col=P[h.signColor],dark=h.signColor==='warn'?P.warnD:h.signColor==='blue'?P.blueD:P.signD,ink=h.signColor==='warn'?P.ink:P.paper;
  RO(c,x+3,Y.sign,w-6,12,col,dark);R(c,x+4,Y.sign+1,w-8,1,'rgba(255,255,255,.25)');const tw=textWidth(h.sign);drawText(c,h.sign,x+(w-tw)/2|0,Y.sign+5,ink);}
 else{R(c,x,Y.sign+4,w,2,wallL);R(c,x,Y.sign+6,w,1,wallD);}
 // ground floor: roller shutter (cửa cuốn) open or closed
 const sx=x+5,sw=w-10,top=Y.ground,bh=Y.walk-Y.ground;
 RO(c,sx-1,top-1,sw+2,4,P.shutD,P.shade);
 if(!h.shop){R(c,sx,top+3,sw,bh-3,P.shut);for(let j=top+4;j<Y.walk;j+=3){R(c,sx,j,sw,1,P.shutL);R(c,sx,j+1,sw,1,P.shutD);}R(c,sx+sw/2-3|0,Y.walk-5,6,2,P.shutD);return;}
 R(c,sx,top+3,sw,bh-3,P.room);R(c,sx,top+3,sw,3,P.roomD);
 lights.push({kind:'shop',x:sx,y:top+3,w:sw,h:bh-3});
 const goods=[P.sign,P.warn,P.blue,P.leafL,P.tee,P.bloom,P.jacket];
 if(h.shop==='grocery'){for(const sy of[top+9,top+19,top+29]){R(c,sx+2,sy+6,sw-4,1,P.woodL);for(let i=sx+3;i<sx+sw-4;i+=4)R(c,i,sy+1+(rand()*2|0),3,5-(rand()*2|0),goods[rand()*goods.length|0]);}}
 if(h.shop==='tea'||h.shop==='pho'){R(c,sx+3,top+12,sw-6,2,P.woodL);R(c,sx+3,top+24,sw-6,8,P.wood);R(c,sx+3,top+24,sw-6,1,P.woodL);RO(c,sx+6,top+16,8,8,P.inox,P.inoxD);RO(c,sx+16,top+18,6,6,P.warn,P.warnD);
  R(c,sx+sw/2|0,top+3,1,5,P.ink);R(c,(sx+sw/2|0)-1,top+8,3,3,P.lampCore);lights.push({kind:'bulb',x:sx+sw/2|0,y:top+9});}
 if(h.shop==='repair'){for(let i=0;i<3;i++)ellipse(c,sx+8+i*9,top+16,3,3,P.hair);R(c,sx+3,top+28,sw-6,2,P.inoxD);RO(c,sx+4,top+31,10,8,P.sign,P.signD);}
}
function drawWalk(c,W){
 R(c,0,Y.walk,W,Y.lane-Y.walk,P.pave);
 for(let j=Y.walk;j<Y.lane;j+=7){R(c,0,j,W,1,P.paveD);for(let i=(j/7%2)*5;i<W;i+=10){R(c,i,j+1,1,6,P.paveD);R(c,i+1,j+1,1,1,P.paveL);}}
 R(c,0,Y.walk,W,1,P.shade);R(c,0,Y.lane-3,W,1,P.concL);R(c,0,Y.lane-2,W,2,P.concD);
}
function drawLane(c,W,rand){
 R(c,0,Y.lane,W,Y.curb-Y.lane,P.asphalt);
 for(let i=0;i<W*3;i++)R(c,rand()*W|0,Y.lane+(rand()*(Y.curb-Y.lane)|0),1,1,rand()<.5?P.asphaltL:P.asphaltD);
 for(let x=60;x<W;x+=260){ellipse(c,x,Y.lane+12,4,2,P.asphaltD);R(c,x-3,Y.lane+12,7,1,P.concD);}
 R(c,0,Y.lane,W,2,P.asphaltD);
}
function drawLake(c,W,rand){
 R(c,0,Y.curb,W,2,P.concL);R(c,0,Y.curb+2,W,4,P.conc);for(let i=0;i<W;i+=9)R(c,i,Y.curb+2,1,4,P.concD);R(c,0,Y.curb+6,W,1,P.concD);
 R(c,0,Y.lake,W,WORLD_H-Y.lake,P.water);R(c,0,Y.lake,W,4,P.waterDD);R(c,0,Y.lake+4,W,3,P.waterD);
 for(let j=Y.lake+30;j<WORLD_H;j++)for(let i=(j%2);i<W;i+=2)if(j>Y.lake+40||((i+j)%4===0))R(c,i,j,1,1,P.waterD);
 // lotus beds
 for(const lx of[40,190,560,700,980]){for(let i=0;i<7;i++){const px=lx+(rand()*40|0),py=Y.lake+18+(rand()*36|0);ellipse(c,px,py,4,2,P.padD);ellipse(c,px-1,py-1,3,1,P.pad);R(c,px,py-1,1,2,P.padD);}
  R(c,lx+14,Y.lake+22,3,2,P.lotus);R(c,lx+15,Y.lake+21,1,1,P.chalkL);}
 // railing along the embankment
 for(let i=4;i<W;i+=12){R(c,i,Y.curb-8,2,9,P.hair);R(c,i,Y.curb-8,1,1,P.hairL);}
 R(c,0,Y.curb-8,W,1,P.hair);R(c,0,Y.curb-5,W,1,P.hairL);
}
function drawDock(c){
 const {x,w}=DOCK,top=Y.curb-2,bot=Y.lake+38;
 R(c,x-2,top,w+4,bot-top+1,P.woodD);
 for(let j=top+1;j<bot;j+=4){R(c,x,j,w,3,P.wood);R(c,x,j,w,1,P.woodL);}
 for(const px of[x,x+w-3])R(c,px,bot,3,8,P.woodD);
 R(c,x-1,bot+8,w+2,1,P.foam);
 R(c,x-2,top,1,bot-top,P.wood);
}
function drawPole(c,x,lights){
 shadowBlob(c,x+6,Y.lane-4,6,2,.3);
 R(c,x-1,6,5,Y.lane-8,P.concD);R(c,x,6,3,Y.lane-8,P.conc);R(c,x,6,1,Y.lane-8,P.concL);
 RO(c,x-9,10,21,3,P.wood,P.woodD);for(const ix of[x-8,x-2,x+5,x+10])R(c,ix,8,2,2,P.chalkL);
 // cable tangle + linh-spectrum sensor strip (11 §4.1)
 for(let i=0;i<4;i++)R(c,x-4+i,30+i*2,10-i*2,2,P.hair);ellipse(c,x+1,38,5,2,P.hair);
 RO(c,x+4,48,5,10,P.inox,P.inoxD);R(c,x+5,50,3,1,P.warn);R(c,x+5,53,3,1,P.leafL);
 // street lamp arm over the lane
 R(c,x+3,22,14,2,P.concD);R(c,x+15,22,6,4,P.inoxD);R(c,x+16,25,4,1,P.lampCore);
 lights.push({kind:'lamp',x:x+18,y:27});
}
function drawWires(c,W){
 c.fillStyle=P.hair;
 const pts=[...POLES];
 const seg=(x0,y0,x1,y1,sag)=>{for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++){const t=(x-x0)/(x1-x0||1);c.fillRect(x,Math.round(y0+(y1-y0)*t+sag*4*t*(1-t)),1,1);}};
 for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[i+1]??W+40;for(const [o,s] of[[-8,10],[-2,14],[5,9],[10,16]])seg(a+o,9,b+o,9,s);}
 for(let i=0;i<pts.length;i++){const a=pts[i]-POLES[0]-60;seg(a<0?0:a,9,pts[i]-8,9,12);}
 for(const p of POLES){seg(p-40,30,p-2,36,6);seg(p+3,36,p+46,26,5);}
}
function drawTree(c,x,rand){
 shadowBlob(c,x+8,Y.lane-6,20,4,.35);
 R(c,x-2,70,5,Y.lane-74,P.woodD);R(c,x-1,70,3,Y.lane-74,P.wood);R(c,x-2,Y.lane-14,5,5,P.chalkL);R(c,x-2,Y.lane-10,5,1,P.chalkD);
 // bàng: tiered horizontal canopy
 const tones={line:P.leafDD,base:P.leaf,light:P.leafL,dark:P.leafD};
 blob(c,x,72,24,8,tones);blob(c,x+2,60,19,8,tones);blob(c,x-1,49,13,7,tones);
 for(let i=0;i<10;i++)R(c,x-20+(rand()*40|0),47+(rand()*30|0),2,1,rand()<.5?P.tileL:P.leafL);
}
function drawStreetLife(c,rand){
 // parked scooters, plastic stools, low inox tables (11 §5)
 const bikes=[[14,'blue','blueD'],[352,'sign','signD'],[392,'chalk','chalkD'],[662,'warn','warnD'],[712,'mint','mintD'],[860,'blue','blueD']];
 for(const [bx,b,bd] of bikes){shadowBlob(c,bx+17,Y.walk+17,16,2,.3);sprite(c,'scooter',bx,Y.walk-2,{body:P[b],bodyD:P[bd]},bx%3===0);}
 const table=(tx,ty)=>{shadowBlob(c,tx+10,ty+12,10,2,.3);R(c,tx+2,ty+5,1,7,P.inoxD);R(c,tx+17,ty+5,1,7,P.inoxD);RO(c,tx,ty,20,6,P.inox,P.inoxD);R(c,tx+1,ty+1,18,1,P.inoxL);R(c,tx+4,ty+2,3,3,P.lampCore);R(c,tx+9,ty+2,3,3,P.warn);R(c,tx+14,ty+2,2,3,P.chalkL);};
 table(108,Y.walk+4);table(800,Y.walk+4);

 for(const [sx,sy,col] of SEATS)stool(c,sx,sy,col);
 // fishing rod rack and bucket on the dock
 RO(c,DOCK.x+3,Y.curb+4,7,6,P.blue,P.blueD);R(c,DOCK.x+4,Y.curb+5,5,1,P.waterL);
}

function stool(c,x,y,col){ // ghế nhựa: top at y-9, ~10 px tall
 shadowBlob(c,x,y,6,1,.3);const k=P[col],d=P[col+'D'];
 R(c,x-5,y-6,1,6,d);R(c,x+4,y-6,1,6,d);R(c,x-4,y-3,8,1,d);RO(c,x-6,y-10,12,4,k,d);R(c,x-5,y-9,10,1,'rgba(255,255,255,.3)');
}
const SEATS=[[96,Y.walk+20,'sign'],[140,Y.walk+21,'blue'],[790,Y.walk+20,'sign'],[DOCK.x+16,Y.lake+34,'blue']];
let cache=null;
/** Builds the static world once; returns canvas plus light emitters and actors. */
export function buildWorld(doc=globalThis.document){
 if(cache)return cache;
 const W=WORLD_W,cv=doc.createElement('canvas');cv.width=W;cv.height=WORLD_H;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 const rand=rng(2026),lights=[];
 drawWalk(c,W);drawLane(c,W,rand);drawLake(c,W,rand);drawDock(c);
 let x=0;for(const h of HOUSES){drawRoof(c,x,h.w,h,rand,lights);drawFacade(c,x,h.w,h,rand,lights);x+=h.w;}
 R(c,0,Y.facade-1,W,1,'rgba(46,42,74,.35)');
 drawStreetLife(c,rand);
 for(const t of TREES)drawTree(c,t,rand);
 for(const p of POLES)drawPole(c,p,lights);
 drawWires(c,W);
 cache={canvas:cv,W,H:WORLD_H,lights};
 return cache;
}

/** Animated actors drawn above the static layer each frame (Y-sorted by feet). */
function drawActors(c,f,ox,oy,reduced){
 const t=reduced?0:f;
 const people=[
  {x:DOCK.x+16,y:Y.lake+34,o:{pose:'sit',top:'jacket',pants:'denim',hair:'hair'},rod:true},
  {x:96,y:Y.walk+20,o:{pose:'sit',top:'tee',pants:'khaki',hair:'hairB',print:'sign'}},
  {x:140,y:Y.walk+21,o:{pose:'sit',top:'sky',pants:'denim',skin:'skin2',hat:'warn'}},
  {x:790,y:Y.walk+20,o:{pose:'sit',top:'mint',pants:'khaki',skin:'skin2'}},
  {x:186,y:Y.walk+15,o:{top:'rose',pants:'denim',hair:'hairB',long:true}},
 ].sort((a,b)=>a.y-b.y);
 for(const p of people){
  const x=p.x-ox,y=p.y-oy;
  if(p.rod){c.fillStyle=P.woodD;for(let i=0;i<22;i++)c.fillRect(x+10+i,y-24-(i*0.8|0),1,1);
   const bx=x+33,by=y-4+((t>>1)%2);c.fillStyle=P.foam;for(let j=y-41;j<by;j+=2)c.fillRect(bx,j,1,1);R(c,bx-1,by,3,2,P.sign);R(c,bx-1,by+2,3,1,P.chalkL);
   if(t%6<3){R(c,bx-4,by+3,2,1,P.foam);R(c,bx+3,by+3,2,1,P.foam);}}
  drawPerson(c,x,y,p.o,(t+p.x)%4===0?0:t+p.x);
 }
 // a delivery rider passing along the lane
 if(!reduced){const rx=((f*3)%(WORLD_W+120))-60-ox,sy=Y.lane+4-oy;
  RO(c,rx-2,sy-3,11,11,P.warn,P.warnD);R(c,rx,sy-1,7,1,P.sign);
  sprite(c,'scooter',rx,sy,{body:P.leaf,bodyD:P.leafD});
  RO(c,rx+8,sy-7,11,13,P.leaf,P.leafD);RO(c,rx+16,sy-2,7,4,P.leaf,P.leafD);R(c,rx+22,sy-1,2,2,P.skin);
  RO(c,rx+7,sy-19,13,13,P.skin,P.ink);R(c,rx+6,sy-21,15,6,P.leaf);R(c,rx+6,sy-16,2,2,P.leafD);R(c,rx+16,sy-14,2,3,P.ink);}
 // water shimmer
 c.fillStyle=P.waterL;
 for(let i=0;i<40;i++){const wx=((i*97+(t*(i%3+1)))%WORLD_W)-ox,wy=Y.lake+10+((i*53)%60)-oy;c.fillRect(wx,wy,3+(i%3),1);}
}

function drawLights(c,lights,dark,f,ox,oy,reduced){
 if(dark<.25)return;
 const a=Math.min(1,(dark-.25)/.35);
 c.save();c.globalCompositeOperation='lighter';
 for(const l of lights){
  const x=l.x-ox,y=l.y-oy;
  if(l.kind==='window'||l.kind==='shop'){c.globalAlpha=.55*a;R(c,x,y,l.w,l.h,P.lamp);c.globalAlpha=.12*a;R(c,x-2,y+l.h,l.w+4,10,P.lamp);}
  if(l.kind==='lamp'||l.kind==='bulb'){const r=l.kind==='lamp'?34:18;for(let s=3;s>=1;s--){c.globalAlpha=.11*a;ellipse(c,x,y+(l.kind==='lamp'?r*.55:4)|0,r*s/3|0,r*s/5|0,P.lamp);}c.globalAlpha=a;R(c,x-1,y-1,3,2,P.lampCore);}
  if(l.kind==='linh'){ // level-0 linh motes around medicinal herbs, only at night (11 §6)
   for(let k=0;k<3;k++){const ph=reduced?k*2:f+k*5+(l.x%7);const mx=x-4+((l.x*k*31)%9),my=y-3-((ph>>1)%6);c.globalAlpha=a*(.45+.45*((ph%4)/3));R(c,mx,my,1,1,k?P.linh:P.linhCore);}}
 }
 c.restore();
}

/** Camera specs for page-specific crops of the same lane. fx/fy is a world point; ax/ay where it sits in the view. */
export const SCENES = {
 home:{fx:DOCK.x+20,fy:118,ax:.68,ay:.52,view:200},
 teaser:{fx:DOCK.x+16,fy:178,ax:.5,ay:.5,view:120},
 sidebar:{fx:612,fy:140,ax:.5,ay:.5,view:130},
 journal:{fx:150,fy:120,ax:.66,ay:.6,view:190},
 calendar:{fx:470,fy:110,ax:.66,ay:.55,view:190},
 insights:{fx:560,fy:110,ax:.66,ay:.55,view:190},
 community:{fx:820,fy:120,ax:.66,ay:.6,view:190},
 settings:{fx:780,fy:60,ax:.66,ay:.45,view:190},
 world:{fx:WORLD_W/2,fy:WORLD_H/2,ax:.5,ay:.5,view:232},
};

const active=new Set();let timer=0,frame=0;
function layout(s){
 const box=s.cv.parentElement.getBoundingClientRect(),dpr=globalThis.devicePixelRatio||1;
 const cssW=Math.max(1,box.width),cssH=Math.max(1,box.height),spec=SCENES[s.name]||SCENES.home;
 // integer scale only (12 §3); never show past the world edges
 const k=Math.max(1,Math.round(cssH*dpr/spec.view),Math.ceil(cssW*dpr/s.world.W),Math.ceil(cssH*dpr/s.world.H));
 const w=Math.ceil(cssW*dpr/k),h=Math.ceil(cssH*dpr/k);
 s.cv.width=w;s.cv.height=h;s.cv.style.width=`${w*k/dpr}px`;s.cv.style.height=`${h*k/dpr}px`;
 s.ox=Math.round(Math.min(Math.max(0,spec.fx-w*spec.ax),s.world.W-w));s.oy=Math.round(Math.min(Math.max(0,spec.fy-h*spec.ay),s.world.H-h));
 s.ctx=s.cv.getContext('2d');s.ctx.imageSmoothingEnabled=false;
}
function paint(s){
 const {ctx:c,cv,world,ox,oy}=s;
 c.globalCompositeOperation='source-over';c.globalAlpha=1;
 c.drawImage(world.canvas,ox,oy,cv.width,cv.height,0,0,cv.width,cv.height);
 drawActors(c,frame,ox,oy,s.reduced);
 const tint=dayTint(s.hour);
 if(tint.dark>.01||tint.rgb.some(v=>v<255)){c.globalCompositeOperation='multiply';c.fillStyle=tint.css;c.fillRect(0,0,cv.width,cv.height);c.globalCompositeOperation='source-over';}
 drawLights(c,world.lights,tint.dark,frame,ox,oy,s.reduced);
}
function tick(){
 frame++;
 for(const s of active){if(!s.cv.isConnected){active.delete(s);s.ro?.disconnect();continue;}if(!s.reduced)paint(s);}
 timer=active.size?setTimeout(tick,170):0;
}
/** Finds canvas[data-scene] under root and keeps them painted. */
export function mountScenes(root,{hour=12,reduced=false}={}){
 for(const cv of root.querySelectorAll('canvas[data-scene]')){
  if(cv.__scene)continue;
  const s={cv,name:cv.dataset.scene,world:buildWorld(cv.ownerDocument),hour,reduced};
  cv.__scene=s;layout(s);paint(s);active.add(s);
  if(globalThis.ResizeObserver){s.ro=new ResizeObserver(()=>{layout(s);paint(s);});s.ro.observe(cv.parentElement);}
 }
 if(active.size&&!timer)timer=setTimeout(tick,170);
}
