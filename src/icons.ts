export function icon(name:string,size=22):string {
  const paths:Record<string,string> = {
    crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/><circle cx="12" cy="12" r="1"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    wings:'<path d="m12 8 3-4h7l-4 5h-4m-2-1L9 4H2l4 5h4M3 12l6 3 3 6 3-6 6-3M6 9l6 3 6-3"/><path d="M12 8v13"/>',
    skull:'<path d="M8 20v-4c-6-2-5-13 4-13s10 11 4 13v4Z"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="m11 15 1-2 1 2M10 17v3m4-3v3"/>',
    shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
    settings:'<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 3h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-3Z"/><circle cx="11.5" cy="11.5" r="3"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    volume:'<path d="M11 4 5 9H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    medal:'<path d="m8 2 4 6 4-6M5 2l4 7m10-7-4 7"/><circle cx="12" cy="15" r="7"/><path d="m12 10 1.5 3 3.5.5-2.5 2.5.5 3-3-1.5L9 19l.5-3L7 13.5l3.5-.5Z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    power:'<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
    bomb:'<circle cx="11" cy="14" r="7"/><path d="m15 8 3-4 3 2M17 2l1 2m4-1-2 1"/>',
    bag:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2M3 13h18m-11 0v3h4v-3"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3m0 3v1"/>',
    map:'<path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3Zm7-3v17m6-14v17"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.crosshair}</svg>`;
}
export function gunSVG(id:string):string {
  const pistol=['usp','p2000','glock','deagle','dual','tec9'].includes(id);
  if(id==='knife') return '<svg viewBox="0 0 220 80" fill="currentColor"><path d="m20 48 70-15 113-16-51 35-63 4-65 9Z"/><path d="m83 25 9 36-7 3-10-37Z"/></svg>';
  return `<svg viewBox="0 0 220 80" fill="currentColor">${pistol?'<path d="M55 23h110l13 8-6 15h-63l-9 30H74l9-34H55ZM162 27h35v9h-35ZM105 47v12h17l9-13h-6l-5 8h-9v-8Z"/><path d="M59 18h5v8h-5m93-9h5v9h-5"/>':'<path d="m7 34 40-10 14 8h70v-8h23v9h55v7h-58l-15 10-7 25h-23l5-28H83l-6 24H65l4-27-13-5-43 13ZM98 23h34v6H98ZM171 27h5v15h-5ZM191 27h5v15h-5"/><path d="M79 44v16h18l7-16h-5l-6 11h-9V44Z"/>'}</svg>`;
}
