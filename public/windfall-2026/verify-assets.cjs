/* node verify-assets.cjs - deterministic file-based GLB and provenance checks. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'),'utf8'));
assert.equal(manifest.version,1);assert.ok(Array.isArray(manifest.assets));
const names=new Set();
for(const a of manifest.assets){
 assert.match(a.id,/^[\w-]+$/);assert.ok(!names.has(a.id));names.add(a.id);
 assert.ok(['OWNED-ORIGINAL','CC0-1.0','CC-BY-4.0'].includes(a.license));
 assert.ok(a.creator&&a.provenance);assert.match(a.src,/^models\/[\w-]+\.glb$/);
 assert.ok(a.instances.length>=1);
 const bytes=fs.readFileSync(path.join(root,a.src));
 assert.ok(bytes.length<=32*1024*1024);assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8').trim());
 assert.equal(json.asset.version,'2.0');assert.equal(json.buffers.length,1);
 assert.ok(!json.buffers[0].uri);assert.ok(!json.extensionsRequired?.length);
 for(const img of json.images||[]) assert.ok(img.bufferView!==undefined);
 for(const inst of a.instances){assert.ok(inst.position.length===3&&inst.position.every(Number.isFinite));}
 console.log(`${a.id}: ${bytes.length} bytes, ${(json.meshes||[]).length} GLB meshes, ${a.instances.length} placed instances`);
}
console.log('Windfall GLB models and art provenance: verified.');
