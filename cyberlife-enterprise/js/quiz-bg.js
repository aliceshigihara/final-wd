/* Fundo de partículas conectadas (tradução vanilla JS de um template React de "Particles").
   Limitado ao container: ocupa só a seção do quiz e pausa quando ela sai da tela. */
class QuizParticles {
    constructor(sel, o = {}) {
        this.o = Object.assign({ count: 70, color: '56,189,248', link: 130, speed: 0.35, mouse: 140 }, o);
        this.root = document.querySelector(sel);
        if (!this.root) return;
        this.cv = document.createElement('canvas');
        this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        this.ctx = this.cv.getContext('2d');
        this.root.appendChild(this.cv);
        this.m = { x: -999, y: -999 };
        this.visible = true;
        this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const sec = this.root.parentElement;
        sec.addEventListener('pointermove', e => {
            const r = this.root.getBoundingClientRect();
            this.m.x = e.clientX - r.left; this.m.y = e.clientY - r.top;
        });
        sec.addEventListener('pointerleave', () => { this.m.x = this.m.y = -999; });
        new ResizeObserver(() => this.resize()).observe(this.root);
        new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(this.root);
        this.resize();
        if (!this.still) this.loop();
    }
    resize() {
        const d = Math.min(devicePixelRatio || 1, 2);
        this.w = this.root.clientWidth; this.h = this.root.clientHeight;
        if (!this.w || !this.h) return;
        this.cv.width = this.w * d; this.cv.height = this.h * d;
        this.ctx.setTransform(d, 0, 0, d, 0, 0);
        const n = Math.round(this.o.count * Math.min(1, this.w / 1100) + 20);
        this.p = Array.from({ length: n }, () => ({
            x: Math.random() * this.w, y: Math.random() * this.h,
            vx: (Math.random() - .5) * this.o.speed * 2, vy: (Math.random() - .5) * this.o.speed * 2,
            r: Math.random() * 1.6 + .6
        }));
        if (this.still) this.draw();
    }
    step() {
        for (const a of this.p) {
            const dx = a.x - this.m.x, dy = a.y - this.m.y, d = Math.hypot(dx, dy);
            if (d < this.o.mouse) { const f = (1 - d / this.o.mouse) * .6; a.vx += dx / d * f * .2; a.vy += dy / d * f * .2; }
            a.vx *= .99; a.vy *= .99;
            a.x += a.vx; a.y += a.vy;
            if (a.x < 0 || a.x > this.w) a.vx *= -1;
            if (a.y < 0 || a.y > this.h) a.vy *= -1;
        }
    }
    draw() {
        const c = this.ctx, L = this.o.link, col = this.o.color;
        c.clearRect(0, 0, this.w, this.h);
        for (let i = 0; i < this.p.length; i++) {
            const a = this.p[i];
            c.fillStyle = `rgba(${col},.8)`;
            c.beginPath(); c.arc(a.x, a.y, a.r, 0, 6.283); c.fill();
            for (let j = i + 1; j < this.p.length; j++) {
                const b = this.p[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < L) {
                    c.strokeStyle = `rgba(${col},${(1 - d / L) * .35})`;
                    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
                }
            }
        }
    }
    loop() { if (this.visible && this.p) { this.step(); this.draw(); } requestAnimationFrame(() => this.loop()); }
}
new QuizParticles('#quiz-bg');