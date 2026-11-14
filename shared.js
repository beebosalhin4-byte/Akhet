const D=Math.PI/180,$=id=>document.getElementById(id),N=720;
const SITES=[{id:'mal',n:'Malapert Massif (south pole)',lat:-85.99,lon:.12},{id:'hay',n:'Haworth rim (south pole)',lat:-87.45,lon:-5},{id:'nob',n:'Nobile Rim 1 (Artemis III)',lat:-85.4,lon:31.4},
{id:'con',n:'Connecting Ridge (Artemis III)',lat:-89.45,lon:-137.1},{id:'sha',n:'Shackleton rim (south pole)',lat:-89.54,lon:129.8},{id:'mou',n:'Mons Mouton (IM-2)',lat:-84.8,lon:29.2},{id:'mpa',n:'Malapert A (IM-1)',lat:-80.13,lon:1.44},
{id:'cha',n:'Chandrayaan-3 landing',lat:-69.3733,lon:32.3189},{id:'ch4',n:"Chang'e-4",lat:-45.4446,lon:177.5991},{id:'bg1',n:'Blue Ghost 1 (Mare Crisium)',lat:18.56,lon:61.81},
{id:'a11',n:'Apollo 11 (Tranquility)',lat:.6741,lon:23.473},{id:'a12',n:'Apollo 12',lat:-3.0128,lon:-23.4219},{id:'a14',n:'Apollo 14',lat:-3.6453,lon:-17.4714},{id:'a15',n:'Apollo 15 (Hadley)',lat:26.1322,lon:3.633},
{id:'a16',n:'Apollo 16',lat:-8.9734,lon:15.5011},{id:'a17',n:'Apollo 17',lat:20.1908,lon:30.7717},{id:'cus',n:'Custom coordinates…',lat:-85,lon:0}];
const hzg=(b,a,p)=>Array.from({length:360},(_,i)=>{const t=i*D;return Math.max(0,b+a*(.5*Math.sin(3*t+p)+.3*Math.sin(7*t+2*p)+.2*Math.sin(13*t+3*p)))});
const PH={mal:hzg(1.2,1.6,0),hay:hzg(2.2,2.4,1),nob:hzg(1.8,2,2),con:hzg(.9,1.2,3),sha:hzg(1.6,1.8,4),cha:hzg(.5,.8,5),a15:hzg(1,1.5,6),a11:Array(360).fill(0)};
/* ---- LOLA terrain: loaded once, then a skyline is computed for ANY lat/lon in the browser (~20 ms) ---- */
const RM=1737400;let DEM={},HZC={};
async function ld(u){const r=await fetch(u,{cache:'no-cache'});if(!r.ok)throw new Error(u+' not found ('+r.status+')');let b=new Uint8Array(await r.arrayBuffer());if(b[0]===31&&b[1]===139){if(typeof DecompressionStream==='undefined')throw new Error('this browser cannot unzip .gz files');b=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())}if(b.byteLength%2)throw new Error(u+' has an odd byte count ('+b.byteLength+')');const c=new Uint8Array(b);return new Int16Array(c.buffer,0,c.byteLength>>1)}
let DEMSTATE='loading';
(async()=>{try{const rm=await fetch('data/dem_meta.json',{cache:'no-cache'});if(!rm.ok)throw new Error('data/dem_meta.json not found ('+rm.status+')');const m=await rm.json(),D2={...m};D2.g=await ld('data/dem_global.bin.gz');if(D2.g.length!==D2.gw*D2.gh)throw new Error('global map has '+D2.g.length+' values, expected '+D2.gw*D2.gh+' (use LDEM_16.IMG)');
 try{D2.s=await ld('data/dem_south.bin.gz');if(D2.s.length!==D2.pn*D2.pn){const q=D2.s.length;D2.s=null;D2.err='polar map size does not match n='+D2.pn+' ('+q+' values)'}}catch(e){D2.err=String(e.message||e)}DEM=D2}catch(e){DEM={err:String(e.message||e)}}
 DEMSTATE='done';HZC={};if(typeof SER!=='undefined')for(const k in SER)delete SER[k];all()})();
function bil(a,w,h,x,y,wrap){const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,X=i=>wrap?(i%w+w)%w:Math.max(0,Math.min(w-1,i)),Y=j=>Math.max(0,Math.min(h-1,j));
return a[Y(y0)*w+X(x0)]*(1-fx)*(1-fy)+a[Y(y0)*w+X(x0+1)]*fx*(1-fy)+a[Y(y0+1)*w+X(x0)]*(1-fx)*fy+a[Y(y0+1)*w+X(x0+1)]*fx*fy}
function dhgt(la,lo){if(DEM.s&&la<-80*D){const r=2*RM*Math.tan((Math.PI/2+la)/2);return .5*bil(DEM.s,DEM.pn,DEM.pn,(DEM.pn-1)/2+r*Math.sin(lo)/DEM.pm,(DEM.pn-1)/2-r*Math.cos(lo)/DEM.pm)}
 return .5*bil(DEM.g,DEM.gw,DEM.gh,((lo/D%360+360)%360)*DEM.gp-.5,(90-la/D)*DEM.gp-.5,true)}
function skyline(lat,lon){const la=lat*D,lo=lon*D,h0=dhgt(la,lo)+2,th=[],out=[];for(let d=.5;d<=30;d+=.5)th.push(d*1e3/RM);for(let d=32;d<=200;d+=2)th.push(d*1e3/RM);
 for(let a=0;a<360;a++){const az=a*D;let best=-90;for(const t of th){const ct=Math.cos(t),st=Math.sin(t),l2=Math.asin(Math.sin(la)*ct+Math.cos(la)*st*Math.cos(az)),o2=lo+Math.atan2(Math.sin(az)*st*Math.cos(la),ct-Math.sin(la)*Math.sin(l2)),z=dhgt(l2,o2),
  el=Math.atan2((RM+z)*ct-(RM+h0),(RM+z)*st)/D;if(el>best)best=el}out.push(best)}return out}
const hzFor=(id,lat,lon)=>{if(!DEM.g)return PH[id]||Array(360).fill(0);const k=lat.toFixed(3)+','+lon.toFixed(3);return HZC[k]||(HZC[k]=skyline(lat,lon))};
/* ---- math: JPL-family ephemeris (astronomy-engine) + IAU 2009 Moon orientation ---- */
const rz=(v,a)=>{const c=Math.cos(a),s=Math.sin(a);return[c*v[0]+s*v[1],-s*v[0]+c*v[1],v[2]]},rx=(v,a)=>{const c=Math.cos(a),s=Math.sin(a);return[v[0],c*v[1]+s*v[2],-s*v[1]+c*v[2]]};
const nm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)},dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function frame(dt){const d=dt.getTime()/864e5-10957.5,T=d/36525,E=(a,b)=>(a+b*d)*D,S=Math.sin,C=Math.cos;
const e1=E(125.045,-.0529921),e2=E(250.089,-.1059842),e3=E(260.008,13.0120009),e4=E(176.625,13.3407154),e5=E(357.529,.9856003),e6=E(311.589,26.4057084),e7=E(134.963,13.064993),e8=E(276.617,.3287146),e9=E(34.226,1.7484877),e10=E(15.134,-.1589763),e11=E(119.743,.0036096),e12=E(239.961,.1643573),e13=E(25.053,12.9590088);
const ra=269.9949+.0031*T-3.8787*S(e1)-.1204*S(e2)+.07*S(e3)-.0172*S(e4)+.0072*S(e6)-.0052*S(e10)+.0043*S(e13);
const de=66.5392+.013*T+1.5419*C(e1)+.0239*C(e2)-.0278*C(e3)+.0068*C(e4)-.0029*C(e6)+.0009*C(e7)+.0008*C(e10)-.0009*C(e13);
const W=38.3213+13.17635815*d+3.561*S(e1)+.1208*S(e2)-.0642*S(e3)+.0158*S(e4)+.0252*S(e5)-.0066*S(e6)-.0047*S(e7)-.0046*S(e8)+.0028*S(e9)+.0052*S(e10)+.004*S(e11)+.0019*S(e12)-.0044*S(e13);
const m=Astronomy.GeoMoon(dt),s=Astronomy.GeoVector(Astronomy.Body.Sun,dt,true),mv=[m.x,m.y,m.z],sun=[s.x-m.x,s.y-m.y,s.z-m.z],ear=mv.map(x=>-x);
const B=v=>rz(rx(rz(v,(90+ra)*D),(90-de)*D),W*D);
return{B,s:nm(B(sun)),e:nm(B(ear)),sr:.2666/Math.hypot(...sun),er:Math.asin(6371/(Math.hypot(...mv)*149597870.7))/D}}
function azel(v,la,lo){const p=la*D,l=lo*D,up=[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],no=[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)],ea=[-Math.sin(l),Math.cos(l),0];
return{el:Math.asin(Math.max(-1,Math.min(1,dot(v,up))))/D,az:(Math.atan2(dot(v,ea),dot(v,no))/D+360)%360}}
const mask=(h,az)=>{const n=h.length,p=(az%360+360)%360/360*n,i=Math.floor(p)%n,t=p-Math.floor(p);return h[i]*(1-t)+h[(i+1)%n]*t};
const FR=new Map();function frames(t0){if(!FR.has(t0)){FR.set(t0,Array.from({length:N},(_,i)=>frame(new Date(t0+i*36e5))));if(FR.size>8)FR.delete(FR.keys().next().value)}return FR.get(t0)}
/* ---- helpers ---- */
const fd=h=>h==null?'—':h<48?Math.round(h)+' h':(h/24).toFixed(1)+' Earth days';
const flip=(a,i)=>{for(let j=i+1;j<N;j++)if(a[j]!==a[i])return j-i;return null};
const longest=(a,v)=>{let b=0,c=0;for(const x of a){x===v?b=Math.max(b,++c):c=0}return b};
const pct=a=>a.filter(Boolean).length/N*100;
const timer=(a,i,up,dn)=>{const x=flip(a,i);return x==null?(a[i]?'stays up for at least '+fd(N-1-i):'stays hidden for at least '+fd(N-1-i)):(a[i]?up:dn)+' in '+fd(x)};
/* ---------- BRAND: Eye of Horus (wedjat) and Akhet glyph ---------- */
const WEDJAT="<svg class='eye' viewBox='0 0 72 44' aria-hidden='true'><path class='brow' d='M8 9 Q36 -1 64 9'/><g class='lid'><path class='almond' d='M6 22 Q36 4 66 22 Q36 40 6 22Z'/><circle class='pupil' cx='36' cy='22' r='8'/><circle class='glint' cx='39' cy='19' r='2.2'/></g><path class='tear' d='M44 34 L50 42 Q56 44 58 38'/><path class='curl' d='M28 34 Q22 42 14 40 Q8 38 11 33 Q14 30 17 33'/></svg>";
const GLYPH="<svg viewBox='0 0 80 42' aria-hidden='true'><path d='M2 38 L16 10 Q40 34 64 10 L78 38 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/><circle cx='40' cy='14' r='7' fill='currentColor'/></svg>";
const eyeP=p=>WEDJAT.replace("class='eye'","class='eye open'").replace("class='lid'",`class='lid' style='transform:scaleY(${Math.max(.07,p/100).toFixed(2)})'`);
const eyes2=r=>`<div class="eyes2"><div class="e1 sunEye">${eyeP(r.sp)}<b>${r.sp.toFixed(0)}%</b><small>Sun eye open: power</small></div><div class="e1 moonEye">${eyeP(r.ep)}<b>${r.ep.toFixed(0)}%</b><small>Moon eye open: link home</small></div></div>`;
document.querySelectorAll('[data-eye]').forEach(n=>n.innerHTML=WEDJAT);document.querySelectorAll('[data-glyph]').forEach(n=>n.innerHTML=GLYPH);

function startTour(steps){steps=steps.filter(s=>{const e=document.querySelector(s.sel);return e&&e.getClientRects().length});if(!steps.length)return;
 let i=0;const ov=document.createElement('div');ov.id='tour';
 ov.innerHTML='<div class="tspot"></div><div class="tbub"><div class="tarr"></div><h4></h4><p></p><div class="trow"><button class="kb tb" data-a="x">✕ Close</button><span class="tc"></span><button class="kb tb" data-a="b">◀ Back</button><button class="kb go tb" data-a="n">Next ▶</button></div></div>';
 document.body.appendChild(ov);const sp=ov.querySelector('.tspot'),bb=ov.querySelector('.tbub'),ar=ov.querySelector('.tarr');
 function show(){const s=steps[i],e=document.querySelector(s.sel);e.scrollIntoView({block:'center',inline:'nearest'});
  const place=()=>{const r=e.getBoundingClientRect(),pad=6;sp.style.cssText='left:'+(r.left-pad)+'px;top:'+(r.top-pad)+'px;width:'+(r.width+2*pad)+'px;height:'+(r.height+2*pad)+'px';
   bb.querySelector('h4').textContent=s.title;bb.querySelector('p').textContent=s.text;bb.querySelector('.tc').textContent=(i+1)+' / '+steps.length;
   bb.querySelector('[data-a=b]').style.visibility=i?'visible':'hidden';bb.querySelector('[data-a=n]').textContent=i<steps.length-1?'Next ▶':'Done ✓';
   const W=Math.min(330,innerWidth-20);bb.style.width=W+'px';const bh=bb.offsetHeight,below=r.bottom+bh+28<innerHeight;
   const top=below?r.bottom+pad+14:Math.max(8,r.top-pad-14-bh),left=Math.max(10,Math.min(innerWidth-W-10,r.left+r.width/2-W/2));
   bb.style.left=left+'px';bb.style.top=top+'px';ar.className='tarr '+(below?'up':'down');ar.style.left=Math.max(16,Math.min(W-30,r.left+r.width/2-left-8))+'px'};
  place();setTimeout(place,350)}
 const close=()=>{ov.remove();removeEventListener('resize',show2);removeEventListener('keydown',key)},show2=()=>show(),key=e=>{if(e.key==='Escape')close()};
 ov.onclick=e=>{const a=e.target.dataset&&e.target.dataset.a;if(a==='x')close();else if(a==='b'&&i>0){i--;show()}else if(a==='n'){if(i<steps.length-1){i++;show()}else close()}};
 addEventListener('resize',show2);addEventListener('keydown',key);show()}
function helpInit(btn,steps){let seen=0;try{seen=localStorage.getItem('tourSeen')}catch(e){}if(!seen)btn.classList.add('pulse');
 btn.onclick=()=>{btn.classList.remove('pulse');try{localStorage.setItem('tourSeen','1')}catch(e){}startTour(steps())}}

function fitCanvas(c,LW,LH){const dpr=Math.min(3,devicePixelRatio||1),w=c.clientWidth;if(!w)return null;const bw=Math.round(w*dpr),bh=Math.round(bw*LH/LW);if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh}c.style.aspectRatio=LW+'/'+LH;const g=c.getContext('2d');g.setTransform(bw/LW,0,0,bw/LW,0,0);return{g,W:LW,H:LH}}
