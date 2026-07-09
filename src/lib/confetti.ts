const DEFAULT_COLORS = ["#524def", "#7c75f5", "#22c55e", "#fbbf24", "#f472b6", "#ffffff"];

interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    originY?: number;
}

export function fireConfetti(options: ConfettiOptions = {}) {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { particleCount = 80, spread = 70, originY = 0.55 } = options;

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        canvas.remove();
        return;
    }

    const originX = canvas.width / 2;
    const originYpx = canvas.height * originY;

    const particles = Array.from({ length: particleCount }, () => ({
        x: originX,
        y: originYpx,
        vx: (Math.random() - 0.5) * spread * 0.15,
        vy: Math.random() * -spread * 0.2 - 4,
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.18 + Math.random() * 0.08,
        drag: 0.98,
        opacity: 1,
    }));

    let frame = 0;
    const maxFrames = 110;

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = 0;

        for (const p of particles) {
            if (p.opacity <= 0) continue;
            alive++;

            p.vx *= p.drag;
            p.vy += p.gravity;
            p.vy *= p.drag;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            if (frame > maxFrames * 0.6) {
                p.opacity -= 0.025;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        }

        frame++;
        if (frame < maxFrames && alive > 0) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    };

    requestAnimationFrame(animate);
}
