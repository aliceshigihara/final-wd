/* Vanilla adaptation of React Bits TextPressure (DavidHDev), originally
   ported from https://codepen.io/JuanFuentes/full/rgXKGQ.
   Reference: https://reactbits.dev/text-animations/text-pressure */
(() => {
  const container = document.querySelector('.text-pressure-container');
  if (!container) return;
  const title = container.querySelector('h1');
  const spans = [...title.children];
  const clamp = n => Math.min(1, Math.max(0, n));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let cursor = {x:0,y:0}, mouse = {...cursor}, frame=0, last=0, idleFrames=0, visible=true, ripples=[], hovering=false, autoPhase=0;
  const applied = [];
  function wake(){ if (!frame && visible) frame=requestAnimationFrame(tick); }
  function resize(){ const r=container.getBoundingClientRect(); title.style.fontSize=Math.max(r.width/(spans.length/2),24)+'px'; wake(); }
  function tick(now){
    frame=0;
    const elapsed=last?Math.min(now-last,64):1000/60; last=now;
    const rect=title.getBoundingClientRect(), maxDist=Math.max(rect.width*.5,1);
    if (!hovering && !motion.matches) {
      autoPhase += elapsed / 1000;
      cursor = {x:rect.left + rect.width*(.5 + .47*Math.sin(autoPhase*2*Math.PI/5)), y:rect.top+rect.height/2};
    }
    const follow=1-Math.exp(-elapsed/250);
    mouse.x+=(cursor.x-mouse.x)*follow; mouse.y+=(cursor.y-mouse.y)*follow;
    ripples=ripples.filter(r=>now-r.start<1300);
    const centers=spans.map(span=>{const r=span.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
    let changed=false;
    spans.forEach((span,i)=>{
      let p=motion.matches?0:clamp(1-distance(mouse,centers[i])/maxDist);
      if(!motion.matches) for(const ripple of ripples){
        const age=(now-ripple.start)/1000;
        const offset=(distance(ripple,centers[i])-age*rect.width*1.25)/Math.max(rect.width*.14,32);
        if(age>0&&age<1.3&&Math.abs(offset)<1){const swell=(1-offset*offset)**2*(1-age/1.3)**2*Math.min(1,age/.06);p=1-(1-p)*(1-swell);}
      }
      const weight=Math.floor(100+900*p), width=Math.floor(25+126*p);
      const settings=`'wght' ${weight}, 'wdth' ${width}, 'ital' ${p.toFixed(2)}`;
      if(applied[i]!==settings){span.style.fontVariationSettings=settings;applied[i]=settings;changed=true;}
    });
    const moving=Math.abs(cursor.x-mouse.x)>.1||Math.abs(cursor.y-mouse.y)>.1||ripples.length>0;
    idleFrames=moving?0:idleFrames+1;
    if(visible&&(!motion.matches&&(!hovering||moving||(changed&&idleFrames<60)))) frame=requestAnimationFrame(tick);else last=0;
  }
  resize(); const initial=container.getBoundingClientRect(); cursor={x:initial.left+initial.width/2,y:initial.top+initial.height/2};mouse={...cursor};
  container.addEventListener('pointerenter',e=>{hovering=true;cursor={x:e.clientX,y:e.clientY};wake();},{passive:true});
  container.addEventListener('pointermove',e=>{hovering=true;cursor={x:e.clientX,y:e.clientY};wake();},{passive:true});
  container.addEventListener('pointerleave',()=>{hovering=false;wake();},{passive:true});
  container.addEventListener('pointerdown',e=>{if(motion.matches)return;ripples.push({x:e.clientX,y:e.clientY,start:performance.now()});if(ripples.length>6)ripples.shift();wake();});
  window.addEventListener('scroll',wake,{passive:true,capture:true});
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();}).observe(container);
  document.fonts?.addEventListener('loadingdone',wake);
  motion.addEventListener('change',wake);
  wake();
})();
