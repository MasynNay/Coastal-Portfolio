"""Repack self-authored building GLBs with high-quality JPEG embedded PBR textures.

RGB materials require no alpha channel. Repacking keeps the glTF 2.0 model fully
self-contained and standards compliant while reducing client download size.
Geometry, UVs, and metallic/roughness values remain unchanged except JPEG loss.
"""
from pathlib import Path
from PIL import Image
from io import BytesIO
import json, struct

ROOT=Path(__file__).resolve().parents[1]
MODELS=('windfall-timber-cottage.glb','windfall-harbor-workshop.glb')

def aligned_bytes(buffer):
    pad=(-len(buffer))%4
    return buffer + b'\x00'*pad

def compress_glb(path):
    src=path.read_bytes()
    if src[:4]!=b'glTF' or struct.unpack_from('<I',src,4)[0]!=2:raise ValueError('Not glTF 2')
    n_json,t_json=struct.unpack_from('<II',src,12)
    if t_json!=0x4E4F534A:raise ValueError('Invalid JSON chunk')
    doc=json.loads(src[20:20+n_json]);start_bin=20+n_json
    n_bin,t_bin=struct.unpack_from('<II',src,start_bin)
    if t_bin!=0x004E4942:raise ValueError('Invalid BIN chunk')
    binary=src[start_bin+8:start_bin+8+n_bin]
    img_by_view={img['bufferView']:img for img in doc.get('images',[])}
    rebuilt=bytearray()
    sorted_views=sorted(enumerate(doc['bufferViews']),key=lambda e:e[1].get('byteOffset',0))
    old_ends=[]
    for view_id,view in sorted_views:
        offset=view.get('byteOffset',0);size=view['byteLength'];old_ends.append((offset,offset+size))
        if offset+size>len(binary):raise ValueError('Buffer range overflow')
        chunk=bytes(binary[offset:offset+size])
        if view_id in img_by_view:
            image=img_by_view[view_id]
            if image.get('mimeType')!='image/png':raise ValueError('Expected original PNG texture')
            pixels=Image.open(BytesIO(chunk))
            if pixels.mode!='RGB':raise ValueError('Architecture textures must not have alpha')
            optimized=BytesIO()
            # High-quality chroma-preserving JPEG, important for tangent-space normal maps.
            pixels.save(optimized,format='JPEG',quality=97,subsampling=0,optimize=True)
            chunk=optimized.getvalue()
            image['mimeType']='image/jpeg'
        rebuilt.extend(b'\x00'*(-len(rebuilt)%4))
        view['byteOffset']=len(rebuilt);view['byteLength']=len(chunk)
        rebuilt.extend(chunk)
    if any(old_ends[i][1]>old_ends[i+1][0] for i in range(len(old_ends)-1)):
        raise ValueError('Overlapping views unsupported')
    # No original data may be omitted from mesh/material-referenced buffer views.
    doc['buffers'][0]['byteLength']=len(rebuilt)
    jsonbytes=json.dumps(doc,separators=(',',':')).encode('utf-8')
    jsonbytes+=b' '*(-len(jsonbytes)%4)
    binbytes=aligned_bytes(bytes(rebuilt))
    glb=bytearray(struct.pack('<III',0x46546C67,2,12+8+len(jsonbytes)+8+len(binbytes)))
    glb.extend(struct.pack('<II',len(jsonbytes),0x4E4F534A));glb.extend(jsonbytes)
    glb.extend(struct.pack('<II',len(binbytes),0x004E4942));glb.extend(binbytes)
    path.write_bytes(glb)
    return (len(src),len(glb))

if __name__=='__main__':
    for n in MODELS:
        old,new=compress_glb(ROOT/'models'/n)
        print(n,old,'->',new,'bytes; saved',round((old-new)/old*100,1),'percent')
