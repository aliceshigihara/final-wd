/*
 * Scanner - adaptação em JavaScript puro para o fundo da página Sobre.
 */
(function (root) {
    'use strict';

    const DEFAULTS = {
        color1: '#5227FF',
        color2: '#38BDF8',
        color3: '#FFFFFF',
        speed: 0.5,
        sweepSpeed: 0.25,
        reverse: false,
        sweepWidth: 1.6,
        trail: 0.5,
        scale: 1.5,
        frequency: 2,
        ripple: 0.22,
        bandDensity: 11,
        lineWidth: 1.2,
        glow: 0.6,
        scanDirection: 'vertical',
        colorSpread: 0.7,
        brightness: 1,
        vignette: 0.3,
        scanline: true,
        scanlineIntensity: 0.5,
        grain: true,
        grainIntensity: 0.04,
        opacity: 1,
        mouseInteraction: true,
        mouseRadius: 0.5,
        mouseStrength: 0.7,
        mouseMode: 'repel',
        clickEffect: 'ping',
        intro: true,
        lightMode: false,
        dpr: undefined,
        className: '',
        style: undefined
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const merge = (base, extra) => ({ ...base, ...extra });
    const hexToRgb = (hex) => {
        const value = hex.replace('#', '');
        const full = value.length === 3
            ? value.split('').map((character) => character + character).join('')
            : value;
        const number = parseInt(full, 16);
        return [
            ((number >> 16) & 255) / 255,
            ((number >> 8) & 255) / 255,
            (number & 255) / 255
        ];
    };

    class Scanner {
        constructor(container, options = {}) {
            this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;
            if (!this.container) throw new Error('Scanner: container não encontrado.');

            this.options = merge(DEFAULTS, options);
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'scanner-canvas';
            this.canvas.setAttribute('aria-hidden', 'true');
            this.container.appendChild(this.canvas);
            this.context = this.canvas.getContext('2d');
            this.mouse = { x: -1000, y: -1000, active: false };
            this.pings = [];
            this.start = performance.now();
            this.frameRequest = 0;
            this.destroyed = false;
            this.bind();
            this.resize();
            this.draw();
        }

        update(options = {}) {
            if (this.destroyed) return;
            this.options = merge(this.options, options);
        }

        bind() {
            this.onResize = () => this.resize();
            this.onMove = (event) => {
                const rect = this.container.getBoundingClientRect();
                this.mouse.x = event.clientX - rect.left;
                this.mouse.y = event.clientY - rect.top;
                this.mouse.active = this.options.mouseInteraction;
            };
            this.onLeave = () => {
                this.mouse.active = false;
            };
            this.onClick = (event) => {
                if (this.options.clickEffect !== 'ping') return;
                const rect = this.container.getBoundingClientRect();
                this.pings.push({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    age: 0
                });
                if (this.pings.length > 6) this.pings.shift();
            };
            window.addEventListener('resize', this.onResize);
            window.addEventListener('pointermove', this.onMove);
            document.documentElement.addEventListener('pointerleave', this.onLeave);
            window.addEventListener('pointerdown', this.onClick);
        }

        resize() {
            const ratio = Math.min(this.options.dpr || window.devicePixelRatio || 1, 2);
            this.width = Math.max(1, this.container.clientWidth);
            this.height = Math.max(1, this.container.clientHeight);
            this.canvas.width = Math.round(this.width * ratio);
            this.canvas.height = Math.round(this.height * ratio);
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
            this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        draw = (now = performance.now()) => {
            if (this.destroyed) return;
            const context = this.context;
            const time = (now - this.start) / 1000;
            const sweepPosition = this.options.reverse
                ? (1 - ((time * this.options.sweepSpeed) % 1))
                : ((time * this.options.sweepSpeed) % 1);

            context.clearRect(0, 0, this.width, this.height);
            context.save();

            const gradient = context.createLinearGradient(
                0,
                this.height * sweepPosition,
                this.width,
                this.height * (1 - sweepPosition)
            );
            const rgb1 = hexToRgb(this.options.color1);
            const rgb2 = hexToRgb(this.options.color2);
            const rgb3 = hexToRgb(this.options.color3);
            const rgba = (rgb, alpha) => `rgba(${rgb.map((value) => Math.round(value * 255)).join(',')},${alpha})`;

            gradient.addColorStop(0, rgba(rgb1, 0));
            gradient.addColorStop(0.45, rgba(rgb1, 0.25 * this.options.glow));
            gradient.addColorStop(0.55, rgba(rgb2, 0.85));
            gradient.addColorStop(0.7, rgba(rgb3, 0.35));
            gradient.addColorStop(1, rgba(rgb1, 0));

            context.globalCompositeOperation = 'screen';
            context.globalAlpha = this.options.opacity;
            context.fillStyle = gradient;

            if (this.options.scanDirection === 'horizontal') {
                const y = this.height * sweepPosition;
                context.fillRect(0, y - 40, this.width, 80);
            } else if (this.options.scanDirection === 'diagonal') {
                context.save();
                context.translate(this.width / 2, this.height / 2);
                context.rotate(Math.PI / 4);
                context.translate(-this.width / 2, -this.height / 2);
                context.fillRect(this.width * sweepPosition - 40, -this.height, 80, this.height * 3);
                context.restore();
            } else {
                const x = this.width * sweepPosition;
                context.fillRect(x - 40, 0, 80, this.height);
            }

            const bandGap = clamp(this.options.bandDensity, 4, 30);
            context.lineWidth = clamp(this.options.lineWidth, 0.2, 5);
            for (let y = 0; y < this.height; y += bandGap) {
                const shift = Math.sin(y * 0.03 + time * this.options.frequency) * this.options.ripple * 12;
                context.strokeStyle = rgba(rgb2, 0.16 * this.options.brightness);
                context.beginPath();
                context.moveTo(0, y + shift);
                context.lineTo(this.width, y - shift);
                context.stroke();
            }

            if (this.mouse.active) {
                const radius = clamp(this.width * this.options.mouseRadius, 60, 280);
                const mouseGradient = context.createRadialGradient(
                    this.mouse.x,
                    this.mouse.y,
                    0,
                    this.mouse.x,
                    this.mouse.y,
                    radius
                );
                mouseGradient.addColorStop(0, rgba(rgb3, 0.22 * this.options.mouseStrength));
                mouseGradient.addColorStop(1, rgba(rgb3, 0));
                context.fillStyle = mouseGradient;
                context.fillRect(
                    this.mouse.x - radius,
                    this.mouse.y - radius,
                    radius * 2,
                    radius * 2
                );
            }

            for (let index = this.pings.length - 1; index >= 0; index--) {
                const ping = this.pings[index];
                ping.age += 1 / 60;
                const radius = ping.age * 180;
                context.strokeStyle = rgba(rgb3, clamp(1 - ping.age / 1.6, 0, 1));
                context.lineWidth = 2;
                context.beginPath();
                context.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
                context.stroke();
                if (ping.age > 1.6) this.pings.splice(index, 1);
            }

            context.restore();

            if (this.options.scanline) {
                context.fillStyle = `rgba(255,255,255,${this.options.scanlineIntensity * 0.04})`;
                for (let y = 0; y < this.height; y += 4) context.fillRect(0, y, this.width, 1);
            }

            this.frameRequest = requestAnimationFrame(this.draw);
        };

        destroy() {
            this.destroyed = true;
            cancelAnimationFrame(this.frameRequest);
            window.removeEventListener('resize', this.onResize);
            window.removeEventListener('pointermove', this.onMove);
            document.documentElement.removeEventListener('pointerleave', this.onLeave);
            window.removeEventListener('pointerdown', this.onClick);
            this.canvas.remove();
            this.container.classList.remove('scanner-container');
        }
    }

    Scanner.defaults = DEFAULTS;
    root.Scanner = Scanner;
})(typeof window !== 'undefined' ? window : this);
