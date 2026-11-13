import './index.css';
import { Game, controlsMarkup } from './game';
import { prefs, savePrefs, MODES, WEAPONS, SKINS, weapon, eligible, rankLabel, type Mode, type Team } from './data';
import { icon, gunSVG } from './icons';
import { makeSoldier } from './models';
import { mountWeaponPreview } from './preview';
import * as T from 'three';

const root=document.getElementById('root')!;
root.innerHTML=`
  <div id="scene"></div>
  <div id="menu">
    <div class="menu-shade"></div><div class="menu-grain"></div>
    <header class="topbar">
      <button class="brand" aria-label="Counter-Strike 2 home"><span>COUNTER<br>STRIKE</span><b>2</b></button>
      <nav class="main-nav" aria-label="Main navigation"><button data-page="play" class="active">PLAY</button><button data-page="loadout">LOADOUT</button><button data-page="inventory">INVENTORY</button><button data-page="briefing">FIELD GUIDE</button></nav>
      <div class="header-right"><button id="sound-toggle" class="icon-button" aria-label="Toggle sound">${icon('volume',21)}</button><button id="settings" class="icon-button" aria-label="Settings">${icon('settings',21)}</button><span class="header-divider"></span><button id="profile" class="player-profile"><div class="player-avatar">${icon('shield',25)}</div><span><b>Operator</b><small><i></i> READY TO PLAY</small></span>${icon('down',15)}</button></div>
    </header>
    <main id="menu-page"></main>
    <footer class="menu-footer"><div><i class="status-dot"></i> OFFLINE <span class="footer-separator">/</span> <span>LOCAL SESSION</span></div><span class="disclaimer">Unofficial fan-made browser game. Not affiliated with Valve.</span><button id="controls-button">${icon('help',15)} CONTROLS</button><span class="build-version">BUILD 1.0</span></footer>
  </div>
  <div id="game" class="hidden"></div>
  <div id="modal-root"></div>
  <div id="toast" role="status"></div>
`;
export const game=new Game(document.getElementById('scene')!);
const $=(id:string)=>document.getElementById(id)!;
let currentPage='play',currentCategory='all',selectedWeapon=prefs.primary;
let previewGun:T.Group|null=null;
let skinSelection=0;
let weaponPreview:ReturnType<typeof mountWeaponPreview>|null=null;
const mapImage=game.mapPreview();
game.onExit=()=>{showPage('play');};
const teamMark=(team:Team,size=24)=>icon(team==='CT'?'shield':'wings',size);
function toast(message:string){$('toast').textContent=message;$('toast').classList.add('visible');setTimeout(()=>$('toast').classList.remove('visible'),3000);}
function teamName(){return prefs.team==='CT'?'Counter-Terrorist':'Terrorist';}
function badgeMarkup(size=22){const name=prefs.badge;const type=name==='Global Offensive'?'wings':name==='Operation Phoenix'?'shield':'medal';const color=name==='10 Year Veteran'?'#c2b282':name==='5 Year Veteran'?'#adb6bd':name==='Operation Phoenix'?'#d48352':'#9bb7bd';return `<span title="${name}" style="color:${color}">${icon(type,size)}</span>`;}
function totalBots(){return prefs.mode==='casual'?'14':prefs.mode==='wingman'?'3':'10';}
function showPage(page:string){
  weaponPreview?.dispose();weaponPreview=null;
  currentPage=page;
  document.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  if(previewGun){game.world.scene.remove(previewGun);previewGun=null;}
  game.menuSoldier.visible=page==='play'||page==='briefing';
  game.menuSceneActive=page==='play'||page==='briefing';game.renderer.shadowMap.needsUpdate=true;
  game.menuCamera.position.set(4.2,2.85,9);game.menuCamera.lookAt(0,2.05,0);
  $('menu-page').className=`page-${page}`;
  if(page==='play')renderPlay();else if(page==='loadout'||page==='inventory')renderLoadout();else renderBriefing();
}
function renderPlay(){
  const mode=MODES.find(m=>m.id===prefs.mode)!;
  $('menu-page').innerHTML=`
    <section class="play-left">
      <div class="eyebrow"><span class="small-line"></span> OFFLINE MATCHMAKING</div>
      <h1 class="page-title">LET’S PLAY</h1>
      <p class="page-subtitle">Local matches with bots on Dust II.</p>
      <div class="section-caption"><span>GAME MODE</span><span>01 — 05</span></div>
      <div class="mode-list" role="radiogroup" aria-label="Game mode">${MODES.map((m,i)=>`
        <button class="mode-card ${prefs.mode===m.id?'selected':''}" data-mode="${m.id}" role="radio" aria-checked="${prefs.mode===m.id}">
          <span class="mode-icon">${icon(m.icon,29)}</span><span class="mode-copy"><b>${m.name}</b><small>${m.size}</small></span><span class="mode-check">${prefs.mode===m.id?icon('check',17):`0${i+1}`}</span>
        </button>`).join('')}</div>
      <div class="mode-explanation">${icon('info',15)}<span>${mode.description}</span></div>
    </section>
    <div class="agent-caption"><span class="agent-team">${teamMark(prefs.team,20)} ${prefs.team==='CT'?'COUNTER-TERRORIST':'TERRORIST'}</span><h2>${prefs.team==='CT'?'SAS':'PHOENIX CONNEXION'}</h2><div class="agent-badges">${badgeMarkup()}<span class="rank-wings">${icon('wings',24)}</span><span>${rankLabel(prefs.elo)}</span></div></div>
    <aside class="play-right">
      <div class="map-card"><div class="map-art"><img src="${mapImage}" alt="Dust II sandstone courtyard"><div class="map-art-shade"></div><span class="map-tag">${icon('map',13)} ACTIVE DUTY</span><span class="map-emblem"><span>II</span></span><h2>DUST II</h2></div><div class="map-description"><span>BOMB DEFUSAL</span><span>MOROCCO ${icon('globe',13)}</span></div></div>
      <div class="team-picker"><div class="section-caption">CHOOSE YOUR SIDE</div><div class="team-options"><button class="${prefs.team==='CT'?'chosen':''}" data-team="CT">${teamMark('CT',25)}<span>COUNTER-TERRORIST</span>${prefs.team==='CT'?'<i></i>':''}</button><button class="terrorist ${prefs.team==='T'?'chosen':''}" data-team="T">${teamMark('T',25)}<span>TERRORIST</span>${prefs.team==='T'?'<i></i>':''}</button></div></div>
      <div class="match-details"><div class="section-caption">MATCH SETTINGS <span>${icon('lock',12)}</span></div><div><span>Win condition</span><b>First to 12</b></div><div><span>Opponents</span><b>${totalBots()} bots</b></div><div><span>${prefs.mode==='wingman'?'Skill rating':'Bot difficulty'}</span><b>${prefs.mode==='wingman'?`${prefs.elo} ELO`:'Standard'}</b></div></div>
      <button class="arsenal-teaser" id="open-arsenal"><div><span class="eyebrow">MAKE IT YOURS</span><b>YOUR LOADOUT</b><small>Weapons, finishes & knives ${icon('arrow',13)}</small></div><span class="teaser-gun">${gunSVG(prefs.primary)}</span></button>
    </aside>
    <section class="play-dock"><div class="selected-map"><img src="${mapImage}" alt=""><div><small>SELECTED MAP</small><b>Dust II <span class="map-selected-check">${icon('check',13)}</span></b></div><button id="map-info" class="icon-button" aria-label="View map information">${icon('info',18)}</button></div><div class="dock-divider"></div><div class="session-summary"><span class="session-mode">${icon(mode.icon,22)}<b>${mode.name}</b><span class="local-pill">LOCAL</span></span><small>${prefs.mode==='ffa'?'11 PLAYERS · EVERYONE VS EVERYONE':prefs.mode==='wingman'?'2 VS 2 · RANKED BOTS':`2 TEAMS · ${totalBots()} BOTS`}<span> • </span>FIRST TO 12</small></div><div class="ready-status"><i class="status-dot"></i> READY WHEN YOU ARE</div><button id="go" class="go-button">GO ${icon('arrow',28)}</button></section>
  `;
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{prefs.mode=b.dataset.mode as Mode;savePrefs();renderPlay();});
  document.querySelectorAll<HTMLButtonElement>('[data-team]').forEach(b=>b.onclick=()=>{
    const team=b.dataset.team as Team;if(team===prefs.team)return;prefs.team=team;prefs.primary=team==='CT'?'m4a1':'ak47';prefs.secondary=team==='CT'?'usp':'glock';savePrefs();
    game.world.scene.remove(game.menuSoldier);
    game.menuSoldier=makeSoldier(team,true);game.menuSoldier.scale.setScalar(2.15);game.menuSoldier.position.set(1.25,0,1);game.world.scene.add(game.menuSoldier);
    renderPlay();
  });
  $('go').onclick=()=>{if(previewGun){game.world.scene.remove(previewGun);previewGun=null;}game.start();};
  $('open-arsenal').onclick=()=>showPage('loadout');$('map-info').onclick=()=>openMap();
}
function renderLoadout(){
  weaponPreview?.dispose();weaponPreview=null;
  const inventory=currentPage==='inventory';
  const equipped=[prefs.primary,prefs.secondary,'knife'];
  const list=eligible(prefs.team).filter(w=>currentCategory==='all'||(currentCategory==='equipped'?equipped.includes(w.id):currentCategory==='rifles'?['rifle','sniper'].includes(w.type):currentCategory==='pistols'?w.type==='pistol':currentCategory==='knives'?w.type==='knife':['smg','shotgun'].includes(w.type)));
  if(!list.find(w=>w.id===selectedWeapon)&&list[0])selectedWeapon=list[0].id;
  const w=weapon(selectedWeapon),skin=prefs.skins[w.id]||0;skinSelection=skin;
  $('menu-page').innerHTML=`
    <section class="loadout-page">
      <div class="loadout-heading"><div><div class="eyebrow"><span class="small-line"></span> ${inventory?'YOUR COLLECTION':'PREPARE FOR THE NEXT ROUND'}</div><h1 class="page-title">${inventory?'INVENTORY':'LOADOUT'}</h1></div><div class="loadout-side"><span>ACTIVE SIDE</span><button id="loadout-team">${teamMark(prefs.team,20)} ${teamName()} ${icon('down',14)}</button></div></div>
      <div class="loadout-tabs">${[['all','ALL WEAPONS'],['equipped','EQUIPPED'],['rifles','RIFLES'],['pistols','PISTOLS'],['smgs','SMGs & HEAVY'],['knives','KNIVES']].map(([id,label])=>`<button data-category="${id}" class="${currentCategory===id?'active':''}">${label}</button>`).join('')}<span>${list.length} ITEMS</span></div>
      <div class="loadout-body"><div class="weapons-grid">${list.map(v=>{const s=SKINS[prefs.skins[v.id]||0];return `<button class="weapon-tile ${v.id===w.id?'active':''}" data-weapon="${v.id}" style="--rarity:${s.rarity};--skin-a:${s.colors[0]};--skin-b:${s.colors[1]}"><div class="weapon-tile-meta">${equipped.includes(v.id)?`<span class="equipped-label">${icon('check',11)} EQUIPPED</span>`:`<span>${v.type.toUpperCase()}</span>`}</div><div class="weapon-silhouette ${prefs.skins[v.id]?'patterned':''}">${gunSVG(v.id)}</div><b>${v.name}</b><small>${v.id==='knife'?(prefs.knife==='default'?'Combat Knife':prefs.knife==='karambit'?'Karambit':'Butterfly Knife'):s.name}</small></button>`;}).join('')}</div>
      <aside class="weapon-detail"><div class="weapon-preview" id="weapon-preview"><span class="preview-eyebrow">${w.type.toUpperCase()} · ${w.team==='both'?'BOTH TEAMS':w.team}</span><div class="weapon-preview-silhouette" style="--skin-a:${SKINS[skin].colors[0]};--skin-b:${SKINS[skin].colors[1]}">${gunSVG(w.id)}</div><span class="preview-caption">3D MODEL IN GAME</span></div><div class="weapon-detail-copy"><span class="eyebrow">${w.id==='knife'?'MELEE WEAPON':w.type.toUpperCase()}</span><h2>${w.name}</h2><p id="finish-name">${SKINS[skin].name}</p>${w.id==='knife'?`<div class="knife-options">${[['default','COMBAT'],['karambit','KARAMBIT'],['butterfly','BUTTERFLY']].map(([id,name])=>`<button data-knife="${id}" class="${prefs.knife===id?'active':''}">${name}</button>`).join('')}</div>`:`<div class="weapon-stats"><span>DAMAGE</span><i style="--stat:${Math.min(100,w.damage)}%"></i><span>FIRE RATE</span><i style="--stat:${Math.min(100,9/w.rate)}%"></i><span>ACCURACY</span><i style="--stat:${100-w.spread*600}%"></i></div>`}<div class="section-caption">FINISH <span>${SKINS.length-1} SKINS + DEFAULT</span></div><div class="skin-swatches">${SKINS.map((s,i)=>`<button data-skin="${i}" class="${skin===i?'active':''}" title="${s.name}" aria-label="${s.name}" style="--skin-a:${s.colors[0]};--skin-b:${s.colors[1]};--rarity:${s.rarity}">${i===skin?icon('check',16):''}</button>`).join('')}</div><button id="equip" class="primary-button">${equipped.includes(w.id)?'UPDATE LOADOUT':'EQUIP WEAPON'} ${icon('check',19)}</button><p class="loadout-note">${icon('info',13)} All finishes unlocked for offline play</p></div></aside></div>
    </section>
  `;
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category!;renderLoadout();});
  document.querySelector('.preview-caption')!.textContent='DRAG TO ROTATE';
  document.querySelector('.weapon-preview-silhouette')!.classList.add('hidden');
  weaponPreview=mountWeaponPreview($('weapon-preview'),w.id,skin,prefs.knife);
  document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b=>b.onclick=()=>{selectedWeapon=b.dataset.weapon!;renderLoadout();});
  document.querySelectorAll<HTMLButtonElement>('[data-skin]').forEach(b=>b.onclick=()=>{
    skinSelection=Number(b.dataset.skin);$('finish-name').textContent=SKINS[skinSelection].name;
    document.querySelectorAll('[data-skin]').forEach(e=>e.classList.toggle('active',e===b));b.innerHTML=icon('check',16);
    const silhouette=document.querySelector<HTMLElement>('.weapon-preview-silhouette')!;silhouette.style.setProperty('--skin-a',SKINS[skinSelection].colors[0]);silhouette.style.setProperty('--skin-b',SKINS[skinSelection].colors[1]);
    document.querySelectorAll('[data-skin]').forEach(e=>{if(e!==b)e.innerHTML='';});
    weaponPreview?.setWeapon(w.id,skinSelection,prefs.knife);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-knife]').forEach(b=>b.onclick=()=>{prefs.knife=b.dataset.knife!;savePrefs();renderLoadout();});
  $('loadout-team').onclick=()=>{prefs.team=prefs.team==='CT'?'T':'CT';prefs.primary=prefs.team==='CT'?'m4a1':'ak47';prefs.secondary=prefs.team==='CT'?'usp':'glock';selectedWeapon=prefs.primary;savePrefs();game.world.scene.remove(game.menuSoldier);game.menuSoldier=makeSoldier(prefs.team,true);game.menuSoldier.scale.setScalar(2.15);game.menuSoldier.position.set(1.25,0,1);game.menuSoldier.visible=false;game.world.scene.add(game.menuSoldier);renderLoadout();};
  $('equip').onclick=()=>{
    prefs.skins[w.id]=skinSelection;if(w.type!=='knife'){if(w.type==='pistol')prefs.secondary=w.id;else prefs.primary=w.id;}savePrefs();toast(`${w.name}${skinSelection?' | '+SKINS[skinSelection].name:''} equipped`);renderLoadout();
  };
}
function renderBriefing(){
  $('menu-page').innerHTML=`<section class="briefing-page"><div class="eyebrow"><span class="small-line"></span> INTELLIGENCE</div><h1 class="page-title">FIELD GUIDE</h1><p class="page-subtitle">Know the map. Know your equipment.</p><div class="guide-grid"><article><span class="guide-number">01</span><h2>THE OBJECTIVE</h2><p>Terrorists plant C4 at A or B. Counter-Terrorists defend the sites and defuse the bomb. Every mode is first to 12 round wins.</p><p>After an elimination, spectate your killer or switch to another living player. A round continues until its objective is resolved.</p></article><article><span class="guide-number">02</span><h2>GUNPLAY</h2><p>Stop moving to shoot accurately. Crouching improves control, while aiming reduces your spread. Headshots deal extra damage.</p><p>Wooden doors, crates and barrels can be penetrated at reduced damage. Bots use the same weapons and fire rates as you.</p></article><article><span class="guide-number">03</span><h2>UTILITY & ECONOMY</h2><p>Use flashbangs to blind opponents and Molotovs to deny space. Don’t stand in the fire, even if a teammate threw it.</p><p>Open the buy menu with B during buy time. Earn money from eliminations and completed rounds. Your loadout is equipped each round.</p></article><article><span class="guide-number">04</span><h2>GAME MODES</h2><p>Competitive and Casual use bomb-defusal rules. Wingman is 2v2 with a local ELO rating that adjusts bot accuracy.</p><p>Deathmatch has instant respawns after a short countdown; the team with more eliminations wins the timed round. Free For All is last survivor standing.</p></article></div><button class="primary-button" id="guide-controls">VIEW CONTROLS ${icon('arrow',20)}</button></section>`;
  $('guide-controls').onclick=()=>openControls();
}
function modal(title:string,eyebrow:string,body:string,wide=false){
  $('modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${title}"><div class="panel-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div><button id="close-modal" class="icon-button" aria-label="Close dialog">${icon('close',24)}</button></div>${body}</section></div>`;
  $('close-modal').onclick=()=>{$('modal-root').innerHTML='';};document.querySelector('.modal-backdrop')!.addEventListener('click',e=>{if(e.target===e.currentTarget)$('modal-root').innerHTML='';});
}
function openControls(){modal('CONTROLS','KEYBOARD & MOUSE',controlsMarkup());}
function openMap(){
  modal('DUST II','MAP BRIEFING',`<img class="briefing-image" src="${mapImage}" alt="Dust II map courtyard"><div class="map-info-copy"><p>A complete, enclosed two-site arena with a central gateway, long flanking lanes, tunnels, cover and bomb sites A and B.</p><div class="map-key"><span><b>A</b> EAST BOMB SITE</span><span><b>B</b> WEST BOMB SITE</span></div><p>CTs spawn in the north. Ts enter from the south. Wooden doors and crates are penetrable; stone walls are not.</p></div>`);
}
function openSettings(){
  modal('SETTINGS','GAME CONFIGURATION',`<div class="settings-list"><label><span>Mouse sensitivity<small>Applies to mouse look</small></span><input id="sensitivity" type="range" min=".2" max="2.5" value="${prefs.sensitivity}" step=".1"><b id="sensitivity-value">${prefs.sensitivity.toFixed(1)}</b></label><label><span>Sound volume<small>Weapon and gameplay effects</small></span><input id="volume" type="range" min="0" max="1" value="${prefs.volume}" step=".05"><b id="volume-value">${Math.round(prefs.volume*100)}%</b></label><label><span>Graphics<small>Resolution and real-time shadows</small></span><select id="quality"><option value="high" ${prefs.quality==='high'?'selected':''}>High</option><option value="performance" ${prefs.quality==='performance'?'selected':''}>Performance</option></select></label><label><span>Crosshair color</span><input id="crosshair-color" type="color" value="${prefs.crosshair}"></label></div><div class="settings-notice">${icon('info',18)} Settings and your loadout are saved in this browser. No account or server is required.</div><button id="save-settings" class="primary-button">APPLY SETTINGS ${icon('check',19)}</button>`);
  $('sensitivity').oninput=e=>{$('sensitivity-value').textContent=Number((e.target as HTMLInputElement).value).toFixed(1);};
  $('volume').oninput=e=>{$('volume-value').textContent=`${Math.round(Number((e.target as HTMLInputElement).value)*100)}%`;};
  $('save-settings').onclick=()=>{
    prefs.sensitivity=Number(($('sensitivity') as HTMLInputElement).value);prefs.volume=Number(($('volume') as HTMLInputElement).value);prefs.quality=($('quality') as HTMLSelectElement).value;prefs.crosshair=($('crosshair-color') as HTMLInputElement).value;savePrefs();game.setQuality();$('modal-root').innerHTML='';toast('Settings applied');
  };
}
function openProfile(){
  const badges=['10 Year Veteran','5 Year Veteran','Global Offensive','Service Medal','Operation Phoenix','Danger Zone'];
  modal('OPERATOR','PLAYER PROFILE',`<div class="profile-summary"><div class="profile-large-avatar">${icon('shield',43)}</div><div><h2>Operator</h2><span>${rankLabel(prefs.elo)} · ${prefs.elo} ELO</span><small>WINGMAN SKILL GROUP · LOCAL RATING</small></div></div><div class="section-caption">DISPLAY BADGE</div><div class="badges-grid">${badges.map((b,i)=>`<button data-badge="${b}" class="${prefs.badge===b?'active':''}"><span style="color:${['#c2a86b','#adb6bd','#d8bb6b','#789ebc','#d48352','#ab765e'][i]}">${icon(i===2?'wings':i===4?'shield':'medal',36)}</span><b>${b}</b>${prefs.badge===b?icon('check',14):''}</button>`).join('')}</div><p class="loadout-note">All badges are available. Your Wingman rating changes after each round.</p>`);
  document.querySelectorAll<HTMLButtonElement>('[data-badge]').forEach(b=>b.onclick=()=>{prefs.badge=b.dataset.badge!;savePrefs();if(currentPage==='play')renderPlay();openProfile();toast(`${prefs.badge} selected`);});
}
document.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page!));
document.querySelector<HTMLButtonElement>('.brand')!.onclick=()=>showPage('play');
$('settings').onclick=openSettings;$('profile').onclick=openProfile;$('controls-button').onclick=openControls;
$('sound-toggle').onclick=()=>{prefs.volume=prefs.volume>0?0:.35;savePrefs();$('sound-toggle').classList.toggle('muted',prefs.volume===0);$('sound-toggle').setAttribute('aria-label',prefs.volume===0?'Enable sound':'Mute sound');toast(prefs.volume?'Sound enabled':'Sound muted');};
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!game.running)$('modal-root').innerHTML='';});
showPage('play');
