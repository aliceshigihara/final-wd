/* Vanilla JS port of useLayouts Gooey Navbar (MIT), by Urvish Mali.
 * https://github.com/iurvish/uselayouts/blob/main/registry/default/example/gooey-navbar.tsx
 * Original tangent-arc contour and spring constants, with right anchoring for the existing header.
 */
(() => {
  'use strict';
  const num = n => Number.isFinite(n) ? String(Math.round(n*100)/100) : '0';
  const pill = ({x,y,width:w,height:h},radius) => {
    const r=Math.min(radius,w/2,h/2), n=num;
    return `M${n(x)} ${n(y+r)} A${n(r)} ${n(r)} 0 0 1 ${n(x+r)} ${n(y)} L${n(x+w-r)} ${n(y)} A${n(r)} ${n(r)} 0 0 1 ${n(x+w)} ${n(y+r)} L${n(x+w)} ${n(y+h-r)} A${n(r)} ${n(r)} 0 0 1 ${n(x+w-r)} ${n(y+h)} L${n(x+r)} ${n(y+h)} A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y+h-r)} Z`;
  };
  function bridge(e,t,radius,neckHeight,factor){
    if(factor<=.02)return '';
    const a=e.height,o=e.y+a/2,s=Math.min(radius,a/2,e.width/2,t.width/2);
    if(s<=0)return '';
    const c=e.x+e.width,l=t.x,u=l-c;
    if(u<0)return '';
    const d=Math.min(neckHeight/2*factor,a/2-.5),f=u/2+s,p=d-a/2+s,m=2*(p-s);
    if(Math.abs(m)<1e-4)return '';
    const h=(s*s-f*f-p*p)/m;
    if(!(h>0)||s+h<f)return '';
    const g=Math.sqrt(Math.max(0,(s+h)**2-f*f)),mid=(c+l)/2,v=c-s,y=e.y+s,ee=mid-v,b=-g,hyp=Math.hypot(ee,b)||1,te=v+s*ee/hyp,S=y+s*b/hyp,C=2*mid-te,n=num;
    return `M${n(te)} ${n(S)} A${n(h)} ${n(h)} 0 0 0 ${n(C)} ${n(S)} L${n(C)} ${n(2*o-S)} A${n(h)} ${n(h)} 0 0 0 ${n(te)} ${n(2*o-S)} Z`;
  }
  document.querySelectorAll('.gooey-nav').forEach(nav=>{
    const links=[...nav.querySelectorAll('a')], active=links.findIndex(a=>a.classList.contains('active'));
    if(!links.length)return;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
    svg.setAttribute('class','gooey-contour');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');path.setAttribute('fill','var(--gooey-fill, #203a5a)');path.setAttribute('fill-rule','nonzero');svg.append(path);nav.prepend(svg);
    let hovered=-1, focused=-1, rects=[],current=[],push=32,frame=0,last=0;
    const targets=()=>links.slice(0,-1).map((_,i)=>[active,hovered,focused].some(j=>j===i||j===i+1)?1:0);
    let factors=targets(),vel=factors.map(()=>0);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function measure(){
      let x=0;push=innerWidth<=420?10:innerWidth<=760?16:32;
      rects=links.map(a=>{const width=a.offsetWidth,height=a.offsetHeight,r={x,y:0,width,height};x+=width;return r;});render();
    }
    function render(){
      if(!rects.length)return;
      const expansion=push*factors.reduce((a,b)=>a+b,0);let offset=-expansion;
      current=rects.map((r,i)=>{const next={...r,x:r.x+offset};links[i].style.transform=`translateX(${offset}px)`;offset+=push*(factors[i]||0);return next;});
      const radius=12,neck=current[0].height*.35;
      path.setAttribute('d',current.map(r=>pill(r,radius)).concat(current.slice(0,-1).map((r,i)=>bridge(r,current[i+1],radius,neck,factors[i]))).join(' '));
      links.forEach((a,i)=>a.classList.toggle('is-hovered',i===hovered||i===focused));
    }
    function tick(now){
      const dt=Math.min((now-last)/1000,1/30);last=now;let moving=false;
      targets().forEach((target,i)=>{const force=-260*(factors[i]-target)-30*vel[i];vel[i]+=force*dt;factors[i]+=vel[i]*dt;if(Math.abs(factors[i]-target)>.001||Math.abs(vel[i])>.01)moving=true;else{factors[i]=target;vel[i]=0;}});
      render();frame=moving?requestAnimationFrame(tick):0;
    }
    function animate(){if(reduced.matches){factors=targets();vel.fill(0);render();return;}if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
    nav.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const x=e.clientX-nav.getBoundingClientRect().left;let nearest=-1,min=Infinity;current.forEach((r,i)=>{const d=Math.max(r.x-x,x-r.x-r.width,0);if(d<min){min=d;nearest=i;}});if(nearest!==hovered){hovered=nearest;animate();}});
    nav.addEventListener('pointerleave',()=>{hovered=-1;animate();});
    links.forEach((a,i)=>{a.addEventListener('focus',()=>{focused=i;animate();});a.addEventListener('blur',()=>{focused=-1;animate();});});
    if(active>=0)links[active].setAttribute('aria-current','page');
    measure();nav.classList.add('is-ready');window.addEventListener('resize',measure);document.fonts?.ready.then(measure);
  });
})();
