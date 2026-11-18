import http from 'node:http';
import {Readable} from 'node:stream';
import {createHash,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import worker from './dist/server/index.js';
import {FileBucket} from './lib/file-bucket.mjs';
export function createApp({password=process.env.ADMIN_PASSWORD,origin=process.env.SITE_ORIGIN||process.env.RENDER_EXTERNAL_URL,directory=process.env.DATA_DIR}={}){
 if(!password||password.length<16)throw Error('Set ADMIN_PASSWORD to at least 16 characters in hosting environment settings.');
 if(!origin||!/^https?:\/\//.test(origin))throw Error('Set SITE_ORIGIN to the exact https website origin.');
 const base=new URL(origin).origin;const env={BUCKET:directory?new FileBucket(directory):null};
 const digest=s=>createHash('sha256').update(s).digest();const expected=digest('admin:'+password);
 function authenticated(req){const h=req.headers.authorization||'';if(!h.startsWith('Basic '))return false;const decoded=Buffer.from(h.slice(6),'base64').toString('utf8');return timingSafeEqual(digest(decoded),expected)}
 return http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,base);if(url.origin!==base){res.writeHead(400);return res.end('Bad request')}
  const auth=authenticated(req);const protectedRoute=url.pathname==='/admin'||url.pathname==='/admin/'||url.pathname.startsWith('/api/images/');
  if(protectedRoute&&!auth){res.writeHead(401,{'WWW-Authenticate':'Basic realm="ThaiStickers Admin", charset="UTF-8"','Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end('<h1>ThaiStickers — จัดการเว็บไซต์</h1><p>เข้าสู่ระบบด้วยชื่อผู้ใช้ admin และรหัสผ่านเจ้าของเว็บไซต์</p>')}
  const headers=new Headers();for(const [k,v]of Object.entries(req.headers)){if(k.startsWith('oai-')||k==='authorization'||k==='host'||k==='connection'||v==null)continue;headers.set(k,Array.isArray(v)?v.join(','):v)}
  if(auth){headers.set('oai-authenticated-user-id','portable-owner');headers.set('oai-authenticated-user-email','admin@localhost')}
  const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method)){init.body=Readable.toWeb(req);init.duplex='half'}
  let response=await worker.fetch(new Request(url,init),env);if(url.pathname.startsWith('/admin')&&response.status===200){const text=(await response.text()).replace('เจ้าของเว็บไซต์ที่ลงชื่อเข้าใช้ด้วย ChatGPT','เจ้าของเว็บไซต์ที่เข้าสู่ระบบด้วยชื่อผู้ใช้ admin');response=new Response(text,{status:200,headers:response.headers})}res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
 }catch{res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('ระบบขัดข้อง กรุณาลองใหม่')}});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const app=createApp();const port=Number(process.env.PORT||3000);app.listen(port,'0.0.0.0',()=>console.log('ThaiStickers ready on port '+port))}
