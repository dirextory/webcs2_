import * as T from 'three';
import { weapon, SKINS, type Team } from './data';
import { batchRigidMeshes } from './geometry';

const metal = new T.MeshStandardMaterial({color:0x252c30,roughness:.42,metalness:.7});
const rubber = new T.MeshStandardMaterial({color:0x151a1d,roughness:.92});
const steel = new T.MeshStandardMaterial({color:0x8c979d,roughness:.3,metalness:.9});
export function box(g:T.Group|T.Scene, w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material|number, bevel=false){
  const m=new T.Mesh(bevel?new T.CapsuleGeometry(w/2,Math.max(.001,h-w),4,8):new T.BoxGeometry(w,h,d),typeof mat==='number'?new T.MeshStandardMaterial({color:mat,roughness:.8}):mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function cylinder(g:T.Group,r:number,len:number,x:number,y:number,z:number,mat:T.Material,axis='z'){
  const m=new T.Mesh(new T.CylinderGeometry(r,r,len,12),mat);m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;m.castShadow=true;g.add(m);return m;
}
export function labelTexture(text:string,bg:string,fg:string,size=256){
  const c=document.createElement('canvas');c.width=size;c.height=size/2;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,size,size/2);ctx.fillStyle=fg;ctx.font=`bold ${size*.25}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,size/2,size/4);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
const skinCache=new Map<number,T.MeshStandardMaterial>();
function skinMaterial(index:number,base:number){
  if(!index)return new T.MeshStandardMaterial({color:base,roughness:.4,metalness:.5});
  if(skinCache.has(index))return skinCache.get(index)!;
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d')!;const s=SKINS[index];
  x.fillStyle=s.colors[0];x.fillRect(0,0,512,512);x.strokeStyle=s.colors[1];x.fillStyle=s.colors[1];x.lineWidth=8;
  for(let i=0;i<24;i++){
    if(index===3){x.beginPath();x.moveTo(256,256);x.lineTo(Math.cos(i)*500+256,Math.sin(i)*500+256);x.stroke();x.beginPath();x.arc(256,256,i*20,0,7);x.stroke();}
    else if(index===4||index===7){const grad=x.createLinearGradient(0,0,512,512);grad.addColorStop(0,s.colors[0]);grad.addColorStop(.5,s.colors[1]);grad.addColorStop(1,'#eee2c0');x.fillStyle=grad;x.fillRect(0,0,512,512);}
    else if(index===5||index===8){x.beginPath();x.ellipse((i*107)%512,(i*71)%512,90,18,i,0,7);x.fill();}
    else {x.save();x.translate((i*131)%600,(i*79)%600);x.rotate(-.6);x.fillRect(0,0,i%2?18:48,230);x.restore();}
  }
  x.fillStyle='#ffffffa0';x.font='bold 34px monospace';x.fillText(index===1?'01 // ASIIMOV':'// '+s.name.toUpperCase(),20,480);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
  const m=new T.MeshStandardMaterial({map:t,roughness:.36,metalness:.58});skinCache.set(index,m);return m;
}
export function makeWeapon(id:string,skin=0,knife='default'):T.Group{
  const g=new T.Group();g.name=id;const w=weapon(id);const finish=skinMaterial(skin,w.color);
  const wood=new T.MeshStandardMaterial({color:0x91572d,roughness:.65});
  if(id==='knife'){
    if(knife==='karambit'){
      const shape=new T.Shape();shape.moveTo(0,.04);shape.bezierCurveTo(.18,.09,.37,-.035,.32,-.27);shape.bezierCurveTo(.28,-.13,.14,-.08,0,-.035);shape.closePath();
      const blade=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.005,bevelSegments:2,steps:1}),skin?finish:steel);blade.rotation.y=Math.PI/2;blade.position.set(0,.01,-.15);g.add(blade);
      box(g,.07,.09,.27,0,0,.01,rubber);const ring=new T.Mesh(new T.TorusGeometry(.066,.018,8,24),steel);ring.rotation.y=Math.PI/2;ring.position.z=.2;g.add(ring);
      for(let i=0;i<4;i++)box(g,.075,.012,.015,0,-.046,-.1+i*.05,metal);
    }else if(knife==='butterfly'){
      for(const s of [-1,1]){
        const pivot=new T.Group();g.add(pivot);pivot.position.z=-.12;pivot.name=s===-1?'butterflyHandle':'butterflyHandle2';
        const h=box(pivot,.035,.065,.34,s*.043,0,.2,finish);h.rotation.x=s*.035;
        for(let i=0;i<5;i++)cylinder(pivot,.011,.004,s*.043,.035,.08+i*.048,rubber,'y');
        cylinder(g,.027,.12,0,0,-.12,steel,'x');
      }
      const shape=new T.Shape();shape.moveTo(-.035,0);shape.lineTo(-.035,.27);shape.lineTo(0,.44);shape.lineTo(.035,.27);shape.lineTo(.035,0);shape.closePath();
      const blade=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:false}),skin?finish:steel);blade.rotation.x=-Math.PI/2;blade.position.set(0,.015,-.12);g.add(blade);
    }else{
      box(g,.075,.085,.3,0,0,.1,rubber);box(g,.16,.025,.035,0,.04,-.07,metal);
      const shape=new T.Shape();shape.moveTo(-.045,0);shape.lineTo(-.045,.31);shape.lineTo(.02,.45);shape.lineTo(.055,.28);shape.lineTo(.055,0);shape.closePath();
      const blade=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false}),skin?finish:steel);blade.rotation.x=-Math.PI/2;blade.position.set(0,.03,-.08);g.add(blade);
      for(let i=0;i<6;i++)box(g,.081,.012,.012,0,.043,i*.037,rubber);
    }
    return g;
  }
  const pistol=w.type==='pistol';
  if(pistol){
    const one=(offset:number)=>{
      const p=new T.Group();p.position.x=offset;g.add(p);
      box(p,.095,.09,.32,0,.08,-.07,finish);box(p,.083,.045,.28,0,.015,-.04,metal);
      const grip=box(p,.077,.19,.1,0,-.1,.055,id==='deagle'?finish:rubber);grip.rotation.x=-.2;
      box(p,.085,.015,.09,0,-.2,.075,metal);
      box(p,.06,.008,.06,0,-.09,-.06,metal);box(p,.012,.08,.015,-.036,-.04,-.085,metal);box(p,.012,.08,.015,.036,-.04,-.085,metal);
      cylinder(p,.022,id==='usp'?.24:.045,0,.08,id==='usp'?-.34:-.25,id==='usp'?metal:steel);
      box(p,.018,.022,.023,0,.137,-.19,metal);box(p,.065,.02,.025,0,.137,.065,metal);
      for(let i=0;i<6;i++)box(p,.099,.007,.006,0,.1,.015+i*.009,rubber);
      box(p,.016,.03,.06,.052,.04,.02,steel);
    };one(id==='dual'?-.13:0);if(id==='dual')one(.13);
  }else{
    const ak=id==='ak47', awp=w.type==='sniper', smg=w.type==='smg', shotgun=w.type==='shotgun';
    box(g,.115,.14,.42,0,.02,0,finish);box(g,.10,.055,.35,0,.12,-.025,metal);
    const barrelLen=awp?.65:smg?.25:.45;
    cylinder(g,.021,barrelLen,0,.055,-.35-barrelLen/2,metal);
    const silenced=['m4a1','mp5'].includes(id);
    cylinder(g,silenced?.034:.026,silenced?.27:.065,0,.055,-.35-barrelLen-(silenced?.1:0),metal);
    box(g,.105,.11,smg?.18:.29,0,.025,-.33,ak?wood:finish);
    for(let i=0;i<6;i++){box(g,.115,.015,.018,0,.082,-.22-i*.034,rubber);box(g,.12,.013,.012,0,-.032,-.22-i*.034,metal);}
    const grip=box(g,.075,.19,.095,0,-.14,.095,rubber);grip.rotation.x=-.27;
    const mag=box(g,.072,ak?.29:.23,.105,0,-.17,-.1,ak?metal:finish);mag.rotation.x=ak?-.3:.08;
    if(ak){const end=box(g,.073,.1,.11,0,-.34,-.055,metal);end.rotation.x=-.5;}
    if(shotgun){mag.visible=false;cylinder(g,.027,.48,0,-.02,-.46,finish);}
    box(g,.055,.065,.18,0,.025,.27,metal);box(g,.085,.18,.19,0,.0,.42,ak?wood:finish);box(g,.095,.19,.025,0,0,.52,rubber);
    box(g,.018,.035,.37,0,.165,-.02,metal);box(g,.01,.06,.02,0,.12,-.62,metal);
    box(g,.075,.016,.12,0,-.11,.005,metal);
    box(g,.012,.09,.015,.035,-.065,-.04,metal);
    if(awp||['aug','sg553'].includes(id)){
      cylinder(g,.047,awp?.31:.18,0,.225,-.08,metal);cylinder(g,.06,.04,0,.225,-.25,rubber);
      cylinder(g,.043,.006,0,.225,-.273,new T.MeshStandardMaterial({color:0x577f8b,metalness:.95,roughness:.1}));
      box(g,.055,.09,.045,0,.17,-.04,metal);
    }
    for(let i=0;i<5;i++)cylinder(g,.009,.12,0,.045,.13-i*.055,steel,'x');
  }
  return g;
}
export function makeSoldier(team:Team='CT',detailed=false):T.Group{
  const g=new T.Group();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle=team==='CT'?'#52646c':'#a08b68';ctx.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=2){ctx.fillStyle=i%4?'#ffffff09':'#00000018';ctx.fillRect(i,0,1,128);ctx.fillRect(0,i,128,1);}
  for(let i=0;i<1500;i++){ctx.fillStyle=i%2?'#00000012':'#ffffff09';ctx.fillRect((i*47)%128,(i*73)%128,2,2);}
  const fabric=new T.CanvasTexture(canvas);fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(3,3);fabric.colorSpace=T.SRGBColorSpace;
  const cloth=new T.MeshStandardMaterial({map:fabric,roughness:.98});
  const armor=new T.MeshStandardMaterial({color:team==='CT'?0x39494b:0x5b5843,roughness:.9});
  const leather=new T.MeshStandardMaterial({color:0x20282a,roughness:.85});
  const skin=new T.MeshStandardMaterial({color:0xb58a6a,roughness:.9});
  function limb(a:T.Vector3,b:T.Vector3,r:number,m:T.Material){
    const v=b.clone().sub(a);const mesh=new T.Mesh(new T.CapsuleGeometry(r,Math.max(.01,v.length()-r*2),5,10),m);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());mesh.castShadow=true;g.add(mesh);return mesh;
  }
  // Layered uniform, plate carrier, pouches and an articulated stance.
  box(g,.43,.24,.29,0,1.00,0,cloth);
  for(const s of [-1,1]){
    const hip=new T.Vector3(s*.145,.99,0),knee=new T.Vector3(s*.19,.57,s===1?.065:-.09),ankle=new T.Vector3(s*.22,.17,s===1?.12:-.15);
    limb(hip,knee,.135,cloth);limb(knee,ankle,.105,cloth);
    box(g,.15,.18,.07,knee.x,.58,knee.z+.11,armor,true);
    box(g,.19,.16,.32,ankle.x,.10,ankle.z+.06,leather);
    box(g,.2,.035,.34,ankle.x,.028,ankle.z+.065,rubber);
    box(g,.11,.18,.12,s*.27,.88,.01,armor);
    box(g,.11,.14,.08,s*.20,.94,.19,leather);
    // Trouser stitching and boot laces.
    if(detailed){for(let i=0;i<5;i++)box(g,.09,.008,.016,ankle.x,.18-i*.018,ankle.z+.17,armor);box(g,.012,.25,.01,s*.254,.7,.02,armor);}
  }
  box(g,.48,.55,.29,0,1.38,0,cloth,true);
  box(g,.44,.43,.10,0,1.39,.16,armor);
  box(g,.4,.4,.12,0,1.4,-.16,armor);
  for(const s of [-1,1]){const strap=box(g,.075,.44,.08,s*.16,1.5,.16,leather);strap.rotation.z=s*.12;}
  for(let i=0;i<4;i++){
    box(g,.085,.16,.105,(i-1.5)*.10,1.23,.255,armor);
    box(g,.077,.025,.11,(i-1.5)*.10,1.3,.26,cloth);
    box(g,.012,.10,.012,(i-1.5)*.10,1.23,.315,leather);
  }
  box(g,.49,.055,.32,0,1.04,0,leather);box(g,.07,.05,.025,0,1.04,.18,steel);
  const badgeMat=new T.MeshStandardMaterial({map:labelTexture(team==='CT'?'POLICE':'ELITE','#263237','#d1d5cb'),roughness:.8});
  box(g,.25,.087,.015,0,1.53,.22,badgeMat);
  box(g,.065,.14,.06,-.2,1.53,.23,leather);cylinder(g,.008,.15,-.2,1.67,.23,metal,'y');
  for(let i=0;i<5;i++)box(g,.4,.014,.01,0,1.43-i*.035,.225,leather);
  limb(new T.Vector3(-.27,1.56,0),new T.Vector3(-.36,1.27,.15),.105,cloth);
  limb(new T.Vector3(-.36,1.27,.15),new T.Vector3(-.04,1.31,.47),.085,cloth);
  limb(new T.Vector3(.27,1.56,0),new T.Vector3(.38,1.22,.09),.105,cloth);
  limb(new T.Vector3(.38,1.22,.09),new T.Vector3(.13,1.29,.34),.085,cloth);
  for(const p of [[-.04,1.31,.47],[.13,1.29,.34]]){const hand=new T.Mesh(new T.SphereGeometry(.085,10,8),leather);hand.position.set(...p as [number,number,number]);hand.scale.set(.7,.65,1.2);g.add(hand);}
  box(g,.12,.13,.08,-.30,1.50,.07,badgeMat);
  cylinder(g,.08,.15,0,1.72,0,team==='CT'?leather:skin,'y');
  const head=new T.Mesh(new T.SphereGeometry(.17,20,16),team==='CT'?leather:skin);head.position.set(0,1.87,0);head.scale.set(.91,1.17,1);head.castShadow=true;g.add(head);
  if(team==='CT'){
    const helmet=new T.Mesh(new T.SphereGeometry(.194,20,12,0,Math.PI*2,0,Math.PI*.62),armor);helmet.position.set(0,1.96,-.015);helmet.castShadow=true;g.add(helmet);
    box(g,.30,.04,.05,0,1.98,.17,armor);
    const glass=new T.MeshStandardMaterial({color:0x101d22,metalness:.7,roughness:.15});
    box(g,.285,.093,.065,0,1.9,.145,leather);box(g,.25,.063,.02,0,1.91,.182,glass);
    box(g,.011,.085,.022,0,1.90,.195,armor);
    box(g,.11,.11,.09,0,1.79,.16,leather,true);
    for(const s of [-1,1]){
      cylinder(g,.053,.065,s*.1,1.79,.17,armor);
      for(let i=0;i<3;i++)box(g,.055,.006,.012,s*.1,1.77+i*.015,.207,rubber);
      box(g,.035,.12,.13,s*.18,1.9,-.015,leather);
    }
    cylinder(g,.025,.045,-.2,1.91,.03,metal,'x');
  }else{
    const scarf=box(g,.33,.13,.32,0,1.79,0,cloth);scarf.rotation.x=.05;
    box(g,.3,.055,.045,0,1.93,.15,leather);box(g,.12,.05,.016,-.075,1.93,.18,steel);box(g,.12,.05,.016,.075,1.93,.18,steel);
    box(g,.36,.08,.30,0,2.0,-.02,armor);
  }
  const gun=makeWeapon(team==='CT'?'m4a1':'ak47');gun.scale.setScalar(.75);gun.rotation.set(.12,Math.PI/2+.1,-.16);gun.position.set(.12,1.28,.40);g.add(gun);g.userData.gun=gun;
  batchRigidMeshes(g);
  return g;
}
