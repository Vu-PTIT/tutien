// Pixel activity icons (12 §10): two tones + a material outline, shared vocabulary with the game.
// Placeholder set drawn on a 16×16 grid until the art test (12 §13) delivers the 24×24 originals.
const O = '#3B3346';
const icons = {
 book:{a:'#7B70BF',b:'#5A4F98',w:'#FFF8E8',c:'#D9D2C1',rows:[
  '................','................','.ooooo....ooooo.','owwwwwo..owwwwwo','owccwwwoowwwccwo','owwwwwwoowwwwwwo',
  'owccwwwoowwwccwo','owwwwwwoowwwwwwo','owccwwwoowwwccwo','owwwwwwoowwwwwwo','owwwwwwoowwwwwwo','ooooooowwooooooo',
  'oaaaaaaooaaaaaao','oaaaaaaaaaaaaaao','.obbbbbbbbbbbbo.','..oooooooooooo..']},
 run:{a:'#5E8FC9',b:'#41699A',w:'#F4F1EA',c:'#F2C230',rows:[
  '................','................','................','......ooo.......','.....oaaao......','.....oacao......',
  '....oaacaaoo....','....oaaaaaaaoo..','...oaacaaaaaaao.','..oaaaaaaaabbbao','.obbaaaaaaabbbbo','.owwwwwwwwwwwwwo',
  '.owwwwwwwwwwwwwo','..ooooooooooooo.','................','................']},
 bowl:{a:'#E6B85C',b:'#B98A3E',w:'#FFF3D6',c:'#5E9E4A',d:'#8A5A3C',rows:[
  '..........oo....','.........odo....','........odo..oo.','.......odo..odo.','......odo..odo..','.....odo..odo...',
  '..oooooooooooo..','.owwcwwwwwcwwwo.','owwwwwcwwwwwwcwo','oaaaaaaaaaaaaaao','.oaaaaaaaaaaaao.','.oabaaaaaaaabao.',
  '..obbbbbbbbbbo..','...oooooooooo...','.....oaaaao.....','.....oooooo.....']},
 school:{a:'#5E8FC9',b:'#41699A',c:'#F2C230',w:'#D3E1E9',rows:[
  '................','.....oooooo.....','....oo....oo....','...oooooooooo...','..oawaaaaaaaao..','..oaaaaaaaaaao..',
  '..oaooooooooao..','..oaobbbbbboao..','..oaobbccbboao..','..oaobbbbbboao..','..oaooooooooao..','..oaaaaaaaaaao..',
  '..obaaaaaaaabo..','..obbbbbbbbbbo..','...oooooooooo...','................']},
 briefcase:{a:'#C2603E',b:'#93452D',c:'#F2C230',w:'#D9805C',rows:[
  '................','................','................','.....oooooo.....','.....o....o.....','..oooooooooooo..',
  '.owwwwwwwwwwwwo.','.oaaaaaaaaaaaao.','.obbbbbccbbbbbo.','.oaaaaaccaaaaao.','.oaaaaaaaaaaaao.','.oaaaaaaaaaaaao.',
  '.obbbbbbbbbbbbo.','..oooooooooooo..','................','................']},
 moon:{a:'#F2D38C',b:'#D9A23A',w:'#FFF3C4',rows:[
  '................','......oooo......','....ooaaao...o..','...oaaaao...owo.','..oaawao.....o..','..oaaao.........',
  '.oawaao.........','.oaaaao.........','.oaaaaao.....oo.','.oaaaaaaoooooao.','..oaaaaaaaaaao..','..obaaaaaaaabo..',
  '...obbaaaaabbo..','....oobbbbboo...','......ooooo.....','................']},
 drop:{a:'#5E8FC9',b:'#41699A',w:'#D3E1E9',rows:[
  '................','.......oo.......','......oaao......','......oaao......','.....oaaaao.....','....oaaaaaao....',
  '...oaaaaaaaao...','...oawaaaaaao...','..oaawaaaaaaao..','..oawaaaaaaaao..','..oawaaaaaaabo..','..oaaaaaaaaabo..',
  '...oaaaaaabbo...','....obbbbbbo....','.....oooooo.....','................']},
 spark:{a:'#E9A3B5',b:'#BE7A91',w:'#FFF8E8',rows:[
  '................','.......o........','......oao.......','......oao.......','.....oawao......','....oaawaao.....',
  '..ooaaawaaaoo...','.oaawwwwwaaaao..','..ooaaawaaaoo...','....oaaaabo.....','.....oaabo......','......oao.......',
  '......obo.......','.......o........','................','................']},
 bed:{a:'#8F7BC4',b:'#6B5A9E',w:'#F4F1EA',d:'#8A5A3C',rows:[
  '................','................','................','................','................','.oo.............',
  '.odo............','.odoooo.........','.odwwwwoooooooo.','.odwwwwaaaaaaaao','.odooooaaaaaaaao','.odbbbbbbbbbbbbo',
  '.oddddddddddddo.','.od..........do.','.oo..........oo.','................']},
 lotus:{a:'#E9A3B5',b:'#BE7A91',w:'#FFF8E8',c:'#6E9E4A',d:'#4E7A38',rows:[
  '................','................','.......oo.......','......oaao......','......oawo......','..oo..oawao.oo..',
  '.oaao.oawaooaao.','.oaaaooawaoaaao.','..oaaaoawaoaaao.','..obaaaaaaaaabo.','...obbaaaaabbo..','.oooooobbbooooo.',
  'occcccccccccccco','.oddcccccccdddo.','..oooooooooooo..','................']},
 footprints:{a:'#B07A52',b:'#8A5A3C',rows:[
  '................','..ooo...........','.oaaao..........','.oaaao..........','.oaaao..........','.obaao...ooo....',
  '..ooo...oaaao...','..obo...oaaao...','..ooo...oaaao...','........obaao...','.........ooo....','.........obo....',
  '.........ooo....','................','................','................']},
 gamepad:{a:'#D8443A',b:'#9E2F2A',w:'#F4F1EA',c:'#2B2735',rows:[
  '................','................','................','................','...oooooooooo...','..oaaaaaaaaaao..',
  '.oaawaaaaaaaaao.','.oawwwaaaaawaao.','.oaawaaaaawawao.','.oaaaaaaaaaawao.','.oaaaaooooaaaao.','.obbbo....obbbo.',
  '..ooo......ooo..','................','................','................']},
 avatar:{a:'#F0C49A',b:'#C99470',h:'#2F2836',t:'#D9A23A',u:'#A9772A',w:'#FFF8E8',rows:[
  '....oooooooo....','...ohhhhhhhho...','..ohhhhhhhhhho..','..ohhaaaaaahho..','..ohaaaaaaaabo..','..ohawaaaawabo..',
  '..ohaoaaaaoabo..','..ohaaaaaaaabo..','...oaaaooaabo...','....oaaaaabo....','.....oooooo.....','...ooottttooo...',
  '..ottttttttuuo..','.ottttttttttuuo.','.otttttttttttuo.','.oooooooooooooo.']},
};

function gridSvg(def,size,cls,label=''){
 const n=def.rows.length,rects=[];
 def.rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x];if(ch==='.'){x++;continue;}let run=1;while(row[x+run]===ch)run++;const fill=ch==='o'?O:def[ch];if(fill)rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"/>`);x+=run;}});
 return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}>${rects.join('')}</svg>`;
}
/** Whole-number multiple of the 16px grid so pixels stay square. */
const snap=size=>Math.max(16,Math.round(size/16)*16);

export const ICON_GRIDS = icons;
export function activityArtwork(name, size = 32) {
 if (!icons[name] || name === 'avatar') return '';
 return gridSvg(icons[name], snap(size), 'icon activity-picto');
}
export function avatarPortrait(size = 32) { return gridSvg(icons.avatar, snap(size), 'pixel-avatar'); }

/** Pixel moon by lunar day: lit fraction sweeps right (waxing) then left (waning). */
export function pixelMoon(day, size = 16) {
 const n=16,r=7,c=7.5,age=((day-1)%30+30)%30,phase=age/29.53,rects=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const dx=x-c,dy=y-c;if(dx*dx+dy*dy>r*r+1)continue;
  const edge=dx*dx+dy*dy>(r-1)*(r-1)+1.5;
  const half=Math.sqrt(Math.max(0,r*r-dy*dy)),term=Math.cos(phase*2*Math.PI)*half;
  const lit=phase<.5?dx>term:dx<-term;
  rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${edge?(lit?'#D9A23A':'#2E2A4A'):lit?'#F2D38C':'#4A4368'}"/>`);
 }
 size=snap(size);
 return `<svg class="moon-phase-icon" width="${size}" height="${size}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

export function lunarSeal(phase) {
 return `<span class="lunar-seal" aria-hidden="true"><span class="lunar-seal-phase">${phase}</span></span>`;
}

const FACE = ['....oooooooo....','...owwwwwwwwo...','..owwwwwwwwwwo..','.owwwwwwwwwwwwo.','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','owwwwwwwwwwwwwwo','.owwwwwwwwwwwwo.','..owwwwwwwwwwo..','...owwwwwwwwo...','....oooooooo....'];
const EXPR = {
 joy:[[4,6],[4,5],[11,6],[11,5],[4,10],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,10]],
 calm:[[3,6],[4,7],[5,7],[6,6],[9,6],[10,7],[11,7],[12,6],[6,11],[7,11],[8,11],[9,11]],
 focus:[[3,4],[4,5],[5,6],[12,4],[11,5],[10,6],[4,7],[11,7],[6,11],[7,11],[8,11],[9,11]],
 drive:[[4,5],[4,6],[4,7],[11,5],[11,6],[11,7],[5,10],[6,11],[7,11],[8,11],[9,11],[10,10]],
 tired:[[3,7],[4,7],[5,7],[6,7],[9,7],[10,7],[11,7],[12,7],[7,10],[8,10],[7,11],[8,11],[7,12],[8,12]],
};
export function moodArtwork(mood) {
 const rows=FACE.map(r=>r.split(''));for(const [x,y] of EXPR[mood]||EXPR.calm)rows[y][x]='o';
 if(mood==='joy'||mood==='drive'){rows[9][2]='p';rows[9][3]='p';rows[9][12]='p';rows[9][13]='p';}
 return gridSvg({w:'#F8E6BC',p:'#E9A3B5',rows:rows.map(r=>r.join(''))},32,'mood-artwork');
}
