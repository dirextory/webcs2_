export type Team = 'CT' | 'T';
export type Mode = 'classic' | 'wingman' | 'deathmatch' | 'casual' | 'ffa';
export type Weapon = { id: string; name: string; team: Team | 'both'; type: 'rifle' | 'smg' | 'sniper' | 'pistol' | 'shotgun' | 'knife'; price: number; damage: number; rate: number; mag: number; spread: number; color: number };
export const WEAPONS: Weapon[] = [
  { id:'m4a1', name:'M4A1-S', team:'CT', type:'rifle', price:2900, damage:33, rate:.1, mag:20, spread:.008, color:0x303a3a },
  { id:'m4a4', name:'M4A4', team:'CT', type:'rifle', price:3000, damage:33, rate:.09, mag:30, spread:.01, color:0x353d43 },
  { id:'aug', name:'AUG', team:'CT', type:'rifle', price:3300, damage:32, rate:.1, mag:30, spread:.006, color:0x62684b },
  { id:'famas', name:'FAMAS', team:'CT', type:'rifle', price:2050, damage:30, rate:.09, mag:25, spread:.012, color:0x43484b },
  { id:'mp9', name:'MP9', team:'CT', type:'smg', price:1250, damage:26, rate:.07, mag:30, spread:.018, color:0x343d43 },
  { id:'mp5', name:'MP5-SD', team:'CT', type:'smg', price:1500, damage:27, rate:.08, mag:30, spread:.015, color:0x303438 },
  { id:'scar', name:'SCAR-20', team:'CT', type:'sniper', price:5000, damage:80, rate:.3, mag:20, spread:.003, color:0xafa17a },
  { id:'usp', name:'USP-S', team:'CT', type:'pistol', price:200, damage:35, rate:.17, mag:12, spread:.012, color:0x333b3c },
  { id:'p2000', name:'P2000', team:'CT', type:'pistol', price:200, damage:35, rate:.17, mag:13, spread:.012, color:0x383d40 },
  { id:'mag7', name:'MAG-7', team:'CT', type:'shotgun', price:1300, damage:70, rate:.7, mag:5, spread:.07, color:0x414242 },
  { id:'ak47', name:'AK-47', team:'T', type:'rifle', price:2700, damage:36, rate:.1, mag:30, spread:.012, color:0x8c4e29 },
  { id:'galil', name:'Galil AR', team:'T', type:'rifle', price:1800, damage:30, rate:.09, mag:35, spread:.013, color:0x4a5249 },
  { id:'sg553', name:'SG 553', team:'T', type:'rifle', price:3000, damage:33, rate:.1, mag:30, spread:.005, color:0x62664e },
  { id:'mac10', name:'MAC-10', team:'T', type:'smg', price:1050, damage:29, rate:.075, mag:30, spread:.02, color:0x4b4d48 },
  { id:'bizon', name:'PP-Bizon', team:'T', type:'smg', price:1400, damage:27, rate:.08, mag:64, spread:.024, color:0x3a4240 },
  { id:'g3sg1', name:'G3SG1', team:'T', type:'sniper', price:5000, damage:80, rate:.3, mag:20, spread:.003, color:0x3c4838 },
  { id:'glock', name:'Glock-18', team:'T', type:'pistol', price:200, damage:30, rate:.15, mag:20, spread:.016, color:0x333b3c },
  { id:'tec9', name:'Tec-9', team:'T', type:'pistol', price:500, damage:33, rate:.13, mag:18, spread:.014, color:0x343b3a },
  { id:'sawed', name:'Sawed-Off', team:'T', type:'shotgun', price:1100, damage:75, rate:.8, mag:7, spread:.08, color:0x784626 },
  { id:'nova', name:'Nova', team:'T', type:'shotgun', price:1050, damage:65, rate:.7, mag:8, spread:.06, color:0x77523b },
  { id:'deagle', name:'Desert Eagle', team:'both', type:'pistol', price:700, damage:63, rate:.28, mag:7, spread:.012, color:0xb0b4b4 },
  { id:'dual', name:'Dual Berettas', team:'both', type:'pistol', price:300, damage:30, rate:.11, mag:30, spread:.023, color:0x636c71 },
  { id:'awp', name:'AWP', team:'both', type:'sniper', price:4750, damage:115, rate:1.3, mag:5, spread:.001, color:0x687345 },
  { id:'ssg', name:'SSG 08', team:'both', type:'sniper', price:1700, damage:88, rate:1.1, mag:10, spread:.002, color:0x424c46 },
  { id:'knife', name:'Combat Knife', team:'both', type:'knife', price:0, damage:55, rate:.45, mag:0, spread:0, color:0xaeb4b7 },
];
export const SKINS = [
  { name:'Default', colors:['#363d40','#555f60'], rarity:'#89959d' },
  { name:'Asiimov', colors:['#f2eee6','#f4792b'], rarity:'#ee5555' },
  { name:'Vulcan', colors:['#23272c','#47b9d8'], rarity:'#ee5555' },
  { name:'Crimson Web', colors:['#9a1724','#211b22'], rarity:'#c75ee6' },
  { name:'Fade', colors:['#f5c156','#d43caa'], rarity:'#e7b862' },
  { name:'Hyper Beast', colors:['#2cd1a2','#ba32bc'], rarity:'#ee5555' },
  { name:'Printstream', colors:['#f0eee8','#242832'], rarity:'#ee5555' },
  { name:'Case Hardened', colors:['#d4a343','#4869b7'], rarity:'#c75ee6' },
  { name:'Neon Rider', colors:['#eb46aa','#38bce0'], rarity:'#ee5555' },
  { name:'Desert Camo', colors:['#bba780','#655d40'], rarity:'#6a86ed' },
  { name:'Night Ops', colors:['#1c2835','#4a6174'], rarity:'#6a86ed' },
];
export const MODES: {id:Mode;name:string;description:string;size:string;icon:string}[] = [
  {id:'classic',name:'Competitive',description:'The classic bomb defusal experience',size:'5 BOTS / SIDE',icon:'crosshair'},
  {id:'wingman',name:'Wingman',description:'2v2 bomb defusal with skill-based bots',size:'2 VS 2 · RANKED',icon:'wings'},
  {id:'deathmatch',name:'Deathmatch',description:'Instant respawns. Keep your aim sharp.',size:'TEAM DEATHMATCH',icon:'skull'},
  {id:'casual',name:'Casual',description:'More players, the same high stakes.',size:'7 BOTS / SIDE',icon:'shield'},
  {id:'ffa',name:'Free For All',description:'No teammates. Last player standing wins.',size:'YOU + 10 BOTS',icon:'target'},
];
export type Preferences = { mode:Mode; team:Team; primary:string; secondary:string; knife:string; skins:Record<string,number>; elo:number; badge:string; sensitivity:number; volume:number; quality:string; crosshair:string; };
const defaults: Preferences = { mode:'classic', team:'CT', primary:'m4a1', secondary:'usp', knife:'default', skins:{}, elo:1000, badge:'10 Year Veteran', sensitivity:1, volume:.35, quality:'high', crosshair:'#b4ec8e' };
export function readPrefs():Preferences { try { return {...defaults,...JSON.parse(localStorage.getItem('cs2-local')||'{}')}; } catch { return {...defaults}; } }
export const prefs = readPrefs();
export function savePrefs(){ try{localStorage.setItem('cs2-local',JSON.stringify(prefs));}catch{/* Storage is optional in private browsing. */} }
export function weapon(id:string){ return WEAPONS.find(w=>w.id===id)||WEAPONS[0]; }
export function eligible(team:Team){ return WEAPONS.filter(w=>w.team===team||w.team==='both'); }
export function modeBotCount(mode:Mode):[number,number] { return mode==='wingman'?[1,2]:mode==='casual'?[7,7]:[5,5]; }
export function rankLabel(elo:number){return elo<900?'SILVER ELITE':elo<1200?'GOLD NOVA II':elo<1600?'MASTER GUARDIAN':'GLOBAL ELITE';}
