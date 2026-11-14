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
const tree=manifest.assets.find(a=>a.id==='windfall-broadleaf-tree');
assert.ok(tree&&tree.thirdPartyComponents?.length===1,'Scanned broadleaf bark attribution missing');
const barkSource=tree.thirdPartyComponents[0];
assert.equal(barkSource.license,'CC0-1.0');
assert.equal(barkSource.creator,'Rob Tuytel');
assert.equal(barkSource.source,'https://polyhaven.com/a/bark_brown_02');
for(const id of ['windfall-hazel-shrub','windfall-fern-understory','windfall-wildflower-patch']){
  const asset=manifest.assets.find(a=>a.id===id);
  assert.ok(asset&&asset.instances.length>=12,'Missing original undergrowth asset '+id);
  assert.equal(asset.license,'OWNED-ORIGINAL');
}
// Surface scans are CC0, self-hosted, dimension-checked and SHA-verified.
// A missing or changed tile must not be silently accepted as an approved asset.
const crypto=require('node:crypto');
const rocks=manifest.assets.find(x=>x.id==='windfall-cc0-mossy-rock-set');
assert.ok(rocks&&rocks.license==='CC0-1.0'&&rocks.instances.length===3,
  'Photogrammetric CC0 rock-set placement and license missing');
const rockProvenance=JSON.parse(fs.readFileSync(path.join(root,'models',
  'windfall-cc0-mossy-rock-set.SOURCES.json'),'utf8'));
assert.equal(rockProvenance.id,'rock_moss_set_01');
assert.equal(rockProvenance.author,'Kless Gyzen');
assert.equal(rockProvenance.license,'CC0-1.0');
assert.equal(rockProvenance.runtime_network,false);
assert.ok(rockProvenance.triangles>60000&&rockProvenance.triangles<70000);
assert.equal(rockProvenance.runtime_size,fs.statSync(path.join(root,rocks.src)).size);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rocks.src)))
  .digest('hex'),rockProvenance.runtime_sha256);
assert.ok(rockProvenance.files.length>=2);
for(const part of rockProvenance.files){
 assert.match(part.source_url,/^https:\/\/dl\.polyhaven\.org\//);
 assert.match(part.sha256,/^[0-9a-f]{64}$/);
 assert.match(part.md5,/^[0-9a-f]{32}$/);
}

const scanned=JSON.parse(fs.readFileSync(path.join(root,'materials','SOURCES.json'),'utf8'));
assert.equal(scanned.license,'CC0-1.0');
assert.equal(scanned.assets.length,3);
const expectedScans=new Set(['forest-floor-rgba.png','cobblestone-rgba.png','tree-bark-rgba.png']);
for(const scan of scanned.assets){
 assert.ok(expectedScans.delete(scan.local_file),'Unexpected or duplicate scanned tile');
 assert.equal(scan.license,'CC0-1.0');
 assert.match(scan.source,/^https:\/\/polyhaven\.com\/a\/[a-z0-9_]+$/);
 assert.ok(scan.author.length>0);
 assert.ok(scan.diffuse.source_md5&&scan.diffuse.source_sha256);
 const data=fs.readFileSync(path.join(root,'materials',scan.local_file));
 assert.ok(data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),'PNG signature');
 assert.equal(data.readUInt32BE(16),384,'Atlas width');
 assert.equal(data.readUInt32BE(20),384,'Atlas height');
 assert.equal(data[25],6,'PNG RGBA color type');
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),scan.generated_sha256);
 console.log('Verified CC0 scan',scan.local_file,data.length,'bytes');
}
assert.equal(expectedScans.size,0,'Missing scanned texture');
console.log('Windfall GLB models and art provenance: verified.');
