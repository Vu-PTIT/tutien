// Build immutable cardinal-edge masks using the same radius, sample spacing and
// geometry rules as world_move. Expensive geometry is evaluated at build time.
const distance=(a,b,c,d)=>Math.sqrt((a-c)**2+(b-d)**2);
function waterContains(w,x,y) {
  if(w.shape==='ellipse')return ((x-w.center_cell[0])/w.radii_cells[0])**2+((y-w.center_cell[1])/w.radii_cells[1])**2<=1;
  const p=w.points||[];
  if(w.shape==='polygon'){
    let inside=false;
    for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;
    return inside;
  }
  for(let i=1;i<p.length;i++){
    const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1],len=dx*dx+dy*dy;
    const t=len?Math.max(0,Math.min(1,((x-p[i-1][0])*dx+(y-p[i-1][1])*dy)/len)):0;
    if(distance(x,y,p[i-1][0]+t*dx,p[i-1][1]+t*dy)<=w.width_cells/2)return true;
  }
  return false;
}
function navigation(map) {
  const cache=new Map();
  function walkable(x,y) {
    const key=x+','+y;if(cache.has(key))return cache.get(key);
    let ok=true;
    if(x<8||y<8||x>=map.width*32-8||y>=map.height*32-8)ok=false;
    for(const [dx,dy] of [[0,0],[-8,0],[8,0],[0,-8],[0,8]]) {
      if(!ok)break;
      const px=x+dx,py=y+dy,tx=Math.floor(px/32),ty=Math.floor(py/32);
      for(const [rx,ry,w,h] of map.solids)if(tx>=rx&&tx<rx+w&&ty>=ry&&ty<ry+h){ok=false;break;}
      if(!ok)break;
      for(const [rx,ry,w,h] of map.footprints||[])if(px>=rx&&px<rx+w&&py>=ry&&py<ry+h){ok=false;break;}
      if(!ok)break;
      const cx=px/32,cy=py/32;
      const bridge=(map.bridges||[]).some(([rx,ry,w,h])=>cx>=rx&&cx<=rx+w&&cy>=ry&&cy<=ry+h);
      if(!bridge&&(map.waters||[]).some(w=>waterContains(w,cx,cy)))ok=false;
    }
    cache.set(key,ok);return ok;
  }
  function edge(x,y,nx,ny) {
    for(let i=0;i<=4;i++)if(!walkable(x+(nx-x)*i/4,y+(ny-y)*i/4))return false;
    return true;
  }
  const bits=Array.from({length:map.height},()=>new Uint8Array(map.width));
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
    if(!walkable(x*32+16,y*32+16))continue;
    if(x+1<map.width&&edge(x*32+16,y*32+16,(x+1)*32+16,y*32+16)){bits[y][x]|=2;bits[y][x+1]|=1;}
    if(y+1<map.height&&edge(x*32+16,y*32+16,x*32+16,(y+1)*32+16)){bits[y][x]|=8;bits[y+1][x]|=4;}
  }
  // Most rows have long open runs. RLE keeps the VM's immutable data small.
  return bits.map(row=>Array.from(row,n=>n.toString(16)).join('').match(/(.)\1*/g)
    .map(run=>run.length.toString(36)+':'+run[0]).join(','));
}
module.exports={navigation};
