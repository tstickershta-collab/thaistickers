import fs from 'node:fs';
fs.mkdirSync('dist/server',{recursive:true});
const pages={catalog:fs.readFileSync('public/catalog.html','utf8'),home:fs.readFileSync('public/index.html','utf8'),admin:fs.readFileSync('public/admin.html','utf8')};
const assets={};for(const name of fs.readdirSync('assets'))assets['/defaults/'+name]={type:name.endsWith('.png')?'image/png':'image/jpeg',base64:fs.readFileSync('assets/'+name).toString('base64')};
fs.writeFileSync('dist/server/index.js','const pages='+JSON.stringify(pages)+';\nconst assets='+JSON.stringify(assets)+';\n'+fs.readFileSync('worker/index.js','utf8'));
fs.rmSync('dist/index.html',{force:true});
