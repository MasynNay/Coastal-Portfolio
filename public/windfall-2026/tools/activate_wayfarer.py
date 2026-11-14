"""Integrate authored original wayfarer, preserving previous procedural player fallback.
Run at staged development root: python tools/activate_wayfarer.py
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
loader=root/'asset-pipeline.js';main=root/'main.js';manifest=root/'asset-manifest.json'

def replace(src, old, new):
    if old not in src: raise ValueError('Patch source mismatch: '+old[:100])
    return src.replace(old,new,1)

s=loader.read_text()
s=replace(s,"      if (!Array.isArray(a.instances) || !a.instances.length || a.instances.length > 150) throw new Error('Specify 1-150 instances per asset');",
"      if (a.role !== undefined && a.role !== 'player') throw new Error('Unsupported dynamic model role');\n      if (!Array.isArray(a.instances) || !a.instances.length || a.instances.length > 150 || (a.role==='player'&&a.instances.length!==1)) throw new Error('Specify 1-150 instances (one for player)');")
s=replace(s,'    const records=[],statuses=[],colliders=[];','    const records=[],statuses=[],colliders=[];\n    let dynamicPlayer=null;')
s=replace(s,'''          for(const primitive of primitives)localNodes.push({...primitive,model:world});''', '''          for(const primitive of primitives)localNodes.push({...primitive,model:world,nodeIndex:index});''')
s=replace(s,'''      if(!localNodes.length)throw new Error('GLB has no renderable triangle meshes');
      for(const instance of entry.instances){''','''      if(!localNodes.length)throw new Error('GLB has no renderable triangle meshes');
      if(entry.role==='player'){
        // Hierarchical mesh-node articulation (not skinned mesh deformation).
        // The original procedural hero remains visible until GLB validation succeeds.
        const nodeMeshes=new Map();
        for(const mesh of localNodes){
          if(!nodeMeshes.has(mesh.nodeIndex))nodeMeshes.set(mesh.nodeIndex,[]);
          nodeMeshes.get(mesh.nodeIndex).push(mesh);
        }
        dynamicPlayer={doc,roots,parts:localNodes,nodeMeshes};
        statuses.push({id:entry.id,loaded:true,meshes:localNodes.length,instances:1,role:'player'});
        return localNodes.length;
      }
      for(const instance of entry.instances){''')
s=replace(s,'''    function drawShadow(vp){
      if(!records.length)return;''','''    // Drive the named authored GLB pivot nodes from the existing frame-independent gait.
    // No JS-side vertex regeneration is needed: only a few matrices are updated.
    function updatePlayer({x,y,z,heading,phase,motion,time}){
      const rig=dynamicPlayer;if(!rig)return;
      const cycle=Math.sin(phase)*motion,heel=Math.cos(phase)*motion;
      const root=trs([x,y,z],[0,Math.sin(heading*.5),0,Math.cos(heading*.5)]);
      const rotX=a=>trs([0,0,0],[Math.sin(a*.5),0,0,Math.cos(a*.5)]);
      const rotY=a=>trs([0,0,0],[0,Math.sin(a*.5),0,Math.cos(a*.5)]);
      const rotZ=a=>trs([0,0,0],[0,0,Math.sin(a*.5),Math.cos(a*.5)]);
      const swing=(name)=>{
        if(name==='leg-L')return rotX(.43*cycle);
        if(name==='leg-R')return rotX(-.43*cycle);
        if(name==='shin-L')return rotX(-.12+.52*Math.max(0,-cycle));
        if(name==='shin-R')return rotX(-.12+.52*Math.max(0,cycle));
        if(name==='foot-L')return rotX(-.22*Math.sin(phase+.4)*motion);
        if(name==='foot-R')return rotX(.22*Math.sin(phase+.4)*motion);
        if(name==='arm-L')return rotX(-.34*cycle);
        if(name==='arm-R')return rotX(.34*cycle);
        if(name==='forearm-L')return rotX(-.13-.09*heel);
        if(name==='forearm-R')return rotX(-.13+.09*heel);
        if(name==='body')return rotZ(.022*cycle);
        if(name==='cape')return rotX(.06+Math.sin(time*2.3)*.055+.08*motion);
        if(name==='head')return rotY(Math.sin(time*.73)*.026);
        return identity();
      };
      function walk(i,parent,depth=0){
        if(depth>50)throw new Error('Invalid articulated character hierarchy');
        const node=rig.doc.json.nodes[i];
        const original=node.matrix||trs(node.translation,node.rotation,node.scale);
        const local=multiply(original,swing(node.name||''));
        const model=multiply(parent,local);
        for(const mesh of rig.nodeMeshes.get(i)||[])mesh.model=model;
        for(const child of node.children||[])walk(child,model,depth+1);
      }
      const bob=Math.abs(Math.sin(phase))*.042*motion;
      const actor=multiply(root,trs([0,bob,0]));
      for(const i of rig.roots)walk(i,actor);
    }
    function drawShadow(vp,includePlayer=false){
      if(!records.length && !(includePlayer&&dynamicPlayer))return;''')
s=replace(s,'      for(const m of records){if(m.mat.alpha===\'BLEND\')continue;',"      for(const m of (includePlayer&&dynamicPlayer ? records.concat(dynamicPlayer.parts) : records)){if(m.mat.alpha==='BLEND')continue;")
s=replace(s,'''    function draw(render){
      if(!records.length)return;''','''    function draw(render){
      if(!records.length && !dynamicPlayer)return;
      const visible=dynamicPlayer?records.concat(dynamicPlayer.parts):records;''')
s=replace(s,'''        for(const m of records){if(m.mat.alpha!==layer)continue;''','''        for(const m of visible){if(m.mat.alpha!==layer)continue;''')
s=replace(s,'''    return {addGLB,loadManifest,draw,drawShadow,getStatus:()=>statuses.slice(),getMeshCount:()=>records.length,''','''    return {addGLB,loadManifest,draw,drawShadow,updatePlayer,getStatus:()=>statuses.slice(),getMeshCount:()=>records.length+(dynamicPlayer?.parts.length||0),''')
loader.write_text(s)

s=main.read_text()
s=replace(s,''' if(authoredAssets)authoredAssets.drawShadow(nearLightVP);''',''' if(authoredAssets)authoredAssets.drawShadow(nearLightVP,true);''')
s=replace(s,''' gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,heroCount);
 if(authoredAssets)authoredAssets.drawShadow(nearLightVP,true);''',''' if(heroCount){gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,heroCount);}
 if(authoredAssets)authoredAssets.drawShadow(nearLightVP,true);''')
s=replace(s,''' // Update actor geometry before both sunlight shadow and visible color passes.
 const hero=character(elapsed),heroArray=new Float32Array(hero.a);
 gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);
 if(heroArray.byteLength>dynamicByteCapacity){dynamicByteCapacity=2*heroArray.byteLength;gl.bufferData(gl.ARRAY_BUFFER,dynamicByteCapacity,gl.DYNAMIC_DRAW)}
 gl.bufferSubData(gl.ARRAY_BUFFER,0,heroArray);''',''' // The new PBR wayfarer animates in the model hierarchy; keep primitive fallback.
 const hasAuthoredHero=!!(authoredAssets&&authoredAssets.hasLoaded('windfall-wayfarer'));
 if(hasAuthoredHero)authoredAssets.updatePlayer({x,y:y+.07,z,heading:player.heading,phase:player.phase,motion:player.motion,time:elapsed});
 const hero=hasAuthoredHero?null:character(elapsed);
 if(hero){
  const heroArray=new Float32Array(hero.a);gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);
  if(heroArray.byteLength>dynamicByteCapacity){dynamicByteCapacity=2*heroArray.byteLength;gl.bufferData(gl.ARRAY_BUFFER,dynamicByteCapacity,gl.DYNAMIC_DRAW)}
  gl.bufferSubData(gl.ARRAY_BUFFER,0,heroArray);
 }''')
s=replace(s,' renderNearSunShadow(x,z,y,hero.count,now*.001);',' renderNearSunShadow(x,z,y,hero?hero.count:0,now*.001);')
s=replace(s,''' // Dynamic hero geometry is small; regenerate poses rather than deform all of the scenery.
 gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,hero.count);''',''' // Draw a procedural character only when the authored GLB is absent or fails.
 if(hero){gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,hero.count);}''')
main.write_text(s)

j=json.loads(manifest.read_text())
assert not any(a['id']=='windfall-wayfarer' for a in j['assets'])
j['assets'].append({'id':'windfall-wayfarer','src':'models/windfall-wayfarer.glb',
  'role':'player','creator':'Windfall original original articulated adventurer',
  'license':'OWNED-ORIGINAL',
  'provenance':'tools/build_wayfarer.py; original procedural character sculpture, generated PBR maps, hierarchical named pivots; no borrowed artwork',
  'instances':[{'position':[0,0,0],'scale':1,'rotationY':0}]})
manifest.write_text(json.dumps(j,indent=2)+'\n')
print('Integrated character to authored GLB pipeline, preserved fallback and updated manifest')
