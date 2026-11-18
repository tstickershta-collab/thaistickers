import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
export class FileBucket {
 constructor(directory){this.directory=resolve(directory)}
 path(key){const p=resolve(this.directory,key+'.json');if(!p.startsWith(this.directory+sep))throw Error('Invalid file key');return p}
 async head(key){const o=await this.get(key);return o?{etag:o.etag}:null}
 async get(key){try{const o=JSON.parse(await readFile(this.path(key),'utf8'));return {...o,body:new Uint8Array(Buffer.from(o.base64,'base64'))}}catch(e){if(e.code==='ENOENT')return null;throw e}}
 async put(key,body,options={}){const p=this.path(key);await mkdir(join(p,'..'),{recursive:true});const tmp=p+'.'+randomUUID()+'.tmp';const bytes=Buffer.from(await new Response(body).arrayBuffer());await writeFile(tmp,JSON.stringify({etag:randomUUID(),httpMetadata:options.httpMetadata,base64:bytes.toString('base64')}),{mode:0o600});await rename(tmp,p)}
 async delete(key){try{await unlink(this.path(key))}catch(e){if(e.code!=='ENOENT')throw e}}
}
