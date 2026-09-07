import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SKIP_DIRS=new Set(['.git','node_modules']);
const TEXT_EXTENSIONS=new Set(['.md','.js','.json','.html','.css','.yml','.yaml','.webmanifest','.txt']);
const OLD_REFERENCES=[
  ['kameusagiyahoo','test'].join('/'),
  ['kameusagiyahoo.github.io','test'].join('/'),
  ['','test',''].join('/'),
  ['test','git'].join('.')
];

function textFiles(dir=ROOT){
  const files=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP_DIRS.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())files.push(...textFiles(full));
    else if(TEXT_EXTENSIONS.has(path.extname(entry.name))||entry.name==='README')files.push(full);
  }
  return files;
}

test('repository files do not reference the old test repository name or Pages path',()=>{
  const offenders=[];
  for(const file of textFiles()){
    const source=fs.readFileSync(file,'utf8');
    for(const oldRef of OLD_REFERENCES){
      if(source.includes(oldRef))offenders.push(`${path.relative(ROOT,file)}: ${oldRef}`);
    }
  }
  assert.deepEqual(offenders,[]);
});
