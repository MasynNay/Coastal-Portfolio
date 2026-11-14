from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
p=root/'main.js';s=p.read_text()
replacements=[
('const world=new Geometry();','let world=new Geometry();'),
('house(-13,-12,5.7,5.5,4.5);house(-5,-17,5.0,4.8,4.3,colors.deepRoof);house(5,-15,5.4,6.6,5.0);house(16,-10,7.0,6.0,4.8,colors.deepRoof);house(-18,-2,5.8,5.5,4.9);house(18,3,5.4,5.3,4.1);house(7,-25,7.4,5.5,5.1);', '''// Keep old houses as a separately-rendered fallback so authored architecture can
// replace them without gaps if a model fails, and without overlapping walls.
const mainWorld=world;world=new Geometry();
house(-13,-12,5.7,5.5,4.5);house(-5,-17,5.0,4.8,4.3,colors.deepRoof);
house(5,-15,5.4,6.6,5.0);house(16,-10,7.0,6.0,4.8,colors.deepRoof);
house(-18,-2,5.8,5.5,4.9);house(18,3,5.4,5.3,4.1);house(7,-25,7.4,5.5,5.1);
const legacyHouses=world;world=mainWorld;
function needsLegacyHouses(){return !authoredAssets || !authoredAssets.hasLoaded('windfall-timber-cottage') || !authoredAssets.hasLoaded('windfall-harbor-workshop');}'''),
('let mainProgram,shadowProgram,skyProgram,waterProgram,staticGeo,dynamicGeo,waterGeo,fullscreen,depthTex', 'let mainProgram,shadowProgram,skyProgram,waterProgram,staticGeo,legacyHouseGeo,dynamicGeo,waterGeo,fullscreen,depthTex'),
('staticGeo=geometryBuffer(world);world.a=null;','staticGeo=geometryBuffer(world);world.a=null;legacyHouseGeo=geometryBuffer(legacyHouses);legacyHouses.a=null;'),
('gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);\n // Unlike the previous fixed-circle shadow',
 '''gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);
 if(needsLegacyHouses()){gl.bindVertexArray(legacyHouseGeo.vao);gl.drawArrays(gl.TRIANGLES,0,legacyHouseGeo.count);}
 // Unlike the previous fixed-circle shadow'''),
('gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);\n if(authoredAssets){',
 '''gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);
 if(needsLegacyHouses()){gl.bindVertexArray(legacyHouseGeo.vao);gl.drawArrays(gl.TRIANGLES,0,legacyHouseGeo.count);}
 if(authoredAssets){''')]
for a,b in replacements:
    if a not in s:raise ValueError(f'missing in main: {a[:100]}')
    s=s.replace(a,b,1)
p.write_text(s)

p=root/'asset-pipeline.js';s=p.read_text()
replacements=[
("if (a.collisionRadius !== undefined && (!Number.isFinite(a.collisionRadius) || a.collisionRadius < 0 || a.collisionRadius > 60)) throw new Error('Invalid model collision radius');", "if (a.collisionRadius !== undefined && (!Number.isFinite(a.collisionRadius) || a.collisionRadius < 0 || a.collisionRadius > 60)) throw new Error('Invalid model collision radius');\n      if (a.collisionBox !== undefined && (!Array.isArray(a.collisionBox) || a.collisionBox.length !== 2 || !a.collisionBox.every(n => Number.isFinite(n) && n > 0 && n <= 50))) throw new Error('Invalid building collision box');"),
('if(entry.collisionRadius>0)colliders.push({x:instance.position[0],z:instance.position[2],radius:entry.collisionRadius*scale});', '''if(entry.collisionRadius>0)colliders.push({x:instance.position[0],z:instance.position[2],radius:entry.collisionRadius*scale});
        if(entry.collisionBox)colliders.push({x:instance.position[0],z:instance.position[2],halfWidth:entry.collisionBox[0]*scale,halfDepth:entry.collisionBox[1]*scale,rotation:angle});'''),
('return {addGLB,loadManifest,draw,drawShadow,getStatus:()=>statuses.slice(),getMeshCount:()=>records.length,\n      collides:(x,z,padding=.28)=>colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.radius+padding)};', '''return {addGLB,loadManifest,draw,drawShadow,getStatus:()=>statuses.slice(),getMeshCount:()=>records.length,
      hasLoaded:(id)=>statuses.some(s=>s.id===id&&s.loaded),
      collides:(x,z,padding=.28)=>colliders.some(c=>{
        const dx=x-c.x,dz=z-c.z;
        if(c.radius!==undefined)return Math.hypot(dx,dz)<c.radius+padding;
        const cs=Math.cos(c.rotation),sn=Math.sin(c.rotation);
        const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
        return Math.abs(lx)<c.halfWidth+padding && Math.abs(lz)<c.halfDepth+padding;
      })};''')]
for a,b in replacements:
    if a not in s:raise ValueError(f'missing in asset-pipeline: {a[:100]}')
    s=s.replace(a,b,1)
p.write_text(s)

p=root/'asset-manifest.json';m=json.loads(p.read_text())
architecture=[
 {
  'id':'windfall-timber-cottage','src':'models/windfall-timber-cottage.glb',
  'creator':'Windfall — original procedural architecture and custom PBR textures',
  'license':'OWNED-ORIGINAL','provenance':'tools/build_architecture.py; all geometry and PBR maps created locally, no borrowed mesh or image',
  'collisionBox':[3.10,3.0],
  'instances':[{'position':[x,.12,z],'scale':scale,'rotationY':0,'grounded':True} for x,z,scale in [(-13,-12,.95),(-5,-17,.88),(5,-15,.97),(-18,-2,.95),(18,3,.90)]]
 },
 {
  'id':'windfall-harbor-workshop','src':'models/windfall-harbor-workshop.glb',
  'creator':'Windfall — original procedural architecture and custom PBR textures',
  'license':'OWNED-ORIGINAL','provenance':'tools/build_architecture.py; all geometry and PBR maps created locally, no borrowed mesh or image',
  'collisionBox':[3.85,3.55],
  'instances':[{'position':[x,.12,z],'scale':scale,'rotationY':0,'grounded':True} for x,z,scale in [(16,-10,1.02),(7,-25,1.05)]]
 }
]
m['assets'].extend(architecture)
p.write_text(json.dumps(m,indent=2)+'\n')
print('Integrated',len(architecture),'original model families,',sum(len(a['instances']) for a in architecture),'building placements')
