/* Windfall — original self-contained WebGL2 fantasy island, 2026 visual prototype. */
(() => {
'use strict';
const canvas=document.getElementById('scene'), loading=document.getElementById('loading');
const errorNode=document.getElementById('error');
const error=(msg)=>{console.error(msg);errorNode.textContent='Graphics preview: '+msg;errorNode.style.display='block';loading.classList.add('off')};
const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
if(!gl){error('WebGL 2 is unavailable. Enable hardware acceleration or try a recent Firefox/Chrome browser.');return;}
const clamp=(a,b,c)=>Math.max(b,Math.min(c,a)), mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const v3=(x,y,z)=>[x,y,z], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=(a)=>{let s=Math.hypot(...a)||1;return a.map(x=>x/s)};
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}};
const rand=rng(201126), jitter=(amount)=> (rand()-.5)*amount;
const colors={grass:[.24,.39,.23],darkGrass:[.16,.31,.22],sand:[.61,.50,.35],stone:[.54,.55,.51],paleStone:[.73,.71,.59],road:[.52,.51,.45],rock:[.39,.45,.43],wood:[.32,.23,.16],timber:[.25,.18,.13],plaster:[.78,.70,.54],roof:[.55,.25,.21],deepRoof:[.24,.35,.37],slate:[.34,.38,.41],leaf:[.32,.47,.27],lightLeaf:[.48,.58,.30],redLeaf:[.64,.37,.24],gold:[.91,.66,.30],water:[.21,.54,.64],linen:[.86,.72,.47],cloth:[.20,.36,.36],skin:[.72,.49,.33],leather:[.29,.20,.17],iron:[.27,.34,.35],glass:[.71,.84,.85]};
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
// Terrain with smoothly interpolated normals and material transitions.
const NX=137,NZ=135,XMIN=-95,XMAX=95,ZMIN=-97,ZMAX=76;
for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){
 let x=mix(XMIN,XMAX,i/(NX-1)),x2=mix(XMIN,XMAX,(i+1)/(NX-1));let z=mix(ZMIN,ZMAX,j/(NZ-1)),z2=mix(ZMIN,ZMAX,(j+1)/(NZ-1));
 let a=[x,terrain(x,z),z],b=[x2,terrain(x2,z),z],c=[x2,terrain(x2,z2),z2],d=[x,terrain(x,z2),z2];
 let h=(a[1]+b[1]+c[1]+d[1])*.25,beach=smooth(2.7,.0,h),cold=smooth(9,20,h),variation=.87+.16*Math.sin(x*.56+z*.71)*Math.sin(z*.34-x*.18);
 let col=beach>.5? tint(colors.sand,variation):cold>.45?tint(colors.rock,variation):tint(colors.grass,variation*(.8+Math.sin(x*.13)*.1));
 world.triN(a,b,c,groundNormal(x,z),groundNormal(x2,z),groundNormal(x2,z2),col,beach>.5?7:0);
 world.triN(a,c,d,groundNormal(x,z),groundNormal(x2,z2),groundNormal(x,z2),col,beach>.5?7:0);
}
// Long winding cobblestone paths, made of individually varied, uneven stones.
function stonesAlong(ax,az,bx,bz,count,width=3){let dx=bx-ax,dz=bz-az,dist=Math.hypot(dx,dz),nx=-dz/dist,nz=dx/dist;
 for(let n=0;n<count;n++){let t=(n+.5)/count, x=mix(ax,bx,t),z=mix(az,bz,t);for(let q=-2;q<=2;q++){
  let xx=x+nx*(q/2)*width/2+jitter(.16),zz=z+nz*(q/2)*width/2+jitter(.16),y=terrain(xx,zz)+.065;let sx=dist/count*(.39+jitter(.1)),sw=width/5*(.77+rand()*.2),col=tint(colors.paleStone,.79+rand()*.36);
  world.quad([xx-sx,y,zz-sw],[xx-sx,y,zz+sw],[xx+sx,y,zz+sw],[xx+sx,y,zz-sw],col,1);
 }}
}
stonesAlong(0,10,0,-13,28,4.0);stonesAlong(-1,-3,-15,-6,18,3.0);stonesAlong(2,-4,13,-4,18,3.2);stonesAlong(0,2,11,17,24,3.3);stonesAlong(-3,-11,4,-23,18,2.7);
function plaza(cx,cz,r){for(let n=0;n<175;n++){let theta=rand()*Math.PI*2,rr=Math.sqrt(rand())*r,x=cx+Math.cos(theta)*rr,z=cz+Math.sin(theta)*rr,y=terrain(x,z)+.045;world.box(x,y,z,.60+rand()*.66,.03,.55+rand()*.5,tint(colors.paleStone,.72+rand()*.4),1)}}
plaza(-6,-4,4.4);
// Landscape rocks are clustered rather than distributed on an obvious grid.
function rock(x,z,r){let y=terrain(x,z)-.05;world.ellipsoid(x,y+r*.42,z,r,.75*r,r*.82,tint(colors.rock,.75+rand()*.48),1,4,7);if(r>.75)world.ellipsoid(x+r*.52,y+r*.20,z-r*.18,r*.46,.35*r,.43*r,tint(colors.stone,.78+rand()*.25),1,4,6)}
for(let i=0;i<260;i++){let x=mix(-83,83,rand()),z=mix(-85,40,rand());if(Math.hypot(x,z-3)<12 || (x>-17&&x<24&&z>-18&&z<13))continue;rock(x,z,.25+rand()*1.45)}
// Trees: branching trunks, multiple canopy lobes, tonal variation and occasional flowers.
function tree(x,z,scale=1,style=0){let y=terrain(x,z),trunk=3.0*scale,co=style===2?colors.redLeaf:style===1?colors.lightLeaf:colors.leaf;
 world.cylinder(x,y-.15,z,.28*scale,.20*scale,trunk,colors.wood,2,8);
 for(let j=0;j<3;j++){let a=j*Math.PI*2/3+.6,b=[x+Math.cos(a)*1.5*scale,y+trunk*(.68+j*.07),z+Math.sin(a)*1.5*scale],root=[x,y+trunk*.55,z];world.beam(root,b,.10*scale,colors.wood);world.ellipsoid(b[0],b[1]+.55*scale,b[2],1.25*scale,1.45*scale,1.32*scale,tint(co,.80+rand()*.27),3,6,8)}
 world.ellipsoid(x,y+trunk+1.2*scale,z,1.95*scale,2.10*scale,1.85*scale,co,3,7,10);
 world.ellipsoid(x-.75*scale,y+trunk+.95*scale,z+.70*scale,1.21*scale,1.35*scale,1.14*scale,tint(co,1.12),3,5,8);
}
for(let i=0;i<55;i++){let x=-22-rand()*42,z=-29+rand()*54;if(Math.hypot(x+8,z+5)<10)continue;tree(x,z,.63+rand()*.78,i%11===0?2:i%5===0?1:0)}
for(let i=0;i<38;i++){let x=22+rand()*50,z=-42+rand()*42;if(Math.hypot(x-20,z+10)<12)continue;tree(x,z,.8+rand()*.9,i%9===0?2:0)}
for(let [x,z,s,kind] of [[-15,0,1.15,1],[-20,6,1.10,0],[12,6,1.10,1],[22,-8,1.35,0],[-12,-19,1.4,2],[8,-19,1.15,1],[25,13,1.15,0]])tree(x,z,s,kind);
// Individual grass tufts and flowers, concentrated away from paving.
for(let i=0;i<4200;i++){let x=-75+rand()*150,z=-65+rand()*94;if(x>-17&&x<20&&z>-18&&z<12)continue;let y=terrain(x,z);if(y<.45||y>17)continue;let s=.10+rand()*.24,c=rand()>.6?colors.lightLeaf:colors.darkGrass;
 for(let k=0;k<2;k++){let dx=Math.cos(k*1.5+rand()*.4)*s,dz=Math.sin(k*1.8+rand()*.4)*s;world.tri([x-dx,y,z-dz],[x+dx,y,z+dz],[x+jitter(.2),y+s*(2+rand()),z+jitter(.2)],tint(c,.80+rand()*.55),3)}
 if(i%18===0){world.beam([x,y,z],[x,y+.43,z],.018,colors.leaf,3,4);world.ellipsoid(x,y+.47,z,.10,.10,.10,i%36===0?colors.gold:colors.linen,8,3,5)}
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
const VS=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPos;layout(location=1)in vec3 aNormal;layout(location=2)in vec3 aColor;layout(location=3)in float aKind;
uniform mat4 uVP;out vec3 vPos;out vec3 vNormal;out vec3 vColor;flat out int vKind;
void main(){vPos=aPos;vNormal=aNormal;vColor=aColor;vKind=int(aKind+.5);gl_Position=uVP*vec4(aPos,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec3 vPos;in vec3 vNormal;in vec3 vColor;flat in int vKind;
uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uFog;uniform float uTime;uniform sampler2D uShadow;uniform mat4 uLightVP;uniform float uShadowEnabled;
out vec4 frag;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float shadow(vec3 n){if(uShadowEnabled<.5)return 1.;vec4 p=uLightVP*vec4(vPos+n*.03,1.);vec3 q=p.xyz/p.w*.5+.5;if(q.x<=.0||q.x>=1.||q.y<=.0||q.y>=1.||q.z>=1.)return 1.;float bias=max(.00012,.001*(1.-dot(n,normalize(uSun))));float val=0.;for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float depth=texture(uShadow,q.xy+vec2(float(i),float(j))/2048.).r;val+=(q.z-bias<=depth?1.:0.);}return .46+.54*val/9.;}
void main(){vec3 N=normalize(vNormal);vec3 L=normalize(uSun);float nd=max(dot(N,L),0.);float sh=shadow(N), ambient=.72;float micro=noise(vPos*vec3(2.4,2.4,2.4));vec3 albedo=vColor;
 if(vKind==0){albedo*=mix(.82,1.16,micro);albedo+=vec3(.015,.026,-.01)*noise(vPos*6.);}
 if(vKind==1){albedo*=mix(.77,1.13,micro);float cracks=pow(1.-abs(sin(vPos.x*3.1+vPos.z*2.3)),22.);albedo*=1.-cracks*.10;}
 if(vKind==2){float grain=noise(vPos*vec3(8.,1.4,8.));albedo*=mix(.69,1.18,grain);}
 if(vKind==3){float leaf=noise(vPos*5.2)*.58+noise(vPos*14.)*.42;albedo*=mix(.64,1.36,leaf);albedo+=vec3(.035,.042,-.010)*leaf;}
 if(vKind==4){albedo*=mix(.86,1.12,noise(vPos*vec3(1.8,2.5,1.8)));}
 if(vKind==5){float tiles=sin(vPos.x*8.)*sin(vPos.z*10.);albedo*=.92+.10*tiles+.10*micro;}
 if(vKind==7){albedo*=.81+.29*micro;}
 vec3 light=vec3(.99,.79,.56)*(nd*sh*.89)+vec3(.62,.74,.79)*ambient+vec3(.20,.17,.14)*max(N.y,0.);
 vec3 c=albedo*light*1.46;
 if(vKind==6){vec3 V=normalize(uEye-vPos),H=normalize(V+L);c+=vec3(.94,.86,.66)*pow(max(dot(N,H),0.),75.)*.32*sh;}
 if(vKind==8){c=albedo*1.65+vec3(.30,.16,.06)*(.5+.5*sin(uTime*2.5+vPos.x*3.));}
 float dist=length(uEye-vPos);float fog=1.-exp(-pow(dist*.0078,1.55));c=mix(c,uFog,clamp(fog,0.,.91));
 c=1.-exp(-c*1.31);c=pow(c,vec3(.92));frag=vec4(c,1.);
}`;
const SHADOW_VS=`#version 300 es
layout(location=0)in vec3 aPos;uniform mat4 uLightVP;void main(){gl_Position=uLightVP*vec4(aPos,1.);}`;
const SHADOW_FS=`#version 300 es
precision highp float;void main(){} `;
const SKY_VS=`#version 300 es
layout(location=0)in vec2 aPos;out vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,1.,1.);}`;
const SKY_FS=`#version 300 es
precision highp float;in vec2 vUV;uniform float uTime;out vec4 frag;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float no(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){float h=vUV.y;vec3 c=mix(vec3(.91,.70,.49),vec3(.30,.52,.62),smoothstep(.03,.92,h));c=mix(c,vec3(.38,.59,.71),smoothstep(.40,1.,h)*.42);float cloud=no(vec2(vUV.x*5.6+uTime*.002,h*8.0))*0.62+no(vec2(vUV.x*12.,h*15.))*0.38;float clouds=smoothstep(.54,.74,cloud)*smoothstep(.17,.43,h);c=mix(c,vec3(.96,.85,.67),clouds*.39);float glow=exp(-pow(length((vUV-vec2(.74,.77))*vec2(1.5,1.0))*5.0,2.));c+=vec3(.62,.38,.17)*glow*.42;c=pow(c,vec3(.92));frag=vec4(c,1.);}`;
const WATER_VS=`#version 300 es
precision highp float;layout(location=0)in vec3 aPos;uniform mat4 uVP;out vec3 vPos;void main(){vPos=aPos;gl_Position=uVP*vec4(aPos,1.);}`;
const WATER_FS=`#version 300 es
precision highp float;in vec3 vPos;uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uFog;uniform float uTime;out vec4 frag;
float wave(vec2 p){float a=sin(p.x*.79+p.y*.23+uTime*.82)*.17,b=sin(p.y*1.14-p.x*.31+uTime*1.16)*.12,c=sin(p.x*.23+p.y*.97+sin(p.x*.39)*1.4-uTime*.54)*.15;return a+b+c;}
void main(){vec2 p=vPos.xz;float h=wave(p),dx=wave(p+vec2(.09,0.))-h,dz=wave(p+vec2(0.,.09))-h;vec3 N=normalize(vec3(-dx*5.3,1.,-dz*5.3));vec3 V=normalize(uEye-vPos);vec3 L=normalize(uSun);vec3 H=normalize(V+L);float fresnel=pow(1.-max(dot(N,V),0.),2.6);float spec=pow(max(dot(N,H),0.),190.)*.95+pow(max(dot(N,H),0.),34.)*.17;vec3 base=mix(vec3(.06,.28,.35),vec3(.20,.46,.50),.5+.5*sin(p.x*.05+p.y*.02));vec3 color=mix(base,vec3(.58,.72,.70),fresnel*.55)+spec*vec3(1.,.83,.57);
 float warp=sin(p.x*.47+sin(p.y*.34)*1.7+p.y*.13),foam=smoothstep(.55,.85,sin(p.y*.48+uTime*.41+warp*1.3)*sin(p.x*.27-p.y*.34+uTime*.31));
 float nearCoast=1.-smoothstep(12.,21.,p.y);nearCoast*=smoothstep(2.,7.,p.y);color=mix(color,vec3(.75,.84,.75),foam*nearCoast*.42);
 float dist=length(uEye-vPos),fog=1.-exp(-pow(dist*.0078,1.55));color=mix(color,uFog,clamp(fog,0.,.93));color=1.-exp(-color*1.43);frag=vec4(pow(color,vec3(.92)),.94);}`;
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function program(v,f){let p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function geometryBuffer(geometry){let vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geometry.a),gl.STATIC_DRAW);for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,i===0||i===1||i===2?3:1,gl.FLOAT,false,40,[0,12,24,36][i])}gl.bindVertexArray(null);return {vao,buffer,count:geometry.count}}
let mainProgram,shadowProgram,skyProgram,waterProgram,staticGeo,dynamicGeo,waterGeo,fullscreen,depthTex,depthFbo,lightVP;
try{
 mainProgram=program(VS,FS);shadowProgram=program(SHADOW_VS,SHADOW_FS);skyProgram=program(SKY_VS,SKY_FS);waterProgram=program(WATER_VS,WATER_FS);
 staticGeo=geometryBuffer(world);world.a=null;
 const water=new Geometry();water.quad([-155,.035,-155],[155,.035,-155],[155,.035,155],[-155,.035,155],colors.water,8);waterGeo=geometryBuffer(water);
 fullscreen=gl.createVertexArray();gl.bindVertexArray(fullscreen);let b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
 const S=2048;depthTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depthTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,S,S,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 depthFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,depthFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow map framebuffer could not be created');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 const shadowEye=[-65,80,56],focus=[0,4,-9];lightVP=mul(ortho(-113,113,-115,115,1,250),viewMat(shadowEye,focus));
 gl.viewport(0,0,S,S);gl.bindFramebuffer(gl.FRAMEBUFFER,depthFbo);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
 gl.useProgram(shadowProgram);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'uLightVP'),false,new Float32Array(lightVP));gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}catch(e){error(String(e));return}
const u=(p,name)=>gl.getUniformLocation(p,name);
const mainU={vp:u(mainProgram,'uVP'),eye:u(mainProgram,'uEye'),sun:u(mainProgram,'uSun'),fog:u(mainProgram,'uFog'),time:u(mainProgram,'uTime'),shadow:u(mainProgram,'uShadow'),lvp:u(mainProgram,'uLightVP'),enabled:u(mainProgram,'uShadowEnabled')};
const waterU={vp:u(waterProgram,'uVP'),eye:u(waterProgram,'uEye'),sun:u(waterProgram,'uSun'),fog:u(waterProgram,'uFog'),time:u(waterProgram,'uTime')};
const sun=norm([-0.55,.70,.46]),fog=[.61,.66,.63];
const player={x:0,z:7,y:0,heading:0.16,phase:0,motion:0};let cameraYaw=0.16,cameraPitch=.27,cameraDist=10.9,drag=null,aimX=0,aimY=0,runTouch=false;
const key={};window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key))e.preventDefault();key[e.key.toLowerCase()]=true});window.addEventListener('keyup',e=>key[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{for(let k in key)key[k]=false;runTouch=false});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX<innerWidth*.25)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){cameraYaw+=(e.clientX-drag.x)*.006;cameraPitch=clamp(cameraPitch+(e.clientY-drag.y)*.0045,.08,.68);drag.x=e.clientX;drag.y=e.clientY}});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDist=clamp(cameraDist+Math.sign(e.deltaY)*1.0,5,18)},{passive:false});
const joy=document.getElementById('mobileControls'),stick=document.getElementById('stick');let joyID=null;function joyMove(e){if(e.pointerId!==joyID)return;let r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.max(1,Math.hypot(dx,dy)),s=Math.min(1,m/41);aimX=dx/m*s;aimY=-dy/m*s;stick.style.transform=`translate(${aimX*34}px,${-aimY*34}px)`}
joy.addEventListener('pointerdown',e=>{joyID=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});joy.addEventListener('pointermove',joyMove);const stopJoy=()=>{joyID=null;aimX=0;aimY=0;stick.style.transform='translate(0,0)'};joy.addEventListener('pointerup',stopJoy);joy.addEventListener('pointercancel',stopJoy);
const run=document.getElementById('runTouch');run.addEventListener('pointerdown',e=>{runTouch=true;run.setPointerCapture(e.pointerId)});run.addEventListener('pointerup',()=>runTouch=false);run.addEventListener('pointercancel',()=>runTouch=false);
// Character reconstructed from original primitives, not a borrowed game character.
function character(t){let g=new Geometry(),x=player.x,z=player.z,y=terrain(x,z)+.07,spin=player.heading;
 let s=Math.sin(player.phase)*player.motion,walkBob=Math.abs(Math.sin(player.phase))*.09*player.motion;
 const point=(xx,yy,zz)=>[x+Math.cos(spin)*xx+Math.sin(spin)*zz,y+yy,z-Math.sin(spin)*xx+Math.cos(spin)*zz];
 const box=(xx,yy,zz,w,h,d,col,k=0)=>{let p=point(xx,yy,zz);g.box(...p,w,h,d,col,k)};
 const oval=(xx,yy,zz,rx,ry,rz,col,k=0,rows=6,cols=9)=>{let p=point(xx,yy,zz);g.ellipsoid(...p,rx,ry,rz,col,k,rows,cols)};
 const bone=(a,b,r,col,k=0)=>g.beam(point(...a),point(...b),r,col,k,7);
 // Boots, shin guards, knees and independently swinging limbs.
 for(let side of [-1,1]){let ph=s*side,hip=[side*.29,1.17,.0],knee=[side*.30,.71,ph*.27],foot=[side*.30,.13,-ph*.42+.05];bone(hip,knee,.21,colors.cloth);bone(knee,foot,.18,colors.leather);oval(side*.30,.12,-ph*.42-.17,.23,.19,.41,colors.leather,2);oval(side*.30,.64,ph*.23,.23,.15,.21,colors.iron,6,5,7)}
 // Tunic, waist sash, sculpted chest plate, cape and natural cloth folds.
 oval(0,1.61,0,.53,.72,.34,[.18,.38,.36],4,8,11);
 let chest=point(0,1.62,-.30);g.box(chest[0],chest[1]-.33,chest[2],.79,.72,.15,[.24,.46,.43],4);
 for(let side of [-1,1]){let sw=-s*side;bone([side*.46,1.93,0],[side*.63,1.40,sw*.31],.20,colors.cloth,4);bone([side*.63,1.40,sw*.31],[side*.58,1.01,sw*.55],.17,colors.skin,4);oval(side*.56,1.06,sw*.54,.14,.18,.15,colors.skin,4)}
 oval(0,1.34,0,.52,.12,.38,colors.leather,2);box(0,1.31,-.36,.25,.20,.09,colors.gold,6);
 // Cape: asymmetric and gently fluttering, with a sharp upper silhouette.
 let flap=Math.sin(t*2.2)*.11;g.quad(point(-.39,2.08,.23),point(.39,2.08,.23),point(.57,.81,.45+flap),point(-.47,.82,.51-flap),[.27,.26,.40],4);
 // Neck, head, hair fringe and friendly original facial proportions.
 bone([0,2.12,0],[0,2.44,0],.19,colors.skin,4);oval(0,2.62,-.035,.40,.49,.37,colors.skin,4,10,13);
 oval(0,2.93,.045,.44,.28,.39,colors.leather,2,6,10);
 for(let side of [-1,1]){oval(side*.26,2.72,-.14,.19,.22,.23,colors.leather,2,5,7);oval(side*.18,2.67,-.367,.066,.065,.040,colors.iron,6,4,6)}
 oval(0,2.46,-.42,.10,.13,.12,tint(colors.skin,1.09),4,4,7);
 oval(0,2.38,-.36,.19,.042,.042,[.41,.22,.18],2,4,7);
 // Hair at the back and small scarf tail, avoiding recognizable copyrighted character design.
 oval(-.14,2.80,.32,.20,.29,.16,colors.leather,2,5,7);
 return g;
}
// One persistent VAO for character, replacing only its small dynamic data each frame.
dynamicGeo=geometryBuffer(character(0));gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);gl.bufferData(gl.ARRAY_BUFFER,220000,gl.DYNAMIC_DRAW);
let last=performance.now(),then=last,elapsed=0,frames=0,phase=0;
function frame(now){let dt=Math.min(.045,(now-last)/1000);last=now;elapsed+=dt;
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
 const x=player.x,z=player.z,y=terrain(x,z),eye=[x+Math.sin(cameraYaw)*cameraDist*Math.cos(cameraPitch),y+2.0+cameraDist*Math.sin(cameraPitch),z+Math.cos(cameraYaw)*cameraDist*Math.cos(cameraPitch)];
 const target=[x,y+1.7,z],view=viewMat(eye,target),vp=mul(projection(.98,canvas.width/canvas.height,.12,340),view);
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.54,.67,.67,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(skyProgram);gl.uniform1f(u(skyProgram,'uTime'),elapsed);gl.bindVertexArray(fullscreen);gl.drawArrays(gl.TRIANGLES,0,3);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
 gl.useProgram(mainProgram);gl.uniformMatrix4fv(mainU.vp,false,new Float32Array(vp));gl.uniformMatrix4fv(mainU.lvp,false,new Float32Array(lightVP));gl.uniform3fv(mainU.eye,eye);gl.uniform3fv(mainU.sun,sun);gl.uniform3fv(mainU.fog,fog);gl.uniform1f(mainU.time,elapsed);gl.uniform1f(mainU.enabled,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,depthTex);gl.uniform1i(mainU.shadow,0);
 gl.bindVertexArray(staticGeo.vao);gl.drawArrays(gl.TRIANGLES,0,staticGeo.count);
 // Dynamic hero geometry is small; regenerate poses rather than deform all of the scenery.
 let ch=character(elapsed),arr=new Float32Array(ch.a);gl.bindBuffer(gl.ARRAY_BUFFER,dynamicGeo.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,arr);gl.bindVertexArray(dynamicGeo.vao);gl.drawArrays(gl.TRIANGLES,0,ch.count);
 // Water after terrain: its depth test naturally exposes shoreline and submerged sand.
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(waterProgram);
 gl.uniformMatrix4fv(waterU.vp,false,new Float32Array(vp));gl.uniform3fv(waterU.eye,eye);gl.uniform3fv(waterU.sun,sun);gl.uniform3fv(waterU.fog,fog);gl.uniform1f(waterU.time,elapsed);gl.bindVertexArray(waterGeo.vao);gl.drawArrays(gl.TRIANGLES,0,waterGeo.count);gl.depthMask(true);gl.disable(gl.BLEND);
 frames++;if(frames===2)loading.classList.add('off');
 if(Math.abs(x-11)<7&&z>12){document.getElementById('placeName').textContent='The Lantern Harbor';document.getElementById('placeDescription').textContent='The wooden pier leads toward the sea arch and the breaking surf.'}
 else if(x<-13){document.getElementById('placeName').textContent='Briarwood Grove';document.getElementById('placeDescription').textContent='Follow the old tree line beneath the soft mountain light.'}
 else if(z<-19){document.getElementById('placeName').textContent='The Northern Ascent';document.getElementById('placeDescription').textContent='A distant stone lookout watches over the valley.'}
 else{document.getElementById('placeName').textContent='Old Village Square';document.getElementById('placeDescription').textContent='Follow the lanterns past the market toward the harbor. There is more beyond the hills.'}
 requestAnimationFrame(frame)
}
function resize(){let ratio=Math.min(window.devicePixelRatio||1,1.65),w=Math.max(320,Math.round(innerWidth*ratio)),h=Math.max(220,Math.round(innerHeight*ratio));canvas.width=w;canvas.height=h}
window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
})();