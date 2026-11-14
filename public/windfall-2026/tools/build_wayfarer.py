"""Original textured articulated wayfarer (author-generated, no third-party assets).

This is a mid-poly production pipeline proof-of-concept. The mesh has named
hierarchical nodes for the runtime gait system, but is NOT skin-weighted or
photorealistic. Rebuild with: python tools/build_wayfarer.py
"""
from __future__ import annotations
import math
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'models';OUT.mkdir(exist_ok=True)
SEED=20261114


def surface(label,seed):
    gen=np.random.default_rng(seed);S=256
    Y,X=np.mgrid[:S,:S].astype(np.float32)
    U=X/S;V=Y/S
    grain=gen.normal(0,.23,(S,S))
    waves=np.sin(U*43+V*9+np.sin(V*30)*1.1)*.5+.5
    slubs=np.sin(U*19-V*27)*np.cos(U*23+V*9)*.5+.5
    colors={
      'coat':([.18,.30,.32],.88,.02),'pants':([.16,.22,.26],.89,.0),
      'leather':([.25,.14,.095],.75,.0),'skin':([.65,.42,.31],.78,.0),
      'hair':([.14,.091,.070],.87,.0),'linen':([.70,.65,.52],.91,.0),
      'brass':([.60,.44,.22],.36,.84),'dark':([.080,.095,.10],.72,.15),
      'iris':([.20,.37,.35],.40,.03),'scarf':([.35,.22,.25],.87,.0)
    }
    base,rough,metal=colors[label];rgb=np.array(base)[None,None,:]
    micro=grain*.12+waves*.15+slubs*.11
    if label=='skin':micro=grain*.045+waves*.035+slubs*.06
    if label in ['hair','leather']:micro=grain*.08+waves*.20+slubs*.05
    h=np.clip(.48+micro,0,1)
    rgb=np.broadcast_to(rgb*(.89+micro[:,:,None]),(S,S,3)).copy()
    if label=='coat':rgb[:,:,0]+=.016*(waves>.77)
    if label=='pants':rgb[:,:,2]+=.028*(slubs>.79)
    if label=='skin':rgb[:,:,0]+=.025*(waves>.65)
    rgb=np.clip(rgb,0,1)
    dy,dx=np.gradient(h);normal=np.stack([-dx*3.0,-dy*3.0,np.ones_like(h)],axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    orm=np.zeros((S,S,3),np.uint8)
    orm[:,:,0]=240;orm[:,:,1]=np.uint8(np.clip(rough+.05*micro,0,1)*255);orm[:,:,2]=int(255*metal)
    return Image.fromarray(np.uint8(rgb*255)),Image.fromarray(np.uint8(np.clip(normal*.5+.5,0,1)*255)),Image.fromarray(orm)

MAT={}
for idx,key in enumerate(['coat','pants','leather','skin','hair','linen','brass','dark','iris','scarf']):
    albedo,normal,orm=surface(key,SEED+idx*37)
    MAT[key]=PBRMaterial(name='Windfall original '+key,
      baseColorTexture=albedo,normalTexture=normal,metallicRoughnessTexture=orm,
      baseColorFactor=np.uint8([255,255,255,255]),roughnessFactor=1.0,
      metallicFactor=1.0 if key=='brass' else .1 if key=='dark' else 0.0)

# A portion of anatomy/clothing is sculpted by smooth lathe-like shells, not stacked cubes.
def ellipsoid(p,r,sub=2):
    m=trimesh.creation.icosphere(subdivisions=sub,radius=1.0)
    m.vertices=np.asarray(m.vertices)*np.asarray(r)+np.asarray(p)
    return m

def loft(rings,sides=24):
    """Cross-section rings [(y, rx, rz, center_x, center_z)] build a fitted garment."""
    verts=[]
    for y,rx,rz,cx,cz in rings:
        for i in range(sides):
            a=math.tau*i/sides
            verts.append([cx+rx*math.cos(a),y,cz+rz*math.sin(a)])
    faces=[]
    for j in range(len(rings)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;c=(j+1)*sides+(i+1)%sides;d=(j+1)*sides+i
            faces.extend([(a,b,c),(a,c,d)])
    for i in range(1,sides-1):faces.append((0,i+1,i));faces.append(((len(rings)-1)*sides,(len(rings)-1)*sides+i,(len(rings)-1)*sides+i+1))
    return trimesh.Trimesh(vertices=np.asarray(verts),faces=faces,process=False)

def segment(a,b,r0,r1=None,sides=12):
    if r1 is None:r1=r0
    a,b=np.array(a,float),np.array(b,float)
    d=b-a;length=np.linalg.norm(d)
    if length<1e-7:raise ValueError('zero-length mesh segment')
    n=d/length;up=np.array([0,1,0]);up=np.array([1,0,0]) if abs(np.dot(n,up))>.93 else up
    u=np.cross(n,up);u=u/np.linalg.norm(u);v=np.cross(n,u)
    points=[]
    for o,r in [(a,r0),(b,r1)]:
        for j in range(sides):
            theta=j*math.tau/sides;points.append(o+r*(math.cos(theta)*u+math.sin(theta)*v))
    faces=[]
    for i in range(sides):
        j=(i+1)%sides;faces.extend([(i,j,sides+j),(i,sides+j,sides+i)])
    for i in range(1,sides-1):faces.append((0,i+1,i));faces.append((sides,sides+i,sides+i+1))
    return trimesh.Trimesh(vertices=points,faces=faces,process=False)

def strip(points,width=.02):
    # Contoured inset thread trim or hem seam.
    mesh=[]
    for a,b in zip(points,points[1:]):mesh.append(segment(a,b,width,width,8))
    return trimesh.util.concatenate(mesh)

def with_material(mesh,mat):
    # Simple stable UV chart; the source textures are seamless and neutral in appearance.
    vertices=np.asarray(mesh.vertices)
    x,z=vertices[:,0],vertices[:,2]
    uv=np.stack([(x*.69+z*.27)%1,(vertices[:,1]*.65+z*.20)%1],axis=1)
    mesh.visual=TextureVisuals(uv=uv,material=MAT[mat]);return mesh

scene=trimesh.Scene()
PARTS=defaultdict(list)

def T(x=0,y=0,z=0):return trimesh.transformations.translation_matrix([x,y,z])

def anchor(name,parent='world',offset=(0,0,0)):
    scene.graph.update(frame_to=name,frame_from=parent,matrix=T(*offset))

def piece(name,material,mesh,parent):
    PARTS[(parent,material)].append(mesh)

anchor('rig-root')
anchor('body', 'rig-root', (0,1.19,0))
# Torso with sculpted shoulder flare, gathered hood, curved jacket hem and pocket.
piece('fitted-coat','coat',loft([
    (-.23,.315,.238,0,.01),(-.03,.35,.272,0,0),(.21,.377,.274,0,0),
    (.55,.435,.285,0,0),(.72,.42,.276,0,0),(.91,.32,.235,0,.005)
]),'body')
piece('jacket-lapel','linen',loft([(.64,.26,.27,0,-.025),(.87,.26,.265,0,0),(.94,.24,.245,0,0)],24),'body')
piece('collar-front','coat',ellipsoid((0,.72,-.264),(.22,.15,.09),2),'body')
piece('kangaroo-pocket','coat',ellipsoid((0,.08,-.265),(.26,.13,.046),2),'body')
piece('jacket-hem','leather',loft([(-.24,.326,.256,0,0),(-.208,.324,.257,0,0)],24),'body')
for sign in [-1,1]:
    piece('hood-cord-'+str(sign),'linen',segment((sign*.105,.77,-.296),(sign*.105,.37,-.33),.014,.010,8),'body')
    piece('coat-stitch-'+str(sign),'linen',strip([(sign*.25,-.08,-.27),(sign*.30,.18,-.24),(sign*.28,.40,-.245)],.007),'body')
piece('hood','coat',ellipsoid((0,.84,.21),(.34,.29,.23),2),'body')
piece('scarf-knot','scarf',ellipsoid((-.17,.91,-.24),(.12,.10,.09),2),'body')
piece('belt','leather',loft([(-.15,.31,.252,0,0),(-.07,.31,.252,0,0)],24),'body')
piece('belt-buckle','brass',trimesh.creation.box(extents=[.16,.12,.045],transform=T(0,-.10,-.252)),'body')
piece('shoulder-bag','leather',ellipsoid((.35,.26,.14),(.13,.25,.18),2),'body')
piece('bag-hardware','brass',ellipsoid((.355,.31,-.024),(.06,.06,.025),1),'body')
piece('crossbody-strap','leather',strip([(-.38,.75,-.10),(-.25,.62,-.27),(.07,.30,-.285),(.28,.11,-.27)],.045),'body')

# Cloth cape swings about the shoulders and gets independent secondary motion.
anchor('cape','body',(0,.71,.16))
cape=loft([(-.02,.37,.06,0,.02),(-.28,.47,.10,0,.15),(-.59,.54,.11,0,.25),(-.98,.62,.08,0,.38)],28)
piece('cape-cloth','scarf',cape,'cape')
piece('cape-hem','linen',strip([(-.59,-.94,.42),(-.4,-.98,.45),(0,-1.01,.46),(.42,-.98,.45),(.59,-.94,.42)],.012),'cape')

anchor('neck','body',(0,.94,0))
piece('neck-skin','skin',segment((0,-.05,0),(0,.22,0),.15,.145,16),'neck')
anchor('head','neck',(0,.36,-.04))
piece('head-sculpt','skin',ellipsoid((0,.11,-.02),(.300,.396,.288),3),'head')
piece('jawline','skin',ellipsoid((0,-.125,-.087),(.224,.185,.235),2),'head')
piece('nose-bridge','skin',ellipsoid((0,.07,-.325),(.066,.153,.081),2),'head')
piece('nose-tip','skin',ellipsoid((0,-.007,-.375),(.089,.064,.075),2),'head')
piece('chin','skin',ellipsoid((0,-.215,-.21),(.16,.083,.114),2),'head')
for sign in [-1,1]:
    piece('ear-'+str(sign),'skin',ellipsoid((sign*.30,.09,-.016),(.073,.119,.079),2),'head')
    piece('cheek-'+str(sign),'skin',ellipsoid((sign*.21,-.064,-.184),(.102,.108,.11),2),'head')
    piece('eye-white-'+str(sign),'linen',ellipsoid((sign*.124,.125,-.281),(.072,.044,.030),2),'head')
    piece('iris-'+str(sign),'iris',ellipsoid((sign*.124,.124,-.307),(.026,.028,.016),2),'head')
    piece('pupil-'+str(sign),'dark',ellipsoid((sign*.124,.126,-.323),(.013,.017,.006),1),'head')
    piece('eyebrow-'+str(sign),'hair',segment((sign*.067,.229,-.279),(sign*.214,.218,-.266),.026,.022,8),'head')
    piece('sideburn-'+str(sign),'hair',ellipsoid((sign*.278,-.045,-.018),(.064,.152,.094),2),'head')
    piece('beard-cheek-'+str(sign),'hair',ellipsoid((sign*.197,-.185,-.157),(.115,.13,.115),2),'head')
piece('lip','scarf',ellipsoid((0,-.177,-.292),(.097,.020,.020),2),'head')
piece('beard-chin','hair',ellipsoid((0,-.260,-.174),(.192,.094,.16),2),'head')
piece('hair-scalp','hair',ellipsoid((0,.396,.022),(.319,.165,.296),3),'head')
for i in range(13):
    theta=(i/13)*math.tau
    xx=.27*math.cos(theta);zz=.22*math.sin(theta)
    piece('hair-tuft-%02d'%i,'hair',ellipsoid((xx,.412+.027*math.sin(theta*5),zz-.038),(.095,.09,.113),2),'head')
piece('forelock','hair',ellipsoid((-.105,.360,-.253),(.205,.096,.130),2),'head')

for side,label in [(-1,'L'),(1,'R')]:
    # Upper and lower arm are separate pivoted nodes (elbow bend authored in runtime).
    anchor('arm-'+label,'body',(side*.415,.73,0))
    piece('sleeve-'+label,'coat',loft([(-.52,.15,.165,side*.085,0),(-.28,.18,.186,side*.05,0),(-.03,.19,.198,0,0)],18),'arm-'+label)
    piece('shoulder-seam-'+label,'linen',ellipsoid((0,-.055,-.075),(.185,.038,.04),1),'arm-'+label)
    anchor('forearm-'+label,'arm-'+label,(side*.085,-.52,0))
    piece('wrist-sleeve-'+label,'coat',loft([(-.45,.124,.14,0,0),(-.25,.145,.15,0,0),(-.04,.148,.15,0,0)],18),'forearm-'+label)
    piece('cuff-'+label,'leather',loft([(-.47,.145,.152,0,0),(-.41,.14,.15,0,0)],18),'forearm-'+label)
    piece('hand-'+label,'skin',ellipsoid((0,-.56,-.006),(.115,.155,.095),2),'forearm-'+label)
    anchor('leg-'+label,'rig-root',(side*.22,1.13,.03))
    piece('thigh-'+label,'pants',loft([(-.51,.18,.183,0,0),(-.32,.196,.197,0,0),(-.04,.22,.207,0,0)],20),'leg-'+label)
    anchor('shin-'+label,'leg-'+label,(0,-.52,0))
    piece('trouser-'+label,'pants',loft([(-.45,.154,.161,0,0),(-.24,.163,.18,0,0),(-.05,.175,.182,0,0)],20),'shin-'+label)
    piece('ankle-wrap-'+label,'leather',loft([(-.47,.163,.17,0,0),(-.39,.165,.17,0,0)],20),'shin-'+label)
    anchor('foot-'+label,'shin-'+label,(0,-.44,-.05))
    piece('boot-'+label,'leather',ellipsoid((0,-.039,-.087),(.192,.133,.327),2),'foot-'+label)
    piece('boot-sole-'+label,'dark',ellipsoid((0,-.148,-.104),(.195,.045,.334),2),'foot-'+label)
    for k in range(4):
        piece(f'boot-lace-{label}-{k}','linen',segment((-.09,.025-k*.04,-.270),(.09,.025-k*.04,-.27),.012,.012,6),'foot-'+label)

for (parent,material),shapes in PARTS.items():
    model=trimesh.util.concatenate(shapes)
    with_material(model,material)
    node_name=parent+'-surface-'+material
    scene.add_geometry(model,geom_name=node_name,node_name=node_name,parent_node_name=parent)

path=OUT/'windfall-wayfarer.glb'
blob=scene.export(file_type='glb')
path.write_bytes(blob)
loaded=trimesh.load(path,force='scene')
triangles=sum(len(geo.faces) for geo in loaded.geometry.values())
assert len(loaded.geometry)>20 and triangles>13000
assert all(k in loaded.graph.nodes for k in ['leg-L','leg-R','shin-L','head','body','cape','arm-L','forearm-R'])
print(f'{path.name}: {len(blob):,} bytes, {triangles:,} triangles, {len(loaded.geometry)} meshes, {len(loaded.graph.nodes)} nodes')
