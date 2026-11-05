import http from 'http';import fs from 'fs';import path from 'path';
const racine=path.resolve(new URL('../..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const dossier=path.resolve(new URL('.',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
http.createServer((q,r)=>{
 if(q.method==='POST'&&q.url.startsWith('/save/')){const nom=path.basename(decodeURIComponent(q.url.slice(6)));let b='';q.on('data',d=>b+=d);q.on('end',()=>{fs.writeFileSync(path.join(dossier,nom),Buffer.from(b.replace(/^data:image\/png;base64,/,''),'base64'));r.writeHead(200,{'access-control-allow-origin':'*'});r.end('ok');});return;}
 const f=path.join(racine,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(racine)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
 const t={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'content-type':t,'cache-control':'no-store'});fs.createReadStream(f).pipe(r);}).listen(Number(process.env.PORT_ESSAI||8797),'127.0.0.1');
