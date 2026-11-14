"""Produce original detailed PBR timber architecture for Windfall's staged WebGL2 world.

All mesh geometry and image textures are authored here. No external models or artwork.
Run: python tools/build_architecture.py
"""
from pathlib import Path
from collections import defaultdict
import math
import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'models';OUT.mkdir(exist_ok=True)
R=np.random.default_rng(20261114)


def surface_texture(kind,seed):
    rr=np.random.default_rng(seed);s=384
    yy,xx=np.mgrid[:s,:s].astype(np.float32)
    u=xx/s;v=yy/s
    fine=rr.normal(0,1,(s,s)).astype(np.float32)
    coarse=(np.sin(u*29+v*3+np.sin(v*28)*.7)*np.cos(v*28-u*8)+1)*.5
    bands=(np.sin(u*13+v*54+np.sin(u*18))*np.cos(u*25-v*18)+1)*.5
    if kind=='plaster':
        base=np.array([.76,.70,.57]);h=.47+.11*coarse+.08*bands+.045*fine
        c=base[None,None,:]*(.83+.19*coarse[:,:,None]+.09*bands[:,:,None])
        freckles=(fine>.95)*.09; c*=1-freckles[:,:,None]
        rough=.94
    elif kind=='timber':
        base=np.array([.32,.19,.115]);grain=np.sin(u*37+2*np.sin(v*17)+np.sin(u*8+v*8))*.5+.5
        cracks=(np.sin(u*92+v*4)**32)*.30
        h=.32+.48*grain-.21*cracks+.08*fine
        c=base[None,None,:]*(.62+.66*grain[:,:,None])
        rough=.81
    elif kind=='roof':
        base=np.array([.38,.19,.16]);pat=np.sin(u*42+np.sin(v*6)*.4)*.5+.5
        fired=np.maximum(0,np.sin((u+v)*11))*0.11
        h=.36+.29*pat+.10*bands+.08*fine
        c=base[None,None,:]*(.71+.45*coarse[:,:,None]+fired[:,:,None]);rough=.86
    elif kind=='stone':
        base=np.array([.40,.43,.39]);blot=(np.sin(u*16+v*13)*np.cos(v*34-u*11)+1)*.5
        cracks=(np.sin(u*41+np.cos(v*32)*2.4))**36*.19
        h=.39+.23*blot+.16*bands+.045*fine-cracks
        c=base[None,None,:]*(.71+.52*blot[:,:,None])
        c[:,:,1]+=(bands>.7)*.025; rough=.90
    elif kind=='glass':
        base=np.array([.11,.26,.26]);h=.47+.03*coarse
        c=base[None,None,:]*(.71+.18*coarse[:,:,None])
        c[:,:,1]+=.09*(np.sin(u*2.3+v*4)**2);rough=.17
    elif kind=='iron':
        base=np.array([.12,.15,.16]);h=.5+.15*coarse+.08*fine
        c=base[None,None,:]*(.80+.24*coarse[:,:,None]);rough=.43
    elif kind=='leaf':
        base=np.array([.17,.35,.17]);h=.46+.19*coarse+.12*fine
        c=base[None,None,:]*(.69+.52*bands[:,:,None]);rough=.90
    elif kind=='gold':
        base=np.array([.96,.58,.23]);h=.49+.06*fine
        c=base[None,None,:]*(.87+.19*coarse[:,:,None]);rough=.32
    else: raise ValueError(kind)
    c=np.clip(c,0,1)
    if c.shape[:2]!=(s,s):c=np.broadcast_to(c,(s,s,3)).copy()
    h=np.clip(h,0,1)
    dy,dx=np.gradient(h)
    n=np.stack([-dx*3.4,-dy*3.4,np.ones_like(h)],axis=-1)
    n/=np.linalg.norm(n,axis=2,keepdims=True)
    nm=Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255),'RGB')
    orm=np.empty((s,s,3),dtype=np.uint8)
    orm[:,:,0]=np.uint8(np.clip(.94-.07*coarse,0,1)*255)
    orm[:,:,1]=np.uint8(rough*255)
    orm[:,:,2]=np.uint8(180 if kind=='iron' else 130 if kind=='gold' else 0)
    return Image.fromarray(np.uint8(c*255),'RGB'),nm,Image.fromarray(orm,'RGB')

MATERIAL={}
for i,name in enumerate(['plaster','timber','roof','stone','glass','iron','leaf','gold']):
    c,n,o=surface_texture(name,6125+i*71)
    MATERIAL[name]=PBRMaterial(
        name='Windfall original '+name,
        baseColorTexture=c,normalTexture=n,metallicRoughnessTexture=o,
        baseColorFactor=np.array([255,255,255,255],dtype=np.uint8),
        roughnessFactor=1.,metallicFactor=1. if name in ('iron','gold') else 0.,
        doubleSided=name=='leaf'
    )

class MeshParts:
    def __init__(self): self.parts=defaultdict(lambda:[[],[],[]])
    def quad(self,a,b,c,d,mat='plaster',tile=1):
        verts,faces,uv=self.parts[mat];i=len(verts)
        verts.extend([a,b,c,d]);faces.extend([(i,i+1,i+2),(i,i+2,i+3)])
        # World-space texture appearance but no huge UV frequencies
        ab=np.linalg.norm(np.asarray(b)-a);ad=np.linalg.norm(np.asarray(d)-a)
        uv.extend([(0,0),(ab*tile,0),(ab*tile,ad*tile),(0,ad*tile)])
    def box(self,x,y,z,w,h,d,mat='plaster',tile=1):
        X=[x-w/2,x+w/2];Y=[y,y+h];Z=[z-d/2,z+d/2]
        self.quad([X[0],Y[0],Z[1]],[X[1],Y[0],Z[1]],[X[1],Y[1],Z[1]],[X[0],Y[1],Z[1]],mat,tile)
        self.quad([X[1],Y[0],Z[0]],[X[0],Y[0],Z[0]],[X[0],Y[1],Z[0]],[X[1],Y[1],Z[0]],mat,tile)
        self.quad([X[0],Y[0],Z[0]],[X[0],Y[0],Z[1]],[X[0],Y[1],Z[1]],[X[0],Y[1],Z[0]],mat,tile)
        self.quad([X[1],Y[0],Z[1]],[X[1],Y[0],Z[0]],[X[1],Y[1],Z[0]],[X[1],Y[1],Z[1]],mat,tile)
        self.quad([X[0],Y[1],Z[1]],[X[1],Y[1],Z[1]],[X[1],Y[1],Z[0]],[X[0],Y[1],Z[0]],mat,tile)
        self.quad([X[0],Y[0],Z[0]],[X[1],Y[0],Z[0]],[X[1],Y[0],Z[1]],[X[0],Y[0],Z[1]],mat,tile)
    def segment(self,a,b,r,material='timber',sides=7):
        a=np.asarray(a,float);b=np.asarray(b,float);v=b-a;length=np.linalg.norm(v)
        if length<.00001:return
        direction=v/length;cross=np.cross(direction,[0,1,0])
        if np.linalg.norm(cross)<.1:cross=np.cross(direction,[1,0,0])
        one=cross/np.linalg.norm(cross);two=np.cross(direction,one)
        for j in range(sides):
            t=j*math.tau/sides;q=(j+1)*math.tau/sides
            p=lambda origin,ang: origin+r*(one*np.cos(ang)+two*np.sin(ang))
            self.quad(p(a,t),p(a,q),p(b,q),p(b,t),material,1)
    def cylinder(self,x,y,z,r,h,mat='stone',sides=12):
        for i in range(sides):
            a=i*math.tau/sides;b=(i+1)*math.tau/sides
            self.quad([x+r*np.cos(a),y,z+r*np.sin(a)], [x+r*np.cos(b),y,z+r*np.sin(b)],
                      [x+r*np.cos(b),y+h,z+r*np.sin(b)], [x+r*np.cos(a),y+h,z+r*np.sin(a)],mat,.75)
    def to_scene(self):
        scene=trimesh.Scene()
        for name,(verts,faces,uv) in self.parts.items():
            if not faces:continue
            mesh=trimesh.Trimesh(vertices=np.asarray(verts),faces=np.asarray(faces),process=False)
            mesh.visual=TextureVisuals(uv=np.asarray(uv),material=MATERIAL[name])
            scene.add_geometry(mesh,geom_name='architecture-'+name)
        return scene


def make_house(variant):
    g=MeshParts();workshop=variant=='workshop';w=7.3 if workshop else 6.2;d=6.9 if workshop else 6.0;wall=4.6 if workshop else 4.2;ridge=wall+(2.0 if workshop else 2.2)
    x0=-w/2;x1=w/2;z0=-d/2;z1=d/2
    # Foundation courses: long dressed limestone blocks, uneven joint lengths and inset mortar.
    g.box(0,-.27,0,w+.65,.53,d+.63,'stone',.73)
    for course in range(3):
        for side in [-1,1]:
            for k in range(11):
                x=x0-.23+(k+.48)*(w+.46)/11
                g.box(x,-.22+course*.16,side*(d/2+.30),w/11*.87,.14,.13,'stone',1.1)
            for k in range(9):
                z=z0-.18+(k+.5)*(d+.4)/9
                g.box(side*(w/2+.30),-.22+course*.16,z,.13,.14,d/9*.90,'stone',1.1)
    # Actual facade/window recesses are layered geometry (not rectangles drawn in colors).
    g.box(0,.15,0,w,wall-.15,d,'plaster',.32)
    for sign in [-1,1]:
        for y in [1.05,2.25,3.45]:
            g.segment([x0, y,sign*(d/2+.06)],[x1,y,sign*(d/2+.06)],.085,'timber')
        for x in [x0,-w*.31,w*.31,x1]:
            g.box(x,.35,sign*(d/2+.075),.18,wall-.25,.23,'timber')
        for k in range(3):
            x=x0+(k+.5)*w/3
            g.segment([x,1.05,sign*(d/2+.12)],[x+w*.13,2.20,sign*(d/2+.12)],.06,'timber')
    for sign in [-1,1]:
        for z in [z0,z1]:g.box(sign*(w/2+.06),.20,z,.20,wall-.1,.20,'timber')
        for y in [1.15,2.5,wall-.16]:g.box(sign*(w/2+.07),y,0,.21,.15,d+.4,'timber')
    # Entry with carved planks, lintel, forged bands, aged metal studs and stone steps.
    doorW=1.35;front=z1+.13
    g.box(0,.02,front,doorW+0.3,2.6,.22,'timber',.48)
    g.box(0,.05,front+.12,doorW,2.35,.11,'timber',.56)
    for k in range(5):g.box((k-2)*doorW/5,.10,front+.195,.027,2.20,.055,'stone',.5)
    for y in [.45,1.38,2.05]:g.box(0,y,front+.25,doorW,.068,.042,'iron',2)
    g.cylinder(doorW*.32,1.22,front+.31,.055,.07,'gold',8)
    for y in [.00,-.16,-.32]:g.box(0,y,front+.33+abs(y)*1.05,2.1,.14,.55,'stone',.9)
    # Bay windows with depth, wood mullions and metal/colored glass panels.
    for side in [-1,1]:
        cx=side*w*.32
        for zsign in [-1,1]:
            face=zsign*(d/2+.17)
            if zsign>0:
                # boxed projecting window with stone sills and shutter hinges
                g.box(cx,2.17,face,.98,1.45,.12,'timber',.6)
                g.box(cx,2.28,face+zsign*.09,.76,1.16,.046,'glass',1.2)
                g.box(cx,2.28,face+zsign*.145,.05,1.20,.06,'timber',1)
                g.box(cx,2.86,face+zsign*.145,.82,.055,.06,'timber',1)
                g.box(cx,2.09,face+zsign*.20,1.27,.17,.37,'stone',.85)
                for sh in [-1,1]:
                    g.box(cx+sh*.58,2.20,face+zsign*.1,.24,1.28,.09,'timber',.65)
                    for yy in [2.42,2.61,2.80]:g.box(cx+sh*.58,yy,face+zsign*.19,.20,.035,.02,'iron',.6)
                # flower box with curling stems and leaves
                if side>0:
                    g.box(cx,2.09,face+zsign*.48,1.1,.17,.30,'timber',1)
                    for i in range(9):
                        px=cx-.45+i*.11
                        g.segment([px,2.21,face+zsign*.52],[px+.07,2.34+.20*np.sin(i*1.6),face+zsign*(.53+.05*i/9)],.018,'leaf',4)
                        for leafSign in [-1,1]:g.box(px+leafSign*.055,2.35,face+zsign*.55,.14,.034,.08,'leaf',1)
    # Gable end supports, rafters, carved edges.
    g.quad([x0,wall,z1],[x1,wall,z1],[0,ridge,z1],[0,ridge,z1],'plaster',.3)
    g.quad([x1,wall,z0],[x0,wall,z0],[0,ridge,z0],[0,ridge,z0],'plaster',.3)
    for side in [-1,1]:
        for z in [z0-.12,z1+.12]:g.segment([0,ridge,z],[side*(w/2+.42),wall-.1,z],.15,'timber',7)
    g.segment([0,ridge,z0-.30],[0,ridge,z1+.30],.17,'timber',8)
    # Curved terracotta/slate shingle geometry (actual overlap and ridges, not one flat roof plane).
    for side in [-1,1]:
        for row in range(15):
            t0=row/15;t1=(row+1)/15
            for k in range(22):
                tz=k/22;z=z0-.40+(k+.5)*(d+.8)/22
                jitter=R.uniform(-.023,.023)
                # Each tile has a front lip, a raised arch and a weathered lip thickness.
                cx=side*w*.5*(t0+t1)/2
                y=ridge+(wall-.09-ridge)*(t0+t1)/2 + .025
                dz=(d+.8)/22*.91;dx=w/2/15*.95
                lift=.05+R.uniform(-.016,.02)
                p1=[cx-side*dx*.48,y+.028,z-dz*.49];p2=[cx+side*dx*.48,y-.08,z-dz*.49]
                p3=[cx+side*dx*.48,y-.08,z+dz*.49];p4=[cx-side*dx*.48,y+.028,z+dz*.49]
                mid1=[(p1[0]+p2[0])*.5,y+lift,z-dz*.49];mid2=[(p1[0]+p2[0])*.5,y+lift,z+dz*.49]
                # first and second half of each curved piece
                g.quad(p1,mid1,mid2,p4,'roof',2.0)
                g.quad(mid1,p2,p3,mid2,'roof',2.0)
                g.quad(p2,[p2[0],p2[1]-.055,p2[2]],[p3[0],p3[1]-.055,p3[2]],p3,'roof',2.0)
    for z in np.linspace(z0-.35,z1+.35,38):g.cylinder(0,ridge-.016,z,.17,.27,'roof',10)
    # Rain gutters and iron hardware at roof eaves.
    for side in [-1,1]:
        eave=side*(w/2+.40)
        g.segment([eave,wall-.04,z0-.52],[eave,wall-.04,z1+.52],.105,'iron',8)
    # Brick chimney: masonry units, soffit cap and soot detail.
    cx=w*.23;cz=z0+d*.32
    g.box(cx,wall-.55,cz,.80,2.35,.83,'stone',.9)
    for row in range(8):
        for sign in [-1,1]:g.box(cx+sign*.40,wall-.40+row*.26,cz,.10,.18,.70,'stone',1.2)
    g.box(cx,wall+1.66,cz,1.07,.21,1.09,'stone',.7)
    g.box(cx,wall+1.85,cz,.72,.09,.75,'iron',1)
    # Additional hanging signs and workshop-specific structures.
    if workshop:
        signX=-w*.37
        g.segment([signX,3.5,front],[signX,3.5,front+.83],.07,'iron')
        g.box(signX,2.75,front+.89,.78,.62,.08,'timber')
        g.box(signX,2.96,front+.95,.55,.12,.04,'gold')
        g.box(-w*.35,.26,front+1.0,1.5,.96,.60,'timber',.7)
        for i in range(9):
            t=(i+.5)/9
            g.box(-w*.35+(t-.5)*1.2,1.2,front+1.0,.13,.28,.32,'iron',1.3)
        # Broad covered side workbench and carved supports.
        g.box(x1+.9,.96,0,2.2,.18,d*.55,'timber')
        for z in [z0*.47,z1*.47]:g.segment([x1+.9,.12,z],[x1+.9,.99,z],.18,'timber')
        for i in range(11):g.box(x1+.3+i*.12,1.12,.0,.10,.08,d*.38,'stone')
    else:
        # Juliet balcony over door, with open wood lattice and two carved brackets.
        g.box(0,3.32,front+.62,1.85,.16,.96,'timber',.9)
        for x in np.linspace(-.87,.87,9):g.segment([x,3.44,front+.98],[x,4.14,front+.98],.044,'iron',5)
        for z in [front+.42,front+.95]:g.segment([-.93,4.17,z],[.93,4.17,z],.07,'iron',6)
        for x in [-.7,.7]:g.segment([x,3.24,front+.74],[x,2.86,front+.14],.09,'timber',6)
    scene=g.to_scene()
    out=OUT/('windfall-harbor-workshop.glb' if workshop else 'windfall-timber-cottage.glb')
    blob=trimesh.exchange.gltf.export_glb(scene);out.write_bytes(blob)
    faces=sum(len(x.faces) for x in scene.geometry.values())
    print(variant,out.name,'triangles',faces,'bytes',len(blob),'meshes',len(scene.geometry))
    assert blob[:4]==b'glTF' and len(blob)<32*1024*1024

if __name__=='__main__':
    make_house('cottage');make_house('workshop')
