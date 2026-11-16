(() => {
 const svg=document.getElementById('skill-graph'),wrap=document.getElementById('skill-graph-wrap'),table=document.getElementById('skill-table'),body=document.getElementById('skills-body'),toggle=document.getElementById('skills-toggle');
 const ns=svg.namespaceURI,nodes=[],edges=[],groups=PROFILE.skills;
 const make=(tag,attrs)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e};
 groups.forEach((group,g)=>{const hub={label:group.title,g,hub:true,vx:0,vy:0};nodes.push(hub);group.items.forEach((label,i)=>{const node={label,g,i,hub:false,vx:0,vy:0};nodes.push(node);edges.push({a:hub,b:node})})});
 PROFILE.relatedSkills.forEach(([a,b])=>edges.push({a:nodes.find(n=>n.label===a),b:nodes.find(n=>n.label===b)}));
 const lines=make('g',{'aria-hidden':'true'});svg.append(lines);
 edges.forEach(e=>{e.el=make('line',{});lines.append(e.el)});
 let width=0,height=0,visible=false,drag=null,tableMode=innerWidth<600,busy=false,energy=1;
 const connected=(a,b)=>a===b||edges.some(e=>(e.a===a&&e.b===b)||(e.b===a&&e.a===b));
 function highlight(node){nodes.forEach(n=>n.el.style.opacity=!node||connected(n,node)?1:.18);edges.forEach(e=>e.el.style.opacity=!node||e.a===node||e.b===node?1:.08)}
 function destination(node){return [...document.querySelectorAll('.entry .tag,.project .tag')].find(e=>e.textContent===node.label)?.closest('article')}
 function visit(node){const el=destination(node);if(el){el.scrollIntoView({behavior:Effects.motion.matches?'instant':'smooth',block:'center'});Effects.animate(el,[{background:'var(--surface)'},{background:'transparent'}],{duration:1200})}}
 nodes.forEach(n=>{n.el=make('g',{class:n.hub?'hub':'skill',tabindex:0,role:'button','aria-label':n.label+(destination(n)?' — показать в проектах или опыте':' — перетащить узел графа')});n.radius=n.hub?6:3+edges.filter(e=>e.a===n||e.b===n).length*.6;n.phase=nodes.indexOf(n)*2.399;n.el.append(make('circle',{r:n.radius}));const label=make('text',{y:n.radius+13});label.textContent=n.label;n.el.append(label);svg.append(n.el);
  n.el.addEventListener('pointerenter',()=>highlight(n));n.el.addEventListener('pointerleave',()=>{if(!drag)highlight(null)});n.el.addEventListener('focus',()=>highlight(n));n.el.addEventListener('blur',()=>highlight(null));
  n.el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();visit(n)}});
  n.el.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.preventDefault();n.el.setPointerCapture(ev.pointerId);drag={node:n,startX:ev.clientX,startY:ev.clientY,moved:false};energy=1});
  n.el.addEventListener('pointermove',ev=>{if(drag?.node!==n)return;const r=svg.getBoundingClientRect();n.x=Math.max(35,Math.min(width-35,ev.clientX-r.left));n.y=Math.max(25,Math.min(height-25,ev.clientY-r.top));n.vx=n.vy=0;drag.moved ||= Math.hypot(ev.clientX-drag.startX,ev.clientY-drag.startY)>5;draw()});
  const release=ev=>{if(drag?.node!==n)return;const click=!drag.moved&&ev.type==='pointerup';drag=null;if(n.el.hasPointerCapture(ev.pointerId))n.el.releasePointerCapture(ev.pointerId);highlight(null);if(click)visit(n)};
  n.el.addEventListener('pointerup',release);n.el.addEventListener('pointercancel',release);
 });
 function layout(){
  const r=svg.getBoundingClientRect();if(!r.width)return;width=r.width;height=r.height;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const columns=width>=900?4:width>=600?2:1,rows=Math.ceil(groups.length/columns);
  nodes.forEach(n=>{n.homeX=width/columns*(n.g%columns+.5);n.homeY=columns===4?height*(n.g%2?.56:.44):height/rows*(Math.floor(n.g/columns)+.5);n.width=n.el.querySelector('text').getComputedTextLength()+28;if(!Number.isFinite(n.x)){const angle=(n.i||0)/6*Math.PI*2;n.x=n.homeX+Math.cos(angle)*35;n.y=n.homeY+Math.sin(angle)*35}});
  energy=1;for(let i=0;i<300;i++)step(i*16);draw();
 }
 function step(now=performance.now()){
  const scale=Math.min(1,width/600);
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j],dx=b.x-a.x||.1,dy=b.y-a.y,d2=Math.max(25,dx*dx+dy*dy),force=220*scale*energy/d2;
   a.vx-=dx*force;a.vy-=dy*force;b.vx+=dx*force;b.vy+=dy*force;
   const overlapX=(a.width+b.width)/2-Math.abs(dx),overlapY=40-Math.abs(dy);
   if(overlapX>0&&overlapY>0){if(overlapX<overlapY){const push=Math.sign(dx)*overlapX*.25;a.vx-=push;b.vx+=push}else{const push=(Math.sign(dy)||1)*overlapY*.25;a.vy-=push;b.vy+=push}}
  }
  edges.forEach(({a,b})=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-(a.hub||b.hub?80:70)*scale)/d*.1*energy;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f});
  nodes.forEach(n=>{n.vx+=(n.homeX-n.x)*.04*energy;n.vy+=(n.homeY-n.y)*.04*energy;if(!Effects.motion.matches){n.vx+=Math.cos(now/1800+n.phase)*.04;n.vy+=Math.sin(now/2300+n.phase)*.04}if(drag?.node===n){n.vx=n.vy=0;return}n.vx*=.6;n.vy*=.6;n.x=Math.max(n.width/2,Math.min(width-n.width/2,n.x+n.vx));n.y=Math.max(n.radius+4,Math.min(height-n.radius-18,n.y+n.vy))});
  energy=Math.max(energy*.985,Effects.motion.matches?0:.04);
 }
 function draw(){nodes.forEach(n=>n.el.setAttribute('transform',`translate(${n.x},${n.y})`));edges.forEach(({a,b,el})=>{el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y)})}
 function frame(now){requestAnimationFrame(frame);if(!visible||tableMode||document.hidden||Effects.motion.matches)return;step(now);draw()}
 function applyMode(){wrap.hidden=tableMode;table.hidden=!tableMode;toggle.textContent=tableMode?'view as graph':'view as table';toggle.setAttribute('aria-pressed',String(tableMode));if(!tableMode)layout()}
 function labels(){const elements=tableMode?table.querySelectorAll('h3,.tag'):svg.querySelectorAll('text');return new Map([...elements].map(e=>[e.textContent,{rect:e.getBoundingClientRect(),size:getComputedStyle(e).fontSize}]))}
 toggle.addEventListener('click',async()=>{if(busy)return;busy=true;toggle.disabled=true;const before=labels();tableMode=!tableMode;applyMode();const after=labels();if(!Effects.motion.matches){body.classList.add('is-flying');await Promise.all([...before].map(async([text,from])=>{const to=after.get(text);if(!to)return;const el=document.createElement('span');el.className='skill-ghost';el.textContent=text;el.style.fontSize=from.size;document.body.append(el);Effects.scramble(el,520);await Effects.animate(el,[{transform:`translate(${from.rect.left}px,${from.rect.top}px)`,fontSize:from.size},{transform:`translate(${to.rect.left}px,${to.rect.top}px)`,fontSize:to.size}],{duration:650,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});el.remove()}));body.classList.remove('is-flying')}busy=false;toggle.disabled=false});
 new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(svg);new ResizeObserver(()=>{if(!tableMode)layout()}).observe(wrap);applyMode();requestAnimationFrame(frame);
})();
