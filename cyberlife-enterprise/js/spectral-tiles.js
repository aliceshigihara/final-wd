(() => {
    const canvas = document.querySelector('.spectral-tiles canvas');
    const context = canvas?.getContext('2d');
    if (!context) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const tiles = [];
    const orbits = [
        [0.24, 0.73, 0.26, 0, [63, 103, 255]],
        [0.71, 0.42, 0.35, 1.7, [32, 209, 255]],
        [0.84, 0.87, 0.29, 3.1, [170, 87, 255]],
        [0.16, 0.36, 0.32, 4.6, [243, 99, 211]]
    ];
    const pointer = { x: 0, y: 0, active: false, glow: 0 };
    let width;
    let height;
    let tileSize;
    let ripple;
    let frame = 0;

    function project(x, y) {
        const depth = (x + y) * Math.SQRT1_2;
        const scale = tileSize / (1 + depth * 0.055);
        return {
            x: width * 0.52 + (x - y) * Math.SQRT1_2 * scale,
            y: height * 0.57 + depth * 0.69 * scale,
            scale
        };
    }

    function resize() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        const ratio = Math.min(devicePixelRatio, 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        tileSize = Math.max(width * 0.18, Math.min(height * 0.30, width * 0.32));
        tiles.length = 0;

        for (let row = -9; row <= 9; row++) {
            for (let column = -9; column <= 9; column++) {
                const variation = Math.sin(row * 12.7 + column * 73.1);
                if (variation > 0.993) continue;

                const x = column + variation * 0.022;
                const y = row - variation * 0.022;
                const center = project(x, y);
                const margin = tileSize * 1.4;
                if (center.x < -margin || center.x > width + margin ||
                    center.y < -margin || center.y > height + margin) continue;

                const half = 0.465;
                const corners = [
                    project(x - half, y - half),
                    project(x + half, y - half),
                    project(x + half, y + half),
                    project(x - half, y + half)
                ];
                tiles.push({ center, corners, variation, depth: x + y });
            }
        }
        tiles.sort((left, right) => left.depth - right.depth);
        if (motion.matches) draw(0);
    }

    function tilePath(corners, offset) {
        const round = 0.075;
        context.beginPath();
        corners.forEach((corner, index) => {
            const previous = corners[(index + 3) % 4];
            const next = corners[(index + 1) % 4];
            const startX = corner.x + (previous.x - corner.x) * round;
            const startY = corner.y + (previous.y - corner.y) * round + offset;
            if (index === 0) context.moveTo(startX, startY);
            else context.lineTo(startX, startY);
            context.quadraticCurveTo(
                corner.x, corner.y + offset,
                corner.x + (next.x - corner.x) * round,
                corner.y + (next.y - corner.y) * round + offset
            );
        });
        context.closePath();
    }

    function paintTile(tile, lights, now) {
        const { center, corners, variation } = tile;
        const scale = center.scale;
        let brightness = 0;
        let nearest = lights[0];
        let strongest = 0;
        const tint = [0, 0, 0];
        for (const light of lights) {
            const distance = Math.hypot(center.x - light.x, (center.y - light.y) * 1.25);
            const contribution = light.power * Math.exp(-2 * (distance / light.radius) ** 2);
            brightness += contribution;
            tint[0] += light.color[0] * contribution;
            tint[1] += light.color[1] * contribution;
            tint[2] += light.color[2] * contribution;
            if (contribution > strongest) {
                strongest = contribution;
                nearest = light;
            }
        }
        const [red, green, blue] = tint.map(channel => Math.min(255, Math.round(channel)));
        brightness = Math.min(1, brightness);

        let lift = scale * (variation * 0.025 + brightness * 0.018);
        if (ripple && !motion.matches) {
            const age = (now - ripple.start) / 1000;
            const distance = Math.hypot(center.x - ripple.x, center.y - ripple.y) / tileSize;
            const wave = (distance - age * 3.5) * 2.8;
            lift += scale * 0.09 * Math.exp(-wave * wave) * Math.max(0, 1 - age / 1.5);
        }

        const top = -lift;
        const thickness = scale * 0.085;
        const targetX = center.x + Math.max(-0.62, Math.min(0.62, (nearest.x - center.x) / scale)) * scale;
        const targetY = center.y + Math.max(-0.51, Math.min(0.51, (nearest.y - center.y) / scale)) * scale;

        tilePath(corners, top + thickness + scale * 0.024);
        context.lineWidth = scale * 0.043;
        context.strokeStyle = '#01030b66';
        context.stroke();
        context.fillStyle = '#01030bd9';
        context.fill();

        const edge = context.createLinearGradient(
            targetX, targetY,
            targetX + (targetX < center.x ? 1 : -1) * scale * 0.92,
            targetY + scale * 0.45
        );
        edge.addColorStop(0, `rgb(${16 + 0.46 * red + 95 * brightness} ${29 + 0.45 * green + 98 * brightness} ${59 + 0.43 * blue + 82 * brightness})`);
        edge.addColorStop(0.5, `rgb(${11 + 0.56 * red} ${19 + 0.56 * green} ${42 + 0.58 * blue})`);
        edge.addColorStop(1, `rgb(${7 + 0.14 * red} ${11 + 0.16 * green} ${24 + 0.22 * blue})`);

        // Stack the rounded silhouettes to form the glass slab's visible sides.
        context.fillStyle = edge;
        for (let step = 4; step >= 0; step--) {
            tilePath(corners, top + thickness * step / 4);
            context.fill();
        }
        tilePath(corners, top + thickness);
        context.strokeStyle = `rgb(${75 + red * 0.6} ${92 + green * 0.6} ${101 + blue * 0.6} / ${0.09 + brightness * 0.48})`;
        context.lineWidth = Math.max(0.6, scale * 0.0045);
        context.stroke();

        tilePath(corners, top);
        const face = context.createLinearGradient(
            center.x - scale * 0.5, center.y - scale * 0.45 + top,
            center.x + scale * 0.5, center.y + scale * 0.45 + top
        );
        face.addColorStop(0, `rgb(${12 + 0.37 * red} ${24 + 0.38 * green} ${50 + 0.49 * blue} / 0.90)`);
        face.addColorStop(0.44, `rgb(${5 + 0.16 * red} ${10 + 0.17 * green} ${25 + 0.21 * blue})`);
        face.addColorStop(1, `rgb(${9 + 0.27 * red} ${16 + 0.28 * green} ${34 + 0.33 * blue} / 0.88)`);
        context.fillStyle = face;
        context.fill();

        const frost = context.createRadialGradient(targetX, targetY, 0, targetX, targetY, scale * 0.72);
        frost.addColorStop(0, `rgb(${178 + red * 0.3} ${193 + green * 0.24} ${208 + blue * 0.18} / ${strongest * 0.91})`);
        frost.addColorStop(0.26, `rgb(${56 + red * 0.68} ${74 + green * 0.62} ${117 + blue * 0.53} / ${strongest * 0.63})`);
        frost.addColorStop(1, 'transparent');
        context.fillStyle = frost;
        context.fill();

        // A broad bevel catches colored light; a narrow rim reflects it sharply.
        const bevel = context.createRadialGradient(targetX, targetY, 0, targetX, targetY, scale * 1.02);
        bevel.addColorStop(0, `rgb(232 247 255 / ${0.19 + brightness * 0.78})`);
        bevel.addColorStop(0.54, `rgb(${65 + red * 0.65} ${84 + green * 0.64} ${115 + blue * 0.54} / ${0.12 + brightness * 0.52})`);
        bevel.addColorStop(1, 'rgb(84 125 190 / 0.08)');
        context.strokeStyle = `rgb(${72 + red * 0.5} ${94 + green * 0.5} ${123 + blue * 0.5} / ${0.07 + brightness * 0.23})`;
        context.lineWidth = Math.max(1.3, scale * 0.018);
        context.stroke();
        context.strokeStyle = bevel;
        context.lineWidth = Math.max(0.75, scale * 0.006);
        context.stroke();
    }

    function draw(now) {
        const time = now / 1000;
        const lights = orbits.map(([x, y, speed, phase, color]) => ({
            x: width * x + Math.sin(time * speed + phase) * tileSize * 1.15,
            y: height * y + Math.cos(time * speed * 0.7 + phase) * tileSize * 0.65,
            radius: tileSize * 1.5,
            power: 1.05,
            color
        }));
        pointer.glow += ((pointer.active ? 1 : 0) - pointer.glow) * 0.065;
        if (!motion.matches && pointer.glow > 0.01) {
            lights.push({
                x: pointer.x, y: pointer.y, radius: tileSize * 1.2,
                power: pointer.glow * 0.8, color: [129, 208, 255]
            });
        }
        if (ripple && now - ripple.start > 1500) ripple = null;

        context.fillStyle = '#05070e';
        context.fillRect(0, 0, width, height);
        for (const { x, y, radius, power, color } of lights) {
            const glow = context.createRadialGradient(x, y, 0, x, y, radius);
            glow.addColorStop(0, `rgb(${color.join(' ')} / ${power * 0.29})`);
            glow.addColorStop(0.45, `rgb(${color.join(' ')} / ${power * 0.11})`);
            glow.addColorStop(1, 'transparent');
            context.fillStyle = glow;
            context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        for (const tile of tiles) paintTile(tile, lights, now);
    }

    function animate(now) {
        draw(now);
        frame = requestAnimationFrame(animate);
    }

    function updateMotion() {
        cancelAnimationFrame(frame);
        if (motion.matches) draw(0);
        else if (!document.hidden) frame = requestAnimationFrame(animate);
    }

    window.addEventListener('pointermove', (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = event.pointerType !== 'touch';
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
    window.addEventListener('pointerdown', (event) => {
        if (!motion.matches) ripple = { x: event.clientX, y: event.clientY, start: performance.now() };
    }, { passive: true });
    document.addEventListener('visibilitychange', updateMotion);
    motion.addEventListener('change', updateMotion);
    new ResizeObserver(resize).observe(canvas);
    resize();
    updateMotion();
})();
