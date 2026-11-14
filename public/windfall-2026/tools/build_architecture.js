// Original Windfall architecture: generated geometry and original PBR materials.
// Run: node tools/build_architecture.js, with no package dependencies.
function u8ascii(s) {const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i)&255;return a;}

function concatBytes(parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;}

function le32(v){return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}

function be32(v){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]);}

function crc32(a) {let c=0xffffffff;for(let i=0;i<a.length;i++){c^=a[i];for(let j=0;j<8;j++)c=(c&1)?(c>>>1)^0xedb88320:c>>>1;}return (c^0xffffffff)>>>0;}

function pngChunk(type,data) {const bytes=concatBytes([u8ascii(type),data]);return concatBytes([be32(data.length),bytes,be32(crc32(bytes))]);}

function pngRGBA(w,h,rgba) {
 const rowLen=w*4,raw=new Uint8Array((rowLen+1)*h);
 for(let y=0;y<h;y++)raw.set(rgba.subarray(y*rowLen,(y+1)*rowLen),y*(rowLen+1)+1);
 let a=1,b=0;for(const z of raw){a=(a+z)%65521;b=(b+a)%65521;}
 const chunks=[new Uint8Array([0x78,0x01])];
 for(let k=0;k<raw.length;k+=65535){const n=Math.min(65535,raw.length-k);chunks.push(new Uint8Array([k+n===raw.length?1:0,n&255,(n>>>8)&255,(~n)&255,((~n)>>>8)&255]));chunks.push(raw.subarray(k,k+n));}
 chunks.push(be32(((b<<16)|a)>>>0));
 const zlib=concatBytes(chunks);
 const ihdr=concatBytes([be32(w),be32(h),new Uint8Array([8,6,0,0,0])]);
 return concatBytes([new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("IDAT",zlib),pngChunk("IEND",new Uint8Array(0))]);
}

function materialsForBuilding(){
 const labels=["plaster","timber","roof","stone","glass","iron","leaf","gold"];
 const colors=[[192,174,142],[102,61,34],[116,56,47],[107,115,106],[43,82,87],[51,61,63],[51,104,54],[185,128,51]];
 const images=[];
 for(let m=0;m<labels.length;m++){
   for(let kind=0;kind<3;kind++){
     const side=96,data=new Uint8Array(side*side*4);
     for(let y=0;y<side;y++)for(let x=0;x<side;x++){
       const u=x/side,v=y/side;
       const noise=Math.sin(u*61+Math.sin(v*42))*Math.cos(v*53+u*17);
       const grain=Math.sin((m===1?u*48+v*4:u*19+v*29)+Math.sin(v*25));
       const cracks=Math.abs(Math.sin(u*43+v*32+Math.sin(v*8)*2));
       const t=.93+.15*noise+.13*grain-.055*Math.pow(cracks,12);
       const k=(y*side+x)*4;
       if(kind===0){
         data[k]=Math.max(0,Math.min(255,colors[m][0]*t));
         data[k+1]=Math.max(0,Math.min(255,colors[m][1]*t));
         data[k+2]=Math.max(0,Math.min(255,colors[m][2]*t));
       } else if(kind===1){
         data[k]=Math.max(0,Math.min(255,128+32*Math.cos(u*61+v*15)));
         data[k+1]=Math.max(0,Math.min(255,128+29*Math.sin(v*59+u*20)));
         data[k+2]=244;
       } else {
         data[k]=230;
         data[k+1]=m===4?65:m===5?119:m===7?76:218;
         data[k+2]=m===5?210:m===7?144:0;
       }
       data[k+3]=255;
     }
     images.push(pngRGBA(side,side,data));
   }
 }
 return {labels,images};
}

function generateBuildingGLB(variant){
 const workshop=variant==="workshop",w=workshop?7.3:6.2,d=workshop?6.9:6.0,wall=workshop?4.6:4.2,ridge=wall+(workshop?2.0:2.2);
 const names=["plaster","timber","roof","stone","glass","iron","leaf","gold"],groups=names.map(()=>({vertices:[],indices:[]}));
 let count=0;
 const rnd=()=>{count++;let v=Math.sin(count*137.3+5.3)*43758.5453;return v-Math.floor(v);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2]];
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
 const length=(v)=>Math.hypot(...v);
 const normal=(v)=>{let n=length(v)||1;return v.map(x=>x/n)};
 function tri(a,b,c,material,uvScale=1) {
   const g=groups[names.indexOf(material)],i=g.vertices.length/8,n=normal(cross(sub(b,a),sub(c,a)));
   const ab=length(sub(b,a))*uvScale,ac=length(sub(c,a))*uvScale;
   g.vertices.push(...a,...n,0,0,...b,...n,ab,0,...c,...n,0,ac);
   g.indices.push(i,i+1,i+2);
 }
 function quad(a,b,c,d,mat,uv=1){tri(a,b,c,mat,uv);tri(a,c,d,mat,uv);}
 function box(x,y,z,W,H,D,mat,uv=1){
   const x0=x-W/2,x1=x+W/2,y0=y,y1=y+H,z0=z-D/2,z1=z+D/2;
   quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],mat,uv);
   quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],mat,uv);
   quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],mat,uv);
   quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],mat,uv);
   quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],mat,uv);
   quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],mat,uv);
 }
 function beam(a,b,r,mat="timber",sides=6){
   const d=normal(sub(b,a)),temp=Math.abs(d[1])>.93?[1,0,0]:[0,1,0];
   const v=normal(cross(d,temp)),t=cross(d,v);
   const p=(c,angle)=>c.map((x,i)=>x+r*(Math.cos(angle)*v[i]+Math.sin(angle)*t[i]));
   for(let i=0;i<sides;i++){const a0=i*Math.PI*2/sides,a1=(i+1)*Math.PI*2/sides;quad(p(a,a0),p(a,a1),p(b,a1),p(b,a0),mat,.7);}
 }
 function cylinder(x,y,z,r,h,mat="stone",sides=12){
   for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
     quad([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],
       [x+Math.cos(b)*r,y+h,z+Math.sin(b)*r],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r],mat,.8);}
 }
 // Dry-stacked foundation, plaster infill, solid oak frame, exposed bracing.
 box(0,-.28,0,w+.65,.53,d+.65,"stone",.8);
 box(0,.12,0,w,wall-.12,d,"plaster",.35);
 for(let side of [-1,1]){
   for(let y of [1.08,2.3,wall-.2]){box(0,y,side*(d/2+.09),w+.2,.16,.21,"timber");box(side*(w/2+.08),y,0,.21,.16,d+.2,"timber");}
   for(let x of [-w/2,-w*.3,w*.3,w/2])box(x,.23,side*(d/2+.1),.19,wall-.2,.23,"timber");
   for(let z of [-d/2,d/2])box(side*(w/2+.11),.23,z,.24,wall-.18,.22,"timber");
   for(let bay=0;bay<3;bay++){
     const left=-w/2+(bay+.2)*w/3,right=left+w/3*.65;
     beam([left,1.09,side*(d/2+.23)],[right,2.31,side*(d/2+.23)],.065);
   }
 }
 // Deep doorway with a proper step, lintel, vertical boards, metal bands, ring pull.
 const front=d/2+.12;box(0,.05,front,1.66,2.63,.22,"timber",.6);
 box(0,.07,front+.12,1.40,2.39,.08,"timber",.7);
 for(let k=0;k<6;k++)box((k-2.5)*.222,.10,front+.19,.020,2.28,.03,"stone",1);
 for(let h of [.48,1.40,2.12])box(0,h,front+.23,1.44,.06,.03,"iron");
 cylinder(.43,1.17,front+.26,.062,.055,"gold",10);
 for(let i=0;i<3;i++)box(0,-.10-i*.16,front+.4+i*.43,2.15,.13,.55,"stone");
 // Deep projecting paned windows; shutters, mullions, stone sills and planters.
 for(let sign of [-1,1])for(let faceSign of [-1,1]){
   const cx=sign*w*.31,z=(d/2+.17)*faceSign;
   box(cx,2.19,z,.99,1.45,.17,"timber");box(cx,2.30,z+faceSign*.105,.77,1.15,.055,"glass");
   box(cx,2.28,z+faceSign*.17,.053,1.19,.06,"timber");
   box(cx,2.86,z+faceSign*.17,.80,.06,.06,"timber");
   box(cx,2.09,z+faceSign*.23,1.26,.15,.33,"stone");
   for(let s of [-1,1]){
     box(cx+s*.59,2.20,z+faceSign*.15,.22,1.27,.1,"timber");
     for(let y of [2.45,2.67,2.87])box(cx+s*.59,y,z+faceSign*.21,.17,.025,.03,"iron");
   }
   if(faceSign===1 && sign>0){
     box(cx,2.05,z+.48,1.12,.16,.33,"timber");
     for(let i=0;i<9;i++){let x=cx-.48+i*.12;
       beam([x,2.20,z+.49],[x+.04,2.32+Math.sin(i*1.2)*.14,z+.53],.025,"leaf",4);
       box(x,2.38,z+.56,.12,.038,.09,"leaf");
     }
   }
 }
 const X=w/2+.33,Z=d/2+.36;
 // Two gables and exposed carved timber braces under the eaves.
 for(let sign of [-1,1]){tri([-X,wall,sign*Z],[X,wall,sign*Z],[0,ridge,sign*Z],"plaster",.3);
   beam([0,ridge,sign*(Z+.035)],[X,wall,sign*(Z+.035)],.15,"timber");
   beam([-X,wall,sign*(Z+.035)],[0,ridge,sign*(Z+.035)],.15,"timber");}
 beam([0,ridge,-Z-.05],[0,ridge,Z+.05],.16,"timber",8);
 // Hand-laid overlapping tile rows; actual undulating arch and chipped leading lips.
 for(let side of [-1,1])for(let row=0;row<16;row++)for(let k=0;k<23;k++){
   const t=(row+.5)/16,x=side*X*t,baseY=ridge+(wall-ridge)*t+.025;
   const z=-Z+(k+.5)*2*Z/23,halfX=X/16*.48,halfZ=(2*Z/23)*.46;
   const p=(tx,yy,tz)=>[x+side*tx,baseY+yy,z+tz];
   const arch=.04+.025*rnd();
   quad(p(-halfX,.04,-halfZ),p(0,arch,-halfZ),p(0,arch,halfZ),p(-halfX,.04,halfZ),"roof",1.3);
   quad(p(0,arch,-halfZ),p(halfX,-.075,-halfZ),p(halfX,-.075,halfZ),p(0,arch,halfZ),"roof",1.3);
   quad(p(halfX,-.075,-halfZ),p(halfX,-.12,-halfZ),p(halfX,-.12,halfZ),p(halfX,-.075,halfZ),"roof");
 }
 for(let i=0;i<33;i++){const z=-Z+i*2*Z/32;cylinder(0,ridge-.06,z,.15,.17,"roof",10);}
 for(let side of [-1,1])beam([side*X,wall,-Z-.16],[side*X,wall,Z+.16],.095,"iron",7);
 // Gabled chimney with individual limestone courses and soot lip.
 const cx=w*.23,cz=-d*.12;
 box(cx,wall-.40,cz,.86,2.27,.84,"stone");
 for(let i=0;i<8;i++)for(let sign of [-1,1]){
   box(cx+sign*.39,wall-.36+i*.265,cz,.10,.18,.72,"stone",1.5);
 }
 box(cx,wall+1.67,cz,1.13,.19,1.08,"stone");box(cx,wall+1.88,cz,.70,.08,.78,"iron");
 if(workshop){
   beam([-w*.37,3.48,front],[-w*.37,3.48,front+.84],.075,"iron");
   box(-w*.37,2.75,front+.86,.8,.66,.1,"timber");box(-w*.37,2.99,front+.92,.55,.10,.03,"gold");
   box(-w*.33,.24,front+.95,1.50,.97,.56,"timber");
   for(let i=0;i<9;i++)box(-w*.33+(i-4)*.125,1.23,front+.95,.10,.29,.28,"iron");
   box(w/2+.94,.94,0,2.24,.16,d*.55,"timber");
   for(let z of [-d*.23,d*.23])beam([w/2+.94,.10,z],[w/2+.94,.97,z],.16);
 }else{
   box(0,3.32,front+.65,1.88,.15,.94,"timber");
   for(let i=0;i<10;i++)beam([-0.87+i*.193,3.42,front+.99],[-.87+i*.193,4.16,front+.99],.044,"iron",5);
   beam([-.93,4.18,front+.99],[.93,4.18,front+.99],.068,"iron",6);
   for(let s of [-1,1])beam([s*.7,3.22,front+.73],[s*.7,2.81,front+.15],.09);
 }
 const {labels,images}=materialsForBuilding(),chunks=[],bufferViews=[],accessors=[],meshes=[],nodes=[],materials=[],textures=[],jsonImages=[];
 let binSize=0;
 function addBuffer(u8,target,stride){const pad=(4-binSize%4)%4;if(pad){chunks.push(new Uint8Array(pad));binSize+=pad;}
   const view={buffer:0,byteOffset:binSize,byteLength:u8.byteLength};if(target)view.target=target;if(stride)view.byteStride=stride;
   const index=bufferViews.length;bufferViews.push(view);chunks.push(u8);binSize+=u8.byteLength;return index;}
 for(let m=0;m<labels.length;m++){
   const g=groups[m];if(!g.indices.length)continue;
   const v=new Float32Array(g.vertices),index=new Uint32Array(g.indices);
   const vv=addBuffer(new Uint8Array(v.buffer),34962,32),ii=addBuffer(new Uint8Array(index.buffer),34963);
   const a0=accessors.length;accessors.push({bufferView:vv,byteOffset:0,componentType:5126,count:v.length/8,type:"VEC3"},{bufferView:vv,byteOffset:12,componentType:5126,count:v.length/8,type:"VEC3"},{bufferView:vv,byteOffset:24,componentType:5126,count:v.length/8,type:"VEC2"},{bufferView:ii,componentType:5125,count:index.length,type:"SCALAR"});
   meshes.push({name:"Windfall original "+labels[m]+" architecture",primitives:[{attributes:{POSITION:a0,NORMAL:a0+1,TEXCOORD_0:a0+2},indices:a0+3,material:m,mode:4}]});
   nodes.push({name:labels[m],mesh:meshes.length-1});
 }
 for(let m=0;m<labels.length;m++){
   const first=textures.length;
   for(let k=0;k<3;k++){const view=addBuffer(images[m*3+k]);jsonImages.push({bufferView:view,mimeType:"image/png"});textures.push({source:jsonImages.length-1});}
   materials.push({name:labels[m],pbrMetallicRoughness:{baseColorTexture:{index:first},metallicRoughnessTexture:{index:first+2},roughnessFactor:1,metallicFactor:labels[m]==="iron"||labels[m]==="gold"?1:0},normalTexture:{index:first+1},doubleSided:labels[m]==="leaf"});
 }
 const binary=concatBytes(chunks),doc={asset:{version:"2.0",generator:"Windfall authored architecture generator"},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials,textures,images:jsonImages,accessors,bufferViews,buffers:[{byteLength:binary.length}]};
 let json=u8ascii(JSON.stringify(doc));const padding=(4-json.length%4)%4;if(padding)json=concatBytes([json,new Uint8Array(padding).fill(32)]);
 const total=12+8+json.length+8+binary.length;
 const glb=concatBytes([u8ascii("glTF"),le32(2),le32(total),le32(json.length),u8ascii("JSON"),json,le32(binary.length),new Uint8Array([66,73,78,0]),binary]);
 if(glb.length!==total||glb.length>32*1024*1024)throw Error("Invalid architecture GLB length");
 return {bytes:glb,triangles:groups.reduce((s,g)=>s+g.indices.length/3,0),byteLength:glb.length};
}

function base64(bytes){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",chunks=[];
 for(let i=0;i<bytes.length;i+=3){let a=bytes[i],b=bytes[i+1],c=bytes[i+2];chunks.push(t[a>>2]+t[((a&3)<<4)|((b||0)>>4)]+(i+1<bytes.length?t[((b&15)<<2)|((c||0)>>6)]:"=")+(i+2<bytes.length?t[c&63]:"="));}
 return chunks.join("");
}
const fs = require("node:fs"), path = require("node:path");
const out = path.join(__dirname,"../models");fs.mkdirSync(out,{recursive:true});
for(const variant of ["cottage","workshop"]){const result=generateBuildingGLB(variant);
 fs.writeFileSync(path.join(out,variant==="cottage"?"windfall-timber-cottage.glb":"windfall-harbor-workshop.glb"),result.bytes);
 console.log(variant,result.triangles,result.byteLength);
}
