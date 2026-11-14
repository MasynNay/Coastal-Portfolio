/* Windfall self-contained graphics source contract checks.
 * Run: node public/windfall-2026/verify-graphics.cjs
 * These are fast static and deterministic camera tests. They do NOT replace
 * a WebGL2 shader compiler, real-browser screenshot review, or GPU benchmarks.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
const models=fs.readFileSync(path.join(root,'asset-pipeline.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'),'utf8'));
new Function(main);
new Function(models);
function shader(text,name){
 const match=text.match(new RegExp('const '+name+'\\s*=\\s*`([\\s\\S]*?)`;'));
 assert.ok(match,'Shader '+name+' missing');
 const src=match[1].replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
 assert.match(src.trim(),/^#version 300 es/);
 for(const [open,close] of [['(',')'],['[',']'],['{','}']]){
  const count=(ch)=>Array.from(src).filter(x=>x===ch).length;
  assert.equal(count(open),count(close),name+' '+open+'/'+close+' imbalance');
 }
 return src;
}
for(const [file,names] of [[main,['VS','FS','SHADOW_VS','SHADOW_FS','SKY_VS','SKY_FS','WATER_VS','WATER_FS']],
                           [models,['VERTEX','FRAGMENT','SHADOW_VERTEX','SHADOW_FRAGMENT']]]){
 for(const name of names)shader(file,name);
}
const landscape=shader(main,'FS');
const authored=shader(models,'FRAGMENT');
const colorWind=shader(models,'VERTEX'),shadowWind=shader(models,'SHADOW_VERTEX');
assert.match(landscape,/uTime\*\.018/);
assert.match(authored,/uTime\*\.018/);
assert.match(landscape,/cloudSun/);
assert.match(authored,/cloudSun/);
assert.match(authored,/ambientOcclusion/);
assert.match(authored,/leafTransmission/);
assert.match(main,/render\.lowQuality|lowQuality:softwareRenderer/);
assert.match(models,/render\.lowQuality/);
assert.match(colorWind,/world\.xz\+=vec2\(\.16,\.085\)/);
assert.match(shadowWind,/world\.xz\+=vec2\(\.16,\.085\)/);
assert.match(main,/drawShadow\(nearLightVP,true,elapsed\)/);
assert.match(main,/drawShadow\(lightVP,false,elapsed\)/);
const cameraFunction=main.match(/function cameraSafeEye\(target,desired\)\{[\s\S]*?\n\}/);
assert.ok(cameraFunction,'Camera obstacle function missing');
const camera=(terrain,assets)=>new Function('walkingHeight','authoredAssets',cameraFunction[0]+';return cameraSafeEye;')(terrain,assets);
const eye=[0,3,10],target=[0,2,0];
assert.deepEqual(camera(()=>0,null)(target,eye),eye,'Unobstructed camera changes position');
assert.ok(camera((x,z)=>z>4.7&&z<6?4:0,null)(target,eye)[2]<5,'Camera crossed cliff');
assert.ok(camera(()=>0,{collides:(x,z)=>z>=3.2&&z<=4.2})(target,eye)[2]<3.2,'Camera crossed structure');
const required=['windfall-wayfarer','windfall-broadleaf-tree','windfall-mountain-conifer','windfall-timber-cottage','windfall-harbor-workshop','weathered-standing-stone'];
for(const id of required)assert.ok(manifest.assets.some(a=>a.id===id),'Missing asset '+id);
for(const a of manifest.assets){
 assert.match(a.src,/^models\/[\w.-]+\.glb$/);
 assert.ok(['OWNED-ORIGINAL','CC0-1.0','CC-BY-4.0'].includes(a.license));
 assert.ok(a.provenance&&a.creator&&a.instances.length>0);
}
console.log('Windfall graphics contracts: JS syntax, 12 GLSL source checks, weather, foliage wind, shadow times, camera sweeps, six asset families PASS.');
console.log('Still required: headed WebGL2 shader compilation, screenshot review, and physical GPU profiling.');
