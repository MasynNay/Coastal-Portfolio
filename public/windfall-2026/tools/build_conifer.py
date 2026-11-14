"""Reproducible original PBR mountain conifer with branch and cutout-needle meshes.
All geometry and textures are generated locally, no borrowed models or images.
Run: python tools/build_conifer.py
"""
from pathlib import Path
import math
import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'models';OUT.mkdir(exist_ok=True)
R=np.random.default_rng(20261114)
S=256;Y,X=np.mgrid[:S,:S];U=X/S;V=Y/S
noise=R.normal(0,.05,(S,S));grain=(np.sin(U*36+V*10+np.sin(V*16))*0.5+.5)

def image(rgb, alpha=None):
    rgb=np.broadcast_to(rgb,(S,S,3)).copy();out=np.uint8(np.clip(rgb,0,1)*255)
    if alpha is not None:out=np.concatenate((out,np.uint8(np.clip(alpha,0,1)*255)[:,:,None]),axis=2)
    return Image.fromarray(out)

def texset(kind):
    if kind=='bark':
        cracks=(np.maximum(0,np.sin(U*85+np.sin(V*5)*3)))**20
        h=.46+.22*grain-.25*cracks+noise
        base=np.asarray([.25,.17,.105])[None,None,:]*(.65+.62*grain[:,:,None]-.18*cracks[:,:,None]);alpha=None;rough=.93
    else:
        # Alpha-cut needle clusters form a ragged fernlike fan, not rectangular cards.
        axis=np.abs(U-.5)
        edge=.34*(np.sin(np.pi*V)**.68)
        edge*=.75+.25*np.sin(V*29)**2
        contour=1-(axis/(edge+1e-4))**2
        alpha=np.clip(contour*7,0,1)*np.clip((V-.05)*14,0,1)*np.clip((.98-V)*13,0,1)
        h=.45+.13*np.sin(V*50)+noise*.22
        var=.79+.34*np.sin(V*28+U*13)**2+noise
        base=np.array([.11,.25,.18])[None,None,:]*var[:,:,None]
        base[:,:,1]+=.07*np.clip(1-axis*1.3,0,1)
        base[:,:,2]+=.035*np.cos(V*7)**2
        rough=.94
    dy,dx=np.gradient(h);n=np.stack((-dx*1.9,-dy*1.9,np.ones((S,S))),axis=2);n/=np.linalg.norm(n,axis=2,keepdims=True)
    o=np.zeros((S,S,3),dtype=np.uint8);o[:,:,0]=240;o[:,:,1]=int(rough*255)
    return image(base,alpha),image((n*.5+.5)),Image.fromarray(o)

material={}
for name in ['bark','needles']:
    albedo,normal,orm=texset(name)
    material[name]=PBRMaterial(name='Windfall original conifer '+name,
      baseColorFactor=np.array([255,255,255,255],dtype=np.uint8),
      baseColorTexture=albedo,normalTexture=normal,metallicRoughnessTexture=orm,
      metallicFactor=0.,roughnessFactor=1.,doubleSided=name=='needles',
      alphaMode='MASK' if name=='needles' else 'OPAQUE',alphaCutoff=.35)

class Surface:
    def __init__(self):self.v=[];self.f=[];self.uv=[]
    def quad(self,a,b,c,d,uv=None):
        i=len(self.v);self.v.extend([a,b,c,d]);self.f.extend([(i,i+1,i+2),(i,i+2,i+3)]);self.uv.extend(uv or [(0,0),(1,0),(1,1),(0,1)])
    def tube(self,a,b,r0,r1,n=10):
        a,b=np.asarray(a,dtype=float),np.asarray(b,dtype=float);axis=b-a;axis/=np.linalg.norm(axis)
        ref=np.array([0,1,0]) if abs(axis[1])<.95 else np.array([1,0,0])
        right=np.cross(axis,ref);right/=np.linalg.norm(right);up=np.cross(axis,right)
        for i in range(n):
            theta=i*math.tau/n; j=(i+1)*math.tau/n
            pos=lambda base,r,t:base+r*(right*np.cos(t)+up*np.sin(t))
            self.quad(pos(a,r0,theta),pos(a,r0,j),pos(b,r1,j),pos(b,r1,theta),[(i/n,0),((i+1)/n,0),((i+1)/n,1),(i/n,1)])
    def mesh(self,mat):
        mesh=trimesh.Trimesh(vertices=self.v,faces=self.f,process=False)
        mesh.visual=TextureVisuals(uv=self.uv,material=material[mat]);return mesh

bark=Surface();foliage=Surface()
height=7.8
for j in range(24):
 y0=j*height/24;y1=(j+1)*height/24
 taper=lambda y:.285*(1-y/height)**.79+.027
 center=lambda y:[.10*math.sin(y*.41),y,.05*math.cos(y*.32)]
 bark.tube(center(y0),center(y1),taper(y0),taper(y1),10)
# Varied lower boughs and upper needles, with more light passing between clusters.
for tier in range(2,20):
 baseHeight=tier*.36+.24
 radial=(1-baseHeight/height)**.76
 crownRadius=(.34+2.6*radial)
 count=9 if tier<12 else 6
 for branchIndex in range(count):
    theta=branchIndex*math.tau/count + tier*1.74+R.normal(0,.10)
    branchLen=crownRadius*(.78+R.random()*.30)
    direction=np.array([math.cos(theta),-.22+R.random()*.11,math.sin(theta)])
    root=np.array([.10*math.sin(baseHeight*.41),baseHeight,.05*math.cos(baseHeight*.32)])
    tip=root+direction*branchLen+np.array([0,branchLen*.25,0])
    bark.tube(root,tip,.050*radial+.018,.009,7)
    # Needle fans use two crossed, slightly pitched cards for a dense but perforated look.
    cross=np.array([-direction[2],0,direction[0]])
    for k in range(2,6):
        t=k/6
        pivot=root+(tip-root)*t
        remaining=(1-t)*branchLen
        for turn in [-1,1]:
            bend=cross*turn*(.17+.16*R.random())*radial
            crest=np.array([0,.20+R.random()*.18,0])
            endpoint=pivot+direction*remaining*.80+bend+crest*.65
            width=(.13+.22*radial)*(1-t*.52)
            side=cross*width
            foliage.quad(pivot-side, pivot+side,endpoint+side*.18,endpoint-side*.18)
    # Smaller terminal sprays maintain irregular crowns rather than stacked cones.
    foliage.quad(tip-cross*.08,tip+cross*.08,tip+np.array([0,.35,0])+direction*.21,tip+np.array([0,.31,0])+direction*.11)
scene=trimesh.Scene()
scene.add_geometry(bark.mesh('bark'),geom_name='windfall-conifer-bark',node_name='bark')
scene.add_geometry(foliage.mesh('needles'),geom_name='windfall-conifer-needles',node_name='needles')
path=OUT/'windfall-mountain-conifer.glb';path.write_bytes(scene.export(file_type='glb'))
loaded=trimesh.load(path,force='scene')
tri=sum(len(g.faces) for g in loaded.geometry.values())
assert len(loaded.geometry)==2 and tri>4000
print('Conifer',path.stat().st_size,'bytes',tri,'triangles',len(loaded.geometry),'materials')
