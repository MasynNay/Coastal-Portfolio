from pathlib import Path
import numpy as np, trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
root=Path('/mnt/data/windfall-development');(root/'models').mkdir(exist_ok=True)
mesh=trimesh.creation.icosphere(subdivisions=4,radius=1)
orig=mesh.vertices.copy(); x,y,z=orig.T
# Naturally faceted, eroded standing-stone profile with a flattened base.
base=1 + .14*np.sin(5.1*x+4.1*y)*np.cos(5.7*z-2*x) + .078*np.sin(13*x+17*z+4*y) + .052*np.cos(31*x-24*y+21*z)
base+=.10*np.maximum(0,np.sin(y*10+x*4))
v=orig*base[:,None]
v[:,0]*=.98;v[:,1]*=1.36;v[:,2]*=.83
v[:,1] = np.maximum(v[:,1],-.89)
v[:,1]+=.88
mesh.vertices=v
# Angular runic-like geological cracks come from actual vertex shape, not a decal.
# The rock has an authored UV layout and all three glTF material-map types.
u=(np.arctan2(orig[:,2],orig[:,0])/(2*np.pi)+.5)
w=np.arccos(np.clip(orig[:,1],-1,1))/np.pi
uv=np.column_stack([u,w])
res=256
grid=np.mgrid[0:res,0:res].astype(np.float32);xx,yy=grid[1]/res,grid[0]/res
rng=np.random.default_rng(24736)
noise=rng.normal(0,1,(res,res)).astype(np.float32)
# Art-directed quartz/sandstone speckle with weathering variation and mineral veins.
veins=np.abs(np.sin(xx*29 + yy*20 + 1.7*np.sin(yy*18+xx*3)))
moss=(np.sin(xx*12+yy*8)*np.cos(yy*19-xx*5)+1)*.5
moss=np.clip((moss-.65)*3,0,1)*np.clip((yy-.15)*2,0,1)
grains=.16*np.sin(xx*80)*np.cos(yy*72) + .08*noise + .22*np.sin(xx*13+yy*11)
height=np.clip(.5+grains*.38+veins*.13,0,1)
rgb=np.zeros((res,res,3),np.float32)
for i,c in enumerate([.42,.43,.40]):rgb[:,:,i]=c+grains*.30+veins*.07
rgb[:,:,0]*=(1-.35*moss);rgb[:,:,1]*=(1+.05*moss);rgb[:,:,2]*=(1-.35*moss)
rgb=np.clip(rgb,0,1)
base_img=Image.fromarray(np.uint8(rgb*255),'RGB')
# Tangent-space normal map generated from authored height field.
dy,dx=np.gradient(height); n=np.stack([-dx*8,-dy*8,np.ones_like(height)],axis=2);n/=np.maximum(np.linalg.norm(n,axis=2,keepdims=True),1e-6)
normal_img=Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255),'RGB')
# glTF ORM: roughness in G, metalness in B, occlusion in R.
orm=np.zeros((res,res,3),np.uint8);orm[:,:,0]=np.uint8(240-35*moss);orm[:,:,1]=np.uint8(np.clip(.82+grains*.16,0,1)*255);orm[:,:,2]=0
orm_img=Image.fromarray(orm,'RGB')
mat=PBRMaterial(name='Weathered granite and moss',baseColorTexture=base_img,normalTexture=normal_img,metallicRoughnessTexture=orm_img,baseColorFactor=np.array([255,255,255,255],dtype=np.uint8),metallicFactor=0.0,roughnessFactor=0.98, doubleSided=False)
mesh.visual=TextureVisuals(uv=uv,material=mat)
blob=trimesh.exchange.gltf.export_glb(mesh)
(root/'models'/'weathered-standing-stone.glb').write_bytes(blob)
print('triangles',len(mesh.faces),'bytes',len(blob),'header',blob[:12]);
