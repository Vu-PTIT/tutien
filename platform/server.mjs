import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json; charset=utf-8','.woff':'font/woff'};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://localhost')}catch{res.writeHead(400);res.end('Bad Request');return;}
 let requested=decodeURIComponent(url.pathname); if(requested==='/'||requested.startsWith('/app'))requested='/index.html';
 const filepath=path.resolve(root,'.'+requested);
 if(!(filepath===root||filepath.startsWith(root+path.sep))){res.writeHead(403);res.end('Forbidden');return;}
 try{const contents=await fs.readFile(filepath);res.writeHead(200,{'Content-Type':mime[path.extname(filepath)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(contents);}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,()=>console.log(`TuTien platform: http://localhost:${port}/app`));
