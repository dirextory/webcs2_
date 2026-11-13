import * as T from 'three';
import { prefs, savePrefs, weapon, eligible, WEAPONS, modeBotCount, rankLabel, type Team, type Mode, type Weapon } from './data';
import { makeSoldier, makeWeapon, box } from './models';
import { createWorld, collides, nearestWalkable, findPath, type World } from './world';
import { icon, gunSVG } from './icons';

type Actor={id:number;name:string;team:Team;pos:T.Vector3;model:T.Group;hp:number;armor:number;gun:Weapon;ammo:number;cooldown:number;reload:number;alive:boolean;kills:number;roundKills:number;deaths:number;path:T.Vector3[];think:number;target:number;flash:number;utility:number;plant:number;respawn:number;yaw:number;};
type Fire={pos:T.Vector3;time:number;owner:Actor;group:T.Group};
const NAMES=['Rezan','Ghost','Kestrel','Viper','SAS • Blue','Phoenix','Sable','Rook','Archer','Fang','Stone','Dingo','Wolf','Hawk'];
const $=(id:string)=>document.getElementById(id)!;
export class Game {
  renderer:T.WebGLRenderer;
  world:World;
  camera=new T.PerspectiveCamera(76,innerWidth/innerHeight,.06,180);
  menuCamera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,180);
  viewScene=new T.Scene();
  viewCamera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.01,10);
  viewGun=new T.Group();
  menuSoldier:T.Group;
  menuLight:T.DirectionalLight;
  actors:Actor[]=[];
  player!:Actor;
  running=false;
  menuSceneActive=true;
  paused=false;
  shopOpen=false;
  phase:'buy'|'live'|'end'='buy';
  mode:Mode='classic';
  round=1;
  score=[0,0];
  ffaScores=new Map<number,number>();
  roundTime=115;
  phaseTime=10;
  money=800;
  yaw=0;pitch=0;
  keys=new Set<string>();
  mouse=false;
  aim=false;
  slot=1;
  inventory=['m4a1','usp','knife'];
  ammo=[20,12,0];
  reserve=[120,60,0];
  inspect=0;
  kick=0;
  reloadTime=0;
  jump=0;
  jumpVel=0;
  crouch=0;
  specId=-1;
  deaths=0;
  kills=0;
  damageFlash=0;
  killToast=0;
  bomb:{pos:T.Vector3;time:number;mesh:T.Group}|null=null;
  bombCarrier=0;
  objectiveProgress=0;
  flashes=1;
  mollies=1;
  fires:Fire[]=[];
  tracers:{line:T.Line;time:number}[]=[];
  frame=0;
  private last=0;
  private audio:AudioContext|null=null;
  private moveAmount=0;
  private lastRender=0;
  private dragging=false;
  private lostLockExpected=false;
  onExit:()=>void=()=>{};
  constructor(private container:HTMLElement){
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    container.append(this.renderer.domElement);this.renderer.domElement.id='world-canvas';
    this.world=createWorld();this.menuSoldier=makeSoldier('CT',true);this.menuSoldier.scale.setScalar(2.15);this.menuSoldier.position.set(1.25,0,1);this.menuSoldier.rotation.y=.04;this.world.scene.add(this.menuSoldier);
    this.menuCamera.position.set(4.2,2.85,9);this.menuCamera.lookAt(0,2.05,0);
    this.menuLight=new T.DirectionalLight(0xccdde7,2.8);this.menuLight.position.set(1,5,9);this.world.scene.add(this.menuLight);
    this.viewScene.add(new T.HemisphereLight(0xf5f0df,0x5b6973,3.2));const vl=new T.DirectionalLight(0xffdcb0,3);vl.position.set(-2,3,1);this.viewScene.add(vl);
    this.createHud();this.bind();this.setQuality();this.resize();requestAnimationFrame(t=>this.loop(t));
  }
  private createHud(){
    $('game').innerHTML=`
      <div id="hud-top"><div class="score-team ct"><span id="ct-alive"></span><strong id="ct-score">0</strong></div><div class="round-clock"><span id="round-label">ROUND 1 / 23</span><b id="timer">1:55</b><small id="phase-label">FIRST TO 12</small></div><div class="score-team t"><strong id="t-score">0</strong><span id="t-alive"></span></div></div>
      <div class="radar-wrap"><span id="location-name">CT START</span><canvas id="radar" width="220" height="220"></canvas><small><i></i> YOU <i class="ct-dot"></i> TEAM</small></div>
      <div id="kill-feed"></div><div id="teammates"></div><div id="utility-hud"></div><div id="crosshair"><i></i><i></i><i></i><i></i></div>
      <div id="round-banner" class="hidden"></div><div id="objective"></div><div id="spectate" class="hidden"></div>
      <div id="interaction"></div><div id="kill-card" class="hidden"></div><div id="damage-overlay"></div><div id="flash-overlay"></div>
      <div id="hud-bottom"><div class="health-block"><div class="hud-money" id="money">$800</div><div class="health-line"><span>+</span><b id="health">100</b><i></i><span class="armor-icon">${icon('shield',19)}</span><b id="armor">100</b></div></div><div class="hud-center"><span id="team-label">COUNTER-TERRORIST</span><small><kbd>B</kbd> BUY &nbsp; <kbd>F</kbd> INSPECT &nbsp; <kbd>C</kbd> CROUCH</small></div><div class="ammo-block"><div id="weapon-name">M4A1-S</div><div class="ammo-line"><b id="ammo">20</b><span>/ <span id="reserve">120</span></span></div><small>1 PRIMARY &nbsp; 2 SECONDARY &nbsp; 3 KNIFE</small></div></div>
      <button class="game-menu-button" id="game-pause" title="Pause">${icon('settings',19)} <span>ESC</span></button>
      <div id="buy-hint"><kbd>B</kbd> OPEN BUY MENU <span id="buy-countdown">10</span></div>
      <div id="shop" class="game-overlay hidden"></div><div id="pause-menu" class="game-overlay hidden"></div><div id="scoreboard" class="game-overlay hidden"></div>
    `;
    $('game-pause').onclick=()=>this.pause();
  }
  private bind(){
    addEventListener('resize',()=>this.resize());
    document.addEventListener('contextmenu',e=>{if(this.running)e.preventDefault();});
    document.addEventListener('keydown',e=>{
      if(!this.running)return;
      if(['Space','Tab','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyC','ControlLeft'].includes(e.code))e.preventDefault();
      if(e.repeat){this.keys.add(e.code);return;}
      this.keys.add(e.code);
      if(e.code==='Escape'){if(this.shopOpen)this.closeShop();else this.paused?this.resume():this.pause();}
      if(e.code==='KeyB'){if(this.shopOpen)this.closeShop();else if(this.phase==='buy'&&this.player.alive)this.openShop();}
      if(this.paused||this.shopOpen)return;
      if(e.code==='Digit1')this.switchSlot(0);if(e.code==='Digit2')this.switchSlot(1);if(e.code==='Digit3')this.switchSlot(2);
      if(e.code==='KeyQ')this.aim=!this.aim;
      if(e.code==='KeyR')this.reload();
      if(e.code==='KeyF'&&this.inspect<=0)this.inspect=2.4;
      if(e.code==='KeyG')this.throwUtility('flash');
      if(e.code==='KeyH')this.throwUtility('molly');
      if(e.code==='Space'&&this.jump===0&&this.player.alive){this.jumpVel=5;this.jump=.001;}
      if(e.code==='Tab')this.showScoreboard();
      if(e.code==='ArrowRight'&&!this.player.alive)this.nextSpectator();
    });
    document.addEventListener('keyup',e=>{this.keys.delete(e.code);if(e.code==='Tab')$('scoreboard').classList.add('hidden');});
    addEventListener('blur',()=>{this.keys.clear();this.mouse=false;this.aim=false;if(this.running&&!this.paused&&!this.shopOpen)this.pause();});
    this.renderer.domElement.addEventListener('mousedown',e=>{
      if(!this.running||this.paused||this.shopOpen)return;
      if(e.button===0){this.mouse=true;this.dragging=true;if(document.pointerLockElement!==this.renderer.domElement)this.lock();}
      if(e.button===2)this.aim=true;
    });
    document.addEventListener('mouseup',e=>{if(e.button===0){this.mouse=false;this.dragging=false;}if(e.button===2)this.aim=false;});
    document.addEventListener('mousemove',e=>{
      if(!this.running||this.paused||this.shopOpen||!this.player.alive)return;
      if(document.pointerLockElement===this.renderer.domElement||this.dragging){
        this.yaw-=e.movementX*.0022*prefs.sensitivity;this.pitch=Math.max(-1.4,Math.min(1.4,this.pitch-e.movementY*.0022*prefs.sensitivity));
      }
    });
    document.addEventListener('pointerlockchange',()=>{
      if(!document.pointerLockElement&&this.running&&!this.shopOpen&&!this.paused&&!this.lostLockExpected)this.pause();
      this.lostLockExpected=false;
    });
    this.renderer.domElement.addEventListener('wheel',e=>{if(this.running&&!this.paused&&!this.shopOpen){e.preventDefault();this.switchSlot((this.slot+(e.deltaY>0?1:2))%3);}},{passive:false});
  }
  private lock(){try{const result=this.renderer.domElement.requestPointerLock();if(result&&'catch'in result)result.catch(()=>{});}catch{/* Drag-to-look is available if pointer lock is blocked. */}}
  private unlock(){if(document.pointerLockElement){this.lostLockExpected=true;document.exitPointerLock();}}
  resize(){
    this.renderer.setSize(innerWidth,innerHeight);for(const c of [this.camera,this.menuCamera,this.viewCamera]){c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix();}
  }
  setQuality(){this.renderer.setPixelRatio(Math.min(devicePixelRatio,prefs.quality==='high'?1.6:.8));this.renderer.shadowMap.enabled=prefs.quality==='high';this.renderer.shadowMap.needsUpdate=true;}
  start(){
    this.mode=prefs.mode;this.running=true;this.paused=false;this.shopOpen=false;this.menuSoldier.visible=false;this.menuLight.visible=false;
    this.score=[0,0];this.ffaScores.clear();this.round=1;this.money=800;this.kills=0;this.deaths=0;
    this.inventory=[prefs.primary,prefs.secondary,'knife'];this.actors.forEach(a=>this.world.scene.remove(a.model));this.actors=[];
    this.player=this.makeActor(0,'You',prefs.team,new T.Vector3(),prefs.primary);this.player.model.visible=false;
    if(this.mode==='ffa'){
      for(let i=0;i<10;i++)this.makeActor(i+1,NAMES[i],i%2?'CT':'T',new T.Vector3(),i%2?'m4a1':'ak47');
    }else{
      const [friends,enemies]=modeBotCount(this.mode),other=prefs.team==='CT'?'T':'CT';
      for(let i=0;i<friends;i++)this.makeActor(i+1,NAMES[i],prefs.team,new T.Vector3(),prefs.team==='CT'?'m4a1':'ak47');
      for(let i=0;i<enemies;i++)this.makeActor(friends+i+1,NAMES[friends+i],other,new T.Vector3(),other==='CT'?'m4a1':'ak47');
    }
    this.setQuality();this.nextRound();$('pause-menu').classList.add('hidden');$('game').classList.remove('hidden');$('menu').classList.add('hidden');
    this.audio??=new AudioContext();this.audio.resume().catch(()=>{});
  }
  private makeActor(id:number,name:string,team:Team,pos:T.Vector3,gun:string){
    const model=makeSoldier(team);this.world.scene.add(model);
    const a:Actor={id,name,team,pos,model,hp:100,armor:100,gun:weapon(gun),ammo:weapon(gun).mag,cooldown:0,reload:0,alive:true,kills:0,roundKills:0,deaths:0,path:[],think:0,target:-1,flash:0,utility:4+Math.random()*8,plant:0,respawn:0,yaw:0};this.actors.push(a);return a;
  }
  private spawn(a:Actor){
    let base=this.world.spawns[a.team==='CT'?0:1].clone();
    if(this.mode==='ffa'||this.mode==='deathmatch'){
      for(let k=0;k<60;k++){const p=new T.Vector3((Math.random()-.5)*68,0,(Math.random()-.5)*68);if(!collides(this.world,p.x,p.z,.6)&&this.actors.every(o=>!o.alive||o.id===a.id||o.pos.distanceTo(p)>10)){base=p;break;}}
    }
    a.pos.copy(nearestWalkable(this.world,base.add(new T.Vector3((Math.random()-.5)*5,0,(Math.random()-.5)*3))));
    a.hp=100;a.armor=100;a.alive=true;a.ammo=a.gun.mag;a.cooldown=.4;a.reload=0;a.flash=0;a.path=[];a.think=0;a.plant=0;a.utility=5+Math.random()*14;
    a.model.position.copy(a.pos);a.model.visible=a.id!==0;
    a.yaw=a.team==='CT'?Math.PI:0;
    a.model.rotation.set(0,a.yaw,0);
    if(a.id===0){this.yaw=a.team==='CT'?Math.PI:0;this.pitch=0;this.jump=0;this.jumpVel=0;this.aim=false;this.reloadTime=0;this.ammo=this.inventory.map(id=>weapon(id).mag);this.reserve=[120,60,0];this.switchSlot(0);}
  }
  private nextRound(){
    this.phase='buy';this.phaseTime=12;this.roundTime=this.mode==='deathmatch'?90:115;this.specId=-1;this.objectiveProgress=0;
    if(this.bomb){this.world.scene.remove(this.bomb.mesh);this.bomb=null;}
    this.fires.forEach(f=>this.world.scene.remove(f.group));this.fires=[];this.flashes=1;this.mollies=1;
    for(const a of this.actors){a.roundKills=0;this.spawn(a);}
    const ts=this.actors.filter(a=>a.team==='T');this.bombCarrier=ts[Math.floor(Math.random()*ts.length)]?.id??0;
    $('round-banner').classList.add('hidden');$('spectate').classList.add('hidden');$('buy-hint').classList.remove('hidden');$('kill-feed').innerHTML='';$('objective').innerHTML='';
    this.openShop();
  }
  private setViewWeapon(){
    this.viewScene.remove(this.viewGun);this.viewGun=makeWeapon(this.inventory[this.slot],prefs.skins[this.inventory[this.slot]]||0,prefs.knife);
    const sleeve=new T.MeshStandardMaterial({color:prefs.team==='CT'?0x3d5157:0x9d8867,roughness:.9});
    const glove=new T.MeshStandardMaterial({color:0x253135,roughness:.85});
    const hand=box(this.viewGun,.12,.13,.18,.025,-.13,.12,glove,true);
    hand.rotation.x=.2;const arm=box(this.viewGun,.16,.38,.16,.09,-.33,.27,sleeve,true);arm.rotation.x=.6;
    if(this.slot!==2){box(this.viewGun,.11,.1,.16,-.04,-.09,-.24,glove,true);const support=box(this.viewGun,.15,.42,.15,-.13,-.27,-.10,sleeve,true);support.rotation.x=-.65;support.rotation.z=-.25;}
    this.viewGun.position.set(.26,-.27,-.56);this.viewScene.add(this.viewGun);
  }
  private switchSlot(slot:number){this.slot=slot;this.reloadTime=0;this.inspect=0;this.aim=false;if(this.player){this.player.gun=weapon(this.inventory[slot]);this.player.ammo=this.ammo[slot];}this.setViewWeapon();}
  private reload(){
    const w=weapon(this.inventory[this.slot]);if(!this.player.alive||this.slot===2||this.reloadTime>0||this.ammo[this.slot]>=w.mag||this.reserve[this.slot]<=0)return;
    this.reloadTime=w.type==='sniper'?2.8:2.2;this.sound(600,.04,.04,'sine');
  }
  private sound(freq:number,duration:number,volume=.12,type:OscillatorType='sawtooth'){
    if(!this.audio||prefs.volume===0)return;const ctx=this.audio;const o=ctx.createOscillator(),gain=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.2),ctx.currentTime+duration);gain.gain.setValueAtTime(volume*prefs.volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(gain);gain.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);
  }
  private lineClear(from:T.Vector3,to:T.Vector3,penetrate=false):{clear:boolean;through:boolean}{
    const dir=to.clone().sub(from),len=dir.length();const ray=new T.Raycaster(from,dir.normalize(),.1,len);const hits=ray.intersectObjects(this.world.surfaces,false);
    if(!hits.length)return {clear:true,through:false};
    if(penetrate&&hits.every(h=>h.object.userData.penetrable))return {clear:true,through:true};
    return {clear:false,through:false};
  }
  private enemies(a:Actor){return this.actors.filter(b=>b.alive&&b.id!==a.id&&(this.mode==='ffa'||b.team!==a.team));}
  private firePlayer(){
    const a=this.player,w=a.gun;if(!a.alive||a.cooldown>0||this.reloadTime>0||this.inspect>0||this.phase!=='live')return;
    if(w.type!=='knife'&&this.ammo[this.slot]<=0){this.reload();return;}
    a.cooldown=w.rate;this.inspect=0;
    if(w.type!=='knife')this.ammo[this.slot]--;
    this.kick=w.type==='knife'?.16:.055;this.sound(w.type==='knife'?220:95+Math.random()*60,.09,w.type==='knife'?.1:.23,'sawtooth');
    const origin=this.camera.position.clone();
    const dir=new T.Vector3();this.camera.getWorldDirection(dir);
    const spread=w.spread*(this.aim?.5:1)*(1+this.moveAmount*5)*(this.crouch>.5?.55:1)*(this.jump>0?6:1);
    dir.x+=(Math.random()-.5)*spread;dir.y+=(Math.random()-.5)*spread;dir.z+=(Math.random()-.5)*spread;dir.normalize();
    const ray=new T.Raycaster(origin,dir,.1,w.type==='knife'?2.4:120);
    const hits=ray.intersectObjects(this.world.surfaces,false);let limit=hits.length?hits[0].distance:120;let through=false;
    if(hits.length&&hits[0].object.userData.penetrable&&w.type!=='knife'){
      through=true;limit=hits.find(h=>!h.object.userData.penetrable)?.distance??120;
    }
    let victim:Actor|undefined,dist=limit,headshot=false;
    for(const b of this.enemies(a)){
      for(const [height,radius,head] of [[1.86,.23,true],[1.2,.37,false],[.55,.28,false]] as [number,number,boolean][]){
        const p=b.pos.clone();p.y=height;const hit=ray.ray.intersectSphere(new T.Sphere(p,radius),new T.Vector3());
        if(hit){const d=hit.distanceTo(origin);if(d<dist){victim=b;dist=d;headshot=head;}}
      }
    }
    if(victim)this.hit(a,victim,w.damage*(headshot?3.2:1)*(through?.45:1),headshot,through);
    this.tracer(origin.clone().add(new T.Vector3(.2,-.15,0)),origin.clone().addScaledVector(dir,Math.min(dist,90)),a.team);
    if(w.type!=='knife')this.pitch=Math.min(1.4,this.pitch+.008+(w.type==='sniper'?.04:0));
  }
  private hit(attacker:Actor,victim:Actor,damage:number,headshot=false,wallbang=false){
    if(!victim.alive)return;
    const reduction=victim.armor>0?.82:1;victim.hp-=damage*reduction;victim.armor=Math.max(0,victim.armor-damage*.15);
    if(victim.id===0){this.damageFlash=.4;this.sound(65,.12,.18,'triangle');}
    if(victim.hp<=0){
      victim.hp=0;victim.alive=false;victim.deaths++;victim.model.rotation.z=Math.PI/2;victim.model.position.y=.25;victim.respawn=3;
      attacker.kills++;attacker.roundKills++;
      if(attacker.id===0){this.kills++;this.money=Math.min(16000,this.money+300);this.killToast=3;
        $('kill-card').innerHTML=`<span class="kill-emblem">${icon('skull',30)}</span><div><small>${headshot?'HEADSHOT':wallbang?'WALLBANG':'ENEMY ELIMINATED'}</small><strong>${victim.name}</strong></div><span class="kill-count">${attacker.roundKills}</span>`;$('kill-card').classList.remove('hidden');this.sound(800,.12,.2,'sine');}
      if(victim.id===0){this.deaths++;this.specId=attacker.id;}
      const feed=document.createElement('div');feed.className=`feed-row ${attacker.id===0?'player-kill':''}`;feed.innerHTML=`<span class="${attacker.team.toLowerCase()}-text">${attacker.name}</span><span class="feed-weapon">${gunSVG(attacker.gun.id)}</span>${wallbang?icon('shield',13):''}${headshot?icon('crosshair',14):''}<span class="${victim.team.toLowerCase()}-text">${victim.name}</span>`;$('kill-feed').prepend(feed);setTimeout(()=>feed.remove(),6500);
      if(victim.id===0){$('spectate').classList.remove('hidden');}
      if(this.specId===victim.id&&victim.id!==0)this.nextSpectator();
    }
  }
  private tracer(from:T.Vector3,to:T.Vector3,team:Team){
    const line=new T.Line(new T.BufferGeometry().setFromPoints([from,to]),new T.LineBasicMaterial({color:team==='CT'?0xffe5a1:0xffc87d,transparent:true,opacity:.6}));this.world.scene.add(line);this.tracers.push({line,time:.055});
  }
  private nextSpectator(){const alive=this.actors.filter(a=>a.alive&&a.id!==0);if(!alive.length)return;const i=alive.findIndex(a=>a.id===this.specId);this.specId=alive[(i+1)%alive.length].id;}
  private tickBot(a:Actor,dt:number){
    if(!a.alive){if(this.mode==='deathmatch'&&this.phase==='live'){a.respawn-=dt;if(a.respawn<=0)this.spawn(a);}return;}
    a.cooldown=Math.max(0,a.cooldown-dt);a.flash=Math.max(0,a.flash-dt);a.think-=dt;a.utility-=dt;
    if(a.reload>0){a.reload-=dt;if(a.reload<=0)a.ammo=a.gun.mag;}
    if(this.phase!=='live')return;
    const skill=this.mode==='wingman'?Math.min(.85,.3+prefs.elo/3200):.52;
    if(a.think<=0){
      a.think=.22+Math.random()*.25;
      const origin=a.pos.clone().add(new T.Vector3(0,1.6,0));
      // Every opponent is evaluated by distance and sight, including the player.
      const targets=this.enemies(a).map(b=>{const d=a.pos.distanceTo(b.pos);const sight=this.lineClear(origin,b.pos.clone().add(new T.Vector3(0,1.3,0)),d<18);return {b,d,...sight};}).filter(t=>t.d<42&&t.clear).sort((x,y)=>x.d-y.d);
      a.target=targets[0]?.b.id??-1;
      if(a.target<0||a.pos.distanceTo(this.actors.find(b=>b.id===a.target)!.pos)>20){
        if(!a.path.length||Math.random()<.06){
          let destination:T.Vector3;
          if(this.bomb)destination=this.bomb.pos.clone().add(new T.Vector3((a.id%3-1)*3,0,(a.id%2)*3));
          else if(this.mode==='deathmatch'||this.mode==='ffa')destination=new T.Vector3((Math.random()-.5)*66,0,(Math.random()-.5)*66);
          else if(a.team==='T')destination=this.world.sites[a.id%2].clone();
          else destination=this.roundTime>88?new T.Vector3((a.id%3-1)*24,0,-17):this.world.spawns[1].clone();
          a.path=findPath(this.world,a.pos,destination);
        }
      }
    }
    const target=this.actors.find(b=>b.id===a.target&&b.alive);
    if(target&&a.flash<=0){
      const delta=target.pos.clone().sub(a.pos),distance=delta.length();a.yaw=Math.atan2(delta.x,delta.z);
      if(a.cooldown<=0&&a.reload<=0){
        if(a.ammo<=0){a.reload=2.2;}
        else{
          a.cooldown=a.gun.rate;a.ammo--;
          const origin=a.pos.clone().add(new T.Vector3(0,1.45,0)),point=target.pos.clone().add(new T.Vector3(0,1.35,0));
          const sight=this.lineClear(origin,point,true);
          if(sight.clear){
            this.tracer(origin,point,a.team);
            const moving=a.path.length>0?1.8:1;
            const accuracy=Math.max(.06,(skill-distance*.006)/moving);
            if(Math.random()<accuracy)this.hit(a,target,a.gun.damage*(sight.through?.45:1),false,sight.through);
            if(distance<22)this.sound(95,.065,.035);
          }
        }
      }
      if(a.utility<=0&&distance<22){a.utility=25;this.useUtility(a,Math.random()>.5?'flash':'molly',target.pos.clone());}
      // Strafe between shots, but stop often enough to regain accuracy.
      if(distance<20){if(Math.sin(performance.now()*.002+a.id)>.4){const strafe=new T.Vector3(delta.z,0,-delta.x).normalize().multiplyScalar((a.id%2?1:-1)*dt*2);this.move(a,strafe.x,strafe.z);}a.path=[];}
    }
    if(a.path.length&&(!target||a.pos.distanceTo(target.pos)>20||a.flash>0)){
      const delta=a.path[0].clone().sub(a.pos),d=delta.length();if(d<.35)a.path.shift();else{delta.normalize().multiplyScalar(dt*(a.flash>0?1.8:3.7));this.move(a,delta.x,delta.z);if(!target)a.yaw=Math.atan2(delta.x,delta.z);}
    }
    if(this.isBombMode()){
      if(!this.bomb&&a.id===this.bombCarrier&&this.world.sites.some(s=>s.distanceTo(a.pos)<6)&&!target){a.plant+=dt;if(a.plant>3.2)this.plantBomb(a);}
      if(this.bomb&&a.team==='CT'&&a.pos.distanceTo(this.bomb.pos)<3&&!target){a.plant+=dt;if(a.plant>5)this.endRound('CT','Bomb defused',a);}
    }
    a.model.position.copy(a.pos);a.model.rotation.set(0,a.yaw,0);
    a.model.position.y=a.path.length?Math.sin(performance.now()*.012+a.id)*.025:0;
  }
  private move(a:Actor,dx:number,dz:number){if(!collides(this.world,a.pos.x+dx,a.pos.z))a.pos.x+=dx;if(!collides(this.world,a.pos.x,a.pos.z+dz))a.pos.z+=dz;}
  private isBombMode(){return !['deathmatch','ffa'].includes(this.mode);}
  private plantBomb(a:Actor){
    if(this.bomb)return;const mesh=new T.Group();box(mesh,.35,.13,.24,0,.08,0,0x454a37);box(mesh,.10,.02,.08,0,.16,0,0xb93625);mesh.position.copy(a.pos);this.world.scene.add(mesh);this.bomb={pos:a.pos.clone(),time:40,mesh};a.plant=0;this.sound(1000,.2,.2,'sine');$('objective').innerHTML=`${icon('bomb',18)} BOMB PLANTED <span>40</span>`;this.objectiveProgress=0;
  }
  private throwUtility(type:'flash'|'molly'){
    if(this.phase!=='live'||!this.player.alive)return;if(type==='flash'&&this.flashes<=0||type==='molly'&&this.mollies<=0)return;
    if(type==='flash')this.flashes--;else this.mollies--;
    const direction=new T.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));const to=this.player.pos.clone().addScaledVector(direction,13);
    this.useUtility(this.player,type,nearestWalkable(this.world,to));
  }
  private useUtility(a:Actor,type:'flash'|'molly',to:T.Vector3){
    const projectile=new T.Mesh(new T.SphereGeometry(.08,8,8),new T.MeshStandardMaterial({color:type==='flash'?0xc0c5b4:0x73532a}));const from=a.pos.clone().add(new T.Vector3(0,1.5,0));this.world.scene.add(projectile);
    let elapsed=0;const fly=()=>{
      elapsed+=.04;projectile.position.lerpVectors(from,to,Math.min(elapsed/.7,1));projectile.position.y+=Math.sin(elapsed/.7*Math.PI)*4;
      if(elapsed<.7&&this.running){setTimeout(fly,40);return;}this.world.scene.remove(projectile);
      if(!this.running||this.phase!=='live')return;
      if(type==='flash'){
        for(const b of this.actors)if(b.alive&&b.pos.distanceTo(to)<17&&this.lineClear(to.clone().add(new T.Vector3(0,.5,0)),b.pos.clone().add(new T.Vector3(0,1.5,0))).clear)b.flash=3.6*(1-b.pos.distanceTo(to)/24);
        if(this.player.pos.distanceTo(to)<20)this.sound(1800,.6,.15,'sine');
      }else{
        const group=new T.Group();group.position.copy(to);
        for(let i=0;i<16;i++){const flame=new T.Mesh(new T.ConeGeometry(.32,.7+Math.random(),5),new T.MeshBasicMaterial({color:i%2?0xffae28:0xef4b11,transparent:true,opacity:.75}));flame.position.set((Math.random()-.5)*4,.4,(Math.random()-.5)*4);group.add(flame);}
        const light=new T.PointLight(0xff7520,4,9);light.position.y=1;group.add(light);this.world.scene.add(group);this.fires.push({pos:to,time:7,owner:a,group});
      }
    };fly();
  }
  private tick(dt:number){
    if(this.paused)return;
    if(this.phase==='end'){
      this.phaseTime-=dt;this.updateCamera(dt);this.updateHud();if(this.phaseTime<=0){if(this.score.some(s=>s>=12)||[...this.ffaScores.values()].some(s=>s>=12))this.matchFinished();else{this.round++;this.nextRound();}}return;
    }
    if(this.phase==='buy'){
      this.phaseTime-=dt;$('buy-countdown').textContent=Math.ceil(this.phaseTime).toString();
      if(this.phaseTime<=0){this.phase='live';this.closeShop(false);$('buy-hint').classList.add('hidden');this.lock();}
    }else{
      this.roundTime-=dt;
      if(this.bomb){this.bomb.time-=dt;const b=$('objective').querySelector('span');if(b)b.textContent=Math.ceil(this.bomb.time).toString();if(Math.floor(this.bomb.time*2)!==Math.floor((this.bomb.time+dt)*2))this.sound(850,.05,.06,'sine');if(this.bomb.time<=0)this.endRound('T','Target destroyed',this.actors.find(a=>a.id===this.bombCarrier));}
      if(this.roundTime<=0&&!this.bomb){
        if(this.mode==='deathmatch'){const ct=this.actors.filter(a=>a.team==='CT').reduce((s,a)=>s+a.roundKills,0),t=this.actors.filter(a=>a.team==='T').reduce((s,a)=>s+a.roundKills,0);this.endRound(ct>=t?'CT':'T','Deathmatch complete');}
        else if(this.mode==='ffa'){const best=[...this.actors].filter(a=>a.alive).sort((a,b)=>b.hp-a.hp)[0];if(best)this.endRound(best.team,'Round time elapsed',best);}
        else this.endRound('CT','Time expired');
      }
    }
    if(this.phase==='live'){
      this.player.cooldown=Math.max(0,this.player.cooldown-dt);
      if(this.player.alive&&!this.shopOpen){
        const crouching=this.keys.has('KeyC');this.crouch=T.MathUtils.lerp(this.crouch,crouching?1:0,dt*10);
        const speed=(this.slot===2?6:4.6)*(crouching?.48:1)*(this.aim?.7:1)*(this.keys.has('ShiftLeft')?.55:1);
        let x=0,z=0;if(this.keys.has('KeyW'))z--;if(this.keys.has('KeyS'))z++;if(this.keys.has('KeyA'))x--;if(this.keys.has('KeyD'))x++;
        const len=Math.hypot(x,z)||1;this.moveAmount=(x||z)?1:0;
        this.move(this.player,(x/len*Math.cos(this.yaw)+z/len*Math.sin(this.yaw))*speed*dt,(z/len*Math.cos(this.yaw)-x/len*Math.sin(this.yaw))*speed*dt);
        this.player.yaw=this.yaw+Math.PI;
        if(this.mouse)this.firePlayer();
        if(this.reloadTime>0){this.reloadTime-=dt;if(this.reloadTime<=0){const add=Math.min(weapon(this.inventory[this.slot]).mag-this.ammo[this.slot],this.reserve[this.slot]);this.ammo[this.slot]+=add;this.reserve[this.slot]-=add;}}
        if(this.keys.has('KeyE')&&this.isBombMode()){
          if(this.player.team==='T'&&!this.bomb&&this.bombCarrier===0&&this.world.sites.some(s=>s.distanceTo(this.player.pos)<6)){
            this.objectiveProgress+=dt;$('interaction').innerHTML=`PLANTING C4 <progress value="${this.objectiveProgress}" max="3.2"></progress>`;if(this.objectiveProgress>=3.2)this.plantBomb(this.player);
          }else if(this.player.team==='CT'&&this.bomb&&this.player.pos.distanceTo(this.bomb.pos)<3){
            this.objectiveProgress+=dt;$('interaction').innerHTML=`DEFUSING C4 <progress value="${this.objectiveProgress}" max="5"></progress>`;if(this.objectiveProgress>=5)this.endRound('CT','Bomb defused',this.player);
          }
        }else{this.objectiveProgress=0;$('interaction').innerHTML=this.isBombMode()?(this.bomb&&this.player.team==='CT'&&this.player.pos.distanceTo(this.bomb.pos)<3?'HOLD E TO DEFUSE':this.player.team==='T'&&this.bombCarrier===0&&!this.bomb?'C4 CARRIER · HOLD E AT A OR B TO PLANT':''):'';}
      }else if(!this.player.alive&&this.mode==='deathmatch'){
        this.player.respawn-=dt;if(this.player.respawn<=0){this.spawn(this.player);$('spectate').classList.add('hidden');}
      }
      for(const a of this.actors)if(a.id!==0)this.tickBot(a,dt);
      // Dropped C4 is automatically recovered by the nearest living attacker.
      const carrier=this.actors.find(a=>a.id===this.bombCarrier);
      if(this.isBombMode()&&!this.bomb&&!carrier?.alive){const next=this.actors.filter(a=>a.alive&&a.team==='T').sort((a,b)=>a.pos.distanceTo(carrier?.pos??new T.Vector3())-b.pos.distanceTo(carrier?.pos??new T.Vector3()))[0];if(next)this.bombCarrier=next.id;}
      const alive=this.actors.filter(a=>a.alive);
      if(this.mode==='ffa'){if(alive.length===1)this.endRound(alive[0].team,'Last player standing',alive[0]);}
      else if(this.mode!=='deathmatch'){
        if(!alive.some(a=>a.team==='CT'))this.endRound('T','Counter-Terrorists eliminated');
        else if(!alive.some(a=>a.team==='T')&&!this.bomb)this.endRound('CT','Terrorists eliminated');
      }
    }
    for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.time-=dt;f.group.children.forEach((m,j)=>{if(m instanceof T.Mesh)m.scale.y=.8+Math.sin(performance.now()*.014+j)*.25;});for(const a of this.actors)if(a.alive&&a.pos.distanceTo(f.pos)<2.7)this.hit(f.owner,a,dt*28);if(f.time<=0){this.world.scene.remove(f.group);this.fires.splice(i,1);}}
    this.jumpVel-=dt*15;this.jump=Math.max(0,this.jump+this.jumpVel*dt);if(this.jump===0)this.jumpVel=0;
    this.inspect=Math.max(0,this.inspect-dt);this.kick=Math.max(0,this.kick-dt*.5);this.killToast-=dt;if(this.killToast<=0)$('kill-card').classList.add('hidden');
    this.damageFlash=Math.max(0,this.damageFlash-dt);this.player.flash=Math.max(0,this.player.flash-dt);
    this.updateCamera(dt);this.updateHud();
  }
  private updateCamera(dt:number){
    const a=this.player.alive?this.player:this.actors.find(a=>a.id===this.specId&&a.alive);
    if(!a)return;
    this.camera.position.copy(a.pos).add(new T.Vector3(0,1.72+(this.player.alive?this.jump-this.crouch*.52:0),0));
    this.camera.rotation.order='YXZ';
    this.camera.rotation.y=this.player.alive?this.yaw:a.yaw+Math.PI;this.camera.rotation.x=this.player.alive?this.pitch:0;
    const desired=this.aim&&this.player.alive?(this.player.gun.type==='sniper'?28:52):76;
    this.camera.fov=T.MathUtils.lerp(this.camera.fov,desired,Math.min(1,dt*14));this.camera.updateProjectionMatrix();
    const t=performance.now()*.008,bob=this.moveAmount&&this.player.alive?Math.sin(t)*.009:0;
    this.viewGun.position.set(this.aim?.015:.27,-.27+Math.abs(bob)-this.kick,-.57+this.kick);
    this.viewGun.rotation.set(this.kick*2,0,bob);
    if(this.reloadTime>0){this.viewGun.rotation.z=-.6+Math.sin(this.reloadTime*5)*.1;this.viewGun.position.y-=.09;}
    if(this.inspect>0){
      const p=1-this.inspect/2.4,s=Math.sin(p*Math.PI);
      this.viewGun.position.set(.1,-.15,-.5);this.viewGun.rotation.set(.2*s,1.1*s,-.35*s);
      if(this.slot===2&&prefs.knife==='karambit'){this.viewGun.rotation.x=p*Math.PI*6;this.viewGun.rotation.y=.4*s;}
      else if(this.slot===2&&prefs.knife==='butterfly'){this.viewGun.rotation.z=p*Math.PI*4;const h=this.viewGun.getObjectByName('butterflyHandle'),h2=this.viewGun.getObjectByName('butterflyHandle2');if(h)h.rotation.x=Math.sin(p*Math.PI*4)*2.5;if(h2)h2.rotation.x=-Math.sin(p*Math.PI*6)*2.2;}
      else if(this.slot===1){this.viewGun.rotation.y=1.8*s;this.viewGun.rotation.z=.3*Math.sin(p*Math.PI*2);}
      else if(this.player.gun.type==='sniper'){this.viewGun.rotation.z=-.6*s;this.viewGun.rotation.y=.6*s;}
    }
    if(this.inspect<=0&&this.slot===2&&prefs.knife==='butterfly'){const h=this.viewGun.getObjectByName('butterflyHandle'),h2=this.viewGun.getObjectByName('butterflyHandle2');if(h)h.rotation.x=0;if(h2)h2.rotation.x=0;}
    if(this.slot===2&&this.kick>0)this.viewGun.rotation.z-=this.kick*8;
  }
  private updateHud(){
    $('ct-score').textContent=String(this.mode==='ffa'?this.ffaScores.get(0)||0:this.score[0]);$('t-score').textContent=String(this.mode==='ffa'?Math.max(0,...[...this.ffaScores].filter(([id])=>id!==0).map(([,score])=>score)):this.score[1]);
    const seconds=this.phase==='buy'?Math.ceil(this.phaseTime):Math.max(0,Math.ceil(this.roundTime));
    $('timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;$('timer').classList.toggle('danger',seconds<20&&this.phase==='live');
    $('round-label').textContent=`ROUND ${this.round}`;$('phase-label').textContent=this.phase==='buy'?'BUY TIME':this.mode==='wingman'?`${prefs.elo} ELO`:this.mode==='ffa'?'YOU / LEADER':'FIRST TO 12';
    for(const team of ['CT','T'] as Team[])$(team==='CT'?'ct-alive':'t-alive').innerHTML=this.actors.filter(a=>a.team===team).map(a=>`<i class="avatar-mini ${a.alive?'':'dead'}">${a.alive?icon('user',15):icon('skull',14)}</i>`).join('');
    const a=this.player.alive?this.player:this.actors.find(a=>a.id===this.specId)||this.player;
    $('health').textContent=String(Math.ceil(a.hp));$('armor').textContent=String(Math.ceil(a.armor));$('health').classList.toggle('danger',a.hp<30);
    $('money').textContent=`$${this.money.toLocaleString()}`;$('weapon-name').textContent=this.player.alive?weapon(this.inventory[this.slot]).name:a.gun.name;
    $('ammo').textContent=this.slot===2&&this.player.alive?'—':String(this.player.alive?this.ammo[this.slot]:a.ammo);$('reserve').textContent=this.reloadTime>0?'RELOADING':String(this.reserve[this.slot]);
    $('team-label').textContent=this.mode==='ffa'?'FREE FOR ALL':prefs.team==='CT'?'COUNTER-TERRORIST':'TERRORIST';
    $('utility-hud').innerHTML=`<span><kbd>G</kbd> FLASH <b>${this.flashes}</b></span><span><kbd>H</kbd> MOLOTOV <b>${this.mollies}</b></span>${this.isBombMode()&&this.bombCarrier===0&&!this.bomb?`<span class="bomb-carrier">${icon('bomb',15)} C4</span>`:''}`;
    $('crosshair').style.setProperty('--gap',`${this.moveAmount?12:5}px`);$('crosshair').style.setProperty('--crosshair',prefs.crosshair);$('crosshair').classList.toggle('hidden',!this.player.alive||this.shopOpen);
    $('damage-overlay').style.opacity=String(this.damageFlash);$('flash-overlay').style.opacity=String(Math.min(1,this.player.flash/1.5));
    if(!this.player.alive)$('spectate').innerHTML=`<small>SPECTATING</small><strong class="${a.team.toLowerCase()}-text">${a.name}</strong><span>${this.mode==='deathmatch'?`RESPAWNING IN ${Math.ceil(this.player.respawn)}`:'RIGHT ARROW TO SWITCH PLAYER'}</span>`;
    $('location-name').textContent=a.pos.z>20?'T START':a.pos.z<-23?(a.pos.x>10?'BOMB SITE A':a.pos.x<-10?'BOMB SITE B':'CT START'):Math.abs(a.pos.x)<7?'MID':a.pos.x>0?'LONG A':'B TUNNELS';
    if(this.frame%5===0)this.drawRadar(a);
    if(this.frame%3===0){$('teammates').innerHTML=this.player.alive&&this.mode!=='ffa'?this.actors.filter(b=>b.alive&&b.id!==0&&b.team===prefs.team&&b.pos.distanceTo(this.player.pos)<38).map(b=>{const p=b.pos.clone().add(new T.Vector3(0,2.35,0)).project(this.camera);if(p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return '';return `<span class="teammate-tag" style="left:${(p.x*.5+.5)*100}%;top:${(-p.y*.5+.5)*100}%"><i></i>${b.name}<small>${Math.ceil(b.hp)}%</small></span>`;}).join(''):'';}
  }
  private drawRadar(a:Actor){
    const c=$('radar') as HTMLCanvasElement,x=c.getContext('2d')!;x.clearRect(0,0,220,220);x.fillStyle='#152126d9';x.fillRect(0,0,220,220);
    const map=(p:number)=>(p+40)/80*220;
    x.fillStyle='#727c78';for(const s of this.world.solids){x.fillStyle=s.penetrable?'#62675b':'#76817d';x.fillRect(map(s.x-s.w/2),map(s.z-s.d/2),s.w/80*220,s.d/80*220);}
    x.font='bold 15px Arial';x.fillStyle='#d2b16b';for(let i=0;i<2;i++){const s=this.world.sites[i];x.fillText(i?'B':'A',map(s.x)-5,map(s.z)+5);}
    for(const b of this.actors.filter(b=>b.alive&&(b.team===prefs.team||b.id===0))){x.beginPath();x.arc(map(b.pos.x),map(b.pos.z),b.id===a.id?4:2.8,0,Math.PI*2);x.fillStyle=b.id===0?'#ecdfaf':'#80b8da';x.fill();}
    if(this.bomb){x.fillStyle='#ed7147';x.fillRect(map(this.bomb.pos.x)-3,map(this.bomb.pos.z)-3,6,6);}
    x.save();x.translate(map(a.pos.x),map(a.pos.z));x.rotate(-this.yaw);x.strokeStyle='#f2e5bd';x.lineWidth=1.5;x.beginPath();x.moveTo(-6,-8);x.lineTo(0,-15);x.lineTo(6,-8);x.stroke();x.restore();
  }
  private endRound(team:Team,reason:string,mvp?:Actor){
    if(this.phase==='end')return;this.phase='end';this.phaseTime=6;this.mouse=false;this.closeShop(false);$('interaction').innerHTML='';$('objective').innerHTML='';$('buy-hint').classList.add('hidden');
    if(this.mode==='ffa'&&mvp)this.ffaScores.set(mvp.id,(this.ffaScores.get(mvp.id)||0)+1);
    else this.score[team==='CT'?0:1]++;
    const best=mvp||[...this.actors].filter(a=>a.team===team).sort((a,b)=>b.roundKills-a.roundKills)[0];
    const isWin=this.mode==='ffa'?best?.id===0:team===prefs.team;
    this.money=Math.min(16000,this.money+(isWin?3250:1900));
    if(this.mode==='wingman'){prefs.elo=Math.max(0,prefs.elo+(isWin?24:-18));savePrefs();}
    $('round-banner').innerHTML=`<div class="round-winner ${team.toLowerCase()}-text">${icon(team==='CT'?'shield':'wings',32)} ${this.mode==='ffa'?`${best?.name} wins the round`:team==='CT'?'COUNTER-TERRORISTS WIN':'TERRORISTS WIN'}</div><p>${reason}</p><div class="mvp-line">${icon('medal',25)}<span><b>MVP: ${best?.name||'Team'}</b><small>${best?.roundKills||0} eliminations this round ${this.mode==='wingman'?` · ${prefs.elo} ELO`:''}</small></span></div>`;
    $('round-banner').classList.remove('hidden');this.sound(isWin?660:220,.45,.15,'triangle');
  }
  private matchFinished(){
    this.paused=true;this.unlock();$('pause-menu').classList.remove('hidden');$('pause-menu').innerHTML=`<div class="pause-panel"><span class="eyebrow">MATCH COMPLETE</span><h1>${this.mode==='ffa'?([...this.ffaScores.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]===0?'VICTORY':'MATCH OVER'):this.score[prefs.team==='CT'?0:1]>=12?'VICTORY':'MATCH OVER'}</h1><p>${this.score[0]} : ${this.score[1]} · ${this.kills} kills · ${this.deaths} deaths</p><button id="again" class="primary-button">PLAY AGAIN ${icon('arrow')}</button><button id="finish-exit" class="secondary-button">BACK TO MAIN MENU</button></div>`;$('again').onclick=()=>this.start();$('finish-exit').onclick=()=>this.exit();
  }
  openShop(){
    if(!this.player.alive||this.phase!=='buy')return;this.shopOpen=true;this.mouse=false;this.unlock();
    $('shop').classList.remove('hidden');const guns=eligible(prefs.team).filter(w=>w.type!=='knife');
    $('shop').innerHTML=`<div class="shop-panel"><div class="panel-heading"><div><span class="eyebrow">ROUND ${this.round} · ${prefs.team==='CT'?'COUNTER-TERRORISTS':'TERRORISTS'}</span><h1>BUY MENU</h1></div><strong class="shop-wallet">$${this.money}</strong><button class="icon-button" id="close-shop" aria-label="Close buy menu">${icon('close')}</button></div><p class="shop-note">Your selected loadout is equipped. Buy a replacement or extra utility.</p><div class="buy-grid">${guns.map(w=>`<button class="buy-item" data-buy="${w.id}" ${w.price>this.money?'disabled':''}><span>${w.name}</span><div>${gunSVG(w.id)}</div><b>$${w.price}</b><small>${w.type.toUpperCase()}</small></button>`).join('')}<button class="buy-item utility" data-buy="armor"><span>Kevlar + Helmet</span><div>${icon('shield',48)}</div><b>$1,000</b></button><button class="buy-item utility" data-buy="flash"><span>Flashbang</span><div>${icon('bomb',40)}</div><b>$200</b></button><button class="buy-item utility" data-buy="molly"><span>Molotov</span><div>${icon('bomb',40)}</div><b>$400</b></button></div><div class="shop-footer"><span>BUY TIME RUNS AUTOMATICALLY · <kbd>B</kbd> TO CLOSE</span><button id="ready" class="primary-button">READY ${icon('arrow')}</button></div></div>`;
    $('close-shop').onclick=()=>this.closeShop();$('ready').onclick=()=>this.closeShop();
    $('shop').querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.buy!;const price=id==='armor'?1000:id==='flash'?200:id==='molly'?400:weapon(id).price;if(price>this.money)return;this.money-=price;
      if(id==='armor'){this.player.armor=100;this.player.hp=Math.min(100,this.player.hp);}
      else if(id==='flash')this.flashes++;else if(id==='molly')this.mollies++;
      else{const w=weapon(id),slot=w.type==='pistol'?1:0;this.inventory[slot]=id;this.ammo[slot]=w.mag;this.reserve[slot]=w.mag*4;this.switchSlot(slot);}
      this.sound(500,.06,.1,'sine');this.openShop();
    });
  }
  closeShop(lock=true){this.shopOpen=false;$('shop').classList.add('hidden');if(lock&&this.running&&!this.paused)this.lock();}
  pause(){
    if(!this.running)return;this.paused=true;this.mouse=false;this.keys.clear();this.unlock();$('pause-menu').classList.remove('hidden');
    $('pause-menu').innerHTML=`<div class="pause-panel"><span class="eyebrow">OFFLINE · DUST II</span><h1>PAUSED</h1><p>${this.mode.toUpperCase()} · ROUND ${this.round} · ${this.score[0]} : ${this.score[1]}</p><button id="resume" class="primary-button">RESUME GAME ${icon('arrow')}</button><button id="pause-controls" class="secondary-button">CONTROLS</button><button id="leave-game" class="text-button">LEAVE MATCH</button><div id="pause-control-list" class="hidden">${controlsMarkup()}</div></div>`;
    $('resume').onclick=()=>this.resume();$('leave-game').onclick=()=>this.exit();$('pause-controls').onclick=()=>$('pause-control-list').classList.toggle('hidden');
  }
  resume(){this.paused=false;$('pause-menu').classList.add('hidden');this.lock();}
  exit(){this.running=false;this.paused=false;this.unlock();this.mouse=false;this.keys.clear();this.actors.forEach(a=>a.model.visible=false);this.menuSoldier.visible=true;this.menuLight.visible=true;$('game').classList.add('hidden');$('menu').classList.remove('hidden');this.onExit();}
  private showScoreboard(){
    $('scoreboard').classList.remove('hidden');$('scoreboard').innerHTML=`<div class="scoreboard-panel"><span class="eyebrow">DUST II · FIRST TO 12</span><h1>${this.mode.toUpperCase()}</h1><div class="scoreboard-header"><span>PLAYER</span><span>K</span><span>D</span><span>ROUND WINS</span></div>${[...this.actors].sort((a,b)=>b.kills-a.kills).map(a=>`<div class="scoreboard-row ${a.id===0?'you':''} ${a.team.toLowerCase()}-text"><span>${!a.alive?icon('skull',15):icon('user',15)} ${a.name}</span><span>${a.kills}</span><span>${a.deaths}</span><span>${this.mode==='ffa'?this.ffaScores.get(a.id)||0:this.score[a.team==='CT'?0:1]}</span></div>`).join('')}<small>RELEASE TAB TO CLOSE</small></div>`;
  }
  mapPreview():string{
    const c=new T.PerspectiveCamera(58,1.8,.1,200);c.position.set(20,6,-20);c.lookAt(29,1,-31);
    const visible=this.menuSoldier.visible;this.menuSoldier.visible=false;const oldSize=this.renderer.getSize(new T.Vector2());this.renderer.setSize(720,400,false);this.renderer.render(this.world.scene,c);
    const image=this.renderer.domElement.toDataURL('image/jpeg',.85);this.renderer.setSize(oldSize.x,oldSize.y,false);this.menuSoldier.visible=visible;return image;
  }
  private loop(now:number){
    const dt=Math.min(.04,(now-this.last)/1000||.016);this.last=now;this.frame++;
    if(this.running){
      this.tick(dt);this.renderer.autoClear=true;
      if(this.frame%12===0)this.renderer.shadowMap.needsUpdate=true;
      const spec=this.actors.find(a=>a.id===this.specId);if(!this.player.alive&&spec)spec.model.visible=false;
      this.renderer.render(this.world.scene,this.camera);
      if(!this.player.alive&&spec)spec.model.visible=spec.alive;
      if(this.player.alive&&!this.shopOpen){this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.viewScene,this.viewCamera);this.renderer.autoClear=true;}
    }else if(this.menuSceneActive&&now-this.lastRender>33){
      this.lastRender=now;
      this.menuSoldier.position.y=Math.sin(now*.0008)*.012;this.menuSoldier.rotation.y=.16+Math.sin(now*.00015)*.04;
      this.renderer.render(this.world.scene,this.menuCamera);
    }
    for(let i=this.tracers.length-1;i>=0;i--){this.tracers[i].time-=dt;if(this.tracers[i].time<=0){this.world.scene.remove(this.tracers[i].line);this.tracers[i].line.geometry.dispose();(this.tracers[i].line.material as T.Material).dispose();this.tracers.splice(i,1);}}
    requestAnimationFrame(t=>this.loop(t));
  }
}
export function controlsMarkup(){return `<div class="controls-grid"><span>Move</span><b>W A S D</b><span>Look / Shoot</span><b>MOUSE / LEFT CLICK</b><span>Aim</span><b>RIGHT CLICK / Q</b><span>Crouch / Walk / Jump</span><b>C / SHIFT / SPACE</b><span>Primary / Secondary / Knife</span><b>1 / 2 / 3</b><span>Reload / Inspect</span><b>R / F</b><span>Buy menu</span><b>B</b><span>Plant / Defuse</span><b>HOLD E</b><span>Flashbang / Molotov</span><b>G / H</b><span>Scoreboard</span><b>HOLD TAB</b><span>Spectate next</span><b>RIGHT ARROW</b><span>Pause</span><b>ESC</b></div><p class="controls-note">Crouch uses C, not Ctrl, so moving forward won’t trigger the browser’s close-tab shortcut. Click the game to capture your mouse, or click and drag if your browser blocks pointer lock.</p>`;}
