const $=id=>document.getElementById(id),$$=s=>[...document.querySelectorAll(s)];
const R=matchMedia('(prefers-reduced-motion:reduce)').matches,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),fmt=n=>n.toLocaleString('es-AR');

$$('.wave').forEach(el=>{
  el.setAttribute('aria-label',el.textContent);
  el.innerHTML=[...el.textContent].map((c,i)=>`<span aria-hidden="true" style="--i:${i}">${c}</span>`).join('');
});

let S={s:0,p:0,c:0},cur=[],prog=0;
const D={
  sem:{v:[30,45,38,62,55,80,96],k:[128400,38,27],d:'+18%'},
  mes:{v:[20,28,35,31,48,52,60,58,72,85,80,104],k:[486200,142,89],d:'+24%'}
};

function build(v,w=320,h=120){
  const m=Math.max(...v)*1.1,p=v.map((y,i)=>[i*w/(v.length-1),h-y/m*h+6]);
  let d=`M${p[0][0]} ${p[0][1]}`;
  for(let i=1;i<p.length;i++){
    const[x0,y0]=p[i-1],[x1,y1]=p[i],c=(x0+x1)/2;
    d+=` C${c} ${y0} ${c} ${y1} ${x1} ${y1}`;
  }
  return{d,a:`${d} L${w} 130 L0 130Z`,last:p[p.length-1]};
}

function count(el,to,pre='',suf=''){
  const t0=performance.now();
  (function f(t){
    const k=clamp((t-t0)/1000),e=1-Math.pow(1-k,3);
    el.textContent=pre+fmt(Math.round(to*e))+suf;
    if(k<1)requestAnimationFrame(f);
  })(t0);
}

function show(key){
  const s=D[key],g=build(s.v),l=$('line'),a=$('area'),d=$('dot');
  l.classList.remove('go');
  a.classList.remove('go');
  l.setAttribute('d',g.d);
  a.setAttribute('d',g.a);
  d.setAttribute('cx',g.last[0]);
  d.setAttribute('cy',g.last[1]);
  void l.getBoundingClientRect();
  l.classList.add('go');
  a.classList.add('go');
  count($('k0'),s.k[0],'$');
  count($('k1'),s.k[1]);
  count($('k2'),s.k[2]);
  S={s:s.k[0],p:s.k[1],c:s.k[2]};
  cur=[...s.v];
  $('k0d').textContent=s.d+' vs. anterior';
}

$$('.seg button').forEach(b=>b.addEventListener('click',()=>{
  $$('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  show(b.dataset.p);
}));
show('sem');

$$('.tools button').forEach(b=>b.addEventListener('click',()=>{
  $$('.tools button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  $('toolNote').textContent=b.dataset.n;
}));

$$('.tile').forEach(t=>t.addEventListener('pointermove',e=>{
  const r=t.getBoundingClientRect();
  t.style.setProperty('--mx',(e.clientX-r.left)+'px');
  t.style.setProperty('--my',(e.clientY-r.top)+'px');
}));

$$('.bars i').forEach((b,i)=>b.style.setProperty('--k',i));

const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    e.target.classList.add('in');
    io.unobserve(e.target);
  }
}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
$$('[data-r]').forEach(el=>io.observe(el));

const io2=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    count(e.target,+e.target.dataset.to);
    io2.unobserve(e.target);
  }
}),{threshold:.6});
$$('[data-to]').forEach(el=>io2.observe(el));

const sc=$('scrub');
sc.setAttribute('aria-label',sc.textContent);
sc.innerHTML=sc.textContent.trim().split(/\s+/).map((w,i,a)=>`<span aria-hidden="true" class="${i>=a.length-6?'hl':''}">${w}</span>`).join(' ');
const words=[...sc.children];

let AC=null,snd=false;
function blip(k=1){
  if(!snd)return;
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='triangle';
    o.frequency.value=440*Math.pow(1.0595,Math.min(k,12)*2);
    g.gain.setValueAtTime(.12,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.18);
    o.connect(g);
    g.connect(AC.destination);
    o.start();
    o.stop(AC.currentTime+.2);
  }catch(e){}
}

document.body.insertAdjacentHTML('beforeend','<div class="toast" id="toast" role="status"></div>');
let tt;
function toast(t){
  const el=$('toast');
  el.textContent=t;
  el.classList.add('show');
  clearTimeout(tt);
  tt=setTimeout(()=>el.classList.remove('show'),2800);
}

document.querySelector('.chart').insertAdjacentHTML('afterend','<div class="goal"><div class="goal__t"><span>Meta del mes</span><b id="gp">0%</b></div><div class="goal__b"><i id="gf"></i></div></div><div class="sellrow"><button class="sell" id="sell" type="button">+ Registrar venta <span id="combo"></span></button></div>');

function tw(el,a,b,pre){
  const t0=performance.now();
  (function f(t){
    const k=clamp((t-t0)/500);
    el.textContent=pre+fmt(Math.round(a+(b-a)*(1-Math.pow(1-k,3))));
    if(k<1)requestAnimationFrame(f);
  })(t0);
}

function setGoal(){
  const q=Math.min(100,Math.round(prog));
  $('gp').textContent=q+'%';
  $('gf').style.width=q+'%';
  if(prog>=100){
    blip(10);
    setTimeout(()=>{prog=0;setGoal();},900);
  }
}

let last=0,combo=0,ct;
function doSale(auto){
  const now=performance.now();
  if(!auto){combo=now-last<1400?combo+1:1;last=now;}else combo=1;
  const amt=Math.round((3+Math.random()*15)*10)*100,from=S.s;
  S.s+=amt;
  S.p++;
  if(combo%3===0)S.c++;
  tw($('k0'),from,S.s,'$');
  $('k1').textContent=fmt(S.p);
  $('k2').textContent=fmt(S.c);
  $('k0').animate([{transform:'scale(1.12)',color:'#16A34A'},{transform:'none'}],{duration:380,easing:'ease-out'});
  const nv=clamp(cur[cur.length-1]*(.85+Math.random()*.5),20,140);
  cur.push(nv);
  cur.shift();
  const g=build(cur);
  $('line').setAttribute('d',g.d);
  $('area').setAttribute('d',g.a);
  $('dot').setAttribute('cx',g.last[0]);
  $('dot').setAttribute('cy',g.last[1]);
  const sb=$('sell').getBoundingClientRect(),x=sb.left+sb.width/2+(Math.random()-.5)*90,y=sb.top;
  const f=document.createElement('div');
  f.className='fl';
  f.textContent='+$'+fmt(amt)+(combo>1?'  x'+combo:'');
  f.style.left=x+'px';
  f.style.top=y+'px';
  document.body.appendChild(f);
  f.animate([{transform:'translate(-50%,0) scale(.8)',opacity:1},{transform:'translate(-50%,-90px) scale(1.15)',opacity:0}],{duration:900,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>f.remove();
  if(!auto){
    blip(combo);
    if(navigator.vibrate)navigator.vibrate(12);
  }
  $('combo').textContent=combo>1?'x'+combo+' 🔥':'';
  clearTimeout(ct);
  ct=setTimeout(()=>{combo=0;$('combo').textContent='';},1500);
  const sm=document.querySelector('.chip--a small');
  if(sm)sm.textContent='+$'+fmt(amt)+' · ahora mismo';
  prog+=8+Math.random()*6;
  setGoal();
}

$('sell').addEventListener('click',()=>doSale(false));
let heroOn=true;
new IntersectionObserver(e=>{heroOn=e[0].isIntersecting;}).observe($('hero'));
setInterval(()=>{if(!document.hidden&&heroOn&&performance.now()-last>3200)doSale(true);},2400);

$$('.tools button').forEach(b=>b.addEventListener('click',e=>{blip(2);}));
$$('.mod input').forEach(i=>i.addEventListener('change',()=>{if(i.checked)blip(4);}));

let lc=0,lt=0;
document.querySelector('.brand').addEventListener('click',()=>{
  const n=performance.now();
  lc=n-lt<900?lc+1:1;
  lt=n;
  if(lc===5){toast('🚀 ¡Encontraste el secreto del logo!');}
});

const chipB=document.querySelector('.chip--b'),
  msgs=[
    ['Stock bajo','3 productos para reponer'],
    ['Cliente nuevo','Lucía se sumó a tu agenda'],
    ['Pago recibido','$8.900 acreditados'],
    ['Meta cerca','Te falta poco este mes']
  ];
let mi=0;
setInterval(()=>{
  if(document.hidden)return;
  mi=(mi+1)%msgs.length;
  const d=chipB.querySelector('div');
  d.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:220}).onfinish=()=>{
    d.innerHTML=msgs[mi][0]+'<small>'+msgs[mi][1]+'</small>';
    d.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260});
  };
},3200);

const tb=$$('.tools button');
let ti=0,tu=false;
$('toolNote').closest('.tile').addEventListener('pointerdown',()=>{tu=true;});
setInterval(()=>{
  if(tu||document.hidden)return;
  ti=(ti+1)%tb.length;
  tb.forEach((x,i)=>x.setAttribute('aria-pressed',i===ti));
  $('toolNote').textContent=tb[ti].dataset.n;
},3000);

const wv=document.querySelector('.wave');
setTimeout(()=>wv.classList.add('done'),3300);
setInterval(()=>{
  if(document.hidden||scrollY>innerHeight)return;
  wv.classList.add('rp');
  setTimeout(()=>wv.classList.remove('rp'),1500);
},4500);

const spot=document.querySelector('.spot');
if(!R&&matchMedia('(hover:hover)').matches){
  addEventListener('pointermove',e=>{
    spot.style.setProperty('--sx',e.clientX+'px');
    spot.style.setProperty('--sy',e.clientY+'px');
  },{passive:true});
}

const W=[
  {t:'Tiendas',h:'Tu stock siempre a la vista',p:'Controla talles, colores y precios sin planillas, y sabe qué reponer.',r:[['Remera básica · M','8 en stock'],['Jean recto · 40','3 en stock'],['Campera liviana','Reponer']]},
  {t:'Artesanías',h:'Cuánto ganas con cada pieza',p:'Registra tus ventas y mira qué productos te dejan más.',r:[['Taza personalizada','$6.500'],['Pack de regalo','$18.900'],['Velas aromáticas','$4.200']]},
  {t:'Finanzas',h:'Tus finanzas siempre claras',p:'Controla ingresos y gastos y mira cuánto gana tu emprendimiento desde un solo lugar.',r:[['Ventas de hoy','$48.500'],['Compra de insumos','-$12.800'],['Balance del mes','$186.200']]}
];
const wtabs=document.querySelector('.who__tabs'),wc=document.querySelector('.who__c');
const X=[
  {c:'#F43F5E',n:'Venta nueva · +$12.400'},
  {c:'#A78BFA',n:'Pedido personalizado · $6.500'},
  {c:'#22C55E',n:'Balance del mes · +18%'}
];
W.forEach((d,i)=>Object.assign(d,X[i]));
wtabs.innerHTML=W.map(d=>`<button type="button" role="tab" style="--ac:${d.c}"><b>${d.t}</b><i></i></button>`).join('');
const wt=[...wtabs.children];

function who(i){
  wt.forEach((b,j)=>{
    b.classList.toggle('on',j===i);
    b.setAttribute('aria-selected',j===i);
    const bar=b.querySelector('i');
    bar.style.animation='none';
    if(j===i){void bar.offsetWidth;bar.style.animation='';}
  });
  const d=W[i];
  wc.style.setProperty('--ac',d.c);
  wc.innerHTML=`<div class="lv"><span class="lvd"></span>En vivo<span class="nt">${d.n}</span></div><h3>${d.h}</h3><p>${d.p}</p>`+d.r.map((r,k)=>`<div class="wr" style="--k:${k}">${r[0]}<span>${r[1]}</span></div>`).join('')+`<div class="wb">${Array.from({length:16},(_,j)=>`<i style="--h:${20+Math.round(Math.random()*80)}%;--k:${j}"></i>`).join('')}</div>`;
  wc.classList.remove('who__c--shine');
  void wc.offsetWidth;
  wc.classList.add('who__c--shine');
}
wt.forEach((b,i)=>{
  b.addEventListener('click',()=>who(i));
  b.querySelector('i').addEventListener('animationend',()=>who((i+1)%W.length));
});
who(0);

$$('.imp').forEach(el=>{
  el.setAttribute('aria-label',el.textContent);
  el.innerHTML=[...el.textContent].map((c,i)=>`<span aria-hidden="true" style="--i:${i}">${c}</span>`).join('');
});

$$('.pm__t').forEach(t=>t.innerHTML+=t.innerHTML);

const stk=$('stk');
const hd=$('hd'),heroL=$('heroL'),box=$('box'),sp=$$('[data-sp]'),rows=$$('.mq__row');
rows.forEach(r=>r.innerHTML+=r.innerHTML);
let ly=scrollY,v=0,pos=0,mqOn=true;
const hint=$('hint');
new IntersectionObserver(e=>{mqOn=e[0].isIntersecting;}).observe(document.querySelector('.mq'));

function tick(){
  const y=scrollY,vh=innerHeight;
  v+=((y-ly)-v)*.12;
  ly=y;
  hd.classList.toggle('sm',y>30);
  stk.classList.toggle('show',y>vh*.9&&box.getBoundingClientRect().top>vh*.8);
  if(!R){
    if(y<vh*1.4){
      sp.forEach(el=>el.style.translate=`0 ${y*el.dataset.sp}px`);
      hint.style.opacity=clamp(.7-y/200,0,.7);
    }
    heroL.style.opacity=clamp(1-y/(vh*.75));
    heroL.style.translate=`0 ${y*.1}px`;
    if(mqOn)pos+=.6+v*.15;
    const sk=clamp(v*-.35,-9,9);
    if(mqOn)rows.forEach((r,i)=>{
      const h=r.scrollWidth/2,p=((pos%h)+h)%h;
      r.style.transform=`translateX(${i?p-h:-p}px) skewX(${sk}deg)`;
    });
  }
  const sr=sc.getBoundingClientRect(),n=Math.round(clamp((vh*.85-sr.top)/(vh*.55))*words.length);
  words.forEach((w,i)=>w.classList.toggle('on',i<n));
  if(!R){
    const br=box.getBoundingClientRect(),q=clamp((vh-br.top)/(vh*.8));
    box.style.scale=.88+.12*q;
    box.style.borderRadius=(80-44*q)+'px';
  }
  if(!R)requestAnimationFrame(tick);
}
tick();
if(R)addEventListener('scroll',tick,{passive:true});

const pn=document.querySelector('.panel'),mk=document.querySelector('.mock');
if(!R&&matchMedia('(hover:hover)').matches){
  mk.addEventListener('pointermove',e=>{
    const r=mk.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    pn.style.transform=`perspective(900px) rotateY(${x*10}deg) rotateX(${-y*10}deg)`;
  });
  mk.addEventListener('pointerleave',()=>{pn.style.transform='';});
}

if(!R)$$('.mag').forEach(b=>{
  b.addEventListener('pointermove',e=>{
    const r=b.getBoundingClientRect();
    b.style.translate=`${(e.clientX-r.left-r.width/2)*.2}px ${(e.clientY-r.top-r.height/2)*.3}px`;
  });
  b.addEventListener('pointerleave',()=>b.style.translate='0 0');
});

(function(){
  const q=$('fq'),chips=$$('.faq__chips button'),gs=$$('.fg'),em=$('fe');
  let cat='all';
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function filt(){
    const t=norm(q.value.trim());
    let n=0;
    gs.forEach(g=>{
      let any=0;
      const ok=cat==='all'||g.dataset.g===cat;
      g.querySelectorAll('details').forEach(d=>{
        const m=ok&&(!t||norm(d.textContent).includes(t));
        d.hidden=!m;
        if(m){any++;n++;}
        if(t)d.open=m;
      });
      g.hidden=!any;
    });
    em.classList.toggle('show',n===0);
  }
  q.addEventListener('input',filt);
  chips.forEach(b=>b.addEventListener('click',()=>{
    cat=b.dataset.c;
    chips.forEach(x=>x.setAttribute('aria-pressed',x===b));
    filt();
  }));
})();