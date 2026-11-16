/* Browser effects reconstructed from the reference's observed interactions. */
window.Effects = (() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789:.=*+-<>';
  const rand = () => chars[Math.floor(Math.random()*chars.length)];
  const animate = (el, frames, options) => motion.matches ? Promise.resolve() : el.animate(frames, options).finished.catch(()=>{});
  function scramble(el, duration=900) {
    if(motion.matches) return;
    const text=el.textContent, start=performance.now(); el.setAttribute('aria-label',text);
    function frame(now){const end=Math.floor((now-start)/duration*text.length);el.textContent=[...text].map((c,i)=>i<end||c===' '?c:rand()).join('');if(end<text.length&&el.isConnected)requestAnimationFrame(frame);else el.textContent=text;}
    requestAnimationFrame(frame);
  }
  function themes(){
    const sun=['...#...','.#...#.','..###..','#.###.#','..###..','.#...#.','...#...'],moon=['...###.','..##...','.##....','.##....','.##....','..##...','...###.'];
    document.querySelectorAll('.theme-toggle').forEach(button=>{
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 7 7');svg.setAttribute('aria-hidden','true');
      for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(sun[y][x]==='#'||moon[y][x]==='#'){
        const r=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v]of Object.entries({x:x+.1,y:y+.1,width:.8,height:.8}))r.setAttribute(k,v);
        if(sun[y][x]==='#')r.dataset.sun='';if(moon[y][x]==='#')r.dataset.moon='';r.style.setProperty('--delay',`${(x*5+y*3)%7*35}ms`);svg.append(r);
      }
      button.append(svg);button.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('resume-theme',next)}catch{}});
    });
  }
  function reveal(){
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const section=entry.target;io.unobserve(section);section.classList.add('is-visible');scramble(section.querySelector('h2'));}),{rootMargin:'0px 0px -12% 0px'});
    document.querySelectorAll('.reveal').forEach(section=>{section.classList.add('is-ready');const items=section.querySelectorAll('h3,p,li,.tags,.post-link,dl>div');items.forEach((el,i)=>{el.dataset.print='';el.style.setProperty('--delay',`${i*Math.min(90,1400/Math.max(items.length,1))}ms`)});io.observe(section)});
  }
  function life(){
    const canvas=document.getElementById('life');if(!canvas)return ()=>{};
    const ctx=canvas.getContext('2d'), cell=8;let cols=0,rows=0,board,next,tick=0,last=0,raf=0,blocked=[];
    const allowed=()=>!motion.matches&&innerWidth>=1200&&!document.hidden;
    function seed(x,y){if(!board)return;for(const[dx,dy]of[[1,0],[2,1],[0,2],[1,2],[2,2]]){const a=(x+dx+cols)%cols,b=(y+dy+rows)%rows;board[b*cols+a]=1;}}
    function resize(){cols=Math.ceil(innerWidth/cell);rows=Math.ceil(innerHeight/cell);canvas.width=innerWidth;canvas.height=innerHeight;board=new Uint8Array(cols*rows);next=new Uint8Array(board.length);for(let i=0;i<Math.max(8,cols*rows/1500);i++)seed(Math.random()*cols|0,Math.random()*rows|0);}
    function obstacles(){blocked=[...document.querySelectorAll('.terminal,.ribbon,.tag,h1,h2,h3,p,li,dl,.post-link,.contact-cta')].map(e=>e.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<innerHeight);}
    function step(){let alive=0;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)n+=board[((y+dy+rows)%rows)*cols+(x+dx+cols)%cols];const i=y*cols+x;next[i]=n===3||(board[i]&&n===2)?1:0;alive+=next[i];}[board,next]=[next,board];if(alive<15)seed(Math.random()*cols|0,Math.random()*rows|0);}
    function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--life');for(let i=0;i<board.length;i++)if(board[i]){const x=i%cols*cell,y=Math.floor(i/cols)*cell;if(!blocked.some(r=>x>r.left-12&&x<r.right+12&&y>r.top-12&&y<r.bottom+12))ctx.fillRect(x,y,7,7);}}
    function frame(now){raf=requestAnimationFrame(frame);if(!allowed()){ctx.clearRect(0,0,canvas.width,canvas.height);return}if(now-last<1000/6)return;last=now;step();if(++tick%6===0)obstacles();if(tick%12===0)seed(Math.random()*cols|0,Math.random()*rows|0);draw();}
    let pointerAt=0;addEventListener('pointermove',ev=>{if(!allowed()||ev.timeStamp-pointerAt<40)return;pointerAt=ev.timeStamp;seed(ev.clientX/cell|0,ev.clientY/cell|0)});
    addEventListener('life:seed',ev=>{for(const[x,y]of ev.detail||[])seed(x/cell|0,y/cell|0)});addEventListener('resize',resize);addEventListener('scroll',obstacles,{passive:true});resize();obstacles();raf=requestAnimationFrame(frame);return ()=>cancelAnimationFrame(raf);
  }
  function intro(){
    const el=document.getElementById('intro');if(!el)return;
    let seen=false;try{seen=sessionStorage.getItem('resume-intro-seen')==='1';sessionStorage.setItem('resume-intro-seen','1')}catch{}
    if(seen||motion.matches){el.remove();return}
    const canvas=el.querySelector('canvas'),ctx=canvas.getContext('2d'),word=el.querySelector('.intro-word');let raf=0,finished=false,last=0;
    canvas.width=innerWidth;canvas.height=innerHeight;ctx.font='14px "JetBrains Mono", monospace';const drops=Array.from({length:Math.ceil(innerWidth/16)},()=>Math.random()*innerHeight/16);
    function draw(now){if(finished)return;raf=requestAnimationFrame(draw);if(now-last<33)return;last=now;const dark=document.documentElement.dataset.theme==='dark';ctx.fillStyle=dark?'#0000001f':'#eff1f51f';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.fillStyle=dark?'#f5f5f5':'#3c3f55';drops.forEach((n,i)=>{ctx.fillText(rand(),i*16,n*16);drops[i]=n*16>innerHeight&&Math.random()>.97?0:n+1})}
    let timers=[];function leave(){if(finished)return;finished=true;timers.forEach(clearTimeout);cancelAnimationFrame(raf);el.classList.add('leaving');dispatchEvent(new CustomEvent('life:seed',{detail:drops.map((n,i)=>[i*16,n*16])}));setTimeout(()=>el.remove(),400);for(const name of ['pointerdown','keydown','wheel','touchstart'])removeEventListener(name,leave)}
    const greetings=['Hello','Привет','Hallo','こんにちは','Bonjour','Hola'];const chosen=['Hello',...greetings.slice(1).sort(()=>Math.random()-.5).slice(0,3)];chosen.forEach((text,i)=>timers.push(setTimeout(()=>{word.textContent=text;word.style.animation='none';void word.offsetWidth;word.style.animation=''},i*650)));timers.push(setTimeout(leave,chosen.length*650));for(const name of ['pointerdown','keydown','wheel','touchstart'])addEventListener(name,leave,{passive:true});raf=requestAnimationFrame(draw);
  }
  return {motion,animate,scramble,themes,reveal,life,intro};
})();
