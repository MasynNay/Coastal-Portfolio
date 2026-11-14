from pathlib import Path
import numpy as np, trimesh
from PIL import Image, ImageDraw
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
root=Path(__file__).resolve().parents[1];r=np.random.default_rng(2946)
(root/'models').mkdir(parents=True,exist_ok=True)
verts=[];faces=[];uvs=[]
def frustum(a,b,ra,rb,sides=10):
 a=np.array(a,float);b=np.array(b,float);axis=b-a;axis/=np.linalg.norm(axis)
 p=np.cross(axis,[0,0,1]);p/=np.linalg.norm(p) if np.linalg.norm(p)>1e-5 else 1
 if np.linalg.norm(p)<1e-5:p=np.array([1.,0,0])
 q=np.cross(axis,p)
 offset=len(verts)
 for j in [0,1]:
  center=a if j==0 else b;rad=ra if j==0 else rb
  for i in range(sides):
   theta=2*np.pi*i/sides;pos=center+rad*(p*np.cos(theta)+q*np.sin(theta))
   verts.append(pos);uvs.append([i/sides,j*.8])
 for i in range(sides):
  ni=(i+1)%sides;bottom=offset+i;offset2=offset+ni;top=offset+sides+i;top2=offset+sides+ni
  faces.append([bottom,offset2,top2]);faces.append([bottom,top2,top])
 # cap geometry
 center=len(verts);verts.append(a);uvs.append([.5,.1])
 for i in range(sides):faces.append([center,offset+(i+1)%sides,offset+i])

# Twisted living trunk with branch junctions and roots; no flat cylindrical silhouette.
spine=[]
for i in range(9):
 t=i/8;spine.append(np.array([.19*np.sin(t*2.3),t*5.8,.10*np.sin(t*3.1)],float))
for i in range(8):frustum(spine[i],spine[i+1],(.39-.28*i/9),(.38-.28*(i+1)/9),12)
for k in range(7):
 angle=k*2*np.pi/7;foot=spine[0]+[np.cos(angle)*.78,.05,np.sin(angle)*.78]
 frustum(spine[0]+[0,.33,0],foot,.16,.02,7)
branch_tips=[]
for i in range(19):
 angle=i*2.39996+.22;start_index=3+i%5;start=spine[start_index];height=5.5-(start_index*.26)+r.uniform(-.4,.4)
 reach=r.uniform(1.6,2.7)*(1-(start_index-3)*.10)
 reach=max(reach,1.2)
 end=start+np.array([np.cos(angle)*reach,height-start[1],np.sin(angle)*reach]);mid=start*.48+end*.52+[0,.18,0]
 frustum(start,mid,.14-.018*(start_index-3),.075,8)
 frustum(mid,end,.075,.018,8)
 branch_tips.append(end)
 for j in range(3):
  a=angle+r.uniform(-.95,.95);t=.48+j*.18;begin=mid*(1-t)+end*t
  end2=begin+np.array([np.cos(a)*r.uniform(.36,.7),r.uniform(.25,.7),np.sin(a)*r.uniform(.36,.7)])
  frustum(begin,end2,.04,.007,6);branch_tips.append(end2)
# random micro-knots and coppery exfoliating bark surface
bark_vertices=np.asarray(verts,float);bark_faces=np.asarray(faces,int);bark_uv=np.asarray(uvs,float)
wood=trimesh.Trimesh(vertices=bark_vertices,faces=bark_faces,process=False)
# Bark color texture and tangent-space relief.
res=256; yy,xx=np.mgrid[:res,:res].astype(np.float32); u=xx/res;v=yy/res
seams=(np.sin(u*65+v*17+np.sin(v*18+u*23))*.5+.5)
noise=r.normal(0,.105,(res,res));veins=np.sin(u*31+np.sin(v*9)*.8)*.5+.5
bark_height=np.clip(.43+.23*seams+.24*veins+.11*noise,0,1)
base=np.stack([.32+.25*bark_height,.20+.18*bark_height,.12+.15*bark_height],axis=-1)
base+=noise[:,:,None]*.10
bark_color=Image.fromarray(np.uint8(np.clip(base,0,1)*255),'RGB')
# Use the verified, locally committed CC0 Poly Haven bark scan when available.
# Authoring never downloads a texture; the fully original procedural fallback
# remains available if the scan is omitted in a lightweight source checkout.
scan=root/'materials'/'tree-bark-rgba.png'
if scan.is_file():
 with Image.open(scan) as image:
  tile=image.convert('RGBA').resize((res,res),Image.Resampling.LANCZOS)
 bark_color=tile.convert('RGB')
 bark_height=np.asarray(tile.getchannel('A'),dtype=np.float32)/255.
 print('Broadleaf bark: local CC0 scan and height-alpha from materials/SOURCES.json')
else:
 print('Broadleaf bark: deterministic original procedural texture fallback')
dy,dx=np.gradient(bark_height);normals=np.stack([-dx*3,-dy*3,np.ones_like(dx)],axis=-1);normals/=np.linalg.norm(normals,axis=2,keepdims=True)
bark_normal=Image.fromarray(np.uint8((normals*.5+.5)*255),'RGB')
bark_orm=np.zeros((res,res,3),np.uint8);bark_orm[:,:,0]=242;bark_orm[:,:,1]=220;bark_orm[:,:,2]=0
bark_material=PBRMaterial(name='Bark with fissures',baseColorTexture=bark_color,normalTexture=bark_normal,metallicRoughnessTexture=Image.fromarray(bark_orm),roughnessFactor=.98,metallicFactor=0)
wood.visual=TextureVisuals(uv=bark_uv,material=bark_material)
# Leaf cards. Exact UV rectangles sample the painted leaf alpha silhouette.
leaf_v=[];leaf_f=[];leaf_uv=[]
for ti,tip in enumerate(branch_tips):
 # Leaves cluster in volumetric shells rather than flat discs.
 count=26 if ti%4!=0 else 34
 for j in range(count):
  angle=r.uniform(0,np.pi*2);rad=r.uniform(.0,.7)
  center=tip+np.array([np.cos(angle)*rad,r.normal(0,.26),np.sin(angle)*rad])
  if center[1]<2.6:continue
  axis=r.normal(0,1,3);axis[1]*=.5;axis/=np.linalg.norm(axis)
  up=np.array([-.14,.99,.08]);right=np.cross(axis,up)
  if np.linalg.norm(right)<.01:right=np.array([1,0,0])
  right/=np.linalg.norm(right);up=np.cross(right,axis);up/=np.linalg.norm(up)
  width=r.uniform(.13,.25);height=width*r.uniform(1.5,2.2)
  # 4 quads with a slight saddle silhouette in 3D.
  corners=[center-right*width,center+right*width,center+right*width+up*height,center-right*width+up*height]
  idx=len(leaf_v)
  for point in corners:leaf_v.append(point)
  leaf_uv.extend([[0.,1.],[1.,1.],[1.,0.],[0.,0.]])
  leaf_f.extend([[idx,idx+1,idx+2],[idx,idx+2,idx+3]])
leaves=trimesh.Trimesh(vertices=np.asarray(leaf_v),faces=np.asarray(leaf_f),process=False)
# An alpha-masked painterly leaf texture: refined silhouette and two-tone veins.
S=128
rgba=np.zeros((S,S,4),np.uint8)
for y in range(S):
 for x in range(S):
  a=y/(S-1);b=x/(S-1)-.5
  outline=(np.sin(np.pi*a)**.9)*(.49+np.sin(a*9)*.015)
  inside=abs(b)<outline and a>.015 and a<.986
  if inside:
   vein=max(0.,1-abs(b)*30)
   diag=np.maximum(0,np.sin((b*8+a*12)*6))*.13
   light=.6+.25*a+vein*.16+diag+r.normal(0,.045)
   rgba[y,x]=[int(np.clip(52*light,0,255)),int(np.clip(151*light+24,0,255)),int(np.clip(62*light,0,255)),255]
leaf_img=Image.fromarray(rgba,'RGBA')
leaf_normal=np.zeros((S,S,3),np.uint8);leaf_normal[:]=[128,128,255]
leaf_orm=np.zeros((S,S,3),np.uint8);leaf_orm[:]=[245,205,0]
leaf_mat=PBRMaterial(name='Individually cut leaves',baseColorTexture=leaf_img,normalTexture=Image.fromarray(leaf_normal),metallicRoughnessTexture=Image.fromarray(leaf_orm),roughnessFactor=.9,metallicFactor=0,alphaMode='MASK',alphaCutoff=.40,doubleSided=True)
leaves.visual=TextureVisuals(uv=np.asarray(leaf_uv),material=leaf_mat)
scene=trimesh.Scene();scene.add_geometry(wood,geom_name='windfall-bark');scene.add_geometry(leaves,geom_name='windfall-foliage')
blob=trimesh.exchange.gltf.export_glb(scene)
(root/'models'/'windfall-broadleaf-tree.glb').write_bytes(blob)
print('bark faces',len(wood.faces),'leaf faces',len(leaves.faces),'size',len(blob),'file valid',blob[:4]);
