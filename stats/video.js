(function(){
'use strict';
const API='https://countapi.mileshilliard.com/api/v1';
const PREFIX='videohen';
const API_TIMEOUT=5000;
const PER_PAGE=20;
const AUTO_MS=60000;
let allRows=[]; // {title,link,genre,views,plays,shares,total}
let filtered=[];
let sortMode='total_desc'; // default = Total Terbanyak biar Bijukubo tetap #1

function slug(s){return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)}
function keyOf(...a){return [PREFIX,...a.map(slug).filter(Boolean)].join('_')}
function fmt(n){n=parseInt(n,10)||0; return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
async function fetchWithTimeout(url,ms=API_TIMEOUT){
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try{ const r=await fetch(url,{signal:c.signal,cache:'no-store'}); if(!r.ok) return null; return await r.json(); }catch{return null}finally{clearTimeout(t)}
}
async function apiGet(key, retries=1){
  for(let a=0;a<=retries;a++){
    const d=await fetchWithTimeout(`${API}/get/${encodeURIComponent(key)}`);
    if(d && typeof d.value !== 'undefined') return parseInt(d.value,10)||0;
    if(d && d.value===0) return 0;
    // 404 atau null → coba lagi sekali
    if(a<retries) await new Promise(r=>setTimeout(r,300));
  }
  return 0;
}
async function apiGetBatchChunked(keys, chunk=10){
  const out=new Array(keys.length).fill(0);
  for(let i=0;i<keys.length;i+=chunk){
    const slice=keys.slice(i,i+chunk);
    const vals=await Promise.all(slice.map(k=>apiGet(k,1)));
    for(let j=0;j<vals.length;j++) out[i+j]=vals[j];
    if(i+chunk < keys.length) await new Promise(r=>setTimeout(r,250));
    // update progress di pageInfo biar user tau tidak hang
    const pi=$('#pageInfo');
    if(pi && keys.length>50) pi.textContent=`Memuat hitungan ${Math.min(i+chunk,keys.length)}/${keys.length}...`;
  }
  return out;
}
function $(s){return document.querySelector(s)}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}

let rawList=[]; // simpan p/daftar.json asli biar grid bisa render langsung
function renderGrid(){
  const grid=$('#videoGrid');
  if(!grid) return;
  if(!filtered.length){
    grid.innerHTML='<div class="empty" style="width:100%;text-align:center;padding:20px;color:#888">Tidak ada video</div>';
    return;
  }
  // tampilkan maksimal 30 biar tidak panjang, dengan angka di atas judul
  const toShow=filtered.slice(0,30);
  grid.innerHTML=toShow.map((r,i)=>{
    const safe=escapeHtml(r.title);
    const img=r.image || 'https://placehold.co/300x450?text=No+Thumb';
    const views=r.views||0, plays=r.plays||0, shares=r.shares||0;
    return `<div class="dashboard-item" title="${safe}">
      <div class="video-thumb-container">
        <img class="video-thumb" src="${img}" loading="lazy" onerror="this.src='https://placehold.co/300x450?text=No+Thumb'">
      </div>
      <div class="dashboard-info">
        <div class="dashboard-rank">#${i+1}</div>
        <div class="dashboard-title">${safe}</div>
        <div class="dashboard-count"><i class="fa-solid fa-eye"></i> Dilihat: <strong>${fmt(views)}</strong></div>
        <div class="dashboard-count"><i class="fa-solid fa-play"></i> Diputar: <strong>${fmt(plays)}</strong></div>
        <div class="dashboard-count"><i class="fa-solid fa-share"></i> Dishare: <strong>${fmt(shares)}</strong></div>
      </div>
    </div>`;
  }).join('');
}

async function load(isAuto=false){
  // isAuto=true → jangan tampilkan loading & jangan reset scroll (biar posisi tetap)
  const prevScroll = isAuto ? window.scrollY : 0;
  const prevGridScroll = isAuto ? ($('#videoGrid')?.parentElement?.scrollTop||0) : 0;
  try{ if(localStorage.getItem('vh_video_ver')!=='v3'){ localStorage.removeItem('vh_video_rows'); localStorage.setItem('vh_video_ver','v3'); } }catch{}
  const grid=$('#videoGrid');
  const tbody=$('#videoTable');
  if(!isAuto){
    if(grid) grid.innerHTML='<div class="loading" style="width:100%;text-align:center;padding:20px;color:#888"><i class="fa-solid fa-spinner fa-pulse"></i> Memuat daftar...</div>';
    if(tbody) tbody.innerHTML='<tr><td colspan="6" class="loading"><i class="fa-solid fa-spinner fa-pulse"></i> Memuat...</td></tr>';
  }
  let list;
  try{
    const j=await fetchWithTimeout('../p/daftar.json?t='+Date.now(), 8000);
    list=(j && j.pages ? j.pages : []).filter(p=>p.title);
    if(!list.length) throw new Error('daftar kosong');
  }catch(e){
    console.warn('[video] daftar.json gagal', e);
    list=[];
  }
  if(!list.length){
    if(grid) grid.innerHTML='<div class="empty" style="width:100%;text-align:center;padding:20px;color:#888">Tidak ada video di daftar.json</div>';
    if(tbody) tbody.innerHTML='<tr><td colspan="6" class="empty">Tidak ada video di daftar.json</td></tr>';
    return;
  }
  rawList=list;
  if(!isAuto){
    // hanya render awal dengan 0 biar gambar langsung ada (tanpa nunggu hit)
    allRows=list.map(p=>({title:p.title, link:p.link, image:p.image||'', genre:p.genre||'', views:0, plays:0, shares:0, total:0}));
    // coba pakai cache biar langsung terlihat Bijukubo #1 (opsional)
    try{
      const cached=JSON.parse(localStorage.getItem('vh_video_rows')||'null');
      if(cached && Array.isArray(cached) && cached.length===list.length){
        const m=new Map(cached.map(r=>[r.title,r]));
        allRows=allRows.map(r=>{ const c=m.get(r.title); return c? {...r, views:c.views||0, plays:c.plays||0, shares:c.shares||0, total:c.total||0}: r; });
      }
    }catch{}
    filtered=[...allRows];
    if(sortMode==='total_desc') filtered.sort((a,b)=>b.total-a.total);
    else if(sortMode==='views_desc') filtered.sort((a,b)=>b.views-a.views);
    else if(sortMode==='plays_desc') filtered.sort((a,b)=>b.plays-a.plays);
    else if(sortMode==='title_asc') filtered.sort((a,b)=>a.title.localeCompare(b.title));
    renderGrid(); renderTable();
  }
  const pi0=$('#pageInfo'); if(pi0) pi0.textContent=`${list.length} video • memuat Dibuka...`;
  // FASE 1: fetch Dibuka saja untuk semua (210) biar tau ranking, chunk 10 biar tidak 404
  const CHUNK=10;
  for(let i=0;i<list.length;i+=CHUNK){
    const slice=list.slice(i,i+CHUNK);
    const sKeysV=slice.map(p=>keyOf('video',p.title));
    const vVals=await Promise.all(sKeysV.map(k=>apiGet(k)));
    for(let j=0;j<slice.length;j++){
      const idx=i+j;
      allRows[idx].views=vVals[j]||0;
      allRows[idx].total=vVals[j]||0; // sementara total = views dulu
    }
    // update progresif biar Bijukubo langsung naik setelah chunk-nya ke-fetch
    filtered=[...allRows];
    const q1=($('#searchInput')?.value||'').toLowerCase().trim();
    if(q1) filtered=filtered.filter(r=>r.title.toLowerCase().includes(q1)||r.genre.toLowerCase().includes(q1));
    if(sortMode==='total_desc') filtered.sort((a,b)=>b.total-a.total);
    else if(sortMode==='views_desc') filtered.sort((a,b)=>b.views-a.views);
    else if(sortMode==='plays_desc') filtered.sort((a,b)=>b.plays-a.plays);
    else if(sortMode==='title_asc') filtered.sort((a,b)=>a.title.localeCompare(b.title));
    renderGrid(); renderTable();
    if(pi0) pi0.textContent=`Memuat Dibuka ${Math.min(i+CHUNK,list.length)}/${list.length} • Top: ${filtered[0]?.title||'-'}`;
    await new Promise(r=>setTimeout(r,40));
  }
  // FASE 2: fetch Diputar+Dishare hanya untuk Top 30 (hemat 180 request) biar total akurat
  const topIdx=[...allRows].map((r,i)=>({i,v:r.views})).sort((a,b)=>b.v-a.v).slice(0,30).map(o=>o.i);
  if(pi0) pi0.textContent=`Memuat Diputar/Dishare Top 30...`;
  for(let k=0;k<topIdx.length;k+=8){
    const chunkIdx=topIdx.slice(k,k+8);
    const sKeysW=chunkIdx.map(idx=>keyOf('watch',list[idx].title));
    const sKeysS=chunkIdx.map(idx=>keyOf('share',list[idx].title));
    const [wVals,sVals]=await Promise.all([
      Promise.all(sKeysW.map(ke=>apiGet(ke))),
      Promise.all(sKeysS.map(ke=>apiGet(ke)))
    ]);
    for(let j=0;j<chunkIdx.length;j++){
      const idx=chunkIdx[j];
      allRows[idx].plays=wVals[j]||0;
      allRows[idx].shares=sVals[j]||0;
      allRows[idx].total=(allRows[idx].views||0)+(wVals[j]||0);
    }
    filtered=[...allRows];
    const q2=($('#searchInput')?.value||'').toLowerCase().trim();
    if(q2) filtered=filtered.filter(r=>r.title.toLowerCase().includes(q2)||r.genre.toLowerCase().includes(q2));
    if(sortMode==='total_desc') filtered.sort((a,b)=>b.total-a.total);
    else if(sortMode==='views_desc') filtered.sort((a,b)=>b.views-a.views);
    else if(sortMode==='plays_desc') filtered.sort((a,b)=>b.plays-a.plays);
    else if(sortMode==='title_asc') filtered.sort((a,b)=>a.title.localeCompare(b.title));
    renderGrid(); renderTable();
    await new Promise(r=>setTimeout(r,40));
  }
  try{ localStorage.setItem('vh_video_rows', JSON.stringify(allRows)); }catch{}
  console.log('[video] done top3', allRows.slice().sort((a,b)=>b.total-a.total).slice(0,3).map(r=>`${r.title}:${r.total} (v${r.views}+w${r.plays})`));
  const piF=$('#pageInfo'); if(piF) piF.textContent= filtered.length>30? `Menampilkan 30 dari ${filtered.length} video` : `${filtered.length} video`;
  const upd2=$('#lastUpdate'); if(upd2) upd2.textContent='Update: '+new Date().toLocaleTimeString('id-ID');
  if(isAuto){
    window.scrollTo(0, prevScroll);
    const pg=$('#videoGrid')?.parentElement; if(pg) pg.scrollTop=prevGridScroll;
  }
}

function renderChart(){
  const c=$('#videoChart');
  if(!c) return;
  const top10=allRows.slice().sort((a,b)=>b.total-a.total).slice(0,10);
  if(!top10.length || top10[0].total===0){
    c.innerHTML='<div class="empty">Belum ada data tayangan video</div>';
    return;
  }
  const labels=top10.map(r=>r.title.length>18? r.title.slice(0,18)+'…' : r.title);
  const values=top10.map(r=>r.total);
  const max=Math.max(...values,1);
  const h=220, pad={t:20,r:16,b:40,l:48};
  const wrap=c.parentElement.clientWidth||900;
  const needed=labels.length*56+pad.l+pad.r;
  const W=Math.max(wrap,needed);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`0 0 ${W} ${h}`);
  svg.style.cssText=`width:${W}px;height:${h}px;display:block;background:#000;border-radius:6px;min-width:100%`;
  const innerW=W-pad.l-pad.r, innerH=h-pad.t-pad.b;
  const step=innerW/Math.max(labels.length,1);
  const barW=Math.max(10,Math.min(36,step*0.6));
  const y=v=>pad.t+innerH-(v/max)*innerH;
  let grid='';
  for(let i=0;i<=4;i++){
    const yy=pad.t+(i/4)*innerH, v=Math.round(max*(1-i/4));
    grid+=`<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="#2a2a2a" stroke-width="0.5"/>`;
    grid+=`<text x="${pad.l-8}" y="${yy+4}" fill="#888" font-size="11" text-anchor="end">${fmt(v)}</text>`;
  }
  let bars='', labs='';
  values.forEach((v,i)=>{
    const xc=pad.l+step*i+step/2, x=xc-barW/2, yy=y(v), bh=innerH-(yy-pad.t);
    const peak=v===max;
    bars+=`<rect x="${x}" y="${yy}" width="${barW}" height="${bh}" rx="4" fill="${peak?'#a200f9':'#7d00bf'}" opacity="0.95"><title>${escapeHtml(labels[i])}: ${fmt(v)}</title></rect>`;
    bars+=`<text x="${xc}" y="${yy-6}" fill="#fff" font-size="10" text-anchor="middle" font-weight="700">${fmt(v)}</text>`;
    labs+=`<text x="${xc}" y="${h-pad.b+14}" fill="#aaa" font-size="9" text-anchor="middle">${escapeHtml(labels[i])}</text>`;
  });
  svg.innerHTML=`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a200f9"/><stop offset="100%" stop-color="#5a00a0"/></defs>${grid}${bars}${labs}`;
  c.innerHTML=''; c.appendChild(svg); c.style.width=W+'px';
}

function applyFilter(){
  const q=($('#searchInput')?.value||'').toLowerCase().trim();
  filtered=allRows.filter(r=>{
    if(!q) return true;
    return r.title.toLowerCase().includes(q) || r.genre.toLowerCase().includes(q);
  });
  if(sortMode==='total_desc') filtered.sort((a,b)=>b.total-a.total);
  else if(sortMode==='views_desc') filtered.sort((a,b)=>b.views-a.views);
  else if(sortMode==='plays_desc') filtered.sort((a,b)=>b.plays-a.plays);
  else if(sortMode==='title_asc') filtered.sort((a,b)=>a.title.localeCompare(b.title));
  renderGrid();
  renderTable();
}

function renderTable(){
  const pi=$('#pageInfo'); if(pi) pi.textContent= filtered.length? (filtered.length>30? `Menampilkan 30 dari ${filtered.length} video` : `${filtered.length} video`) : '0 video';
  const tbody=$('#videoTable');
  if(!tbody) return; // tabel sudah dihapus, cukup update pageInfo
  if(!filtered.length){
    tbody.innerHTML='<tr><td colspan="6" class="empty">Tidak ada hasil</td></tr>';
    return;
  }
  tbody.innerHTML=filtered.map((r,i)=>{
    const rank=i+1;
    const safe=escapeHtml(r.title);
    const href=r.link? `../p/${encodeURIComponent(r.link)}` : '#';
    return `<tr>
      <td class="rank">${rank}</td>
      <td class="title-cell"><a href="${href}" target="_blank" title="${safe}">${safe}</a><div style="font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px">${escapeHtml(r.genre)}</div></td>
      <td class="num">${fmt(r.views)}</td>
      <td class="num">${fmt(r.plays)}</td>
      <td class="num">${fmt(r.shares)}</td>
      <td class="num" style="color:#a200f9">${fmt(r.total)}</td>
    </tr>`;
  }).join('');
}

// events - auto dimatikan, hanya tombol Refresh / reload page
document.addEventListener('DOMContentLoaded',()=>{
  load(false);
  $('#searchInput')?.addEventListener('input', applyFilter);
  $('#sortSelect')?.addEventListener('change', e=>{ sortMode=e.target.value; applyFilter(); });
  $('#refreshBtn')?.addEventListener('click', ()=>{ load(false); });
  const upd=$('#lastUpdate');
  if(upd) upd.textContent='Update: '+new Date().toLocaleTimeString('id-ID');
});
})();
