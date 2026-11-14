"""Original Windfall coastal understory: hazel shrubs, ferns and wildflower meadow.
No external assets, online fetches, commercial textures or artist likenesses.
Run: python tools/build_understory.py [hazel|fern|wildflower|all]
"""
from __future__ import annotations
import math
import sys
from pathlib import Path
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'models';OUT.mkdir(parents=True,exist_ok=True)
SIZE=192

class Mesh:
    def __init__(self):self.vertices=[];self.faces=[];self.uvs=[]
    def quad(self,a,b,c,d,uv=None):
        k=len(self.vertices)
        self.vertices.extend((a,b,c,d))
        self.uvs.extend(uv or ((0,0),(1,0),(1,1),(0,1)))
        self.faces.extend(((k,k+1,k+2),(k,k+2,k+3)))
    def twig(self,a,b,r0,r1,n=7):
        a=np.asarray(a,float);b=np.asarray(b,float)
        axis=b-a;length=np.linalg.norm(axis)
        if length<1e-5:return
        axis/=length
        guide=np.array([0,1,0]) if abs(axis[1])<.93 else np.array([1,0,0])
        side=np.cross(axis,guide);side/=np.linalg.norm(side)
        other=np.cross(axis,side)
        for k in range(n):
            theta=k*math.tau/n;theta1=(k+1)*math.tau/n
            p=lambda origin,r,t:origin+r*(math.cos(t)*side+math.sin(t)*other)
            self.quad(p(a,r0,theta),p(a,r0,theta1),p(b,r1,theta1),p(b,r1,theta),
                      ((k/n,0),((k+1)/n,0),((k+1)/n,1),(k/n,1)))
    def finish(self,material):
        assert self.faces and self.vertices
        mesh=trimesh.Trimesh(vertices=np.asarray(self.vertices),faces=np.asarray(self.faces),process=False)
        assert np.isfinite(mesh.vertices).all()
        mesh.visual=TextureVisuals(uv=np.asarray(self.uvs,float),material=material)
        return mesh

def image_rgb(color,seed):
    gen=np.random.default_rng(seed)
    y,x=np.mgrid[:SIZE,:SIZE].astype(float)
    wave=.55+.15*np.sin(x*.19+y*.26)+.08*np.cos(x*.71-y*.07)+gen.normal(0,.055,(SIZE,SIZE))
    data=np.clip(np.asarray(color)[None,None,:]*wave[:,:,None]*1.40,0,1)
    return Image.fromarray(np.uint8(data*255),'RGB')

def leaf_image(kind):
    y,x=np.mgrid[:SIZE,:SIZE].astype(float)
    u=x/(SIZE-1);v=y/(SIZE-1)
    center=abs(u-.5)*2
    if kind=='fern':shape=np.sin(np.pi*v)**.85*(.87+.08*np.sin(v*math.tau*7))
    else:shape=np.sin(np.pi*v)**.72*(.83+.11*np.sin(v*math.tau*10)**2)
    border=np.clip((shape-center)*19,0,1)
    edge=np.clip(v*22,0,1)*np.clip((1-v)*25,0,1)
    vein=np.exp(-abs(u-.5)*42)
    branchveins=np.maximum(0,np.cos((u-.5)*19+v*20))**14
    noise=np.random.default_rng(8 if kind=='fern' else 14).normal(0,.055,(SIZE,SIZE))
    warm=.65+.18*v+.11*vein+.10*branchveins+noise
    palette=(.26,.52,.18) if kind=='fern' else (.28,.45,.18)
    rgb=np.stack([warm*palette[0],warm*palette[1],warm*palette[2]],axis=-1)
    rgba=np.uint8(np.clip(np.dstack((rgb,border*edge)),0,1)*255)
    return Image.fromarray(rgba,'RGBA')

def blossom_image():
    # Three original pastel petals in a single material atlas, 1/3 each.
    yy,xx=np.mgrid[:SIZE,:(SIZE*3)].astype(float)
    local=(xx%SIZE)/(SIZE-1);v=yy/(SIZE-1)
    d=((local-.5)/.48)**2+((v-.53)/.49)**2
    alpha=np.clip((1-d)*12,0,1)*np.clip(v*38,0,1)
    palettes=np.array([[.70,.58,.79],[.71,.75,.92],[.92,.82,.62]])
    rgb=palettes[np.minimum((xx//SIZE).astype(int),2)]*(.78+.22*v[:,:,None])
    rgba=np.uint8(np.clip(np.dstack((rgb,alpha)),0,1)*255)
    return Image.fromarray(rgba,'RGBA')

def mat(name,picture,masked=False):
    normal=Image.new('RGB',picture.size,(128,128,255))
    orm=Image.new('RGB',picture.size,(242,226,0))
    return PBRMaterial(name='Windfall original '+name,baseColorTexture=picture,
                       normalTexture=normal,metallicRoughnessTexture=orm,
                       baseColorFactor=np.uint8([255,255,255,255]),
                       roughnessFactor=1.0,metallicFactor=0.0,
                       alphaMode='MASK' if masked else 'OPAQUE',
                       alphaCutoff=.42,doubleSided=bool(masked))

def add_card(mesh,base,tip,width,angle=0,atlas=0):
    base=np.asarray(base,float);tip=np.asarray(tip,float)
    direction=tip-base
    cross=np.cross(direction,[0,0,1])
    if np.linalg.norm(cross)<1e-4:cross=np.cross(direction,[0,1,0])
    cross/=max(np.linalg.norm(cross),1e-9)
    if angle:cross=cross*math.cos(angle)+np.cross(direction/np.linalg.norm(direction),cross)*math.sin(angle)
    a=base-cross*width*.5;b=base+cross*width*.5
    c=tip+cross*width*.18;d=tip-cross*width*.18
    if atlas:
        uu=(atlas-1)/3
        uv=((uu,0),(uu+1/3,0),(uu+1/3,1),(uu,1))
    else:uv=None
    mesh.quad(a,b,c,d,uv)

def hazel():
    rng=np.random.default_rng(4012)
    stems,leaf=Mesh(),Mesh()
    for shoot in range(24):
        az=shoot*2.399963+rng.normal(0,.16)
        h=rng.uniform(1.0,2.10)
        reach=rng.uniform(.53,1.18)
        root=np.array([.07*math.cos(az),.0,.07*math.sin(az)])
        mid=np.array([reach*.42*math.cos(az),h*.56,reach*.42*math.sin(az)])
        top=np.array([reach*math.cos(az),h,reach*math.sin(az)])
        stems.twig(root,mid,.043,.024,8);stems.twig(mid,top,.025,.008,7)
        for node in range(2,7):
            t=node/7
            origin=mid*(1-t)+top*t
            for sign in [-1,1]:
                sideways=np.array([math.cos(az+sign*math.pi*.44),0,math.sin(az+sign*math.pi*.44)])
                tip=origin+sideways*rng.uniform(.16,.32)+np.array([0,rng.uniform(.12,.25),0])
                stems.twig(origin,tip,.013,.004,5)
                direction=tip+sideways*.25+np.array([0,rng.uniform(.09,.24),0])
                add_card(leaf,tip,direction,rng.uniform(.16,.25),rng.uniform(-.45,.45))
    return [('bark',stems,mat('hazel wood',image_rgb((.39,.27,.16),41))),
            ('leaf',leaf,mat('hazel leaves',leaf_image('hazel'),True))]

def fern():
    rng=np.random.default_rng(2026)
    stalks,foliage=Mesh(),Mesh()
    for i in range(18):
        az=i*2.399963+rng.normal(0,.12)
        l=rng.uniform(.77,1.42);height=rng.uniform(.42,.73)
        direction=np.array([math.cos(az),0,math.sin(az)])
        start=direction*rng.uniform(0,.12)
        midpoint=start+direction*l*.50+np.array([0,height,0])
        end=start+direction*l+np.array([0,height*.36,0])
        stalks.twig(start,midpoint,.012,.009,5);stalks.twig(midpoint,end,.009,.002,5)
        side=np.array([-direction[2],0,direction[0]])
        for j in range(1,15):
            t=j/16
            pivot=(1-t)*start+t*end+np.array([0,height*1.85*t*(1-t),0])
            breadth=.24*math.sin(math.pi*t)**.83
            for sign in (-1,1):
                up=height*.07*math.sin(t*math.pi)
                tip=pivot+side*sign*breadth+direction*(.10+.06*(1-t))+np.array([0,up,0])
                add_card(foliage,pivot,tip,.055+(.045*math.sin(math.pi*t)),sign*.3)
    return [('stalk',stalks,mat('fern stems',image_rgb((.30,.46,.17),71))),
            ('fronds',foliage,mat('fern leaflets',leaf_image('fern'),True))]

def wildflower():
    rng=np.random.default_rng(584)
    stalks,leaves,petals=Mesh(),Mesh(),Mesh()
    for j in range(22):
        radial=rng.uniform(0,math.tau);r=.84*math.sqrt(rng.uniform())
        base=np.array([math.cos(radial)*r,0,math.sin(radial)*r])
        height=rng.uniform(.30,.77)
        bend=np.array([rng.normal(0,.15),height,rng.normal(0,.15)])
        top=base+bend
        stalks.twig(base,top,.011,.004,5)
        for n in range(3):
            t=(n+1)/5
            pivot=base+bend*t
            angle=radial+n*2.2
            end=pivot+np.array([math.cos(angle)*.14,.07,math.sin(angle)*.14])
            add_card(leaves,pivot,end,.069,angle*.12)
        for k in range(6):
            az=k*math.tau/6+rng.normal(0,.07)
            lift=np.array([math.cos(az)*.068,.016,math.sin(az)*.068])
            end=top+np.array([math.cos(az)*.16,.075,math.sin(az)*.16])
            add_card(petals,top+lift,end,.104,az*.14,atlas=1+j%3)
    return [('stem',stalks,mat('meadow wildflower stalks',image_rgb((.32,.49,.20),31))),
            ('leaf',leaves,mat('meadow leaves',leaf_image('hazel'),True)),
            ('petal',petals,mat('meadow pastel petals',blossom_image(),True))]

def build(name):
    variants={'hazel':('windfall-hazel-shrub',hazel),'fern':('windfall-fern-understory',fern),
              'wildflower':('windfall-wildflower-patch',wildflower)}
    stem,builder=variants[name]
    scene=trimesh.Scene()
    for label,mesh,material in builder():
        model=mesh.finish(material)
        scene.add_geometry(model,geom_name=f'{stem}-{label}',node_name=label)
    path=OUT/(stem+'.glb');path.write_bytes(scene.export(file_type='glb'))
    check=trimesh.load(path,force='scene')
    faces=sum(len(geometry.faces) for geometry in check.geometry.values())
    assert len(check.geometry)>=2 and faces>=200 and path.stat().st_size<4*1024*1024
    print(stem, 'triangles',faces,'GLB bytes',path.stat().st_size,'bounds',check.bounds.round(2))

if __name__=='__main__':
    choice=sys.argv[1] if len(sys.argv)>1 else 'all'
    if choice=='all':
        for name in ('hazel','fern','wildflower'):build(name)
    else:build(choice)
