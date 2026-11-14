/* Windfall authored-asset pipeline. WebGL2, glTF 2.0 GLB, metallic-roughness PBR.
 * Requires same-origin, self-hosted models and explicit rights metadata in the manifest.
 * The procedural world remains available while assets are loading or if they fail.
 */
(() => {
  'use strict';
  const MAX_BYTES = 32 * 1024 * 1024;
  const MANIFEST_VERSION = 1;
  const supportedLicenses = new Set(['CC0-1.0', 'CC-BY-4.0', 'OWNED-ORIGINAL']);
  function validateManifest(manifest) {
    if (!manifest || manifest.version !== MANIFEST_VERSION || !Array.isArray(manifest.assets))
      throw new Error('Model manifest must contain version:1 and an assets array');
    if (manifest.assets.length > 64) throw new Error('Too many independent model assets');
    const seen = new Set();
    for (const a of manifest.assets) {
      if (!a || !/^[a-z0-9][\w-]{0,60}$/i.test(a.id || '') || seen.has(a.id)) throw new Error('Asset IDs must be unique');
      seen.add(a.id);
      if (typeof a.src !== 'string' || !/^models\/[\w/.-]+\.glb$/.test(a.src) || a.src.includes('..')) throw new Error('Models must be local .glb files under models/');
      if (!supportedLicenses.has(a.license) || typeof a.creator !== 'string' || !a.creator.trim() || !a.provenance)
        throw new Error(`Asset ${a.id} needs rights, creator, and provenance`);
      if (a.role !== undefined && !['player','companion'].includes(a.role)) throw new Error('Unsupported dynamic model role');
      if (!Array.isArray(a.instances) || !a.instances.length || a.instances.length > 150 || (a.role==='player'||a.role==='companion')&&a.instances.length!==1) throw new Error('Specify 1-150 instances (one for player)');
      if (a.collisionRadius !== undefined && (!Number.isFinite(a.collisionRadius) || a.collisionRadius < 0 || a.collisionRadius > 60)) throw new Error('Invalid model collision radius');
      if (a.collisionBox !== undefined && (!Array.isArray(a.collisionBox) || a.collisionBox.length !== 2 || !a.collisionBox.every(n => Number.isFinite(n) && n > 0 && n <= 50))) throw new Error('Invalid building collision box');
      for (const inst of a.instances) {
        if (!Array.isArray(inst.position) || inst.position.length !== 3 || !inst.position.every(Number.isFinite)) throw new Error('Invalid model placement');
        if (inst.scale !== undefined && (!Number.isFinite(inst.scale) || inst.scale <= 0 || inst.scale > 100)) throw new Error('Invalid model scale');
        if (inst.rotationY !== undefined && !Number.isFinite(inst.rotationY)) throw new Error('Invalid model rotation');
      }
    }
    return manifest;
  }
  function parseGLB(input) {
    const b = input instanceof ArrayBuffer ? input : input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    if (b.byteLength < 20 || b.byteLength > MAX_BYTES) throw new Error('GLB size outside supported range');
    const dv = new DataView(b);
    if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2 || dv.getUint32(8, true) !== b.byteLength)
      throw new Error('Invalid glTF 2 binary header');
    let cursor = 12, json = null, binary = null;
    while (cursor < b.byteLength) {
      if (cursor + 8 > b.byteLength) throw new Error('Incomplete GLB chunk header');
      const len = dv.getUint32(cursor, true), type = dv.getUint32(cursor + 4, true);
      cursor += 8;
      if (len % 4 !== 0 || cursor + len > b.byteLength) throw new Error('Invalid GLB chunk bounds');
      if (type === 0x4e4f534a) {
        if (json) throw new Error('Multiple GLB JSON chunks');
        json = JSON.parse(new TextDecoder().decode(new Uint8Array(b, cursor, len)).trim());
      } else if (type === 0x004e4942) {
        if (binary) throw new Error('Multiple GLB binary chunks');
        binary = new Uint8Array(b, cursor, len);
      }
      cursor += len;
    }
    if (!json || !binary || json.asset?.version !== '2.0') throw new Error('Requires glTF 2.0 JSON and binary chunks');
    if ((json.buffers || []).length !== 1 || json.buffers[0].uri) throw new Error('GLB must have one embedded binary buffer');
    if (json.extensionsRequired?.length) throw new Error(`Unsupported glTF extensions: ${json.extensionsRequired.join(', ')}`);
    if (binary.byteLength < json.buffers[0].byteLength) throw new Error('Truncated model geometry');
    return { json, binary };
  }
  const COMPONENT = { 5120: { size: 1, read: 'getInt8' }, 5121: { size: 1, read: 'getUint8' }, 5122: { size: 2, read: 'getInt16' }, 5123: { size: 2, read: 'getUint16' }, 5125: { size: 4, read: 'getUint32' }, 5126: { size: 4, read: 'getFloat32' } };
  const COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  function accessorValues(doc, id) {
    const { json, binary } = doc, a = json.accessors?.[id], view = json.bufferViews?.[a?.bufferView], comp = COMPONENT[a?.componentType];
    if (!a || !view || !comp || !COUNT[a.type] || a.sparse) throw new Error(`Unsupported glTF accessor ${id}`);
    if (!Number.isInteger(a.count) || a.count < 1 || a.count > 2000000) throw new Error('Invalid vertex count');
    const dimensions = COUNT[a.type], span = dimensions * comp.size, stride = view.byteStride || span;
    const base = (view.byteOffset || 0) + (a.byteOffset || 0), viewEnd = (view.byteOffset || 0) + view.byteLength;
    if (stride < span || stride % comp.size || base + (a.count - 1) * stride + span > viewEnd || viewEnd > binary.byteLength)
      throw new Error('Accessor exceeds its buffer view');
    const result = new Float32Array(a.count * dimensions), dv = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < dimensions; k++) {
      let value = dv[comp.read](base + i * stride + k * comp.size, true);
      if (a.normalized && a.componentType !== 5126) {
        const max = (2 ** (comp.size * 8 - (a.componentType % 2 === 0 ? 1 : 0))) - 1;
        value = a.componentType % 2 === 0 ? Math.max(-1, value / max) : value / max;
      }
      result[i * dimensions + k] = value;
    }
    return { values: result, dimension: dimensions, count: a.count };
  }
  function identity() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function multiply(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = 0;
      for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    }
    return o;
  }
  function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
    const [x, y, z, w] = q, [sx, sy, sz] = s;
    return [
      (1 - 2 * (y*y + z*z))*sx, 2*(x*y+z*w)*sx, 2*(x*z-y*w)*sx, 0,
      2*(x*y-z*w)*sy, (1-2*(x*x+z*z))*sy, 2*(y*z+x*w)*sy, 0,
      2*(x*z+y*w)*sz, 2*(y*z-x*w)*sz, (1-2*(x*x+y*y))*sz, 0,
      t[0],t[1],t[2],1
    ];
  }
  function normalize(v) { const l = Math.hypot(...v) || 1; return v.map(x => x / l); }
  function cross(a, b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function geometry(doc, primitive) {
    if (primitive.mode !== undefined && primitive.mode !== 4) throw new Error('Only triangle-based glTF meshes supported');
    if (primitive.attributes?.POSITION === undefined) throw new Error('Missing glTF POSITION attribute');
    const points = accessorValues(doc,primitive.attributes.POSITION);
    if (points.dimension !== 3) throw new Error('POSITION must be VEC3');
    const normals = primitive.attributes.NORMAL !== undefined ? accessorValues(doc,primitive.attributes.NORMAL).values : new Float32Array(points.count * 3);
    const uv = primitive.attributes.TEXCOORD_0 !== undefined ? accessorValues(doc,primitive.attributes.TEXCOORD_0).values : new Float32Array(points.count * 2);
    const tangents = primitive.attributes.TANGENT !== undefined ? accessorValues(doc,primitive.attributes.TANGENT).values : new Float32Array(points.count * 4);
    const indices = primitive.indices !== undefined ? accessorValues(doc,primitive.indices).values : Float32Array.from({length:points.count},(_,i)=>i);
    if (normals.length !== points.count * 3 || uv.length !== points.count * 2 || tangents.length !== points.count * 4)
      throw new Error('Inconsistent glTF attribute lengths');
    if (indices.length % 3 !== 0) throw new Error('Triangle index count must be divisible by three');
    const idx = new Uint32Array(indices.length);
    for (let i=0;i<indices.length;i++) { if (indices[i] < 0 || indices[i] >= points.count || Math.floor(indices[i]) !== indices[i]) throw new Error('Invalid triangle index'); idx[i] = indices[i]; }
    if (primitive.attributes.NORMAL === undefined) {
      for (let i=0;i<idx.length;i+=3) {
        const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;
        const u=[points.values[b]-points.values[a],points.values[b+1]-points.values[a+1],points.values[b+2]-points.values[a+2]];
        const v=[points.values[c]-points.values[a],points.values[c+1]-points.values[a+1],points.values[c+2]-points.values[a+2]];
        const n=cross(u,v);
        for(const off of [a,b,c]) for(let k=0;k<3;k++) normals[off+k]+=n[k];
      }
      for(let i=0;i<normals.length;i+=3) normals.set(normalize(Array.from(normals.slice(i,i+3))),i);
    }
    if (primitive.attributes.TANGENT === undefined) {
      for(let i=0;i<idx.length;i+=3){
        const a=idx[i],b=idx[i+1],c=idx[i+2];
        const ax=points.values[a*3],ay=points.values[a*3+1],az=points.values[a*3+2];
        const e1=[points.values[b*3]-ax,points.values[b*3+1]-ay,points.values[b*3+2]-az];
        const e2=[points.values[c*3]-ax,points.values[c*3+1]-ay,points.values[c*3+2]-az];
        const du1=uv[b*2]-uv[a*2],du2=uv[c*2]-uv[a*2],dv1=uv[b*2+1]-uv[a*2+1],dv2=uv[c*2+1]-uv[a*2+1];
        const denom=du1*dv2-du2*dv1,f=Math.abs(denom)>1e-7?1/denom:0;
        const tangent=f?[f*(e1[0]*dv2-e2[0]*dv1),f*(e1[1]*dv2-e2[1]*dv1),f*(e1[2]*dv2-e2[2]*dv1)]:[1,0,0];
        for(const index of [a,b,c]) for(let k=0;k<3;k++)tangents[index*4+k]+=tangent[k];
      }
      for(let i=0;i<points.count;i++){
        const n=Array.from(normals.slice(i*3,i*3+3)),t=Array.from(tangents.slice(i*4,i*4+3)),dot=n.reduce((sum,x,k)=>sum+x*t[k],0);
        const ortho=normalize(t.map((x,k)=>x-dot*n[k]));
        tangents.set([...ortho,1],i*4);
      }
    }
    const interleaved=new Float32Array(points.count*12);
    for(let i=0;i<points.count;i++){
      interleaved.set(points.values.subarray(i*3,i*3+3),i*12);
      interleaved.set(normals.subarray(i*3,i*3+3),i*12+3);
      interleaved.set(uv.subarray(i*2,i*2+2),i*12+6);
      interleaved.set(tangents.subarray(i*4,i*4+4),i*12+8);
    }
    return { vertices:interleaved,indices:idx };
  }
  function shader(gl,type,src) {
    const h=gl.createShader(type);gl.shaderSource(h,src);gl.compileShader(h);
    if(!gl.getShaderParameter(h,gl.COMPILE_STATUS))throw new Error(`glTF model shader: ${gl.getShaderInfoLog(h)}`);
    return h;
  }
  function link(gl,vs,fs) {
    const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(`glTF model shader link: ${gl.getProgramInfoLog(p)}`);
    return p;
  }
  const VERTEX = `#version 300 es
  precision highp float;
  layout(location=0)in vec3 aPosition;
  layout(location=1)in vec3 aNormal;
  layout(location=2)in vec2 aUV;
  layout(location=3)in vec4 aTangent;
  uniform mat4 uVP,uModel;
  uniform float uWindTime,uWindWeight,uWindBaseY,uWindInvHeight,uWindMotionScale;
  out vec3 vPosition,vNormal,vTangent,vBitangent;
  out vec2 vUV;
  void main(){
   vec4 world=uModel*vec4(aPosition,1.);
   float tip=pow(clamp((aPosition.y-uWindBaseY)*uWindInvHeight,0.,1.),1.35);
   float gust=sin(uWindTime*.91+world.x*.17+world.z*.13)+.38*sin(uWindTime*1.71+world.x*.34-world.z*.23);
   world.xz+=vec2(.16,.085)*gust*tip*uWindWeight*uWindMotionScale;
   vPosition=world.xyz;mat3 invTrans=transpose(inverse(mat3(uModel)));
   vNormal=normalize(invTrans*aNormal);vTangent=normalize(mat3(uModel)*aTangent.xyz);
   vBitangent=normalize(cross(vNormal,vTangent)*aTangent.w);
   vUV=aUV;gl_Position=uVP*world;}`;
  const FRAGMENT = `#version 300 es
  precision highp float;
  in vec3 vPosition,vNormal,vTangent,vBitangent;
  in vec2 vUV;
  uniform sampler2D uBase,uNormal,uORM,uEmissive,uShadowFar,uShadowNear;
  uniform mat4 uFarVP,uNearVP;
  uniform vec3 uEye,uSun,uFog,uEmission;
  uniform float uTime,uLowQuality;
  uniform vec4 uBaseFactor;
  uniform vec2 uMetalRough;
  uniform float uHasBase,uHasNormal,uHasORM,uHasEmissive,uHasShadows,uAlphaCutoff,uAlphaMasked;
  out vec4 frag;
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  float shadowTap(sampler2D map,vec4 projected,float bias){vec3 q=projected.xyz/projected.w*.5+.5;
   if(q.x<.005||q.x>.995||q.y<.005||q.y>.995||q.z<=0.||q.z>=1.)return 1.;
   float lit=0.;vec2 texel=1./vec2(textureSize(map,0));
   for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(map,q.xy+vec2(float(x),float(y))*texel*1.4).r;lit+=step(q.z-bias,d);}return lit/9.;}
  float shadow(vec3 n){if(uHasShadows<.5)return 1.;
   float bias=max(.00015,.0007*(1.-max(dot(n,uSun),0.)));
   vec4 nearP=uNearVP*vec4(vPosition+n*.02,1.);vec2 uv=nearP.xy/nearP.w*.5+.5;
   float weight=1.-smoothstep(.36,.465,max(abs(uv.x-.5),abs(uv.y-.5)));
   float far=shadowTap(uShadowFar,uFarVP*vec4(vPosition+n*.03,1.),bias);
   return mix(.3+.7*far,.25+.75*shadowTap(uShadowNear,nearP,bias*.7),weight);}
  void main(){vec4 base=uBaseFactor*(uHasBase>.5?texture(uBase,vUV):vec4(1.));
   if(uAlphaMasked>.5&&base.a<uAlphaCutoff)discard;
   vec3 n=normalize(vNormal),v=normalize(uEye-vPosition),l=normalize(uSun);
   if(uHasNormal>.5){vec3 mapped=texture(uNormal,vUV).xyz*2.-1.;n=normalize(mat3(normalize(vTangent),normalize(vBitangent),n)*mapped);}
   float metal=uMetalRough.x,rough=uMetalRough.y,ambientOcclusion=1.;
   if(uHasORM>.5){vec4 orm=texture(uORM,vUV);rough*=orm.g;metal*=orm.b;ambientOcclusion=mix(1.,orm.r,.78);}
   rough=clamp(rough,.075,1.);metal=clamp(metal,0.,1.);
   vec3 h=normalize(l+v),F0=mix(vec3(.04),base.rgb,metal);
   float nl=max(dot(n,l),0.),nv=max(dot(n,v),.001),nh=max(dot(n,h),.001),vh=max(dot(v,h),0.);
   float a=rough*rough,a2=a*a,denom=nh*nh*(a2-1.)+1.;float D=a2/max(3.14159*denom*denom,.00001);
   float k=(rough+1.)*(rough+1.)/8.;float G=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
   vec3 F=F0+(1.-F0)*pow(1.-vh,5.);
   vec3 spec=(D*G*F)/max(4.*nv*nl,.0005);
   vec3 kd=(1.-F)*(1.-metal);
   // Same world-space cloud field as terrain; ambient light remains beneath clouds.
   float cloudSun=1.;
   if(uLowQuality<.5){
    vec2 p=vPosition.xz*.021+vec2(uTime*.018,uTime*.006);
    float a=sin(p.x*2.31+sin(p.y*1.41)*.86);
    float b=sin(p.y*2.07-p.x*.72);
    float c=sin(dot(p,vec2(2.74,-1.83))+.65);
    cloudSun-=smoothstep(.14,.53,a*.51+b*.34+c*.15)*.32;
   }
   vec3 direct=(kd*base.rgb/3.14159+spec)*vec3(1.,.80,.60)*nl*shadow(n)*cloudSun*2.5;
   vec3 hemisphere=base.rgb*mix(vec3(.20,.24,.27),vec3(.48,.55,.58),clamp(n.y*.5+.5,0.,1.))*(1.-metal)*.60*ambientOcclusion;
   // Thin alpha-masked foliage receives a small, warm backlit transmission term.
   float leafBacklight=max(dot(-n,l),0.)*uAlphaMasked*.31;
   vec3 leafTransmission=base.rgb*vec3(.46,.66,.29)*leafBacklight*shadow(n)*cloudSun;
   vec3 color=direct+hemisphere+leafTransmission+uEmission*(uHasEmissive>.5?texture(uEmissive,vUV).rgb:vec3(1.));
   float dist=length(uEye-vPosition);
   float heightFog=exp(-max(vPosition.y,0.)*.052);
   float fog=1.-exp(-pow(dist*.0086,1.52)*(.68+.40*heightFog));
   color=mix(color,pow(uFog,vec3(2.2)),clamp(fog*.74,0.,.84));
   frag=vec4(pow(aces(color*.82),vec3(1./2.2)),base.a);
  }`;
  const SHADOW_VERTEX = `#version 300 es
  precision highp float;layout(location=0)in vec3 aPosition;layout(location=2)in vec2 aUV;
  uniform mat4 uVP,uModel;uniform float uWindTime,uWindWeight,uWindBaseY,uWindInvHeight,uWindMotionScale;out vec2 vUV;
  void main(){
   vUV=aUV;vec4 world=uModel*vec4(aPosition,1.);
   float tip=pow(clamp((aPosition.y-uWindBaseY)*uWindInvHeight,0.,1.),1.35);
   float gust=sin(uWindTime*.91+world.x*.17+world.z*.13)+.38*sin(uWindTime*1.71+world.x*.34-world.z*.23);
   world.xz+=vec2(.16,.085)*gust*tip*uWindWeight*uWindMotionScale;
   gl_Position=uVP*world;
  }`;
  const SHADOW_FRAGMENT = `#version 300 es
  precision highp float;in vec2 vUV;uniform sampler2D uBase;uniform vec4 uBaseFactor;
  uniform float uHasBase,uAlphaMasked,uAlphaCutoff;
  void main(){float a=uBaseFactor.a*(uHasBase>.5?texture(uBase,vUV).a:1.);if(uAlphaMasked>.5&&a<uAlphaCutoff)discard;}`;
  async function imageTexture(gl,doc,textureId,srgb) {
    const tex=doc.json.textures?.[textureId],img=doc.json.images?.[tex?.source];
    if(!tex||!img || img.bufferView===undefined)throw new Error('Only embedded glTF textures are supported');
    const view=doc.json.bufferViews?.[img.bufferView],mime=img.mimeType;
    if(!view || !['image/png','image/jpeg','image/webp'].includes(mime))throw new Error('Texture must be an embedded PNG, JPEG or WebP');
    if((view.byteOffset||0)+view.byteLength>doc.binary.byteLength)throw new Error('Texture buffer exceeds GLB bounds');
    const source=doc.binary.slice(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
    const image=await createImageBitmap(new Blob([source],{type:mime}));
    const out=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,out);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,srgb?gl.SRGB8_ALPHA8:gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    image.close();return out;
  }
  // OpenGL clip planes extracted from the column-major view-projection matrix.
  // The six normalized planes are shared by the color and shadow passes.
  function frustumPlanes(m) {
    if (!m || m.length !== 16) throw new Error('Expected a 4x4 clip matrix');
    const pairs = [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]];
    return pairs.map(([axis,sign])=>{
      const p=[m[3]+sign*m[axis],m[7]+sign*m[4+axis],
               m[11]+sign*m[8+axis],m[15]+sign*m[12+axis]];
      const length=Math.hypot(p[0],p[1],p[2]);
      if(!Number.isFinite(length)||length<1e-10)throw new Error('Degenerate clip plane');
      return p.map(v=>v/length);
    });
  }
  function transformSphere(local,model,margin=0) {
    const c=local.center;
    const center=[
      model[0]*c[0]+model[4]*c[1]+model[8]*c[2]+model[12],
      model[1]*c[0]+model[5]*c[1]+model[9]*c[2]+model[13],
      model[2]*c[0]+model[6]*c[1]+model[10]*c[2]+model[14]
    ];
    // A maximum column length bounds rotation+scaling for our glTF TRS models.
    // Nonuniform scale and procedural wind displacement get extra slack.
    const scale=Math.max(Math.hypot(model[0],model[1],model[2]),
      Math.hypot(model[4],model[5],model[6]),
      Math.hypot(model[8],model[9],model[10]));
    return {center,radius:local.radius*scale+margin};
  }
  function sphereVisible(sphere,planes) {
    const c=sphere.center;
    return planes.every(p=>p[0]*c[0]+p[1]*c[1]+p[2]*c[2]+p[3]>=-sphere.radius);
  }
  function create(gl) {
    const standard=link(gl,VERTEX,FRAGMENT),depth=link(gl,SHADOW_VERTEX,SHADOW_FRAGMENT);
    const uniform=(program,name)=>gl.getUniformLocation(program,name);
    const u={};for(const [name,prog] of [['standard',standard],['depth',depth]]){
      u[name]={};for(const n of ['uVP','uModel','uBase','uNormal','uORM','uEmissive','uShadowFar','uShadowNear','uFarVP','uNearVP','uEye','uSun','uFog','uEmission','uBaseFactor','uMetalRough','uHasBase','uHasNormal','uHasORM','uHasEmissive','uHasShadows','uAlphaCutoff','uAlphaMasked','uWindTime','uWindWeight','uWindBaseY','uWindInvHeight','uWindMotionScale','uTime','uLowQuality'])u[name][n]=uniform(prog,n);
    }
    const records=[],statuses=[],colliders=[];
    let dynamicPlayer=null;
    const companionRigs=[];
    const drawStats={colorSubmitted:0,colorCulled:0,shadowSubmitted:0,shadowCulled:0,instances:0};
    function beginFrame(){
      drawStats.colorSubmitted=0;drawStats.colorCulled=0;
      drawStats.shadowSubmitted=0;drawStats.shadowCulled=0;
      drawStats.instances=records.length;
    }
    const defaultWhite=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,defaultWhite);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    function addGeometry(mesh){
      const {vertices,indices}=mesh;
      const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ibo=gl.createBuffer();
      gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
      for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,i===2?2:i===3?4:3,gl.FLOAT,false,48,[0,12,24,32][i]);}
      // Scan mesh positions once; reuse transformed bounds across every instance.
      const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<vertices.length;i+=12)for(let k=0;k<3;k++){
        const value=vertices[i+k];
        if(!Number.isFinite(value))throw new Error('Non-finite GLB vertex position');
        lo[k]=Math.min(lo[k],value);hi[k]=Math.max(hi[k],value);
      }
      const center=lo.map((v,k)=>(v+hi[k])*.5);
      let radius=0;
      for(let i=0;i<vertices.length;i+=12)radius=Math.max(radius,Math.hypot(
        vertices[i]-center[0],vertices[i+1]-center[1],vertices[i+2]-center[2]));
      gl.bindVertexArray(null);return {vao,indices:indices.length,bounds:{center,radius,heightStart:lo[1],heightSpan:Math.max(.15,hi[1]-lo[1])}};
    }
    async function addGLB(buffer,entry){
      validateManifest({version:MANIFEST_VERSION,assets:[entry]});
      const doc=parseGLB(buffer),materials=doc.json.materials || [{}],resources=new Map(),localNodes=[];
      async function materialAt(index){
        const m=materials[index]||{},pbr=m.pbrMetallicRoughness||{};
        const base=pbr.baseColorTexture?.index,normal=m.normalTexture?.index,orm=pbr.metallicRoughnessTexture?.index,emissive=m.emissiveTexture?.index;
        async function texture(id,isColor){
          if(id===undefined)return null;
          const cacheKey=`${id}:${isColor?'srgb':'linear'}`;
          if(!resources.has(cacheKey))resources.set(cacheKey,await imageTexture(gl,doc,id,isColor));
          return resources.get(cacheKey);
        }
        return {base:await texture(base,true),normal:await texture(normal,false),orm:await texture(orm,false),emissive:await texture(emissive,true),
          baseFactor:pbr.baseColorFactor||[1,1,1,1],metal:pbr.metallicFactor??1,rough:pbr.roughnessFactor??1,emission:m.emissiveFactor||[0,0,0],
          alpha:m.alphaMode||'OPAQUE',cutoff:m.alphaCutoff??.5,doubleSided:!!m.doubleSided};
      }
      const resolvedMaterials=await Promise.all(materials.map((_,i)=>materialAt(i)));
      const primitiveMesh=(doc.json.meshes||[]).map(mesh=>(mesh.primitives||[]).map(p=>({gpu:addGeometry(geometry(doc,p)),mat:resolvedMaterials[p.material||0]})));
      const sceneIndex=doc.json.scene??0,roots=doc.json.scenes?.[sceneIndex]?.nodes;
      if(!roots)throw new Error('Model has no active glTF scene');
      function visit(index,parent,depthCount=0){
        if(depthCount>50)throw new Error('Cyclic glTF node graph');
        const node=doc.json.nodes?.[index];if(!node)throw new Error('Invalid glTF node reference');
        const local=node.matrix||trs(node.translation,node.rotation,node.scale),world=multiply(parent,local);
        if(node.mesh!==undefined){const primitives=primitiveMesh[node.mesh];if(!primitives)throw new Error('Invalid mesh reference');
          for(const primitive of primitives)localNodes.push({...primitive,model:world,nodeIndex:index});}
        for(const child of node.children||[])visit(child,world,depthCount+1);
      }
      for(const root of roots)visit(root,identity());
      if(!localNodes.length)throw new Error('GLB has no renderable triangle meshes');
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
      if(entry.role==='companion'){
        const instance=entry.instances[0],scale=instance.scale??1,angle=instance.rotationY??0;
        const base=trs(instance.position,[0,Math.sin(angle/2),0,Math.cos(angle/2)],[scale,scale,scale]);
        const nodeMeshes=new Map(),parts=[];
        for(const m of localNodes){
          const model=multiply(base,m.model);
          const part={...m,model,bounds:transformSphere(m.gpu.bounds,model,.08)};
          parts.push(part);records.push(part);
          if(!nodeMeshes.has(m.nodeIndex))nodeMeshes.set(m.nodeIndex,[]);
          nodeMeshes.get(m.nodeIndex).push(part);
        }
        const index=companionRigs.length;
        companionRigs.push({doc,roots,base,nodeMeshes,parts,index});
        if(entry.collisionRadius>0)colliders.push({x:instance.position[0],z:instance.position[2],radius:entry.collisionRadius*scale});
        statuses.push({id:entry.id,loaded:true,meshes:parts.length,instances:1,role:'companion'});
        return parts.length;
      }
      for(const instance of entry.instances){
        const scale=instance.scale??1,angle=instance.rotationY??0;
        const extra=trs(instance.position,[0,Math.sin(angle/2),0,Math.cos(angle/2)],[scale,scale,scale]);
        for(const mesh of localNodes){
          const model=multiply(extra,mesh.model);
          // Keep a margin for procedural wind and small transform rounding.
          const margin=mesh.mat.alpha==='MASK'?.48:.06;
          records.push({...mesh,model,bounds:transformSphere(mesh.gpu.bounds,model,margin)});
        }
        if(entry.collisionRadius>0)colliders.push({x:instance.position[0],z:instance.position[2],radius:entry.collisionRadius*scale});
        if(entry.collisionBox)colliders.push({x:instance.position[0],z:instance.position[2],halfWidth:entry.collisionBox[0]*scale,halfDepth:entry.collisionBox[1]*scale,rotation:angle});
      }
      statuses.push({id:entry.id,loaded:true,meshes:localNodes.length,instances:entry.instances.length});
      return localNodes.length;
    }
    async function loadManifest(url='asset-manifest.json',heightAt=null) {
      const res=await fetch(url,{credentials:'same-origin'});
      if(!res.ok)throw new Error(`Model manifest HTTP ${res.status}`);
      const manifest=validateManifest(await res.json());
      const list=[];
      for(const entry of manifest.assets){list.push((async()=>{
        try {const response=await fetch(entry.src,{credentials:'same-origin'});
          if(!response.ok)throw new Error(`Model ${entry.id} HTTP ${response.status}`);
          const data=await response.arrayBuffer();
          // Grounded positions are sampled from the *same* terrain as the original island.
          const placed={...entry,instances:entry.instances.map(i=>i.grounded&&heightAt?
            {...i,position:[i.position[0],i.position[1]+heightAt(i.position[0],i.position[2]),i.position[2]]}:i)};
          await addGLB(data,placed);
        } catch(err) {statuses.push({id:entry.id,loaded:false,error:String(err)});console.warn('Windfall model omitted:',entry.id,String(err));}
      })());}
      await Promise.all(list);return statuses;
    }
    function drawGeometry(m){gl.bindVertexArray(m.gpu.vao);gl.drawElements(gl.TRIANGLES,m.gpu.indices,gl.UNSIGNED_INT,0);}
    function setCommon(uniforms,m){
      gl.uniformMatrix4fv(uniforms.uModel,false,new Float32Array(m.model));
      gl.uniform4fv(uniforms.uBaseFactor,m.mat.baseFactor);
      gl.uniform1f(uniforms.uHasBase,m.mat.base?1:0);
      gl.uniform1f(uniforms.uAlphaMasked,m.mat.alpha==='MASK'?1:0);
      gl.uniform1f(uniforms.uAlphaCutoff,m.mat.cutoff);
      gl.uniform1f(uniforms.uWindWeight,m.mat.alpha==='MASK'?1:0);
      const height=m.gpu.bounds.heightSpan;
      gl.uniform1f(uniforms.uWindBaseY,m.gpu.bounds.heightStart);
      gl.uniform1f(uniforms.uWindInvHeight,1/height);
      gl.uniform1f(uniforms.uWindMotionScale,Math.min(1.,Math.max(.045,height*.21)));
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.mat.base||defaultWhite);gl.uniform1i(uniforms.uBase,0);
    }
    // Drive the named authored GLB pivot nodes from the existing frame-independent gait.
    // No JS-side vertex regeneration is needed: only a few matrices are updated.
    function updatePlayer({x,y,z,heading,phase,motion,turn=0,time}){
      const rig=dynamicPlayer;if(!rig)return;
      const cycle=Math.sin(phase)*motion,heel=Math.cos(phase)*motion;
      // Secondary reactions are independent of frame rate and smoothly fade at rest.
      const lean=Math.max(-.85,Math.min(.85,turn));
      const breath=Math.sin(time*1.58)*.0065*(1.-motion);
      const sway=Math.sin(time*1.22+phase*.17)*.023;
      const root=trs([x,y,z],[0,Math.sin(heading*.5),0,Math.cos(heading*.5)]);
      const rotX=a=>trs([0,0,0],[Math.sin(a*.5),0,0,Math.cos(a*.5)]);
      const rotY=a=>trs([0,0,0],[0,Math.sin(a*.5),0,Math.cos(a*.5)]);
      const rotZ=a=>trs([0,0,0],[0,0,Math.sin(a*.5),Math.cos(a*.5)]);
      const swing=(name)=>{
        if(name==='leg-L')return rotX(.43*cycle+.035*heel*motion);
        if(name==='leg-R')return rotX(-.43*cycle-.035*heel*motion);
        if(name==='shin-L')return rotX(-.12+.52*Math.max(0,-cycle));
        if(name==='shin-R')return rotX(-.12+.52*Math.max(0,cycle));
        if(name==='foot-L')return rotX(-.22*Math.sin(phase+.4)*motion);
        if(name==='foot-R')return rotX(.22*Math.sin(phase+.4)*motion);
        if(name==='arm-L')return multiply(rotX(-.34*cycle+.025*motion),rotZ(.035*motion));
        if(name==='arm-R')return multiply(rotX(.34*cycle+.025*motion),rotZ(-.035*motion));
        if(name==='forearm-L')return rotX(-.13-.09*heel);
        if(name==='forearm-R')return rotX(-.13+.09*heel);
        if(name==='body')return multiply(rotZ(.026*cycle-.12*lean+sway*.25),rotX(.015*Math.sin(phase*2.)*motion));
        if(name==='cape')return multiply(rotX(.07+Math.sin(time*2.3)*.053+.11*motion+.035*heel),rotZ(-.08*lean+.02*Math.sin(time*1.6)));
        if(name==='head')return multiply(rotY(Math.sin(time*.73)*.026-.12*lean),rotZ(lean*.026));
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
      const bob=Math.abs(Math.sin(phase))*.042*motion+breath;
      const actor=multiply(root,trs([0,bob,0]));
      for(const i of rig.roots)walk(i,actor);
    }
    // Separate idle pose for every companion. Named original GLB pivots move,
    // and bounds are updated before shadow and color culling.
    function updateCompanions(time){
      const rotX=a=>trs([0,0,0],[Math.sin(a*.5),0,0,Math.cos(a*.5)]);
      const rotY=a=>trs([0,0,0],[0,Math.sin(a*.5),0,Math.cos(a*.5)]);
      const rotZ=a=>trs([0,0,0],[0,0,Math.sin(a*.5),Math.cos(a*.5)]);
      for(const rig of companionRigs){
        const seed=rig.index*1.71,breath=Math.sin(time*1.48+seed)*.009;
        const swing=(name)=>{
          if(name==='body')return multiply(rotZ(.018*Math.sin(time*.77+seed)),rotX(breath));
          if(name==='head')return rotY(Math.sin(time*.51+seed)*.12);
          if(name==='arm-L')return rotX(.075*Math.sin(time*.92+seed));
          if(name==='arm-R')return rotX(-.075*Math.sin(time*.92+seed+.8));
          if(name==='forearm-L')return rotX(-.11+.035*Math.sin(time*1.4+seed));
          if(name==='forearm-R')return rotX(-.10-.035*Math.sin(time*1.4+seed));
          if(name==='cape')return rotX(.06+Math.sin(time*1.48+seed)*.045);
          return identity();
        };
        function visit(i,parent,depthCount=0){
          if(depthCount>50)throw new Error('Invalid companion node hierarchy');
          const node=rig.doc.json.nodes[i];
          const local=node.matrix||trs(node.translation,node.rotation,node.scale);
          const model=multiply(parent,multiply(local,swing(node.name||'')));
          for(const part of rig.nodeMeshes.get(i)||[]){
            part.model=model;
            part.bounds=transformSphere(part.gpu.bounds,model,.08);
          }
          for(const child of node.children||[])visit(child,model,depthCount+1);
        }
        const root=multiply(rig.base,trs([0,breath,0]));
        for(const i of rig.roots)visit(i,root);
      }
    }
    function drawShadow(vp,includePlayer=false,time=0){
      if(!records.length && !(includePlayer&&dynamicPlayer))return;
      gl.useProgram(depth);gl.uniformMatrix4fv(u.depth.uVP,false,new Float32Array(vp));gl.uniform1f(u.depth.uWindTime,time);
      const planes=frustumPlanes(vp);
      const visible=records.filter(m=>sphereVisible(m.bounds,planes));
      drawStats.shadowCulled+=records.length-visible.length;
      if(includePlayer&&dynamicPlayer)visible.push(...dynamicPlayer.parts);
      for(const m of visible){if(m.mat.alpha==='BLEND')continue;
        setCommon(u.depth,m);if(m.mat.doubleSided)gl.disable(gl.CULL_FACE);else gl.enable(gl.CULL_FACE);
        drawGeometry(m);drawStats.shadowSubmitted++;
      }
      gl.disable(gl.CULL_FACE);
    }
    function draw(render){
      if(!records.length && !dynamicPlayer)return;
      // Cull static instances once per frame, not once for each material layer.
      const planes=frustumPlanes(render.vp);
      const visible=records.filter(m=>sphereVisible(m.bounds,planes));
      drawStats.colorSubmitted=0;
      drawStats.colorCulled=records.length-visible.length;
      drawStats.instances=records.length;
      // The player remains rendered regardless of transient camera transitions.
      if(dynamicPlayer)visible.push(...dynamicPlayer.parts);
      gl.useProgram(standard);
      gl.uniformMatrix4fv(u.standard.uVP,false,new Float32Array(render.vp));
      gl.uniformMatrix4fv(u.standard.uFarVP,false,new Float32Array(render.farVP));
      gl.uniformMatrix4fv(u.standard.uNearVP,false,new Float32Array(render.nearVP||identity()));
      gl.uniform3fv(u.standard.uEye,render.eye);gl.uniform3fv(u.standard.uSun,render.sun);gl.uniform3fv(u.standard.uFog,render.fog);
      gl.uniform1f(u.standard.uHasShadows,render.nearMap?1:0);
      gl.uniform1f(u.standard.uTime,render.time||0);
      gl.uniform1f(u.standard.uLowQuality,render.lowQuality?1:0);
      gl.uniform1f(u.standard.uWindTime,render.time||0);
      gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,render.farMap);gl.uniform1i(u.standard.uShadowFar,4);
      gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,render.nearMap||defaultWhite);gl.uniform1i(u.standard.uShadowNear,5);
      for(const layer of ['OPAQUE','MASK','BLEND']){
        if(layer==='BLEND'){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
        for(const m of visible){if(m.mat.alpha!==layer)continue;
          setCommon(u.standard,m);gl.uniform2fv(u.standard.uMetalRough,[m.mat.metal,m.mat.rough]);
          gl.uniform3fv(u.standard.uEmission,m.mat.emission);
          for(const [slot,texture,name,has] of [[1,m.mat.normal,'uNormal','uHasNormal'],[2,m.mat.orm,'uORM','uHasORM'],[3,m.mat.emissive,'uEmissive','uHasEmissive']]){
            gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,texture||defaultWhite);gl.uniform1i(u.standard[name],slot);gl.uniform1f(u.standard[has],texture?1:0);
          }
          if(m.mat.doubleSided)gl.disable(gl.CULL_FACE);else gl.enable(gl.CULL_FACE);
          drawGeometry(m);drawStats.colorSubmitted++;
        }
        if(layer==='BLEND'){gl.depthMask(true);gl.disable(gl.BLEND);}
      }
      gl.disable(gl.CULL_FACE);
    }
    return {addGLB,loadManifest,draw,drawShadow,updatePlayer,updateCompanions,beginFrame,getStatus:()=>statuses.slice(),getMeshCount:()=>records.length+(dynamicPlayer?.parts.length||0),
      hasLoaded:(id)=>statuses.some(s=>s.id===id&&s.loaded),
      getDrawStats:()=>({...drawStats}),
      collides:(x,z,padding=.28)=>colliders.some(c=>{
        const dx=x-c.x,dz=z-c.z;
        if(c.radius!==undefined)return Math.hypot(dx,dz)<c.radius+padding;
        const cs=Math.cos(c.rotation),sn=Math.sin(c.rotation);
        const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
        return Math.abs(lx)<c.halfWidth+padding && Math.abs(lz)<c.halfDepth+padding;
      })};
  }
  window.WindfallAssetPipeline = {create,parseGLB,validateManifest,
    culling:{frustumPlanes,transformSphere,sphereVisible}};
})();
