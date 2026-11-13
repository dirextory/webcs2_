import * as T from 'three';
import { box, labelTexture } from './models';
import { batchRigidMeshes } from './geometry';
export const CELL=2.4, GRID=33, HALF=GRID*CELL/2;
export type Obstacle={x:number;z:number;w:number;d:number;h:number;penetrable:boolean;mesh:T.Object3D};
export type World={scene:T.Scene;solids:Obstacle[];nav:boolean[][];surfaces:T.Object3D[];sites:T.Vector3[];spawns:T.Vector3[]};
let seed=42;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function plaster(color:string){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
  for(let i=0;i<19000;i++){const l=rand()>.5?255:50;ctx.fillStyle=`rgba(${l},${l-10},${l-20},${rand()*.095})`;ctx.fillRect(rand()*512,rand()*512,rand()*6+1,rand()*4+1);}
  for(let i=0;i<35;i++){ctx.fillStyle=`rgba(80,65,42,${rand()*.06})`;ctx.fillRect(rand()*512,rand()*512,rand()*80,rand()*150);}
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  return new T.MeshStandardMaterial({map:tex,roughness:.95});
}
function groundTexture(){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d')!;x.fillStyle='#b6a58a';x.fillRect(0,0,512,512);
  for(let i=0;i<15000;i++){x.fillStyle=rand()>.5?'#c5b59c':'#a99b86';x.fillRect(rand()*512,rand()*512,2,2);}
  x.strokeStyle='#9e8e76';x.lineWidth=1;
  for(let i=0;i<512;i+=64){x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();for(let j=0;j<512;j+=128){const off=i%128===0?0:64;x.strokeRect(j+off,i,128,64);}}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(24,24);t.colorSpace=T.SRGBColorSpace;return t;
}
export function createWorld():World{
  const scene=new T.Scene();scene.background=new T.Color(0xa8b7bc);scene.fog=new T.FogExp2(0xc0b9a5,.009);
  scene.add(new T.HemisphereLight(0xd7e8f4,0x78614a,2.1));
  const sun=new T.DirectionalLight(0xffe2ae,3.7);sun.position.set(-25,42,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-49;sun.shadow.camera.right=49;sun.shadow.camera.top=49;sun.shadow.camera.bottom=-49;sun.shadow.camera.far=110;sun.shadow.bias=-.0007;sun.shadow.normalBias=.04;scene.add(sun);
  const solids:Obstacle[]=[],surfaces:T.Object3D[]=[];
  const sand=plaster('#c8b38e'),cream=plaster('#ddd0ad'),stone=plaster('#b19d7b'),blue=plaster('#718b91');
  const trim=new T.MeshStandardMaterial({color:0x9b8c73,roughness:.95});
  const dark=new T.MeshStandardMaterial({color:0x35464a,roughness:.8});
  const wood=new T.MeshStandardMaterial({color:0x84704c,roughness:.9});
  const floor=new T.Mesh(new T.PlaneGeometry(170,170),new T.MeshStandardMaterial({map:groundTexture(),roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);surfaces.push(floor);
  function solid(w:number,h:number,d:number,x:number,z:number,mat:T.Material,penetrable=false,y=0){
    const m=box(scene,w,h,d,x,y+h/2,z,mat);m.userData.penetrable=penetrable;surfaces.push(m);solids.push({x,z,w,d,h:y+h,penetrable,mesh:m});return m;
  }
  function arch(group:T.Group,width:number,height:number,mat:T.Material){
    const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(-width/2,height-width/2);shape.absarc(0,height-width/2,width/2,Math.PI,0,true);shape.lineTo(width/2,0);shape.closePath();
    const m=new T.Mesh(new T.ShapeGeometry(shape),mat);group.add(m);return m;
  }
  function facade(w:number,h:number,d:number,x:number,z:number,side:number,mat:T.Material){
    const face=new T.Group();face.position.set(x,0,z);face.rotation.y=side;scene.add(face);
    const front=d/2+.025;
    box(face,w+.15,.12,.25,0,.22,front,trim);
    const door=new T.Group();door.position.set(-w*.23,0,front+.02);arch(door,1.55,2.7,trim);door.position.z+=.015;face.add(door);
    const inner=new T.Group();inner.position.set(0,.06,.015);arch(inner,1.26,2.47,dark);door.add(inner);
    for(let i=0;i<5;i++)box(door,.018,1.75,.025,-.5+i*.25,.9,.03,wood);
    box(face,.10,.15,.05,-w*.23+.43,1.04,front+.09,trim);
    // Recessed shutters, lintels, vents and wiring give the streets a readable scale.
    for(let xx=-w/2+1.7;xx<w/2-1;xx+=3.4){
      for(let yy=3.8;yy<h-.9;yy+=2.9){
        box(face,1.25,1.65,.09,xx,yy,front,trim);box(face,1.03,1.4,.11,xx,yy,front+.055,rand()>.3?dark:blue);
        for(let sl=0;sl<8;sl++)box(face,1.05,.033,.045,xx,yy-.6+sl*.17,front+.13,trim);
        box(face,1.5,.14,.32,xx,yy-.85,front+.12,cream);
        box(face,.045,1.35,.05,xx,yy,front+.14,trim);
        if(rand()>.65){box(face,1.0,.56,.50,xx+1,yy-.4,front+.25,cream);for(let j=0;j<5;j++)box(face,.65,.025,.02,xx+1,yy-.6+j*.09,front+.52,trim);}
      }
    }
    box(face,w+.25,.24,.35,0,h-.18,front,cream);
    if(w>8){
      const sign=new T.MeshStandardMaterial({map:labelTexture(rand()>.5?'CAFÉ • SAHARA':'المَدِينَة','#536b68','#e0d4b9'),roughness:.9});
      box(face,2.5,.65,.1,w*.19,2.6,front+.09,sign);
      const awning=box(face,3.4,.08,1.5,w*.18,2.1,front+.6,rand()>.5?blue:wood);awning.rotation.x=.14;
    }
    // Roof antenna.
    if(rand()>.5){box(face,.035,2,.035,w*.22,h+.8,0,dark);box(face,1.4,.025,.025,w*.22,h+1.4,0,dark);box(face,.8,.025,.025,w*.22,h+1.8,0,dark);}
    void mat;
  }
  const buildings=[
    [-29,27,14,16,9],[-12,28,12,14,8],[12,28,12,14,11],[29,27,14,16,7],
    [-30,8,12,14,10],[-13,10,12,10,7],[12,10,12,10,10],[30,8,12,14,8],
    [-30,-10,12,13,9],[-13,-10,12,11,10],[13,-10,12,11,8],[30,-10,12,13,11],
    [-12,-29,12,12,8],[12,-29,12,12,9],
  ];
  for(const [x,z,w,d,h]of buildings){
    const mat=rand()>.45?sand:cream;solid(w,h,d,x,z,mat);
    box(scene,w+.4,.24,d+.4,x,h+.06,z,cream);
    for(const [side,ww,dd]of [[0,w,d],[Math.PI,w,d],[Math.PI/2,d,w],[-Math.PI/2,d,w]])facade(ww,h,dd,x,z,side,mat);
  }
  // Perimeter ramparts enclose a complete three-lane, two-site arena.
  solid(82,5,1,0,40,stone);solid(82,5,1,0,-40,stone);solid(1,6,80,40,0,sand);solid(1,6,80,-40,0,sand);
  for(let i=-38;i<40;i+=3){box(scene,1.3,.6,1.05,i,5.3,-40,stone);box(scene,1.3,.6,1.05,i,5.3,40,stone);}
  // Landmark gateway in mid.
  for(const x of [-4.8,4.8]){solid(1.3,6.2,1.5,x,-18,stone);box(scene,1.7,.25,1.8,x,5.7,-18,cream);}
  box(scene,11,1.0,1.5,0,6,-18,stone);
  const arc=new T.Mesh(new T.TorusGeometry(4.15,.6,6,28,Math.PI),stone);arc.position.set(0,3.1,-18);scene.add(arc);
  // Lower wooden doors can be wallbanged.
  for(const x of [-2.6,2.6]){
    const door=solid(2.8,3.2,.24,x,-18,wood,true);door.rotation.y=x<0?-.55:.55;
    for(let y=.3;y<3;y+=.65)box(scene,2.8,.09,.08,x,y,-17.83,trim);
  }
  function crate(x:number,z:number,w=2.2,h=2.2){
    const m=solid(w,h,w,x,z,wood,true);for(const s of [-1,1]){
      for(const y of [.15,h-.15])box(scene,w+.03,.12,.06,x,y,z+s*(w/2+.025),trim);
      for(const xx of [-w/2+.12,w/2-.12])box(scene,.12,h,.06,x+xx,h/2,z+s*(w/2+.03),trim);
      const brace=box(scene,w*1.2,.09,.06,x,h/2,z+s*(w/2+.04),trim);brace.rotation.z=Math.atan(h/w)*s;
    }m.userData.penetrable=true;
  }
  for(const [x,z,w,h]of [[25,-29,3,2.6],[28,-26,3,2.6],[24,-28,2,4.4],[-27,-28,3,2.5],[-30,-25,3,2.5],[-27,-24,2,1.5],[5,2,2.5,2.1],[-5,-5,2,1.7],[22,14,2.4,2.4],[-22,18,2.8,2.8],[4,24,2,1.8],[-4,30,2,1.8]])crate(x,z,w,h);
  const barrelMat=new T.MeshStandardMaterial({color:0x475e64,metalness:.5,roughness:.75});
  for(const [x,z] of [[-21,5],[21,-17],[34,-20],[-34,21],[7,18]]){
    const m=new T.Mesh(new T.CylinderGeometry(.52,.52,1.5,16),barrelMat);m.position.set(x,.75,z);m.castShadow=true;scene.add(m);
    solids.push({x,z,w:1.05,d:1.05,h:1.5,penetrable:true,mesh:m});m.userData.penetrable=true;surfaces.push(m);
    for(const y of [.2,1.3]){const ring=new T.Mesh(new T.TorusGeometry(.52,.025,5,16),trim);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);scene.add(ring);}
  }
  const sites=[new T.Vector3(27,0,-29),new T.Vector3(-27,0,-29)];
  for(let i=0;i<sites.length;i++){
    const p=sites[i];const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;ctx.strokeStyle='#be6535';ctx.lineWidth=18;ctx.strokeRect(20,20,472,472);ctx.fillStyle='#b85b31';ctx.font='bold 300px Arial';ctx.textAlign='center';ctx.fillText(i?'B':'A',256,360);
    const decal=new T.Mesh(new T.PlaneGeometry(9,9),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,roughness:1}));decal.rotation.x=-Math.PI/2;decal.position.set(p.x,.018,p.z);scene.add(decal);
    const sign=new T.MeshStandardMaterial({map:labelTexture(i?'← B':'A →','#bba887','#8c3c25'),roughness:1});box(scene,2.8,1.4,.05,i?-6.02:6.02,2.4,-7,sign);
  }
  // Dust particles catch the warm directional light.
  const particles=new Float32Array(450*3);for(let i=0;i<particles.length;i+=3){particles[i]=(rand()-.5)*80;particles[i+1]=rand()*10;particles[i+2]=(rand()-.5)*80;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(particles,3));scene.add(new T.Points(geo,new T.PointsMaterial({color:0xffe3b4,size:.025,transparent:true,opacity:.4})));
  const nav=Array.from({length:GRID},(_,r)=>Array.from({length:GRID},(_,c)=>{const x=(c+.5)*CELL-HALF,z=(r+.5)*CELL-HALF;return !solids.some(s=>Math.abs(x-s.x)<s.w/2+.5&&Math.abs(z-s.z)<s.d/2+.5);}));
  batchRigidMeshes(scene,surfaces);
  return {scene,solids,nav,surfaces,sites,spawns:[new T.Vector3(0,0,-32),new T.Vector3(0,0,32)]};
}
export function collides(world:World,x:number,z:number,r=.32){
  return Math.abs(x)>38.8||Math.abs(z)>38.8||world.solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
}
export function nearestWalkable(world:World,p:T.Vector3):T.Vector3 {
  if(!collides(world,p.x,p.z,.5))return p.clone();
  for(let r=1;r<20;r++)for(let a=0;a<16;a++){const q=new T.Vector3(p.x+Math.cos(a*Math.PI/8)*r,0,p.z+Math.sin(a*Math.PI/8)*r);if(!collides(world,q.x,q.z,.5))return q;}
  return new T.Vector3(0,0,0);
}
export function findPath(world:World,start:T.Vector3,end:T.Vector3):T.Vector3[]{
  const cell=(p:T.Vector3)=>{
    const r=Math.max(0,Math.min(GRID-1,Math.floor((p.z+HALF)/CELL))),c=Math.max(0,Math.min(GRID-1,Math.floor((p.x+HALF)/CELL)));
    if(world.nav[r][c])return [r,c];
    // A valid world position may fall in a blocked coarse navigation cell.
    // Snap both endpoints to a navigable cell, not merely collision-free space.
    for(let radius=1;radius<GRID;radius++){
      const candidates:[number,number,number][]=[];
      for(let rr=Math.max(0,r-radius);rr<=Math.min(GRID-1,r+radius);rr++)for(let cc=Math.max(0,c-radius);cc<=Math.min(GRID-1,c+radius);cc++){
        if(!world.nav[rr][cc])continue;
        const x=(cc+.5)*CELL-HALF,z=(rr+.5)*CELL-HALF;candidates.push([rr,cc,(x-p.x)**2+(z-p.z)**2]);
      }
      if(candidates.length){candidates.sort((a,b)=>a[2]-b[2]);return candidates[0];}
    }
    return [r,c];
  };
  const [sr,sc]=cell(start),[er,ec]=cell(nearestWalkable(world,end));const sk=sr*GRID+sc,ek=er*GRID+ec;
  const open=[sk],prev=new Map<number,number>(),g=new Map<number,number>([[sk,0]]),closed=new Set<number>();
  for(let loops=0;open.length&&loops<1800;loops++){
    open.sort((a,b)=>(g.get(a)!+Math.abs(a%GRID-ec)+Math.abs(Math.floor(a/GRID)-er))-(g.get(b)!+Math.abs(b%GRID-ec)+Math.abs(Math.floor(b/GRID)-er)));
    const k=open.shift()!;if(k===ek){const path:T.Vector3[]=[];let n=k;while(n!==sk){path.unshift(new T.Vector3((n%GRID+.5)*CELL-HALF,0,(Math.floor(n/GRID)+.5)*CELL-HALF));n=prev.get(n)!;if(n===undefined)break;}return path;}
    closed.add(k);const r=Math.floor(k/GRID),c=k%GRID;
    for(const [dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc,n=rr*GRID+cc;if(rr<0||cc<0||rr>=GRID||cc>=GRID||!world.nav[rr][cc]||closed.has(n))continue;const ng=g.get(k)!+1;if(ng<(g.get(n)??Infinity)){prev.set(n,k);g.set(n,ng);if(!open.includes(n))open.push(n);}}
  }return [];
}
