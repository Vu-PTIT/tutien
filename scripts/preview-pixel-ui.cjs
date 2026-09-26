/* Development-only static scene layout preview. NOT a Godot runtime screenshot.
 * Reads the real .tscn hierarchy/assets. Does not execute GDScript.
 * Requires Sharp from the workspace runtime; not a game dependency.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../client');
const output = path.resolve(process.argv[2] || '/tmp/tutien-ui-review');
const read = p => fs.readFileSync(path.join(root, p.replace('res://','')), 'utf8');
const vec = (s, n) => (s || '').match(/[-+]?\d*\.?\d+/g)?.slice(-n).map(Number) || [];
function doc(p) {
  const sections = [];
  for (const line of read(p).split(/\r?\n/)) {
    if (line.startsWith('[')) {
      const s = {kind: line.match(/^\[(\w+)/)[1], attrs: {}, props: {}};
      for (const m of line.matchAll(/(\w+)="([^"]*)"/g)) s.attrs[m[1]] = m[2];
      const instance = line.match(/instance=ExtResource\("([^"]+)"\)/);
      if (instance) s.attrs.instance = instance[1];
      sections.push(s);
    } else {
      const m = line.match(/^([^=]+?) = (.*)$/);
      if (m && sections.length) sections.at(-1).props[m[1]] = m[2];
    }
  }
  return sections;
}
function texture(file) {
  if (file.endsWith('.png')) return {url:'data:image/png;base64,'+fs.readFileSync(path.join(root,file.replace('res://',''))).toString('base64')};
  const d=doc(file), src=d.find(s=>s.kind==='ext_resource'), r=d.find(s=>s.kind==='resource');
  if (!src || !r) return null;
  return {...texture(src.attrs.path), region:vec(r.props.region,4)};
}
function scene(file) {
  const d=doc(file);
  const res=Object.fromEntries(d.filter(s=>s.kind==='ext_resource').map(s=>[s.attrs.id,s.attrs]));
  const lookup={}; let result;
  for (const s of d.filter(s=>s.kind==='node')) {
    let n=s.attrs.instance ? scene(res[s.attrs.instance].path) : {type:s.attrs.type,children:[]};
    n.name=s.attrs.name; n.props={...(n.props||{}),...s.props};
    for (const k of ['texture','icon']) {
      const ref=s.props[k]?.match(/ExtResource\("([^"]+)"\)/);
      if(ref) n[k]=texture(res[ref[1]].path);
    }
    if(!result) {result=n;lookup['.']=n;continue;}
    const parent=lookup[s.attrs.parent];
    if(!parent) throw Error('Missing parent '+file+': '+s.attrs.parent);
    parent.children.push(n);
    lookup[(s.attrs.parent==='.'?'':s.attrs.parent+'/')+n.name]=n;
  }
  return result;
}

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const num=(p,k,v=0)=>p[k]===undefined?v:Number(p[k]);
const txt=s=>{try{return JSON.parse(s)}catch{return s||''}};
(async()=>{
  const tree=scene('res://scenes/main.tscn');
  const demoIcons=[4,5,0,1,2,7,6,8,11,9].map(i=>texture('res://assets/pixel/icon_'+i+'.tres'));
  fs.mkdirSync(output,{recursive:true});
  for(const mode of ['village','inventory']){
    const svg=['<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#121b22"/>'];
    const r=(x,y,w,h,fill)=>svg.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'"/>');
    const text=(content,x,y,size=10,center=false)=>svg.push('<text x="'+x+'" y="'+y+'" font-family="DejaVu Sans" font-size="'+size+'" fill="#e8dec4"'+(center?' text-anchor="middle"':'')+'>'+esc(content)+'</text>');
    const box=(x,y,w,h,bg='#15212c')=>{r(x+2,y+2,w,h,'#090f15');r(x,y,w,h,'#957047');r(x+1,y+1,w-2,h-2,bg);};
    function image(t,x,y,w,h){
      if(!t)return;
      if(t.region){
        const [a,b,tw,th]=t.region;
        svg.push('<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+[a,b,tw,th].join(' ')+'" preserveAspectRatio="none"><image width="'+(t.url===demoIcons[0].url?1254:1182)+'" height="'+(t.url===demoIcons[0].url?1254:1330)+'" href="'+t.url+'"/></svg>');
      }else svg.push('<image x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid slice" href="'+t.url+'"/>');
    }
    function draw(n,px=0,py=0,parent=''){
      const p=n.props||{};
      if(p.visible==='false'&&!(n.name==='Inventory'&&mode==='inventory')&&!(n.name==='ModalShade'&&mode==='inventory'))return;
      const pos=vec(p.position,2),scale=vec(p.scale,2);
      const x=px+num(p,'offset_left')+(pos[0]||0),y=py+num(p,'offset_top')+(pos[1]||0);
      const w=num(p,'offset_right')-num(p,'offset_left'),h=num(p,'offset_bottom')-num(p,'offset_top');
      if(n.type==='Panel')box(x,y,w,h);
      if(n.type==='ColorRect'){
        const a=vec(p.color,4);r(x,y,w,h,'rgba('+a.slice(0,3).map(v=>v*255).join(',')+','+(a[3]??1)+')');
      }
      if(n.type==='TextureRect'&&n.texture){
        const t=n.texture, iw=t.region?.[2]||1672,ih=t.region?.[3]||941;
        if(p.stretch_mode==='5'){const f=Math.min(w/iw,h/ih);image(t,x+(w-iw*f)/2,y+(h-ih*f)/2,iw*f,ih*f);}
        else image(t,x,y,w,h);
      }
      if(n.type==='Sprite2D'){
        const t=n.texture,sw=t.region[2]*(scale[0]||1),sh=t.region[3]*(scale[1]||1);
        image(t,x-sw/2,y-sh/2,sw,sh);
      }
      if(n.type==='ProgressBar'){box(x,y,w,h,'#0c131c');r(x+1,y+1,(w-2)*num(p,'value')/100,h-2,p.theme_type_variation?'#347da6':'#a43842');}
      if(n.type==='Button'){
        box(x,y,w,h);
        if(n.icon)image(n.icon,x+(w-26)/2,y+2,26,26);
        if(p.text)text(txt(p.text),x+w/2,y+h/2+3,10,true);
      }
      if(n.type==='Label'){
        const size=num(p,'theme_override_font_sizes/font_size',10);
        let content=txt(p.text);
        if(parent==='Inventory'&&n.name==='Summary')content='Mẫu • 10 / 24 ô';
        if(parent==='Detail'&&n.name==='Name')content='Thanh Thiết Kiếm';
        if(parent==='Detail'&&n.name==='Body')content='Kiếm sắt của người mới nhập đạo.\nChưa hỗ trợ trang bị.\n\nNguồn: Lò rèn • chưa mở\nSố lượng: 1';
        for(const [i,line] of content.split('\n').entries())text(line,x+(p.horizontal_alignment==='1'?w/2:0),y+size+1+i*13,size,p.horizontal_alignment==='1');
      }
      if(n.type==='GridContainer'){
        for(let i=0;i<24;i++){
          const gx=x+(i%6)*46,gy=y+Math.floor(i/6)*46;box(gx,gy,43,43);
          if(i<demoIcons.length){image(demoIcons[i],gx+8,gy+5,26,26);text([1,1,2,3,4,3,5,2,1,1][i],gx+30,gy+38,8);}
        }
        return;
      }
      for(const child of n.children)draw(child,x,y,n.name);
    }
    draw(tree);svg.push('</svg>');
    const native = await sharp(Buffer.from(svg.join(''))).png().toBuffer();
    await sharp(native).resize(1280,720,{kernel:'nearest'}).png().toFile(path.join(output,mode+'-layout-preview.png'));
  }
  console.log('Static .tscn layout previews (NOT Godot runtime): '+output);
})().catch(e=>{console.error(e);process.exit(1)});
