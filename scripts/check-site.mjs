import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const decoded=decodeURIComponent(root);
async function files(dir){const output=[];for(const entry of await readdir(dir,{withFileTypes:true})){if(['node_modules','.git','.vercel','mobile'].includes(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())output.push(...await files(path));else output.push(path);}return output;}
let scripts=0,pages=0;for(const path of await files(decoded)){
 if(/\.(m?js|cjs)$/.test(path)){const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(result.status)throw Error(path+'\n'+result.stderr);scripts++;}
 if(path.endsWith('.html')){const source=await readFile(path,'utf8');for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!match[2].trim()||/application\/ld\+json/.test(match[1]))continue;new vm.Script(match[2],{filename:path});}pages++;}
}
console.log(JSON.stringify({validScripts:scripts,validHtmlPages:pages}));
