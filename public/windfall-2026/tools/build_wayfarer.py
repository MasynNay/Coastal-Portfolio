"""Original textured articulated wayfarer (author-generated, no third-party assets).

This is a mid-poly production pipeline proof-of-concept. The mesh has named
hierarchical nodes for the runtime gait system, but is NOT skin-weighted or
photorealistic. Rebuild with: python tools/build_wayfarer.py
"""
from __future__ import annotations
import math
import os
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'models';OUT.mkdir(exist_ok=True)
SEED=20261114
# Original fictional five-character fantasy ensemble; no inferred real likenesses.
CHARACTER=os.environ.get('WINDFALL_CHARACTER','windfall-wayfarer')
CAST={
 'windfall-wayfarer':{'height':1.,'width':1.,'hairStyle':'short','beard':True,'hair':[.14,.091,.070],'skin':[.65,.42,.31],'coat':[.18,.30,.32],'pants':[.16,.22,.26],'scarf':[.35,.22,.25]},
 'windfall-companion-a':{'height':.96,'width':.88,'hairStyle':'long','beard':False,'hair':[.26,.145,.102],'skin':[.68,.45,.35],'coat':[.34,.26,.36],'pants':[.25,.27,.25],'scarf':[.36,.39,.23]},
 'windfall-companion-b':{'height':.76,'width':.80,'hairStyle':'braid','beard':False,'hair':[.22,.15,.104],'skin':[.69,.47,.37],'coat':[.22,.37,.38],'pants':[.34,.31,.27],'scarf':[.42,.27,.30]},
 'windfall-companion-c':{'height':.65,'width':.82,'hairStyle':'short','beard':False,'hair':[.17,.12,.09],'skin':[.69,.47,.34],'coat':[.38,.29,.21],'pants':[.23,.30,.29],'scarf':[.26,.32,.38]},
 'windfall-companion-d':{'height':.54,'width':.85,'hairStyle':'tousled','beard':False,'hair':[.28,.18,.11],'skin':[.73,.50,.37],'coat':[.37,.35,.23],'pants':[.29,.27,.24],'scarf':[.28,.35,.27]},
}
if CHARACTER not in CAST:raise ValueError('Unknown Windfall character variant')
VARIANT=CAST[CHARACTER]


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
    palette={'coat':VARIANT['coat'],'pants':VARIANT['pants'],'scarf':VARIANT['scarf'],'skin':VARIANT['skin'],'hair':VARIANT['hair']}
    base,rough,metal=colors[label];base=palette.get(label,base);rgb=np.array(base)[None,None,:]
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
    # Child head-to-body ratio and shoulder width are intentionally distinct.
    if CHARACTER!='windfall-wayfarer':
        if parent=='head':
            factor=1.09 if VARIANT['height']<.8 else 1.01
            mesh.vertices*=np.array([factor,factor,factor])
        elif parent=='body':
            mesh.vertices*=np.array([VARIANT['width'],1.,.94])
        elif parent.startswith(('arm-','forearm-','leg-','shin-','foot-')):
            mesh.vertices*=np.array([.95,1.,.94])
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
# A continuous head surface, fitted by brow, cheekbone, jaw and chin rings.
# This avoids two intersecting egg shapes and their artificial seam.
piece('head-sculpt','skin',loft([
    (-.31,.06,.07,0,-.115),(-.28,.135,.150,0,-.103),
    (-.235,.185,.194,0,-.085),(-.155,.221,.220,0,-.062),
    (-.065,.264,.263,0,-.039),(.045,.291,.287,0,-.016),
    (.15,.301,.284,0,-.015),(.26,.296,.268,0,0),
    (.365,.274,.246,0,.014),(.448,.217,.196,0,.032),
    (.512,.07,.087,0,.034)
],36),'head')
piece('nose-bridge','skin',ellipsoid((0,.07,-.325),(.066,.153,.081),2),'head')
piece('nose-tip','skin',ellipsoid((0,-.009,-.371),(.081,.048,.063),3),'head')
piece('chin','skin',ellipsoid((0,-.228,-.192),(.132,.063,.083),2),'head')
for sign in [-1,1]:
    piece('ear-'+str(sign),'skin',ellipsoid((sign*.30,.09,-.016),(.073,.119,.079),2),'head')
    # Subtle cheek volume stays inside the continuous face silhouette.
    piece('cheek-'+str(sign),'skin',ellipsoid((sign*.187,-.081,-.188),(.077,.081,.075),2),'head')
    piece('eye-white-'+str(sign),'linen',ellipsoid((sign*.124,.125,-.281),(.057,.028,.020),3),'head')
    piece('iris-'+str(sign),'iris',ellipsoid((sign*.124,.124,-.305),(.020,.022,.011),3),'head')
    piece('pupil-'+str(sign),'dark',ellipsoid((sign*.124,.126,-.316),(.010,.014,.005),2),'head')
    piece('upper-lid-'+str(sign),'skin',segment((sign*.068,.155,-.285),(sign*.182,.146,-.275),.011,.009,10),'head')
    piece('eyebrow-'+str(sign),'hair',segment((sign*.067,.229,-.279),(sign*.214,.218,-.266),.026,.022,8),'head')
    piece('sideburn-'+str(sign),'hair',ellipsoid((sign*.278,-.045,-.018),(.064,.152,.094),2),'head')
piece('lip','skin',ellipsoid((0,-.177,-.292),(.097,.015,.018),2),'head')
if VARIANT['beard']:
    # A single frontal jaw shell replaces separate round beard blobs.
    rings=[(-.325,.065,.105,-.115),(-.296,.124,.151,-.096),
           (-.240,.177,.196,-.078),(-.166,.206,.225,-.047),
           (-.084,.221,.236,-.032),(-.028,.215,.222,-.016)]
    sides=26;v=[];faces=[]
    for ri,(yy,rx,rz,cz) in enumerate(rings):
        for j in range(sides):
            theta=-math.pi*.51+math.pi*1.02*j/(sides-1)
            x=rx*math.sin(theta)
            zz=cz-rz*math.cos(theta)-.008
            curve=(-.018*math.cos(theta*2)) if ri==0 else .007*math.sin(j*.8+ri)
            v.append([x,yy+curve,zz])
    for ri in range(len(rings)-1):
        for j in range(sides-1):
            a=ri*sides+j;b=a+1;c=(ri+1)*sides+j+1;d=c-1
            faces.extend([(a,b,c),(a,c,d)])
    beard=trimesh.Trimesh(vertices=np.asarray(v),faces=np.asarray(faces),process=False)
    piece('fitted-beard','hair',beard,'head')
    for sign in [-1,1]:
        piece('moustache-'+str(sign),'hair',
              segment((sign*.016,-.123,-.301),(sign*.137,-.135,-.284),
                      .017,.011,10),'head')
piece('hair-cap','hair',ellipsoid((0,.39,.018),(.309,.147,.292),3),'head')
# Tapered, flowing locks instead of a uniform ring of spherical clumps.
style=VARIANT['hairStyle']
count=16 if style in ('long','braid') else 11 if style=='tousled' else 8
for i in range(count):
    side=i/(count-1)*2-1
    xx=side*.274
    ridge=[(.44,.067,.10,xx*.55,-.12),(.38,.079,.077,xx*.75,-.19),
           (.29,.060,.055,xx-.012,-.259),(.17,.016,.019,xx-.038,-.258)]
    if style in ('long','braid'):
        ridge=[(.43,.071,.086,xx,-.13),(.27,.081,.077,xx,-.23),
               (.09,.075,.062,xx*1.05,-.19),(-.17,.073,.061,xx*1.15,-.105),
               (-.52,.019,.025,xx*1.09+.03*math.sin(i*2.2),-.06)]
    elif style=='tousled':
        ridge=[(.43,.071,.088,xx*.53,-.11),(.36,.074,.064,xx*.76,-.225),
               (.26,.049,.043,xx+.04*math.sin(i*2),-.26),(.12,.012,.016,xx+.08*math.sin(i*1.9),-.24)]
    piece(f'hair-lock-{i:02d}','hair',loft(ridge,12),'head')
if style=='long':
    for side in [-1,1]:
        piece(f'shoulder-hair-{side}','hair',loft([
            (.16,.085,.10,side*.29,.065),(-.12,.12,.115,side*.32,.10),
            (-.43,.105,.10,side*.34,.17),(-.72,.025,.035,side*.28,.25)
        ],12),'head')
elif style=='braid':
    for side in [-1,1]:
        for j in range(9):
            piece(f'braid-{side}-{j}','hair',ellipsoid((side*(.29+.06*math.sin(j*.75)),
                .10-j*.104,.09+.05*math.sin(j*.42)),(.067,.070,.066),2),'head')
piece('forelock','hair',loft([(.45,.12,.10,-.13,-.17),(.39,.14,.086,-.16,-.245),
    (.29,.12,.063,-.19,-.298),(.19,.014,.024,-.22,-.305)],16),'head')

for side,label in [(-1,'L'),(1,'R')]:
    # Upper and lower arm are separate pivoted nodes (elbow bend authored in runtime).
    anchor('arm-'+label,'body',(side*.415,.73,0))
    piece('sleeve-'+label,'coat',loft([(-.52,.15,.165,side*.085,0),(-.28,.18,.186,side*.05,0),(-.03,.19,.198,0,0)],18),'arm-'+label)
    piece('shoulder-seam-'+label,'linen',ellipsoid((0,-.055,-.075),(.185,.038,.04),1),'arm-'+label)
    anchor('forearm-'+label,'arm-'+label,(side*.085,-.52,0))
    piece('wrist-sleeve-'+label,'coat',loft([(-.45,.124,.14,0,0),(-.25,.145,.15,0,0),(-.04,.148,.15,0,0)],18),'forearm-'+label)
    piece('cuff-'+label,'leather',loft([(-.47,.145,.152,0,0),(-.41,.14,.15,0,0)],18),'forearm-'+label)
    piece('hand-'+label,'skin',ellipsoid((0,-.555,-.006),(.109,.123,.091),2),'forearm-'+label)
    # Four tapered finger shapes and a thumb follow the existing wrist pivot.
    for digit in range(4):
        bx=(digit-1.5)*.047
        ending=(digit-1.5)*.052
        length=.098 if digit in (0,3) else .127
        piece(f'finger-{label}-{digit}','skin',
              segment((bx,-.640,-.027),(ending,-.640-length,-.040),.025,.014,10),
              'forearm-'+label)
    thumb_sign=1 if label=='R' else -1
    piece('thumb-'+label,'skin',
          segment((thumb_sign*.089,-.575,-.026),(thumb_sign*.142,-.674,-.083),
                  .033,.018,10),'forearm-'+label)
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

scale=VARIANT['height']
scene.graph.update(frame_to='rig-root',frame_from='world',matrix=np.diag([scale,scale,scale,1.]))
path=OUT/(CHARACTER+'.glb')
blob=scene.export(file_type='glb')
path.write_bytes(blob)
loaded=trimesh.load(path,force='scene')
triangles=sum(len(geo.faces) for geo in loaded.geometry.values())
assert len(loaded.geometry)>20 and triangles>13000
assert all(k in loaded.graph.nodes for k in ['leg-L','leg-R','shin-L','head','body','cape','arm-L','forearm-R'])
print(f'{path.name}: {len(blob):,} bytes, {triangles:,} triangles, {len(loaded.geometry)} meshes, {len(loaded.graph.nodes)} nodes')
