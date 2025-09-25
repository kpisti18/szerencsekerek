// ---- Oldalsó "Csak a Baross" feliratok véletlen elhelyezése ----
(() => {
    const neonL = document.querySelector('.neon-left');
    const neonR = document.querySelector('.neon-right');
    const card = document.querySelector('.card');
    if (!neonL || !neonR || !card) return;

    const GAP = 16;                  // távolság a kártya szélétől
    const RELOCATE_EVERY_MS = 2000;  // 5 mp-enként új hely

    const rand = (a, b) => Math.random() * (b - a) + a;

    const sizeOf = (el) => {
        const prev = el.style.transform;
        el.style.transform = 'none';
        const w = el.offsetWidth, h = el.offsetHeight;
        el.style.transform = prev;
        return { w, h };
    };

    function placeNeons() {
        const rect = card.getBoundingClientRect();
        const vw = innerWidth, vh = innerHeight;

        // BAL oldal
        {
            const { w, h } = sizeOf(neonL);
            const y = Math.max(h / 2, Math.min(vh - h / 2, rand(rect.top + 10, rect.bottom - 10)));
            const x = Math.max(0, rect.left - w - GAP);
            const angle = rand(-70, -20);
            neonL.style.left = `${x}px`;
            neonL.style.top = `${Math.round(y - h / 2)}px`;
            neonL.style.transform = `rotate(${angle}deg)`;
        }
        // JOBB oldal
        {
            const { w, h } = sizeOf(neonR);
            const y = Math.max(h / 2, Math.min(vh - h / 2, rand(rect.top + 10, rect.bottom - 10)));
            const x = Math.min(vw - w, rect.right + GAP);
            const angle = rand(20, 70);
            neonR.style.left = `${x}px`;
            neonR.style.top = `${Math.round(y - h / 2)}px`;
            neonR.style.transform = `rotate(${angle}deg)`;
        }
    }

    placeNeons();
    addEventListener('resize', () => {
        clearTimeout(window.__neonPlaceTO);
        window.__neonPlaceTO = setTimeout(placeNeons, 120);
    });
    setInterval(placeNeons, RELOCATE_EVERY_MS);
})();

// =========================
//  Szerencsekerék (8 szelet)
// =========================

// --- Beállítások ---
const prizes = [
    "csoki", "nem nyert", "cukorka", "nem nyert",
    "toll", "nem nyert", "hűtőmágnes", "nem nyert"
];
const colors = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#eab308", "#14b8a6", "#f97316"];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const out = document.getElementById("out");

// HiDPI méretezés
function fitHiDPI() {
    const ratio = window.devicePixelRatio || 1;
    const size = Math.min(canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
fitHiDPI();
addEventListener("resize", fitHiDPI);

const N = 8;
const TAU = Math.PI * 2;
const SLICE = TAU / N;

let angle = 0;
let spinning = false;

// Kerék rajz
function drawWheel() {
    const size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    const r = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < N; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, i * SLICE, (i + 1) * SLICE);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,.35)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // címke
        ctx.save();
        ctx.rotate(i * SLICE + SLICE / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0b1020";
        ctx.font = "bold 18px system-ui, sans-serif";
        const label = prizes[i];
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, r - 22, 0);
        ctx.restore();
    }

    // közép dísz
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fillStyle = "#0ea5e9";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.stroke();

    ctx.restore();
}
drawWheel();

// Easing
const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Indítás
function startSpin() {
    if (spinning) return;
    spinning = true;
    out.textContent = "Pörög…";

    const now = performance.now();
    const duration = 4200 + Math.random() * 1200; // 4.2–5.4 s
    const fullTurns = 4 + Math.floor(Math.random() * 3); // 4–6 fordulat
    const targetIndex = Math.floor(Math.random() * N);
    const targetAngle = targetIndex * SLICE + SLICE / 2;

    const current = ((angle % TAU) + TAU) % TAU;
    const delta = ((targetAngle - current) % TAU + TAU) % TAU;
    const endAngleAbsolute = angle + fullTurns * TAU + (TAU - delta);
    const totalDelta = endAngleAbsolute - angle;

    function frame(t) {
        const k = Math.min(1, (t - now) / duration);
        const eased = easeInOutCubic(k);
        angle = angle + (totalDelta * (eased - (k === 0 ? 0 : easeInOutCubic((t - now - 16) / duration))));
        // A fenti kettős ease-trükk helyett egyszerűbb:
        angle = ((current) + totalDelta * eased); // tartósan sima

        drawWheel();
        if (k < 1) {
            requestAnimationFrame(frame);
        } else {
            spinning = false;
            const final = ((angle % TAU) + TAU) % TAU;
            const landedIndex = Math.floor(((TAU - final) % TAU) / SLICE);
            const prize = prizes[landedIndex];
            out.innerHTML =
                prize === "nem nyert"
                    ? `😕 <span class="accent">${prize}</span>`
                    : `🎉 Nyeremény: <span class="accent">${prize}</span>`;
        }
    }
    requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", startSpin);
addEventListener("keydown", (e) => {
    if (e.code === "Enter" || e.code === "Space") startSpin();
});

