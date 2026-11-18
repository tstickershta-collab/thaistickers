import http from 'node:http';
import {Readable} from 'node:stream';
import {createHash,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {createCMS,render,schema,validate} from './lib/cms.mjs';
import {pageManager,applyMenu} from './lib/pages.mjs';
import {randomUUID} from 'node:crypto';
import worker from './dist/server/index.js';
import {FileBucket} from './lib/file-bucket.mjs';
export function createApp({password=process.env.ADMIN_PASSWORD,origin=process.env.SITE_ORIGIN||process.env.RENDER_EXTERNAL_URL,directory=process.env.DATA_DIR}={}){
 if(!password||password.length<16)throw Error('Set ADMIN_PASSWORD to at least 16 characters in hosting environment settings.');
 if(!origin||!/^https?:\/\//.test(origin))throw Error('Set SITE_ORIGIN to the exact https website origin.');
 const base=new URL(origin).origin;const env={BUCKET:directory?new FileBucket(directory):null};
 const manager=pageManager(env.BUCKET);
 const digest=s=>createHash('sha256').update(s).digest();const expected=digest('admin:'+password);
 function authenticated(req){const h=req.headers.authorization||'';if(!h.startsWith('Basic '))return false;const decoded=Buffer.from(h.slice(6),'base64').toString('utf8');return timingSafeEqual(digest(decoded),expected)}
 return http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,base);if(url.origin!==base){res.writeHead(400);return res.end('Bad request')}
  const auth=authenticated(req);const protectedRoute=url.pathname.startsWith('/admin')||url.pathname.startsWith('/api/cms')||url.pathname.startsWith('/api/images/');
  if(protectedRoute&&!auth){res.writeHead(401,{'WWW-Authenticate':'Basic realm="ThaiStickers Admin", charset="UTF-8"','Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end('<h1>ThaiStickers — จัดการเว็บไซต์</h1><p>เข้าสู่ระบบด้วยชื่อผู้ใช้ admin และรหัสผ่านเจ้าของเว็บไซต์</p>')}
  if(url.pathname.startsWith('/api/cms')||['/admin/editor','/admin/pages'].includes(url.pathname)||url.pathname.startsWith('/uploads/')){
   const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
   try{
    if(['/admin/editor','/admin/pages'].includes(url.pathname)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(new URL(url.pathname==='/admin/pages'?'./public/pages.html':'./public/editor.html',import.meta.url),'utf8'))}
    if(url.pathname.startsWith('/uploads/')){const id=url.pathname.slice(9);if(!/^[a-f0-9-]{36}$/.test(id))return send({error:'Not found'},404);const o=await env.BUCKET?.get('uploads/'+id);if(!o)return send({error:'Not found'},404);res.writeHead(200,{'Content-Type':o.httpMetadata.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=86400'});return res.end(Buffer.from(o.body))}
    const page=url.searchParams.get('page')||'home';const idx=await manager.index();if(!idx.pages.some(p=>p.key===page))return send({error:'ไม่พบหน้า'},404);const cms=manager.get(page);
    if(req.method==='GET'&&url.pathname==='/api/cms/pages')return send({...await manager.list(),storageReady:!!env.BUCKET});
    if(req.method==='GET'&&url.pathname==='/api/cms'){const state=await cms.read();return send({...state,schema:schema(),storageReady:!!env.BUCKET})}
    if(req.method!=='POST')return send({error:'Method not allowed'},405);
    if(req.headers.origin!==base)return send({error:'Origin ไม่ถูกต้อง'},403);
    const chunks=[];let total=0;for await(const c of req){total+=c.length;if(total>5242880)return send({error:'ไฟล์ต้องไม่เกิน 5 MB'},413);chunks.push(c)}const bytes=Buffer.concat(chunks);
    if(url.pathname==='/api/cms/upload'){if(!env.BUCKET)return send({error:'กรุณาเชื่อมพื้นที่เก็บถาวรก่อน'},503);const type=req.headers['content-type'];const valid=(type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||(type==='image/png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(type==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');if(!valid)return send({error:'รองรับ JPG PNG WebP เท่านั้น'},415);const id=randomUUID();await env.BUCKET.put('uploads/'+id,bytes,{httpMetadata:{contentType:type}});return send({url:'/uploads/'+id})}
    const body=JSON.parse(bytes.toString());const action=url.pathname.split('/').pop();if(url.pathname.startsWith('/api/cms/pages/'))return send(await manager.change(action,body));
    if(action==='preview'){const html=applyMenu(render(validate(body.document)),idx.menuPublished);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html)}
    const state=await cms.change(action,body);return send({...state,storageReady:true});
   }catch(e){return send({error:e.message},e.status||400)}
  }
  if(['GET','HEAD'].includes(req.method)&&!url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/media/')&&!url.pathname.startsWith('/defaults/')){const idx=await manager.index();const path=url.pathname==='/'?'/':url.pathname.replace(/\/$/,'');const page=idx.pages.find(p=>p.path===path);if(page){const state=await manager.get(page.key).read();if(state.unpublished||(!state.published&&!['home','catalog'].includes(page.key))){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('หน้านี้ยังไม่เผยแพร่')}let html;if(state.published)html=render(state.published);else html=await(await worker.fetch(new Request(new URL(path,base)),env)).text();html=applyMenu(html,idx.menuPublished);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?'':html)}}
  const headers=new Headers();for(const [k,v]of Object.entries(req.headers)){if(k.startsWith('oai-')||k==='authorization'||k==='host'||k==='connection'||v==null)continue;headers.set(k,Array.isArray(v)?v.join(','):v)}
  if(auth){headers.set('oai-authenticated-user-id','portable-owner');headers.set('oai-authenticated-user-email','admin@localhost')}
  const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method)){init.body=Readable.toWeb(req);init.duplex='half'}
  let response=await worker.fetch(new Request(url,init),env);if(url.pathname.startsWith('/admin')&&response.status===200){const text=(await response.text()).replace('เจ้าของเว็บไซต์ที่ลงชื่อเข้าใช้ด้วย ChatGPT','เจ้าของเว็บไซต์ที่เข้าสู่ระบบด้วยชื่อผู้ใช้ admin');response=new Response(text,{status:200,headers:response.headers})}res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
 }catch{res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('ระบบขัดข้อง กรุณาลองใหม่')}});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const app=createApp();const port=Number(process.env.PORT||3000);app.listen(port,'0.0.0.0',()=>console.log('ThaiStickers ready on port '+port))}
