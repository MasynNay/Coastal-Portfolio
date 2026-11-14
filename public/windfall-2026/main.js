/* Windfall — original self-contained WebGL2 fantasy island, 2026 visual prototype. */
(() => {
'use strict';
const canvas=document.getElementById('scene'), loading=document.getElementById('loading');
const errorNode=document.getElementById('error');
const error=(msg)=>{console.error(msg);errorNode.textContent='Graphics preview: '+msg;errorNode.style.display='block';loading.classList.add('off')};
const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
if(!gl){error('WebGL 2 is unavailable. Enable hardware acceleration or try a recent Firefox/Chrome browser.');return;}
const rendererExtension=gl.getExtension('WEBGL_debug_renderer_info');
const rendererName=rendererExtension?gl.getParameter(rendererExtension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
const softwareRenderer=/swiftshader|llvmpipe|software rasterizer/i.test(rendererName||'');
const clamp=(a,b,c)=>Math.max(b,Math.min(c,a)), mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const v3=(x,y,z)=>[x,y,z], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=(a)=>{let s=Math.hypot(...a)||1;return a.map(x=>x/s)};
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}};
const rand=rng(201126), jitter=(amount)=> (rand()-.5)*amount;
const colors={grass:[.20,.33,.20],darkGrass:[.10,.26,.18],sand:[.62,.52,.38],stone:[.48,.49,.47],paleStone:[.66,.66,.57],road:[.51,.50,.44],rock:[.38,.44,.43],wood:[.32,.23,.16],timber:[.25,.18,.13],plaster:[.78,.70,.54],roof:[.43,.22,.20],deepRoof:[.22,.31,.36],slate:[.34,.38,.41],leaf:[.22,.43,.25],lightLeaf:[.38,.55,.27],redLeaf:[.64,.37,.24],gold:[.91,.66,.30],water:[.21,.54,.64],linen:[.86,.72,.47],cloth:[.20,.36,.36],skin:[.72,.49,.33],leather:[.29,.20,.17],iron:[.27,.34,.35],glass:[.71,.84,.85]};
function tint(col,t){return [col[0]*t,col[1]*t,col[2]*t]}
function terrain(x,z){
 const wav=Math.sin(x*.18+Math.cos(z*.12)*1.9)*.42+Math.sin(z*.23-x*.09)*.27+Math.sin(x*.61+z*.29)*.12;
 const shore=smooth(10,23,z+Math.sin(x*.16)*2.6+Math.sin(x*.49)*.55);
 const hills=smooth(-12,-35,z)*3.0; // inverted smooth intentionally works as a descending range
 const mountain=(cx,cz,sx,sz,h)=>h*Math.exp(-(((x-cx)/sx)**2)-(((z-cz)/sz)**2));
 const high=mountain(-46,-58,17,21,23)+mountain(-12,-62,19,20,16)+mountain(29,-59,19,23,26)+mountain(64,-60,17,23,20);
 return 2.5+wav*(.35+smooth(-14,-43,z)*2.6)+hills+high-shore*6.6;
}
class Geometry {
 constructor(){this.a=[];this.count=0;}
 vertex(p,n,c,k){this.a.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],k);this.count++}
 tri(a,b,c,col,k=0){let n=norm(cross(sub(b,a),sub(c,a)));this.vertex(a,n,col,k);this.vertex(b,n,col,k);this.vertex(c,n,col,k)}
 triN(a,b,c,na,nb,nc,col,k=0){this.vertex(a,na,col,k);this.vertex(b,nb,col,k);this.vertex(c,nc,col,k)}
 quad(a,b,c,d,col,k=0){this.tri(a,b,c,col,k);this.tri(a,c,d,col,k)}
 box(x,y,z,w,h,d,col,k=0){let x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],col,k);
  this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],tint(col,.92),k);
  this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],tint(col,.87),k);
  this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],tint(col,1.05),k);
  this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],tint(col,1.12),k);
  this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],col,k);
 }
 cylinder(x,y,z,r0,r1,h,col,k=0,sides=9){for(let j=0;j<sides;j++){let a=j*2*Math.PI/sides,b=(j+1)*2*Math.PI/sides;let p=[x+Math.cos(a)*r0,y,z+Math.sin(a)*r0],q=[x+Math.cos(b)*r0,y,z+Math.sin(b)*r0],u=[x+Math.cos(a)*r1,y+h,z+Math.sin(a)*r1],v=[x+Math.cos(b)*r1,y+h,z+Math.sin(b)*r1];this.quad(p,q,v,u,tint(col,.90+.18*Math.cos(a+.5)),k);this.tri([x,y+h,z],u,v,col,k)}}
 ellipsoid(x,y,z,rx,ry,rz,col,k=0,rows=6,cols=9){for(let i=0;i<rows;i++){let t0=Math.PI*i/rows,t1=Math.PI*(i+1)/rows;for(let j=0;j<cols;j++){let p0=j*2*Math.PI/cols,p1=(j+1)*2*Math.PI/cols;
  const get=(t,p)=>[x+rx*Math.sin(t)*Math.cos(p),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(p)];
  const N=(q)=>norm([(q[0]-x)/rx**2,(q[1]-y)/ry**2,(q[2]-z)/rz**2]);
  let a=get(t0,p0),b=get(t1,p0),c=get(t1,p1),d=get(t0,p1);let shade=.91+.17*Math.sin(j*13.7+i*3.2);let color=tint(col,shade);
  this.triN(a,b,c,N(a),N(b),N(c),color,k);this.triN(a,c,d,N(a),N(c),N(d),color,k);
 }}}
 beam(a,b,r,col,k=2,sides=6){let dir=norm(sub(b,a));let axis=Math.abs(dir[1])>.92?[1,0,0]:[0,1,0];let u=norm(cross(dir,axis)),w=norm(cross(dir,u));let p=(v,t)=>[v[0]+r*(u[0]*Math.cos(t)+w[0]*Math.sin(t)),v[1]+r*(u[1]*Math.cos(t)+w[1]*Math.sin(t)),v[2]+r*(u[2]*Math.cos(t)+w[2]*Math.sin(t))];for(let j=0;j<sides;j++){let t=j*Math.PI*2/sides,q=(j+1)*Math.PI*2/sides;this.quad(p(a,t),p(a,q),p(b,q),p(b,t),tint(col,.88+.17*Math.sin(t)),k)}}
}
function groundNormal(x,z){return norm([terrain(x-.2,z)-terrain(x+.2,z),.4,terrain(x,z-.2)-terrain(x,z+.2)])}
const world=new Geometry();
// Terrain biome blending happens at each vertex, not once per terrain tile.
// This avoids hard triangles at beach/grass/rock boundaries and supports real materials.
function terrainColor(x,z,normal){
 const y=terrain(x,z);
 const beach=1-smooth(.65,2.65,y);
 const cliff=clamp((.86-normal[1])*1.85,0,1)*smooth(6.5,15,y);
 const high=smooth(14,29,y)*.48;
 const stone=clamp(Math.max(cliff,high)*(1-beach),0,.85);
 const grass=colors.grass,sand=colors.sand,rock=colors.rock;
 const variation=.92+.05*Math.sin(x*.53+Math.cos(z*.46))+.035*Math.sin(z*.31-x*.27);
 return [0,1,2].map(i=>(mix(mix(grass[i],sand[i],beach),rock[i],stone))*variation);
}
const NX=127,NZ=129,XMIN=-95,XMAX=95,ZMIN=-97,ZMAX=76;
for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){
 const x=mix(XMIN,XMAX,i/(NX-1)),x2=mix(XMIN,XMAX,(i+1)/(NX-1));
 const z=mix(ZMIN,ZMAX,j/(NZ-1)),z2=mix(ZMIN,ZMAX,(j+1)/(NZ-1));
 const a=[x,terrain(x,z),z],b=[x2,terrain(x2,z),z],c=[x2,terrain(x2,z2),z2],d=[x,terrain(x,z2),z2];
 const na=groundNormal(x,z),nb=groundNormal(x2,z),nc=groundNormal(x2,z2),nd=groundNormal(x,z2);
 const emit=(p,n)=>world.vertex(p,n,terrainColor(p[0],p[2],n),0);
 emit(a,na);emit(b,nb);emit(c,nc);emit(a,na);emit(c,nc);emit(d,nd);
}
// Long winding cobblestone paths, made of individually varied, uneven stones.
function stonesAlong(ax,az,bx,bz,count,width=3){
 const dx=bx-ax,dz=bz-az,dist=Math.hypot(dx,dz),ux=dx/dist,uz=dz/dist,sideX=-uz,sideZ=ux;
 let steps=count*2,stepLength=dist/steps;
 for(let n=0;n<steps;n++){
  const t=(n+.5)/steps,cx=mix(ax,bx,t),cz=mix(az,bz,t);
  for(let row=-3;row<=3;row++){
   const offset=(row+(n%2)*.12)*(width/7.5),j=jitter(.035),lx=cx+sideX*offset+ux*j,lz=cz+sideZ*offset+uz*j;
   const side=(width/7.6)*(.40+rand()*.07),half=stepLength*(.35+rand()*.07);
   const corners=[[-half,-side*.65],[-half,side*.62],[-half*.79,side],[half*.76,side],[half,side*.70],[half,-side*.68],[half*.78,-side],[-half*.76,-side]];
   const stoneHeight=.037+rand()*.041;
   const vertices=corners.map(([forward,across])=>{
     const xx=lx+ux*forward+sideX*across,zz=lz+uz*forward+sideZ*across;
     return [xx,terrain(xx,zz)+.062+stoneHeight,zz];
   });
   const center=[lx,terrain(lx,lz)+.067+stoneHeight,lz];
   const shade=.77+rand()*.31;
   const stoneColor=tint(colors.stone,shade);
   for(let k=0;k<vertices.length;k++){
    const next=(k+1)%vertices.length,v=vertices[k],w=vertices[next];
    world.tri(center,v,w,stoneColor,1);
    const footV=[v[0],v[1]-stoneHeight,v[2]],footW=[w[0],w[1]-stoneHeight,w[2]];
    world.quad(w,v,footV,footW,tint(stoneColor,.73),1);
   }
   if(rand()<.09){const crack=rand()*Math.PI*2;
    world.beam([lx-Math.cos(crack)*half*.27,center[1]+.003,lz-Math.sin(crack)*side*.25],
      [lx+Math.cos(crack)*half*.27,center[1]+.003,lz+Math.sin(crack)*side*.25],
      .008,tint(colors.rock,.63),1,3);
   }
  }
 }
}
stonesAlong(0,10,0,-13,28,4.0);stonesAlong(-1,-3,-15,-6,18,3.0);stonesAlong(2,-4,13,-4,18,3.2);stonesAlong(0,2,11,17,24,3.3);stonesAlong(-3,-11,4,-23,18,2.7);
function plaza(cx,cz,r){for(let n=0;n<175;n++){let theta=rand()*Math.PI*2,rr=Math.sqrt(rand())*r,x=cx+Math.cos(theta)*rr,z=cz+Math.sin(theta)*rr,y=terrain(x,z)+.045;world.box(x,y,z,.60+rand()*.66,.03,.55+rand()*.5,tint(colors.paleStone,.72+rand()*.4),1)}}
plaza(-6,-4,4.4);
// Landscape rocks are clustered rather than distributed on an obvious grid.
function rock(x,z,r){let y=terrain(x,z)-.05;world.ellipsoid(x,y+r*.42,z,r,.75*r,r*.82,tint(colors.rock,.75+rand()*.48),1,4,7);if(r>.75)world.ellipsoid(x+r*.52,y+r*.20,z-r*.18,r*.46,.35*r,.43*r,tint(colors.stone,.78+rand()*.25),1,4,6)}
for(let i=0;i<155;i++){let x=mix(-83,83,rand()),z=mix(-85,40,rand());if(Math.hypot(x,z-3)<12 || (x>-17&&x<24&&z>-18&&z<13))continue;rock(x,z,.25+rand()*1.45)}
// Trees: branching trunks, multiple canopy lobes, tonal variation and occasional flowers.
function tree(x,z,scale=1,style=0){
 let y=terrain(x,z),trunk=(3.5+rand()*.6)*scale;
 let co=style===2?colors.redLeaf:style===1?colors.lightLeaf:colors.leaf;
 const base=[x,y-.1,z],crown=[x+jitter(.25)*scale,y+trunk,z+jitter(.25)*scale];
 world.cylinder(x,y-.13,z,.34*scale,.20*scale,trunk,colors.wood,2,11);
 // Root flare and visible branch architecture, rather than a floating green sphere.
 for(let i=0;i<5;i++){let a=i*Math.PI*2/5+.3;world.beam([x,y+.36*scale,z],[x+Math.cos(a)*.58*scale,y+.04*scale,z+Math.sin(a)*.58*scale],.085*scale,colors.wood,2,5)}
 const canopy=[];
 for(let i=0;i<9;i++){
  let a=i*2.399+rand()*.65,r=(1.0+rand()*.99)*scale,high=(.57+rand()*.77)*scale;
  let tip=[x+Math.cos(a)*r,y+trunk+high,z+Math.sin(a)*r];
  const pivot=[x+.22*Math.cos(a)*scale,y+trunk*.74,z+.22*Math.sin(a)*scale];
  world.beam(pivot,tip,(.065+rand()*.04)*scale,tint(colors.wood,.80+rand()*.24),2,6);
  canopy.push(tip);
  for(let j=0;j<2;j++){
   let dir=a+j*.98,rr=(.5+rand()*.47)*scale;
   let sprig=[tip[0]+Math.cos(dir)*rr,tip[1]+jitter(.53)*scale,tip[2]+Math.sin(dir)*rr];
   world.beam(tip,sprig,.029*scale,colors.wood,2,4);
   canopy.push(sprig);
  }
 }
 // Leaf meshes have irregular silhouettes, two-sided orientation and translucent-looking edges.
 for(let tip of canopy){
  let cluster=5+Math.floor(rand()*4);
  for(let j=0;j<cluster;j++){
   let phi=rand()*Math.PI*2,rad=Math.sqrt(rand())*.67*scale,px=tip[0]+Math.cos(phi)*rad,pz=tip[2]+Math.sin(phi)*rad,py=tip[1]+jitter(.95)*scale;
   let leafScale=(.22+rand()*.23)*scale,twist=rand()*Math.PI*2;
   let normal=norm([Math.cos(twist),.52+rand()*.6,Math.sin(twist)]),side=norm(cross(normal,[0,1,0]));
   let tipA=[px+side[0]*leafScale,py+leafScale*.25,pz+side[2]*leafScale];
   let tipB=[px-side[0]*leafScale,py+leafScale*.22,pz-side[2]*leafScale];
   let point=[px+normal[0]*leafScale*.32,py+leafScale*(.8+rand()*.4),pz+normal[2]*leafScale*.32];
   let col=tint(co,.72+rand()*.58);world.tri([px,py-.08*scale,pz],tipA,point,col,3);world.tri([px,py-.08*scale,pz],point,tipB,col,3);
  }
 }
}
function spruce(x,z,scale=1){
 let y=terrain(x,z),h=(4.8+rand()*2.4)*scale;
 world.cylinder(x,y,z,.24*scale,.085*scale,h,colors.wood,2,7);
 for(let tier=0;tier<5;tier++){
  let t=tier/5,yy=y+h*(.24+.69*t),width=(1.28-t*.98)*scale;
  for(let a=0;a<7;a++){
   let ang=(a+tier*.34)*Math.PI*2/7,sx=Math.cos(ang),sz=Math.sin(ang),end=[x+sx*width,yy-.36*scale,z+sz*width];
   world.beam([x,yy+.23*scale,z],end,.038*scale,colors.wood,2,4);
   let col=tint(tier%3===0?colors.darkGrass:colors.leaf,.61+rand()*.30);
   for(let r=0;r<2;r++){
    let tt=(r+.6)/2,px=mix(x,end[0],tt),pz=mix(z,end[2],tt),py=mix(yy+.23*scale,end[1],tt);
    world.tri([px-sz*.18*scale,py-.09*scale,pz+sx*.18*scale],[px+sz*.18*scale,py-.09*scale,pz-sx*.18*scale],[px+sx*.25*scale,py+.27*scale,pz+sz*.25*scale],col,3);
   }
  }
 }
}
// A dense, varied forest breaks up the previously bare distant hillside.
for(let i=0;i<96;i++){
 let x=-76+rand()*152,z=-76+rand()*44;
 if(z>-46 && Math.abs(x)<24)continue;
 let yy=terrain(x,z);if(yy<4||yy>31)continue;
 spruce(x,z,.55+rand()*1.14);
}
for(let i=0;i<35;i++){let x=-22-rand()*42,z=-29+rand()*54;if(Math.hypot(x+8,z+5)<10)continue;tree(x,z,.63+rand()*.78,i%11===0?2:i%5===0?1:0)}
for(let i=0;i<26;i++){let x=22+rand()*50,z=-42+rand()*42;if(Math.hypot(x-20,z+10)<12)continue;tree(x,z,.8+rand()*.9,i%9===0?2:0)}
for(let [x,z,s,kind] of [[-15,0,1.15,1],[-20,6,1.10,0],[12,6,1.10,1],[22,-8,1.35,0],[-12,-19,1.4,2],[8,-19,1.15,1],[25,13,1.15,0]])tree(x,z,s,kind);
// Individual grass tufts and flowers, concentrated away from paving.
for(let i=0;i<3400;i++){let x=-75+rand()*150,z=-65+rand()*94;if(x>-17&&x<20&&z>-18&&z<12)continue;let y=terrain(x,z);if(y<.45||y>17)continue;let s=.14+rand()*.26,c=rand()>.6?colors.lightLeaf:colors.darkGrass;
 for(let k=0;k<2;k++){let dx=Math.cos(k*1.5+rand()*.4)*s,dz=Math.sin(k*1.8+rand()*.4)*s;world.tri([x-dx,y,z-dz],[x+dx,y,z+dz],[x+jitter(.2),y+s*(2+rand()),z+jitter(.2)],tint(c,.80+rand()*.55),3)}
 if(i%18===0){world.beam([x,y,z],[x,y+.43,z],.018,colors.leaf,3,4);world.ellipsoid(x,y+.47,z,.10,.10,.10,i%36===0?colors.gold:colors.linen,8,3,5)}
}
// Human-scale vegetation is sparse around the town path, thickens naturally at its edges.
for(let i=0;i<950;i++){
 let x=-28+rand()*60,z=-27+rand()*49;
 const inTown=x>-19&&x<23&&z>-19&&z<14,nearRoad=(Math.abs(x)<2.5&&z>-15&&z<15),nearHouses=(x>-19&&x<23&&z>-25&&z<-8);
 if(nearRoad||nearHouses||inTown&&rand()>.40)continue;
 const y=terrain(x,z)+.026;if(y<.3||y>13)continue;
 const a=rand()*6.283,s=.10+rand()*.25;
 const grow=[x,y,z],top=[x+Math.cos(a)*s*.32,y+s*(2.1+rand()),z+Math.sin(a)*s*.32];
 world.beam(grow,top,.015,colors.darkGrass,3,4);
 for(let j=0;j<4;j++){
  const p=a+j*1.57,r=(.25+rand()*.8)*s;
  world.tri([x,y,z],[x+Math.cos(p)*r,y+.23*s,z+Math.sin(p)*r],[x+Math.cos(p+.35)*r*.63,y+s*(1.1+rand()),z+Math.sin(p+.35)*r*.63],tint(j%2?colors.lightLeaf:colors.leaf,.78+rand()*.33),3);
 }
 if(i%11===0){world.ellipsoid(top[0],top[1]+.04,top[2],.065,.09,.072,i%3===0?colors.gold:colors.linen,8,4,6)}
}
// Wind-blown shore pebbles, naturally varied in clustering rather than even scattering.
for(let i=0;i<130;i++){
 const x=-37+rand()*80,z=11+rand()*27,y=terrain(x,z);
 if(y<-.4||y>2.5)continue;
 world.ellipsoid(x,y+.035,z,.06+rand()*.20,.025+rand()*.08,.06+rand()*.17,tint(i%3?colors.stone:colors.sand,.75+rand()*.39),1,4,7);
}
// Village houses. Rich silhouettes, paired windows, stone foundations, timber frames, and tiled gables.
function house(x,z,w,d,h,roofColor=colors.roof,angle=0){let y=terrain(x,z)+.04;
 world.box(x,y,z,w+.45,.58,d+.45,colors.stone,1);world.box(x,y+.56,z,w,h-.4,d,colors.plaster,4);
 let yTop=y+h+.15,left=x-w*.55,right=x+w*.55,ridge=yTop+h*.38,front=z+d*.58,back=z-d*.58;
 world.quad([left,yTop,front],[x,ridge,front],[x,ridge,back],[left,yTop,back],roofColor,5);
 world.quad([x,ridge,front],[right,yTop,front],[right,yTop,back],[x,ridge,back],tint(roofColor,.80),5);
 // Individually lapped shingles add a readable 2026-material detail at walking height.
 for(let side of [-1,1])for(let row=0;row<9;row++){let t0=row/9,t1=(row+1)/9;let steps=Math.ceil(d/.48);for(let col=0;col<steps;col++){
  let z0=back+(front-back)*(col/steps),z1=back+(front-back)*((col+1)/steps),
    x0=mix(x,x+side*w*.55,t0),x1=mix(x,x+side*w*.55,t1),
    y0=mix(ridge,yTop,t0)+.035+row*.005,y1=mix(ridge,yTop,t1)+.04+row*.005;
  let shade=.78+rand()*.32+(row%2)*.045,cc=tint(roofColor,shade);
  world.quad([x0,y0,z0],[x0,y0,z1],[x1,y1,z1],[x1,y1,z0],cc,5);
 }}
 world.tri([left,yTop,front],[right,yTop,front],[x,ridge,front],colors.plaster,4);
 world.tri([right,yTop,back],[left,yTop,back],[x,ridge,back],tint(colors.plaster,.93),4);
 world.beam([left,yTop,front],[x,ridge,front],.10,colors.wood);world.beam([x,ridge,front],[right,yTop,front],.10,colors.wood);
 for(let n=0;n<Math.ceil(w/1.2);n++){let tx=mix(left+.15,right-.15,n/Math.max(1,Math.ceil(w/1.2)-1));world.beam([tx,y+.65,z+d*.505],[tx,yTop,z+d*.505],.065,colors.wood)}
 world.beam([left,yTop,front],[left,yTop,back],.13,colors.wood);world.beam([right,yTop,front],[right,yTop,back],.13,colors.wood);
 world.box(x,y+.55,z+d*.52,w*.25,h*.47,.14,colors.wood,2);world.box(x,y+.73,z+d*.605,w*.21,h*.37,.05,colors.leather,2);
 world.ellipsoid(x+w*.06,y+h*.44,z+d*.65,.07,.07,.06,colors.gold,6,4,5);
 for(let s of [-1,1]){let wx=x+s*w*.31,wy=y+h*.62,wz=z+d*.524;world.box(wx-.0,wy-.0,wz,w*.18,h*.24,.09,colors.wood,2);world.box(wx,wy+.015,wz+.066,w*.145,h*.18,.025,colors.gold,8);
 world.beam([wx,wy,wz+.09],[wx,wy+h*.18,wz+.09],.035,colors.wood);world.beam([wx-w*.07,wy+h*.09,wz+.09],[wx+w*.07,wy+h*.09,wz+.09],.035,colors.wood);
 world.box(wx,wy-.09,wz+.12,w*.24,.09,.24,colors.paleStone,1);
 for(let k=0;k<5;k++){let xx=wx-w*.12+.08+k*w*.058;let yy=wy-.07+.14*Math.sin(k*2.1);
 world.beam([xx,yy,wz+.16],[xx+.05,yy+.19,wz+.16],.025,colors.leaf,3,5);
 world.ellipsoid(xx+.06,yy+.20,wz+.18,.12,.09,.08,k%3===0?colors.redLeaf:colors.leaf,3,4,6);
 }}
 // Raised window sills, shutters and stepped door thresholds add a human scale.
 for(let side of [-1,1]){const wx=x+side*w*.31,wz=z+d*.585,wy=y+h*.62;
   world.box(wx+side*w*.13,wy,z+d*.545,w*.075,h*.26,.08,tint(colors.wood,.93),2);
   for(let k=0;k<3;k++){let yy=wy-h*.10+k*h*.067;
     world.beam([wx+side*w*.11,yy,wz],[wx+side*w*.15,yy,wz],.016,tint(colors.leather,.90),2,4)}
 }
 for(let k=0;k<3;k++)world.box(x,y+.57+k*.065,z+d*.56+(2-k)*.22,w*.36,.08,.43,tint(colors.stone,.88+k*.055),1);
 for(let k=0;k<8;k++){let sx=mix(x-w*.48,x+w*.48,(k+.5)/8);
   world.beam([sx,y+.61,z+d*.519],[sx,y+.75,z+d*.519],.014,tint(colors.rock,.55),1,4)}
 // chimney and roof ridge details
 world.box(x+w*.25,y+h*.96,z-d*.15,.48,1.32,.56,colors.stone,1);world.box(x+w*.25,y+h*1.25,z-d*.15,.60,.18,.69,colors.rock,1);
 for(let k=0;k<4;k++){let q=mix(back+.24,front-.24,(k+.5)/4);world.beam([left,yTop+.04,q],[x,ridge+.04,q],.024,tint(roofColor,.64),5);world.beam([x,ridge+.04,q],[right,yTop+.04,q],.024,tint(roofColor,.64),5)}
}
house(-13,-12,5.7,5.5,4.5);house(-5,-17,5.0,4.8,4.3,colors.deepRoof);house(5,-15,5.4,6.6,5.0);house(16,-10,7.0,6.0,4.8,colors.deepRoof);house(-18,-2,5.8,5.5,4.9);house(18,3,5.4,5.3,4.1);house(7,-25,7.4,5.5,5.1);
// Castle lookout in the northeastern hills.
function tower(x,z){let y=terrain(x,z),r=3.1;world.cylinder(x,y,z,r*1.14,r,14.0,colors.stone,1,14);
 for(let i=0;i<11;i++){let a=i*2*Math.PI/11;world.box(x+Math.cos(a)*r,y+13.7,z+Math.sin(a)*r,.85,1.25,.87,colors.paleStone,1)}
 world.cylinder(x,y+14.7,z,4.1,.23,5.7,colors.deepRoof,5,12);
 for(let j=0;j<4;j++){let a=j*Math.PI*.5+.25;world.box(x+Math.cos(a)*3.16,y+8.1,z+Math.sin(a)*3.16,.65,2.6,.34,colors.timber,2);world.box(x+Math.cos(a)*3.40,y+8.4,z+Math.sin(a)*3.40,.43,2.1,.13,colors.gold,8)}
 world.beam([x,y+20.5,z],[x,y+26,z],.12,colors.wood);world.quad([x,y+24.6,z],[x+2.2,y+24.1,z],[x+2.2,y+22.6,z],[x,y+23,z],colors.roof,5);
}
tower(31,-38);
// Glassmaker's Walk: stone portico with vines and hanging lamps.
function portico(){for(let i=0;i<5;i++){let z=4-i*2.65;for(let x of [-3.5,3.5]){
  let y=terrain(x,z);world.cylinder(x,y,z,.30,.28,4.0,colors.paleStone,1,8);world.box(x,y+3.7,z,.75,.38,.8,colors.stone,1);
  for(let k=0;k<6;k++){let yy=y+.3+k*.55,offset=.39*Math.sin(k*1.9+i);world.beam([x+.32*Math.sin(k),yy,z+offset],[x+.32*Math.sin(k+1),yy+.52,z+offset+.27],.035,colors.leaf,3)}
 }let y=Math.max(terrain(-3.5,z),terrain(3.5,z));world.beam([-3.5,y+4.12,z],[3.5,y+4.12,z],.23,colors.wood);
 for(let b=0;b<3;b++){let x=-2.5+b*2.5;world.beam([x,y+4.10,z],[x,y+3.17,z],.028,colors.iron,6);world.ellipsoid(x,y+3.12,z,.26,.33,.26,b===1?colors.gold:colors.glass,8,5,8)}
}}
portico();
// Fountain built from stacked carved stone and water bowls.
function fountain(x,z){let y=terrain(x,z)+.05;world.cylinder(x,y,z,3.3,3.3,.58,colors.paleStone,1,19);world.cylinder(x,y+.55,z,2.9,2.8,.14,colors.rock,1,19);
 world.cylinder(x,y+.62,z,2.5,2.5,.24,colors.water,8,19);world.cylinder(x,y+.74,z,.67,.56,2.1,colors.paleStone,1,13);world.cylinder(x,y+2.63,z,1.65,1.35,.33,colors.stone,1,17);
 world.cylinder(x,y+2.94,z,.25,.14,1.5,colors.paleStone,1,10);world.ellipsoid(x,y+4.53,z,.21,.38,.21,colors.gold,8,6,10);
 for(let i=0;i<8;i++){let a=i*Math.PI/4,x1=x+Math.cos(a)*1.15,z1=z+Math.sin(a)*1.15;world.beam([x1,y+2.87,z1],[x1+Math.cos(a)*.65,y+1.7,z1+Math.sin(a)*.65],.034,colors.glass,8,5)}
}
fountain(-7,-4);
// Workshop tools, fence rails, crates, cobbled flower boxes.
function workshop(){let x=13,z=-7,y=terrain(x,z);world.box(x,y+.2,z+3.0,4.0,.28,1.2,colors.wood,2);
 for(let dx of [-1.6,1.6])world.box(x+dx,y-.05,z+3.0,.20,2.0,.2,colors.wood,2);
 world.box(x-1.1,y+2.0,z+2.85,.6,.4,.25,colors.iron,6);world.box(x+.6,y+2.0,z+2.85,.74,.35,.3,colors.gold,6);
 for(let j=0;j<6;j++)world.box(x-3.2+j*.56,y,z+4.8,.38,.43,.38,tint(colors.wood,.77+rand()*.2),2);
}
workshop();
// Market stalls: roofs with contrasting handwoven colors and suspending pennants.
function market(x,z,col){let y=terrain(x,z)+.08;for(let s of [-1,1])for(let d of [-1,1])world.beam([x+s*2,y,z+d*1.45],[x+s*2,y+2.65,z+d*1.45],.13,colors.wood);
 world.quad([x-2.24,y+2.85,z-1.75],[x+2.24,y+2.85,z-1.75],[x+2.24,y+2.45,z+1.75],[x-2.24,y+2.45,z+1.75],col,5);
 for(let i=0;i<5;i++){let xx=x-1.85+i*.9;world.beam([xx,y+2.83,z-1.68],[xx,y+2.46,z+1.68],.035,colors.linen)}
 world.box(x,y+.65,z,3.6,.23,1.4,colors.wood,2);for(let j=0;j<9;j++){let xx=x-1.45+(j%5)*.72,zz=z+(j>4?.30:-.30);world.ellipsoid(xx,y+.99,zz,.22,.25,.23,j%3===0?colors.gold: j%2?colors.leaf:colors.redLeaf,3,4,6)}
}
market(-12,5,colors.redLeaf);market(-3,-12,colors.deepRoof);
function fences(ax,az,bx,bz,posts=10){let dx=(bx-ax)/posts,dz=(bz-az)/posts;for(let i=0;i<=posts;i++){let x=ax+i*dx,z=az+i*dz,y=terrain(x,z);world.beam([x,y,z],[x,y+1.3,z],.105,colors.wood)}for(let i=0;i<posts;i++)for(let high of [.55,1.10]){let x=ax+i*dx,z=az+i*dz,nx=x+dx,nz=z+dz;world.beam([x,terrain(x,z)+high,z],[nx,terrain(nx,nz)+high,nz],.055,colors.wood)}}
fences(-23,8,-23,-15,12);fences(24,10,24,-7,9);fences(-18,17,-6,17,8);
// Harbor pier, pillars, ropes and floating lanterns.
function pier(){let x=11.5;for(let i=0;i<24;i++){let z=13+i*.82,y=.85;world.box(x,y,z,5.8,.19,.72,tint(colors.wood,.77+rand()*.3),2);if(i%3===0){for(let side of [-1,1]){let xx=x+side*2.65;world.cylinder(xx,-2.8,z,.2,.24,4.7,colors.wood,2,7);if(i%6===0)world.box(xx,1.7,z,.35,.25,.35,colors.gold,8)}}}
 for(let side of [-1,1])for(let i=0;i<7;i++){let z=13+i*2.7;world.beam([x+side*2.85,1.9,z],[x+side*2.85,1.9,z+2.4],.025,colors.linen,2)}
 world.box(x,1.05,30.0,2.0,.55,1.3,colors.wood,2);world.cylinder(x,1.7,30,.52,.56,.30,colors.iron,6,8);
}
pier();
// Far offshore stone arch and sea stacks, exposed near a winding surf line.
function seaArch(){let y=-1.5;for(let [x,z,s] of [[40,32,1.0],[51,37,.87],[29,40,.67]]){
 world.cylinder(x,y,z,2.5*s,2.05*s,9*s,colors.rock,1,9);
 world.ellipsoid(x,y+8.1*s,z,3.0*s,2.3*s,2.3*s,colors.stone,1,5,8);
 }for(let n=0;n<9;n++){let t=n/8,a=Math.PI*(1-t),x=40+11*t,z=32+5*t,h=10.3+Math.sin(a)*7.2;world.ellipsoid(x,h-2,z,1.55,2.0,1.9,tint(colors.rock,.75+rand()*.35),1,5,7)}
}
seaArch();
// Warm light sources and suspended ornaments between street corners.
function lantern(x,z,lit=1){let y=terrain(x,z);world.cylinder(x,y,z,.18,.13,3.5,colors.wood,2,6);world.beam([x,y+3.38,z],[x+.72,y+3.38,z],.07,colors.wood,2);world.beam([x+.72,y+3.38,z],[x+.72,y+2.85,z],.035,colors.iron,6);world.ellipsoid(x+.72,y+2.72,z,.30,.37,.30,colors.gold,8,6,7)}
for(let [x,z] of [[-4,8],[4,8],[-9,-11],[3,-10],[7,-2],[18,7],[10,12],[13,20],[-17,10]])lantern(x,z);
// Color accents: banners, potted shrubs, garden beds and glass floats.
for(let [x,z] of [[-11,-1],[-15,-1],[6,-12],[9,-11],[18,-6],[-19,4]]){let y=terrain(x,z);world.cylinder(x,y,z,.57,.46,.65,colors.stone,1,8);world.ellipsoid(x,y+.95,z,.9,.94,.85,x<-10?colors.lightLeaf:colors.leaf,3,6,9);for(let k=0;k<5;k++){let a=k*Math.PI*2/5;world.ellipsoid(x+Math.cos(a)*.45,y+1.3,z+Math.sin(a)*.45,.13,.14,.13,colors.redLeaf,8,4,6)}}
function viewMat(eye,target,up=[0,1,0]){let z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],-z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1]}
function projection(fov,aspect,near,far){let s=1/Math.tan(fov/2),a=1/(near-far);return [s/aspect,0,0,0,0,s,0,0,0,0,(far+near)*a,-1,0,0,2*far*near*a,0]}
function ortho(l,r,b,t,n,f){return [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]}
function mul(a,b){let o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=0;for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k]}return o}
// Self-contained 8-surface color + height atlas: grass, stone, wood, foliage,
// plaster, roof, metal and sand. Its alpha channel is used for geometric bump detail.
// Authored scanned textures can replace these slots without changing scene topology.
function makeMaterialAtlas(gl){
 const side=softwareRenderer?128:384,w=side*4,h=side*2,data=new Uint8Array(w*h*4);
 function hash2(x,y,seed){let v=Math.imul(x^seed,374761393)+Math.imul(y+seed,668265263);v=(v^(v>>>13))|0;v=Math.imul(v,1274126177);return ((v^(v>>>16))>>>0)/4294967295}
 function noise2(x,y,seed){let i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);let a=hash2(i,j,seed),b=hash2(i+1,j,seed),c=hash2(i,j+1,seed),d=hash2(i+1,j+1,seed);return mix(mix(a,b,fx),mix(c,d,fx),fy)}
 for(let k=0;k<8;k++)for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  let u=x/side,v=y/side,n=noise2(u*7,v*7,k*91+3),micro=noise2(u*49,v*49,k*83+4),fine=hash2(x,y,k*91+10);
  let rgb;
  if(k===0){let stripe=Math.abs(Math.sin(u*60+v*18));let t=.18+.53*n+.20*micro+.06*fine;rgb=[.28+.54*t,.27+.57*t,.18+.40*t];if(stripe>.92&&fine>.45)rgb=[.35,.37,.22]}
  if(k===1){let veining=Math.abs(Math.sin((u+v*.54)*24+n*4));let t=.24+.48*n+.16*micro+.08*fine;rgb=[t+.04,t+.032,t+.01];if(veining>.99)rgb=rgb.map(a=>a*.75)}
  if(k===2){let grain=.5+.5*Math.sin(u*64+v*2+n*5);let t=.16+.33*n+.32*grain+.10*micro;rgb=[t+.07,t+.02,t*.77]}
  if(k===3){let t=.13+.45*n+.33*micro+.09*fine;rgb=[t*.84,t+.12,t*.67]}
  if(k===4){let t=.54+.30*n+.14*micro;rgb=[t+.045,t+.028,t-.025]}
  if(k===5){let t=.24+.42*n+.23*micro+.11*fine;rgb=[t+.09,t*.80,t*.68]}
  if(k===6){let t=.33+.39*n+.16*micro;rgb=[t*.95,t,t+.07]}
  if(k===7){let t=.33+.40*n+.21*micro+.06*fine;rgb=[t+.08,t+.05,t-.04]}
  let ix=k%4*side+x,iy=Math.floor(k/4)*side+y,o=(iy*w+ix)*4;
  for(let c=0;c<3;c++)data[o+c]=Math.round(clamp(rgb[c],0,1)*255);
  data[o+3]=Math.round(clamp(.18+.52*n+.22*micro+.08*fine,0,1)*255);
 }
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.generateMipmap(gl.TEXTURE_2D);gl.bindTexture(gl.TEXTURE_2D,null);
 return tex;
}
// Height lookup for water lets foam and color follow the ACTUAL coastline.
// Built from the same terrain function as the land mesh, not a hardcoded z stripe.
function createCoastHeightmap(gl){
 const side=256,data=new Uint8Array(side*side);
 for(let row=0;row<side;row++)for(let col=0;col<side;col++){
  let x=mix(XMIN,XMAX,col/(side-1)),z=mix(ZMIN,ZMAX,row/(side-1));
  data[row*side+col]=Math.round(clamp((terrain(x,z)+8)/56,0,1)*255);
 }
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,side,side,0,gl.RED,gl.UNSIGNED_BYTE,data);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.bindTexture(gl.TEXTURE_2D,null);return t;
}
const VS=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPos;layout(location=1)in vec3 aNormal;layout(location=2)in vec3 aColor;layout(location=3)in float aKind;
uniform mat4 uVP;out vec3 vPos;out vec3 vNormal;out vec3 vColor;flat out int vKind;
void main(){vPos=aPos;vNormal=aNormal;vColor=aColor;vKind=int(aKind+.5);gl_Position=uVP*vec4(aPos,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec3 vPos;in vec3 vNormal;in vec3 vColor;flat in int vKind;
uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uFog;uniform float uTime;uniform sampler2D uShadow;uniform sampler2D uMaterialAtlas;uniform mat4 uLightVP;uniform float uShadowEnabled;uniform float uShadowMapSize;uniform float uLowQuality;
out vec4 frag;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float n=0.,a=.55;for(int i=0;i<3;i++){n+=a*noise(p);p=p*2.07+vec3(3.4,7.2,1.1);a*=.51;}return n;}
float shadow(vec3 n){if(uShadowEnabled<.5)return 1.;vec4 p=uLightVP*vec4(vPos+n*.04,1.);vec3 q=p.xyz/p.w*.5+.5;if(q.x<=.002||q.x>=.998||q.y<=.002||q.y>=.998||q.z>=1.)return 1.;
 float bias=max(.00019,.00125*(1.-max(dot(n,normalize(uSun)),0.)));float val=0.;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){vec2 offset=(vec2(float(i),float(j))+.24*vec2(sin(dot(vPos.xz,vec2(13.,7.))),cos(dot(vPos.xz,vec2(11.,17.)))))/uShadowMapSize;float depth=texture(uShadow,q.xy+offset).r;val+=q.z-bias<=depth?1.:0.;}
 return .33+.67*val/9.;}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
// UVs are derived in stable world coordinates. TextureGrad prevents mip seams
// when the tile coordinate wraps, while triplanar weights hide sharp transitions.
vec4 surfaceTile(vec2 local,float layer){
 vec2 tile=vec2(mod(layer,4.),floor(layer*.25));
 vec2 atlasUV=(tile+mix(vec2(.004),vec2(.996),fract(local)))*vec2(.25,.5);
 return textureGrad(uMaterialAtlas,atlasUV,dFdx(local)*vec2(.25,.5),dFdy(local)*vec2(.25,.5));
}
vec4 triplanar(vec3 position,vec3 n,float layer,float scale){
 vec3 weights=pow(abs(n),vec3(4.));weights/=max(weights.x+weights.y+weights.z,.001);
 return surfaceTile(position.yz*scale,layer)*weights.x+
        surfaceTile(position.xz*scale,layer)*weights.y+
        surfaceTile(position.xy*scale,layer)*weights.z;
}

void main(){vec3 N=normalize(vNormal);vec3 L=normalize(uSun);vec3 V=normalize(uEye-vPos);
 if(uLowQuality>.5){
  if(vKind>=13){frag=vec4(.025,.025,.025,vKind==13?.19:vKind==14?.12:.04);return;}
  vec3 base=pow(max(vColor,vec3(.001)),vec3(2.2));
  float direct=max(dot(N,L),0.);
  vec3 c=base*(vec3(.48,.55,.62)*( .68+.22*max(N.y,0.))+vec3(1.12,.84,.64)*direct*.99);
  if(vKind==8)c=base*2.9;
  float fog=1.-exp(-pow(length(uEye-vPos)*.0083,1.42));
  c=mix(c,pow(uFog,vec3(2.2)),fog*.69);
  c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);
  frag=vec4(pow(c,vec3(1./2.2)),1.);return;
 }
 float micro=fbm(vPos*4.1),macro=fbm(vPos*.83),roughness=.92,metallic=0.,transmission=0.;vec3 albedo=vColor;
 if(vKind==0){float grain=fbm(vPos*vec3(2.6,2.6,2.6));albedo*=mix(.57,1.23,grain);albedo=mix(albedo,vec3(.02,.08,.018),smoothstep(.71,.90,macro)*.35);roughness=.99;}
 if(vKind==1){float grit=fbm(vPos*6.);albedo*=mix(.68,1.25,grit);albedo*=mix(.91,1.06,macro);float cracks=pow(1.-abs(sin(vPos.x*2.9+vPos.z*2.3)),27.);albedo*=1.-cracks*.12;roughness=.96;}
 if(vKind==2){float rings=.5+.5*sin(vPos.y*17.+noise(vPos*3.)*3.+vPos.z*6.5);albedo*=mix(.66,1.22,rings*.55+.45*macro);roughness=.78;}
 if(vKind==3){albedo*=mix(.70,1.24,micro*.6+macro*.4);roughness=.84;transmission=.18;}
 if(vKind==4){albedo*=mix(.77,1.13,fbm(vPos*3.));roughness=.96;}
 if(vKind==5){albedo*=mix(.73,1.16,micro*.5+macro*.5);roughness=.85;}
 if(vKind==6){metallic=.65;roughness=.38;albedo*=.95;}
 if(vKind==7){albedo*=mix(.68,1.24,micro);roughness=.96;}
 if(vKind==9){albedo*=mix(.87,1.08,noise(vPos*17.));roughness=.95;}
 if(vKind==10){albedo*=mix(.92,1.06,micro);roughness=.69;}
 if(vKind==11){albedo*=mix(.78,1.21,noise(vPos*vec3(9.,24.,9.)));roughness=.64;}
 if(vKind==12){albedo*=mix(.71,1.16,fbm(vPos*9.));roughness=.73;}
 if(vKind>=13){frag=vec4(.035,.035,.034,vKind==13?.20:vKind==14?.13:.04);return;}
 // Actual triplanar color and height textures now influence all environment surfaces.
 // Height derivatives turn the atlas alpha into micro-normal relief (without mesh subdivision).
 if(vKind<=7){
  float layer=vKind==0?0.:vKind==1?1.:vKind==2?2.:vKind==3?3.:vKind==4?4.:vKind==5?5.:vKind==6?6.:7.;
  float scale=vKind==0?.62:vKind==1?.78:vKind==2?.32:vKind==3?1.2:vKind==4?.52:vKind==5?.60:vKind==6?1.1:1.22;
  vec4 surface=triplanar(vPos,N,layer,scale);
  if(vKind==0){
   float sandMix=1.-smoothstep(.70,2.80,vPos.y);
   float stoneMix=clamp((.84-N.y)*2.3,0.,.92)*smoothstep(5.,20.,vPos.y);
   surface=mix(surface,triplanar(vPos,N,7.,1.20),sandMix);
   surface=mix(surface,triplanar(vPos,N,1.,.72),stoneMix*(1.-sandMix));
  }
  albedo*=mix(vec3(1.),surface.rgb*1.80,.66);
  float ht=surface.a;
  vec3 sigmaX=dFdx(vPos),sigmaY=dFdy(vPos);
  vec3 R=cross(sigmaY,N),S=cross(N,sigmaX);
  float det=dot(sigmaX,R);
  float strength=vKind==1?.17:vKind==2?.13:vKind==3?.055:vKind==0?.11:.09;
  vec3 gradient=sign(det)*(dFdx(ht)*R+dFdy(ht)*S);
  if(abs(det)>.000001)N=normalize(abs(det)*N-gradient*strength);
  roughness=clamp(roughness+(ht-.5)*.12,.15,1.);
 }else{
  vec3 perturb=vec3(fbm(vPos*8.+vec3(.1,2.4,1.7))-.5,fbm(vPos*8.+vec3(1.7,3.9,.1))-.5,fbm(vPos*8.+vec3(4.1,.3,2.6))-.5);
  N=normalize(N+perturb*.036);
 }
 float nd=max(dot(N,L),0.),sh=shadow(N);
 float hemi=.43+.22*max(N.y,0.);vec3 skyFill=vec3(.69,.77,.88)*hemi*.82;
 vec3 sunLight=vec3(1.0,.82,.66)*nd*sh*1.18;
 vec3 bounce=vec3(.26,.21,.16)*(.3+.7*max(-N.y,0.));
 vec3 c=albedo*(skyFill+sunLight+bounce);
 vec3 H=normalize(L+V);float NdotH=max(dot(N,H),0.),NdotV=max(dot(N,V),.01);
 float shininess=mix(120.,9.,roughness*roughness);float spec=pow(NdotH,shininess)*sh;
 float F0=mix(.038,.35,metallic);float fresnel=F0+(1.-F0)*pow(1.-NdotV,5.);
 c+=vec3(1.,.82,.62)*spec*(.10+.38*(1.-roughness)+metallic*.32)*fresnel*3.;
 if(vKind==3)c+=albedo*vec3(.65,.45,.13)*transmission*pow(max(dot(-N,L),0.),2.);
 if(vKind==8){c=albedo*2.05+vec3(.40,.18,.035)*(.5+.5*sin(uTime*2.5+vPos.x*3.));}
 float dist=length(uEye-vPos);float heightFog=exp(-max(vPos.y,0.)*.052);float fog=1.-exp(-pow(dist*.0086,1.52)*(.68+.40*heightFog));
 c=mix(c,pow(uFog,vec3(2.2)),clamp(fog*.74,0.,.84));c=aces(c*.78);c=pow(c,vec3(1./2.20));frag=vec4(c,1.);
}`;
const SHADOW_VS=`#version 300 es
layout(location=0)in vec3 aPos;uniform mat4 uLightVP;void main(){gl_Position=uLightVP*vec4(aPos,1.);}`;
const SHADOW_FS=`#version 300 es
precision highp float;void main(){} `;
const SKY_VS=`#version 300 es
layout(location=0)in vec2 aPos;out vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,1.,1.);}`;
const SKY_FS=`#version 300 es
precision highp float;
in vec2 vUV;
uniform float uTime,uSkyAspect,uSkyFov;
uniform vec3 uSkyForward,uSkyRight,uSkyUp,uSkySun;
out vec4 frag;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float no(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fBm(vec2 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=a*no(p);p=p*2.13+vec2(5.6,3.2);a*=.53;}return v;}
void main(){
 vec2 xy=(vUV*2.-1.)*vec2(uSkyAspect,1.)*tan(uSkyFov*.5);
 vec3 ray=normalize(uSkyForward+uSkyRight*xy.x+uSkyUp*xy.y);
 float elevation=ray.y;
 vec3 horizon=vec3(.91,.70,.54),zenith=vec3(.19,.37,.54);
 vec3 c=mix(horizon,zenith,smoothstep(-.10,.78,elevation));
 c+=vec3(.14,.10,.08)*exp(-pow((elevation-.06)*5.,2.));
 float az=atan(ray.z,ray.x);
 vec2 cloudUV=vec2(az*3.8+uTime*.0014,elevation*6.8);
 float strata=fBm(cloudUV+vec2(no(cloudUV*1.6)*.38,.0));
 float cloud=smoothstep(.47,.67,strata)*smoothstep(.02,.23,elevation)*(1.-smoothstep(.81,.98,elevation));
 c=mix(c,vec3(.96,.87,.77),cloud*.66);
 float angle=max(dot(ray,normalize(uSkySun)),0.);
 float sunDisk=smoothstep(.9997,.99994,angle);
 float halo=pow(angle,240.)*.52+pow(angle,20.)*.18;
 c+=vec3(1.,.74,.43)*halo+vec3(1.,.84,.59)*sunDisk*.88;
 c=pow(clamp(c,0.,1.),vec3(.92));frag=vec4(c,1.);
}`;
const WATER_VS=`#version 300 es
precision highp float;layout(location=0)in vec3 aPos;uniform mat4 uVP;out vec3 vPos;void main(){vPos=aPos;gl_Position=uVP*vec4(aPos,1.);}`;
const WATER_FS=`#version 300 es
precision highp float;in vec3 vPos;uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uFog;uniform float uTime;uniform sampler2D uCoastHeight;out vec4 frag;
float hash(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float wave(vec2 p){float t=uTime;
 float warp=noise(p*.15+vec2(.03*t,-.01*t));p+=vec2(warp-.5,noise(p*.24+vec2(-.02*t,.04*t))-.5)*2.3;
 float a=sin(dot(p,vec2(.82,.57))+t*.76)*.10;
 float b=sin(dot(p,vec2(-.38,.93))-t*.62)*.085;
 float c=sin(dot(p,vec2(.32,-.48))+t*.36+sin(p.x*.21+p.y*.32))*.12;
 float d=sin(dot(p,vec2(.17,.29))+t*.29)*.21;
 return a+b+c+d;}
void main(){vec2 p=vPos.xz;
 float h=wave(p),dx=wave(p+vec2(.05,0.))-h,dz=wave(p+vec2(0.,.05))-h;
 vec3 N=normalize(vec3(-dx*7.,1.,-dz*7.));vec3 V=normalize(uEye-vPos),L=normalize(uSun),H=normalize(V+L);
 float fresnel=pow(1.-max(dot(N,V),0.),5.),spec=pow(max(dot(N,H),0.),135.)*1.3+pow(max(dot(N,H),0.),22.)*.12;
 vec3 deep=vec3(.035,.18,.23),surface=vec3(.13,.35,.42);
 float turbidity=noise(p*.19+vec2(uTime*.007));vec3 c=mix(deep,surface,.21+.65*turbidity);
 c=mix(c,vec3(.55,.70,.75),.18+fresnel*.62);
 c+=spec*vec3(1.,.82,.56);
 // Eddying foam patches are a noisy bounded field, not straight parallel bands.
 float warp=noise(p*.34+vec2(uTime*.07,-uTime*.04));
 float f=noise(p*.47+vec2(warp*2.,uTime*.085))*.65+noise(p*.89+vec2(-uTime*.04,uTime*.1))*.35;
 vec2 coastUV=(p-vec2(-95.,-97.))/vec2(190.,173.);
 float coastValid=step(0.,coastUV.x)*step(0.,coastUV.y)*step(coastUV.x,1.)*step(coastUV.y,1.);
 float height=texture(uCoastHeight,clamp(coastUV,.0,1.)).r*56.-8.;
 float waterDepth=max(0.,.035-height);
 float shallows=(1.-smoothstep(.15,3.20,waterDepth))*coastValid;
 c=mix(c,vec3(.23,.48,.42),shallows*.48);
 // Wave edge breaks on local seabed depth; coast foam follows every island inlet.
 float foam=smoothstep(.56,.77,f+sin(p.x*.13+p.y*.25+warp*3.+uTime*.4)*.07)*shallows;
 c=mix(c,vec3(.83,.86,.75),foam*.66);
 float dist=length(uEye-vPos),fog=1.-exp(-pow(dist*.0092,1.52));c=mix(c,uFog,clamp(fog,0.,.92));
 c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);frag=vec4(pow(c,vec3(1./2.16)),clamp(.94-shallows*.29,.56,.96));
}`;
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function program(v,f){let p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function geometryBuffer(geometry){let vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geometry.a),gl.STATIC_DRAW);for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,i===0||i===1||i===2?3:1,gl.FLOAT,false,40,[0,12,24,36][i])}gl.bindVertexArray(null);return {vao,buffer,count:geometry.count}}
let mainProgram,shadowProgram,skyProgram,waterProgram,staticGeo,dynamicGeo,waterGeo,fullscreen,depthTex,depthFbo,lightVP,materialAtlas,coastHeightmap;
try{
 mainProgram=program(VS,FS);materialAtlas=makeMaterialAtlas(gl);coastHeightmap=createCoastHeightmap(gl);shadowProgram=program(SHADOW_VS,SHADOW_FS);skyProgram=program(SKY_VS,SKY_FS);waterProgram=program(WATER_VS,WATER_FS);
 staticGeo=geometryBuffer(world);world.a=null;
 const water=new Geometry();water.quad([-155,.035,-155],[155,.035,-155],[155,.035,155],[-155,.035,155],colors.water,8);waterGeo=geometryBuffer(water);
 fullscreen=gl.createVertexArray();gl.bindVertexArray(fullscreen);let b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
 const S=softwareRenderer?512:window.matchMedia('(pointer:coarse)').matches?1024:2048;depthTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depthTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,S,S,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 depthFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,depthFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow map framebuffer could not be created');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 const shadowEye=[-65,80,56],focus=[0,4,-9];lightVP=mul(ortho(-113,113,-115,115,1,250),viewMat(shadowEye,focus));
 gl.viewport(0,0,S,S);gl.bindFramebuffer(gl.FRAMEBUFFER,depthFbo);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
 gl.useProgram(shadowProgram);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'uLightVP'),false,new Float32Array(lightVP));if(!softwareRenderer){gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count)}gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}catch(e){error(String(e));return}
const u=(p,name)=>gl.getUniformLocation(p,name);
const mainU={vp:u(mainProgram,'uVP'),eye:u(mainProgram,'uEye'),sun:u(mainProgram,'uSun'),fog:u(mainProgram,'uFog'),time:u(mainProgram,'uTime'),shadow:u(mainProgram,'uShadow'),materials:u(mainProgram,'uMaterialAtlas'),shadowSize:u(mainProgram,'uShadowMapSize'),lowQuality:u(mainProgram,'uLowQuality'),lvp:u(mainProgram,'uLightVP'),enabled:u(mainProgram,'uShadowEnabled')};
const waterU={vp:u(waterProgram,'uVP'),eye:u(waterProgram,'uEye'),sun:u(waterProgram,'uSun'),fog:u(waterProgram,'uFog'),time:u(waterProgram,'uTime'),coast:u(waterProgram,'uCoastHeight')};
const skyU={time:u(skyProgram,'uTime'),aspect:u(skyProgram,'uSkyAspect'),fov:u(skyProgram,'uSkyFov'),forward:u(skyProgram,'uSkyForward'),right:u(skyProgram,'uSkyRight'),up:u(skyProgram,'uSkyUp'),sun:u(skyProgram,'uSkySun')};
const sun=norm([-0.55,.70,.46]),fog=[.63,.70,.73];
const player={x:0,z:7,y:0,heading:0.16,phase:0,motion:0};let cameraYaw=0.16,cameraPitch=.27,cameraDist=10.9,drag=null,aimX=0,aimY=0,runTouch=false;
const key={};window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key))e.preventDefault();key[e.key.toLowerCase()]=true});window.addEventListener('keyup',e=>key[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{for(let k in key)key[k]=false;runTouch=false});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX<innerWidth*.25)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){cameraYaw+=(e.clientX-drag.x)*.006;cameraPitch=clamp(cameraPitch+(e.clientY-drag.y)*.0045,.08,.68);drag.x=e.clientX;drag.y=e.clientY}});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDist=clamp(cameraDist+Math.sign(e.deltaY)*1.0,5,18)},{passive:false});
const joy=document.getElementById('mobileControls'),stick=document.getElementById('stick');let joyID=null;function joyMove(e){if(e.pointerId!==joyID)return;let r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.max(1,Math.hypot(dx,dy)),s=Math.min(1,m/41);aimX=dx/m*s;aimY=-dy/m*s;stick.style.transform=`translate(${aimX*34}px,${-aimY*34}px)`}
joy.addEventListener('pointerdown',e=>{joyID=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});joy.addEventListener('pointermove',joyMove);const stopJoy=()=>{joyID=null;aimX=0;aimY=0;stick.style.transform='translate(0,0)'};joy.addEventListener('pointerup',stopJoy);joy.addEventListener('pointercancel',stopJoy);
const run=document.getElementById('runTouch');run.addEventListener('pointerdown',e=>{runTouch=true;run.setPointerCapture(e.pointerId)});run.addEventListener('pointerup',()=>runTouch=false);run.addEventListener('pointercancel',()=>runTouch=false);
// The pier is a real walkable surface, not merely scenery floating over the terrain.
function walkingHeight(x,z){
 const ground=terrain(x,z);
 return x>8.5&&x<14.5&&z>=12.7&&z<32.3?Math.max(ground,1.055):ground;
}
// Character reconstructed from original primitives, not a borrowed game character.
function character(t){
 const g=new Geometry(),x=player.x,z=player.z,y=walkingHeight(x,z)+.07,spin=player.heading;
 const s=Math.sin(player.phase)*player.motion;
 const bob=Math.abs(Math.sin(player.phase))*.055*player.motion;
 const point=(xx,yy,zz)=>[x+Math.cos(spin)*xx+Math.sin(spin)*zz,y+yy+bob,z-Math.sin(spin)*xx+Math.cos(spin)*zz];
 const oval=(xx,yy,zz,rx,ry,rz,col,k=9,rows=9,cols=13)=>{let p=point(xx,yy,zz);g.ellipsoid(...p,rx,ry,rz,col,k,rows,cols)};
 const bone=(a,b,r,col,k=9,n=9)=>g.beam(point(...a),point(...b),r,col,k,n);
 const fabric=[.23,.34,.42],hem=[.16,.24,.32],denim=[.19,.25,.30],skin=[.70,.47,.34],hair=[.20,.14,.12],sole=[.14,.13,.13];
 // Anatomically tapered trousers, rolling feet and knees at independent positions.
 for(let side of [-1,1]){
  const swing=side*s,hip=[side*.20,1.07,0],knee=[side*.22,.66,swing*.30],ankle=[side*.23,.18,-swing*.48];
  bone(hip,knee,.185,denim,9,11);bone(knee,ankle,.148,denim,9,11);
  oval(side*.23,.23,-swing*.48,.19,.20,.22,denim,9,7,11);
  oval(side*.23,.11,-swing*.48-.14,.21,.13,.34,sole,12,7,11);
  oval(side*.23,.15,-swing*.48-.20,.185,.09,.25,[.27,.24,.21],12,6,11);
  for(let i=0;i<3;i++){let cy=.35+i*.17;oval(side*.23,cy,-swing*.35,.147,.028,.153,tint(denim,.89+i*.07),9,4,10)}
 }
 // Torso and layered hoodie with a real collar, pocket, cuffs and soft cloth folds.
 oval(0,1.58,0,.425,.66,.26,fabric,9,11,15);
 oval(0,1.12,.025,.40,.15,.28,hem,9,7,13);
 oval(0,2.01,.05,.42,.19,.29,tint(fabric,.84),9,7,13);
 for(let side of [-1,1]){
  const sw=-side*s,shoulder=[side*.42,1.95,0],elbow=[side*.55,1.53,sw*.25],wrist=[side*.54,1.07,sw*.46];
  bone(shoulder,elbow,.18,fabric,9,11);bone(elbow,wrist,.15,fabric,9,11);
  oval(side*.54,1.07,sw*.46,.17,.10,.17,hem,9,6,10);
  oval(side*.54,1.00,sw*.48,.112,.14,.12,skin,10,8,10);
 }
 // Hood gathers behind the neck; drawcords are actual thin, dangling geometry.
 oval(0,2.11,.20,.36,.31,.25,tint(fabric,.81),9,8,13);
 oval(0,1.80,-.20,.20,.10,.12,tint(fabric,.91),9,6,11);
 for(let side of [-1,1]){
  const xCord=side*.115,gust=.018*Math.sin(t*3.1+side);
  bone([xCord,2.13,-.272],[xCord+gust,1.80,-.31],.018,[.75,.71,.60],12,6);
  oval(xCord+gust,1.78,-.31,.032,.025,.03,colors.gold,6,4,6);
 }
 // Front hand pocket with curved pouch seams.
 oval(0,1.38,-.265,.276,.158,.063,tint(fabric,.81),9,7,11);
 bone([-.23,1.40,-.302],[-.32,1.48,-.276],.012,tint(fabric,.58),9,5);
 bone([.23,1.40,-.302],[.32,1.48,-.276],.012,tint(fabric,.58),9,5);
 // Neck, ears and head silhouette with refined nose, brow and beard.
 bone([0,2.11,0],[0,2.43,0],.152,skin,10,10);
 oval(0,2.63,-.045,.31,.405,.29,skin,10,14,18);
 for(let side of [-1,1]){
  oval(side*.31,2.65,-.032,.075,.105,.072,skin,10,7,10);
  oval(side*.145,2.66,-.332,.079,.045,.026,[.25,.20,.17],11,6,9);
  oval(side*.146,2.66,-.355,.030,.026,.018,[.73,.62,.49],10,6,8);
  oval(side*.145,2.68,-.369,.013,.015,.009,[.07,.09,.10],11,5,7);
  // Brows don't cross the eyes or erase facial proportions.
  bone([side*.08,2.755,-.327],[side*.23,2.752,-.308],.023,hair,11,6);
 }
 oval(0,2.57,-.337,.073,.14,.092,tint(skin,1.08),10,9,12);
 oval(0,2.47,-.326,.12,.023,.045,[.34,.18,.16],10,5,9);
 // Hair follows the head, with irregular tufts and a subtle beard contour.
 oval(0,2.923,.045,.338,.179,.292,hair,11,10,16);
 oval(-.17,2.91,-.171,.174,.109,.17,hair,11,7,11);
 for(let i=0;i<13;i++){
  let a=i*Math.PI*2/13,r=.22+.06*(.5+.5*Math.sin(i*7.38)),tx=Math.cos(a)*r,tz=Math.sin(a)*r;
  oval(tx,2.973+Math.sin(a)*.022,tz,.083,.068,.11,tint(hair,.79+.21*(.5+.5*Math.sin(i*11.43))),11,5,9);
 }
 for(let side of [-1,1])oval(side*.21,2.477,-.204,.135,.117,.085,tint(hair,.98),11,6,10);
 oval(0,2.397,-.21,.209,.092,.127,hair,11,6,12);
 return g;
}
// Soft contact shadow: three fading concentric rings rendered into the scene depth.
function characterShadow(){
 const g=new Geometry(),n=24,xc=player.x,zc=player.z,center=[xc,walkingHeight(xc,zc)+.11,zc];
 const rings=[0,.25,.43,.64];
 for(let k=1;k<rings.length;k++){
  for(let i=0;i<n;i++){
   let a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
   const v=(r,t)=>{const xx=xc+Math.cos(t)*r,zz=zc+Math.sin(t)*r;return [xx,walkingHeight(xx,zz)+.11,zz]};
   const c0=v(rings[k-1],a),c1=v(rings[k-1],b),e0=v(rings[k],a),e1=v(rings[k],b);
   g.tri(c0,e0,e1,[.06,.07,.06],12+k);g.tri(c0,e1,c1,[.06,.07,.06],12+k);
  }
 }
 return g;
}
// One persistent VAO for character, replacing only its small dynamic data each frame.
dynamicGeo=geometryBuffer(character(0));gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);let dynamicByteCapacity=Math.ceil(dynamicGeo.count*40*1.6);gl.bufferData(gl.ARRAY_BUFFER,dynamicByteCapacity,gl.DYNAMIC_DRAW);
const shadowDecalGeo=geometryBuffer(characterShadow());let shadowByteCapacity=Math.ceil(shadowDecalGeo.count*40*1.4);
gl.bindBuffer(gl.ARRAY_BUFFER,shadowDecalGeo.buffer);gl.bufferData(gl.ARRAY_BUFFER,shadowByteCapacity,gl.DYNAMIC_DRAW);
let last=0,elapsed=0,frames=0,phase=0;
function frame(now){let dt=last?Math.max(0,Math.min(.045,(now-last)/1000)):0;last=now;elapsed+=dt;
 let dx=(key.d||key.arrowright?1:0)-(key.a||key.arrowleft?1:0)+aimX,forward=(key.w||key.arrowup?1:0)-(key.s||key.arrowdown?1:0)+aimY;
 let len=Math.hypot(dx,forward);if(len>1){dx/=len;forward/=len;len=1}
 let moving=len>.04,fast=key.shift||runTouch,speed=fast?7.5:4.0;
 if(moving){let wx=dx*Math.cos(cameraYaw)-forward*Math.sin(cameraYaw),wz=-dx*Math.sin(cameraYaw)-forward*Math.cos(cameraYaw);
 player.x=clamp(player.x+wx*dt*speed*len,-85,85);player.z=clamp(player.z+wz*dt*speed*len,-86,68);
 // Avoid advancing into deep water while retaining pier access.
 if(terrain(player.x,player.z)<.18&&!(player.x>8&&player.x<15&&player.z<33)){player.x-=wx*dt*speed*len;player.z-=wz*dt*speed*len}
 let target=Math.atan2(-wx,-wz),diff=Math.atan2(Math.sin(target-player.heading),Math.cos(target-player.heading));player.heading+=diff*Math.min(1,dt*12);
 player.phase+=dt*(fast?13.2:9.0)*len;
 }
 player.motion=mix(player.motion,moving?1:0,Math.min(1,dt*8));
 const x=player.x,z=player.z,y=walkingHeight(x,z),eye=[x+Math.sin(cameraYaw)*cameraDist*Math.cos(cameraPitch),y+2.0+cameraDist*Math.sin(cameraPitch),z+Math.cos(cameraYaw)*cameraDist*Math.cos(cameraPitch)];
 const target=[x,y+1.7,z],view=viewMat(eye,target),vp=mul(projection(.98,canvas.width/canvas.height,.12,340),view);
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.54,.67,.67,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const skyForward=norm(sub(target,eye)),skyRight=norm(cross(skyForward,[0,1,0])),skyUp=cross(skyRight,skyForward);
 gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(skyProgram);
 gl.uniform1f(skyU.time,elapsed);gl.uniform1f(skyU.aspect,canvas.width/canvas.height);gl.uniform1f(skyU.fov,.98);
 gl.uniform3fv(skyU.forward,skyForward);gl.uniform3fv(skyU.right,skyRight);gl.uniform3fv(skyU.up,skyUp);gl.uniform3fv(skyU.sun,sun);
 gl.bindVertexArray(fullscreen);gl.drawArrays(gl.TRIANGLES,0,3);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
 gl.useProgram(mainProgram);gl.uniformMatrix4fv(mainU.vp,false,new Float32Array(vp));gl.uniformMatrix4fv(mainU.lvp,false,new Float32Array(lightVP));gl.uniform3fv(mainU.eye,eye);gl.uniform3fv(mainU.sun,sun);gl.uniform3fv(mainU.fog,fog);gl.uniform1f(mainU.time,elapsed);gl.uniform1f(mainU.enabled,softwareRenderer?0:1);gl.uniform1f(mainU.lowQuality,softwareRenderer?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,depthTex);gl.uniform1i(mainU.shadow,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,materialAtlas);gl.uniform1i(mainU.materials,1);gl.uniform1f(mainU.shadowSize,softwareRenderer?512:window.matchMedia('(pointer:coarse)').matches?1024:2048);
 gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);
 // A soft, fading, ground-following contact shadow anchors the moving feet.
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
 const sd=new Float32Array(characterShadow().a);gl.bindBuffer(gl.ARRAY_BUFFER,shadowDecalGeo.buffer);
 if(sd.byteLength>shadowByteCapacity){shadowByteCapacity=sd.byteLength*2;gl.bufferData(gl.ARRAY_BUFFER,shadowByteCapacity,gl.DYNAMIC_DRAW)}
 gl.bufferSubData(gl.ARRAY_BUFFER,0,sd);gl.bindVertexArray(shadowDecalGeo.vao);gl.drawArrays(gl.TRIANGLES,0,sd.length/10);
 gl.depthMask(true);gl.disable(gl.BLEND);
 // Dynamic hero geometry is small; regenerate poses rather than deform all of the scenery.
 let ch=character(elapsed),arr=new Float32Array(ch.a);gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);if(arr.byteLength>dynamicByteCapacity){dynamicByteCapacity=2*arr.byteLength;gl.bufferData(gl.ARRAY_BUFFER,dynamicByteCapacity,gl.DYNAMIC_DRAW)}gl.bufferSubData(gl.ARRAY_BUFFER,0,arr);gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,ch.count);
 // Water after terrain: its depth test naturally exposes shoreline and submerged sand.
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(waterProgram);
 gl.uniformMatrix4fv(waterU.vp,false,new Float32Array(vp));gl.uniform3fv(waterU.eye,eye);gl.uniform3fv(waterU.sun,sun);gl.uniform3fv(waterU.fog,fog);gl.uniform1f(waterU.time,elapsed);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,coastHeightmap);gl.uniform1i(waterU.coast,2);gl.bindVertexArray(waterGeo.vao);gl.drawArrays(gl.TRIANGLES,0,waterGeo.count);gl.depthMask(true);gl.disable(gl.BLEND);
 frames++;if(frames===2){loading.classList.add('off');document.documentElement.dataset.windfallReady='1';}
 if(Math.abs(x-11)<7&&z>12){document.getElementById('placeName').textContent='The Lantern Harbor';document.getElementById('placeDescription').textContent='The wooden pier leads toward the sea arch and the breaking surf.'}
 else if(x<-13){document.getElementById('placeName').textContent='Briarwood Grove';document.getElementById('placeDescription').textContent='Follow the old tree line beneath the soft mountain light.'}
 else if(z<-19){document.getElementById('placeName').textContent='The Northern Ascent';document.getElementById('placeDescription').textContent='A distant stone lookout watches over the valley.'}
 else{document.getElementById('placeName').textContent='Old Village Square';document.getElementById('placeDescription').textContent='Follow the lanterns past the market toward the harbor. There is more beyond the hills.'}
 requestAnimationFrame(frame)
}
function resize(){let ratio=Math.min(window.devicePixelRatio||1,window.matchMedia('(pointer:coarse)').matches?1.25:1.5),w=Math.max(320,Math.round(innerWidth*ratio)),h=Math.max(220,Math.round(innerHeight*ratio));canvas.width=w;canvas.height=h}
window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
})();