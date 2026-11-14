#!/usr/bin/env node
/* Offline structural regression guard for original Windfall architecture.
 * Usage: from public/windfall-2026/, node tools/verify-architecture.cjs
 * No browser, subscriptions, external assets, or network required.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file));
const manifest=JSON.parse(read('asset-manifest.json'));
const source=read('main.js').toString('utf8');
const pipeline=read('asset-pipeline.js').toString('utf8');
const types={
 'windfall-timber-cottage':5,
 'windfall-harbor-workshop':2,
};
assert.equal(manifest.version,1);
assert.ok(Array.isArray(manifest.assets));
assert.ok(fs.existsSync(path.join(__dirname,'build_architecture.js')), 'original building generator missing');
function glbJson(filename) {
 const buf=read(filename);
 assert.ok(buf.length>200000 && buf.length<32*1024*1024, filename+' unexpected byte length');
 assert.equal(buf.toString('ascii',0,4),'glTF',filename+' GLB header missing');
 assert.equal(buf.readUInt32LE(4),2,filename+' must be glTF 2');
 assert.equal(buf.readUInt32LE(8),buf.length,filename+' header length mismatch');
 const len=buf.readUInt32LE(12);
 assert.equal(buf.readUInt32LE(16),0x4e4f534a,filename+' JSON chunk missing');
 const json=JSON.parse(buf.toString('utf8',20,20+len).trim());
 assert.equal(json.asset.version,'2.0');
 assert.ok(Array.isArray(json.meshes) && json.meshes.length>=2,filename+' meshes missing');
 assert.ok(Array.isArray(json.materials) && json.materials.length>=3,filename+' PBR materials missing');
 assert.ok(Array.isArray(json.images) && json.images.length>=3,filename+' authored textures missing');
 assert.ok(Array.isArray(json.textures) && json.textures.length>=3,filename+' texture bindings missing');
 for(const image of json.images) {
  assert.equal(image.uri,undefined,filename+' must embed all images');
  assert.ok(Number.isInteger(image.bufferView),filename+' image bufferView missing');
  assert.ok(json.bufferViews[image.bufferView],filename+' broken image bufferView');
 }
 for(const mesh of json.meshes)for(const prim of mesh.primitives||[]){
  assert.ok(prim.attributes?.POSITION!==undefined,filename+' mesh position missing');
  assert.ok(prim.material!==undefined && json.materials[prim.material],filename+' material reference invalid');
 }
 return {bytes:buf.length,meshes:json.meshes.length,materials:json.materials.length,images:json.images.length};
}
for(const [id,expected] of Object.entries(types)) {
 const a=manifest.assets.find(v=>v.id===id);
 assert.ok(a,id+' absent from manifest');
 assert.equal(a.instances.length,expected,id+' placement count drifted');
 assert.equal(a.license,'OWNED-ORIGINAL',id+' rights metadata missing');
 assert.ok(a.creator?.trim() && a.provenance?.trim(),id+' provenance missing');
 assert.ok(a.src.startsWith('models/') && !a.src.includes('..'),id+' invalid model path');
 assert.ok(Array.isArray(a.collisionBox) && a.collisionBox.length===2 && a.collisionBox.every(v=>v>0),id+' rectangular collision missing');
 const info=glbJson(a.src);
 assert.ok(source.includes("hasLoaded('"+id+"')"),id+' model-aware fallback missing');
 console.log(id,JSON.stringify(info),expected+' instances');
}
assert.ok(source.includes('drawLegacyBuildings()'),'fallback rendering missing');
assert.ok(source.includes('rebuildFarSunShadow()'),'distant imported-model shadows missing');
assert.ok(pipeline.includes('collisionBox'),'rotated building collision handling missing');
console.log('Windfall architecture source, material bindings, placements and fallbacks: PASS.');
