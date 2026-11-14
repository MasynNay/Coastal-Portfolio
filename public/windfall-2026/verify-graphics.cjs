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
const characterAuthoring=fs.readFileSync(path.join(root,'tools','build_wayfarer.py'),'utf8');
assert.match(characterAuthoring,/CHARACTER=os\.environ\.get/);
assert.match(characterAuthoring,/piece\('fitted-beard','hair',beard,'head'\)/);
assert.ok(characterAuthoring.includes('faces.extend([(a,c,b),(a,d,c)])'),
  'Character facial-hair sculpt must use outward-facing front normals');
for(const label of ["label=='skin'","label=='hair'","label=='leather'","label=='iris'","label=='brass'"]){
 assert.ok(characterAuthoring.includes(label),'Missing authored material response '+label);
}
assert.match(characterAuthoring,/normal\/=np\.linalg\.norm\(normal/);
assert.match(characterAuthoring,/rough_map/);
const botanicalSource=fs.readFileSync(path.join(root,'tools','build_understory.py'),'utf8');
for(const plant of ['hazel','fern','wildflower']){
 assert.ok(botanicalSource.includes('def '+plant+'():'),'Missing original understory mesh source: '+plant);
}


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
assert.match(main,/drawShadow\(nearLightVP,true,elapsed,eye\)/);
assert.match(main,/drawShadow\(lightVP,false,elapsed,eye\)/);
const cameraFunction=main.match(/function cameraSafeEye\(target,desired\)\{[\s\S]*?\n\}/);
assert.ok(cameraFunction,'Camera obstacle function missing');
const camera=(terrain,assets)=>new Function('walkingHeight','authoredAssets',cameraFunction[0]+';return cameraSafeEye;')(terrain,assets);
const eye=[0,3,10],target=[0,2,0];
assert.deepEqual(camera(()=>0,null)(target,eye),eye,'Unobstructed camera changes position');
assert.ok(camera((x,z)=>z>4.7&&z<6?4:0,null)(target,eye)[2]<5,'Camera crossed cliff');
assert.ok(camera(()=>0,{collides:(x,z)=>z>=3.2&&z<=4.2})(target,eye)[2]<3.2,'Camera crossed structure');
const required=['windfall-wayfarer','windfall-broadleaf-tree','windfall-mountain-conifer','windfall-timber-cottage','windfall-harbor-workshop','weathered-standing-stone','windfall-companion-a','windfall-companion-b','windfall-companion-c','windfall-companion-d','windfall-hazel-shrub','windfall-fern-understory','windfall-wildflower-patch'];
for(const id of required)assert.ok(manifest.assets.some(a=>a.id===id),'Missing asset '+id);
const companions=manifest.assets.filter(item=>item.role==='companion');
assert.equal(companions.length,4,'Expected exactly four authored companion rigs');
for(const item of companions){
 assert.equal(item.instances.length,1);
 assert.ok(item.instances[0].grounded,'Companion must be terrain-grounded');
 assert.ok(item.collisionRadius>0,'Companion needs physical collision proxy');
}
assert.equal(manifest.assets.filter(item=>item.role==='player').length,1,'One playable wayfarer');
const distances={'windfall-hazel-shrub':49,'windfall-fern-understory':37,'windfall-wildflower-patch':34};
for(const [id,value] of Object.entries(distances)){
 assert.equal(manifest.assets.find(a=>a.id===id).detailDistance,value,'Unexpected foliage distance LOD');
}
const rangeFn=models.match(/function inDetailRange\(mesh,eye\)\{[\s\S]*?\n    \}/);
assert.ok(rangeFn,'Missing mesh-radius-aware distance visibility helper');
const inDetailRange=new Function(rangeFn[0]+';return inDetailRange;')();
assert.ok(inDetailRange({bounds:{center:[0,0,0],radius:.2},detailDistance:30},[30.1,0,0]));
assert.ok(!inDetailRange({bounds:{center:[0,0,0],radius:.2},detailDistance:30},[30.3,0,0]));
assert.ok(inDetailRange({bounds:{center:[0,0,0],radius:1},detailDistance:Infinity},[500,0,0]));
assert.match(models,/inDetailRange\(m,render\.eye\)/);

const undergrowth=['windfall-hazel-shrub','windfall-fern-understory','windfall-wildflower-patch'];
const number=undergrowth.reduce((n,id)=>n+manifest.assets.find(a=>a.id===id).instances.length,0);
assert.equal(number,40,'Expected forty authored forest-floor botanical placements');
assert.match(models,/uWindBaseY,uWindInvHeight,uWindMotionScale/);
assert.match(colorWind,/uWindMotionScale/);
assert.match(shadowWind,/uWindMotionScale/);
assert.match(models,/heightStart:lo\[1\]/);


for(const a of manifest.assets){
 assert.match(a.src,/^models\/[\w.-]+\.glb$/);
 assert.ok(['OWNED-ORIGINAL','CC0-1.0','CC-BY-4.0'].includes(a.license));
 assert.ok(a.provenance&&a.creator&&a.instances.length>0);
}
// Exercise the exact production culling helpers, rather than reimplementing
// camera math in tests. This catches column-major row/plane regressions.
const vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(models,sandbox,{timeout:3000});
const {frustumPlanes,transformSphere,sphereVisible}=sandbox.window.WindfallAssetPipeline.culling;
const I=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const planes=frustumPlanes(I);
assert.equal(planes.length,6);
assert.ok(sphereVisible({center:[0,0,0],radius:.25},planes));
assert.ok(sphereVisible({center:[.95,0,0],radius:.1},planes),'Visible edge sphere was discarded');
assert.ok(!sphereVisible({center:[2.5,0,0],radius:.1},planes),'Offscreen sphere was not culled');
assert.ok(!sphereVisible({center:[0,0,-3],radius:.1},planes),'Behind near plane not culled');
const shifted=I.slice();shifted[12]=-3;
assert.ok(sphereVisible({center:[3,0,0],radius:.1},frustumPlanes(shifted)),'Translated world visibility');
assert.ok(!sphereVisible({center:[0,0,0],radius:.1},frustumPlanes(shifted)),'Translated camera side culling');
const nonuniform=[2,0,0,0, 0,3,0,0, 0,0,4,0, 7,0,-5,1];
const bounds=transformSphere({center:[.5,1,0],radius:2},nonuniform,.5);
assert.equal(bounds.center[0],8);
assert.equal(bounds.center[1],3);
assert.equal(bounds.center[2],-5);
assert.equal(bounds.radius,8.5);
assert.match(models,/getDrawStats:/);
assert.match(main,/windfallDrawStats/);
assert.match(main,/authoredAssets\.beginFrame\(\)/);
assert.match(main,/authoredAssets\.updateCompanions\(elapsed\)/);
assert.match(models,/function updateCompanions\(time\)/);
console.log('Windfall graphics contracts: JS syntax, 12 GLSL sources, weather, foliage, camera, culling, thirteen model families PASS.');
console.log('Still required: headed WebGL2 shader compilation, screenshot review, and physical GPU profiling.');
