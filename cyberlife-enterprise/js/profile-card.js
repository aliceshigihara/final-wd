/*
 * ProfileCard - JavaScript puro adaptado para cards de conteúdo.
 */
(function (root) {
    'use strict';

    const DEFAULTS = {
        name: '[Título]',
        title: '[Descrição]',
        handle: '',
        status: 'Disponível',
        contactText: 'Ver mais',
        avatarUrl: '',
        miniAvatarUrl: '',
        theme: 'dark',
        tiltStrength: 12,
        parallax: 8,
        enableTilt: true,
        intro: true,
        showUserInfo: true,
        enableMobileTilt: false,
        holo: 0.8,
        glare: 0.5,
        radius: 16,
        onContactClick: null
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const merge = (base, extra) => ({ ...base, ...extra });

    class ProfileCard {
        constructor(container, options = {}) {
            this.host = typeof container === 'string'
                ? document.querySelector(container)
                : container;
            if (!this.host) throw new Error('ProfileCard: container não encontrado.');

            this.options = merge(DEFAULTS, options);
            this.current = { x: 50, y: 50, active: 0 };
            this.target = { x: 50, y: 50, active: 0 };
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.animationFrame = 0;
            this.destroyed = false;
            this.build();
        }

        build() {
            this.root = document.createElement('div');
            this.root.className = 'profile-card';

            const body = document.createElement('div');
            body.className = 'profile-card__body';

            const tile = document.createElement('div');
            tile.className = 'profile-card__tile';

            this.photo = document.createElement('img');
            this.photo.className = 'profile-card__photo';
            this.photo.draggable = false;
            tile.appendChild(this.photo);

            ['profile-card__scrim', 'profile-card__sheen', 'profile-card__holo', 'profile-card__glare', 'profile-card__shade', 'profile-card__rim', 'profile-card__tile-rim'].forEach((className) => {
                tile.appendChild(document.createElement('div')).className = className;
            });

            const info = document.createElement('div');
            info.className = 'profile-card__info';
            this.name = document.createElement('h3');
            this.name.className = 'profile-card__name';
            this.title = document.createElement('p');
            this.title.className = 'profile-card__title';
            info.append(this.name, this.title);
            tile.appendChild(info);

            body.appendChild(tile);

            this.footer = document.createElement('div');
            this.footer.className = 'profile-card__footer';

            const avatar = document.createElement('div');
            avatar.className = 'profile-card__avatar';
            this.avatar = document.createElement('img');
            avatar.appendChild(this.avatar);

            const meta = document.createElement('div');
            this.handle = document.createElement('div');
            this.handle.className = 'profile-card__handle';
            this.status = document.createElement('div');
            this.status.className = 'profile-card__status';
            meta.append(this.handle, this.status);

            this.contact = document.createElement('button');
            this.contact.type = 'button';
            this.contact.className = 'profile-card__contact';
            this.contact.textContent = this.options.contactText;

            this.footer.append(avatar, meta, this.contact);
            body.appendChild(this.footer);
            this.root.appendChild(body);
            this.host.appendChild(this.root);

            this.bind();
            this.apply();
        }

        apply() {
            const options = this.options;
            this.name.textContent = options.name;
            this.title.textContent = options.title;
            this.handle.textContent = options.handle || '';
            this.status.textContent = options.status;
            this.contact.textContent = options.contactText;
            this.photo.src = options.avatarUrl || '';
            this.photo.alt = options.name;
            this.avatar.src = options.miniAvatarUrl || options.avatarUrl || '';
            this.avatar.alt = options.name;
            this.footer.style.display = options.showUserInfo ? '' : 'none';
            this.root.style.setProperty('--pc-radius', `${options.radius}px`);
            this.root.style.setProperty('--pc-holo', options.holo);
            this.root.style.setProperty('--pc-glare', options.glare);
        }

        bind() {
            this.onMove = (event) => {
                const rect = this.root.getBoundingClientRect();
                this.target.x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
                this.target.y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
                this.target.active = 1;
                this.wake();
            };
            this.onLeave = () => {
                this.target.x = 50;
                this.target.y = 50;
                this.target.active = 0;
                this.wake();
            };
            this.onContact = (event) => {
                if (typeof this.options.onContactClick === 'function') {
                    this.options.onContactClick(event);
                }
            };

            this.root.addEventListener('pointermove', this.onMove);
            this.root.addEventListener('pointerleave', this.onLeave);
            this.root.addEventListener('pointercancel', this.onLeave);
            this.contact.addEventListener('click', this.onContact);
        }

        wake() {
            if (this.animationFrame || this.destroyed) return;
            this.animationFrame = requestAnimationFrame((time) => this.frame(time));
        }

        frame() {
            this.animationFrame = 0;
            const easing = 0.14;
            this.current.x += (this.target.x - this.current.x) * easing;
            this.current.y += (this.target.y - this.current.y) * easing;
            this.current.active += (this.target.active - this.current.active) * easing;
            this.paint();

            const settled =
                Math.abs(this.target.x - this.current.x) < 0.2 &&
                Math.abs(this.target.y - this.current.y) < 0.2 &&
                Math.abs(this.target.active - this.current.active) < 0.01;

            if (!settled) this.wake();
        }

        paint() {
            const x = this.current.x;
            const y = this.current.y;
            const nx = (x - 50) / 50;
            const ny = (y - 50) / 50;
            const tilt = this.reducedMotion || !this.options.enableTilt ? 0 : 1;

            this.root.style.setProperty('--pc-pointer-x', `${x.toFixed(2)}%`);
            this.root.style.setProperty('--pc-pointer-y', `${y.toFixed(2)}%`);
            this.root.style.setProperty('--pc-active', this.current.active.toFixed(2));
            this.root.style.setProperty('--pc-rotate-x', `${(-ny * this.options.tiltStrength * tilt).toFixed(2)}deg`);
            this.root.style.setProperty('--pc-rotate-y', `${(nx * this.options.tiltStrength * tilt).toFixed(2)}deg`);
        }

        destroy() {
            this.destroyed = true;
            cancelAnimationFrame(this.animationFrame);
            this.root.removeEventListener('pointermove', this.onMove);
            this.root.removeEventListener('pointerleave', this.onLeave);
            this.root.removeEventListener('pointercancel', this.onLeave);
            this.contact.removeEventListener('click', this.onContact);
            this.root.remove();
        }
    }

    ProfileCard.defaults = DEFAULTS;
    root.ProfileCard = ProfileCard;
})(typeof window !== 'undefined' ? window : this);
