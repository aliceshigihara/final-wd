/* Kinetic Text: native adaptation of Magic UI's proximity-based weight animation.
   Uses the supplied CyberLife wordmark, preserving its original letter shapes. */
(() => {
    const title = document.querySelector('.kinetic-title');
    if (!title) return;
    const canvas = title.querySelector('canvas');
    const source = title.querySelector('img');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const ranges = [[1,32],[104,140],[213,239],[317,341],[416,445],[519,545],[617,627],[700,740],[792,820]];
    const letters = ranges.map(([left,right]) => ({left,right,center:(left+right)/2,weight:0,target:0}));
    const W = 831, H = 65;
    let glyphs = [], frame = 0, last = 0, ready = false;
    function paint() {
        ctx.clearRect(0,0,W,H);
        letters.forEach((letter,i) => {
            const glyph = glyphs[i];
            const r = letter.weight;
            // Expand the original alpha silhouette in all directions to emulate font weight.
            if (r > .03) {
                ctx.globalAlpha = Math.min(1,r/.65);
                for(let j=0;j<16;j++) {
                    const a = j*Math.PI/8;
                    ctx.drawImage(glyph,letter.left+Math.cos(a)*r,Math.sin(a)*r);
                }
            }
            ctx.globalAlpha = 1;
            ctx.drawImage(glyph,letter.left,0);
        });
    }
    function tick(now) {
        const dt = last ? Math.min(50,now-last) : 16;
        last = now;
        let moving = false;
        for(const l of letters) {
            l.weight += (l.target-l.weight)*(1-Math.exp(-dt/75));
            if(Math.abs(l.target-l.weight)>.015) moving=true; else l.weight=l.target;
        }
        paint();
        if(moving) frame=requestAnimationFrame(tick); else {frame=0;last=0;}
    }
    function schedule(){ if(!frame && ready && !reduced.matches) frame=requestAnimationFrame(tick); }
    function reset(){ letters.forEach(l=>l.target=0); schedule(); }
    function resize(){
        const scale=Math.max(1,Math.min(3,devicePixelRatio*title.clientWidth/W));
        canvas.width=Math.ceil(W*scale); canvas.height=Math.ceil(H*scale);
        ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0); paint();
    }
    function init(){
        if(ready || !source.naturalWidth) return;
        glyphs=letters.map(({left,right})=>{
            const g=document.createElement('canvas'); g.width=right-left; g.height=H;
            const c=g.getContext('2d');
            c.drawImage(source,left,0,right-left,H,0,0,right-left,H);
            c.globalCompositeOperation='source-in'; c.fillStyle='#fff'; c.fillRect(0,0,g.width,H);
            return g;
        });
        ready=true; resize(); title.classList.add('is-ready');
        if('ResizeObserver' in window) new ResizeObserver(resize).observe(title); else window.addEventListener('resize',resize);
        title.addEventListener('pointermove',e=>{
            if(reduced.matches || e.pointerType==='touch') return;
            const bounds=title.getBoundingClientRect();
            const x=(e.clientX-bounds.left)/bounds.width*W;
            letters.forEach(l=>{const d=Math.abs(x-l.center); l.target=3.2*Math.pow(Math.max(0,1-d/190),1.5);});
            schedule();
        });
        title.addEventListener('pointerleave',reset);
        title.addEventListener('pointercancel',reset);
        reduced.addEventListener('change',()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=0;letters.forEach(l=>{l.target=0;l.weight=0;});paint();});
    }
    if(source.complete) init(); else source.addEventListener('load',init,{once:true});
})();
