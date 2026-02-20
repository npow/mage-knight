// ============================================================
// MAGE KNIGHT - UI & RENDERER
// Canvas rendering for hex map + DOM-based UI panels
// Canvas-drawn icons, enhanced terrain, turn guidance, notifications
// ============================================================

(function() {

const UI = {};
const Renderer = {};
const Icons = {};

let canvas, ctx;
let wasDragging = false;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cameraStart = { x: 0, y: 0 };
let gameTime = 0; // for animations

// ==============================================================
// ICONS - Canvas-drawn vector icons replacing all emoji
// ==============================================================
const iconCache = {};

Icons.draw = function(c, name, x, y, size, color) {
    const fn = Icons.fns[name];
    if (!fn) return;
    c.save();
    fn(c, x, y, size, color || '#fff');
    c.restore();
};

Icons.toDataURL = function(name, size, color) {
    const key = `${name}_${size}_${color}`;
    if (iconCache[key]) return iconCache[key];
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const c2 = c.getContext('2d');
    Icons.draw(c2, name, size/2, size/2, size * 0.4, color);
    const url = c.toDataURL();
    iconCache[key] = url;
    return url;
};

Icons.fns = {};

// --- Site Icons ---
Icons.fns.village = function(c, x, y, s, col) {
    c.fillStyle = col;
    // house 1
    c.beginPath();
    c.moveTo(x - s*0.6, y + s*0.1); c.lineTo(x - s*0.3, y - s*0.5); c.lineTo(x, y + s*0.1);
    c.closePath(); c.fill();
    c.fillRect(x - s*0.55, y + s*0.1, s*0.5, s*0.45);
    // house 2
    c.beginPath();
    c.moveTo(x + s*0.05, y + s*0.15); c.lineTo(x + s*0.35, y - s*0.35); c.lineTo(x + s*0.65, y + s*0.15);
    c.closePath(); c.fill();
    c.fillRect(x + s*0.1, y + s*0.15, s*0.5, s*0.4);
};

Icons.fns.keep = function(c, x, y, s, col) {
    c.fillStyle = col;
    // main tower
    c.fillRect(x - s*0.25, y - s*0.3, s*0.5, s*0.85);
    // crenellations
    for (let i = -2; i <= 2; i++) {
        c.fillRect(x + i * s*0.12 - s*0.05, y - s*0.55, s*0.1, s*0.25);
    }
    // door
    c.fillStyle = darkenColor(col, 0.4);
    c.beginPath();
    c.arc(x, y + s*0.35, s*0.12, Math.PI, 0);
    c.fillRect(x - s*0.12, y + s*0.35, s*0.24, s*0.2);
    c.fill();
};

Icons.fns.dungeon = function(c, x, y, s, col) {
    c.fillStyle = col;
    // skull
    c.beginPath();
    c.arc(x, y - s*0.1, s*0.4, Math.PI * 0.8, Math.PI * 0.2);
    c.quadraticCurveTo(x + s*0.15, y + s*0.5, x, y + s*0.55);
    c.quadraticCurveTo(x - s*0.15, y + s*0.5, x - s*0.4 * Math.cos(Math.PI*0.2), y - s*0.1 + s*0.4 * Math.sin(Math.PI*0.2));
    c.fill();
    // eyes
    c.fillStyle = '#000';
    c.beginPath(); c.arc(x - s*0.15, y - s*0.1, s*0.1, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x + s*0.15, y - s*0.1, s*0.1, 0, Math.PI*2); c.fill();
    // nose
    c.beginPath();
    c.moveTo(x, y + s*0.05); c.lineTo(x - s*0.06, y + s*0.18); c.lineTo(x + s*0.06, y + s*0.18);
    c.closePath(); c.fill();
};

Icons.fns.monastery = function(c, x, y, s, col) {
    c.fillStyle = col;
    // cross
    c.fillRect(x - s*0.1, y - s*0.6, s*0.2, s*1.15);
    c.fillRect(x - s*0.4, y - s*0.3, s*0.8, s*0.2);
};

Icons.fns.mageTower = function(c, x, y, s, col) {
    c.fillStyle = col;
    // tower body (narrow)
    c.beginPath();
    c.moveTo(x - s*0.2, y + s*0.55); c.lineTo(x - s*0.15, y - s*0.3);
    c.lineTo(x + s*0.15, y - s*0.3); c.lineTo(x + s*0.2, y + s*0.55);
    c.closePath(); c.fill();
    // pointy roof
    c.beginPath();
    c.moveTo(x - s*0.2, y - s*0.3); c.lineTo(x, y - s*0.7); c.lineTo(x + s*0.2, y - s*0.3);
    c.closePath(); c.fill();
    // star on top
    c.fillStyle = '#ffd700';
    drawStar(c, x, y - s*0.78, s*0.12, 5);
};

Icons.fns.tomb = function(c, x, y, s, col) {
    c.fillStyle = col;
    // coffin shape
    c.beginPath();
    c.moveTo(x - s*0.2, y - s*0.55); c.lineTo(x + s*0.2, y - s*0.55);
    c.lineTo(x + s*0.3, y - s*0.2); c.lineTo(x + s*0.25, y + s*0.55);
    c.lineTo(x - s*0.25, y + s*0.55); c.lineTo(x - s*0.3, y - s*0.2);
    c.closePath(); c.fill();
    // cross on top
    c.fillStyle = darkenColor(col, 0.3);
    c.fillRect(x - s*0.04, y - s*0.35, s*0.08, s*0.35);
    c.fillRect(x - s*0.12, y - s*0.25, s*0.24, s*0.06);
};

Icons.fns.mine = function(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round';
    // pickaxe handle
    c.beginPath(); c.moveTo(x - s*0.4, y + s*0.5); c.lineTo(x + s*0.3, y - s*0.4); c.stroke();
    // pick head
    c.beginPath(); c.moveTo(x + s*0.1, y - s*0.55); c.quadraticCurveTo(x + s*0.6, y - s*0.3, x + s*0.35, y - s*0.05); c.stroke();
};

Icons.fns.ancientRuins = function(c, x, y, s, col) {
    c.fillStyle = col;
    // two broken columns
    c.fillRect(x - s*0.4, y - s*0.2, s*0.15, s*0.75);
    c.fillRect(x + s*0.25, y - s*0.4, s*0.15, s*0.95);
    // column tops
    c.fillRect(x - s*0.48, y - s*0.25, s*0.3, s*0.08);
    c.fillRect(x + s*0.18, y - s*0.45, s*0.3, s*0.08);
    // broken lintel
    c.strokeStyle = col; c.lineWidth = s*0.06;
    c.beginPath(); c.moveTo(x - s*0.35, y - s*0.2); c.lineTo(x + s*0.1, y - s*0.35); c.stroke();
};

Icons.fns.spawningGrounds = function(c, x, y, s, col) {
    // flame
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y - s*0.65);
    c.quadraticCurveTo(x + s*0.5, y - s*0.1, x + s*0.25, y + s*0.55);
    c.quadraticCurveTo(x, y + s*0.3, x, y + s*0.55);
    c.quadraticCurveTo(x, y + s*0.3, x - s*0.25, y + s*0.55);
    c.quadraticCurveTo(x - s*0.5, y - s*0.1, x, y - s*0.65);
    c.fill();
};

Icons.fns.draconumLair = function(c, x, y, s, col) {
    c.fillStyle = col;
    // dragon head profile
    c.beginPath();
    c.moveTo(x + s*0.5, y); // snout tip
    c.quadraticCurveTo(x + s*0.3, y - s*0.2, x, y - s*0.15);
    c.lineTo(x - s*0.2, y - s*0.5); // horn
    c.lineTo(x - s*0.15, y - s*0.2);
    c.lineTo(x - s*0.45, y - s*0.35); // back horn
    c.quadraticCurveTo(x - s*0.4, y - s*0.1, x - s*0.5, y + s*0.1);
    c.quadraticCurveTo(x - s*0.2, y + s*0.4, x + s*0.1, y + s*0.3);
    c.quadraticCurveTo(x + s*0.3, y + s*0.2, x + s*0.5, y);
    c.fill();
    // eye
    c.fillStyle = '#ff0';
    c.beginPath(); c.arc(x - s*0.05, y - s*0.05, s*0.06, 0, Math.PI*2); c.fill();
};

Icons.fns.magicalGlade = function(c, x, y, s, col) {
    // 8-pointed starburst
    c.fillStyle = col;
    drawStar(c, x, y, s*0.5, 8);
    c.fillStyle = lightenColor(col, 0.5);
    drawStar(c, x, y, s*0.25, 8);
};

Icons.fns.city = function(c, x, y, s, col) {
    c.fillStyle = col;
    // wall
    c.fillRect(x - s*0.5, y + s*0.1, s*1.0, s*0.35);
    // left tower
    c.fillRect(x - s*0.55, y - s*0.4, s*0.25, s*0.85);
    c.fillRect(x - s*0.6, y - s*0.45, s*0.35, s*0.08);
    // right tower
    c.fillRect(x + s*0.3, y - s*0.25, s*0.25, s*0.7);
    c.fillRect(x + s*0.25, y - s*0.3, s*0.35, s*0.08);
    // gate
    c.fillStyle = darkenColor(col, 0.4);
    c.beginPath();
    c.arc(x, y + s*0.25, s*0.13, Math.PI, 0);
    c.fillRect(x - s*0.13, y + s*0.25, s*0.26, s*0.2);
    c.fill();
};

// --- Enemy Icons ---
Icons.fns.orc = function(c, x, y, s, col) {
    c.fillStyle = col;
    // round face
    c.beginPath(); c.arc(x, y, s*0.4, 0, Math.PI*2); c.fill();
    // tusks
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(x - s*0.2, y + s*0.15); c.lineTo(x - s*0.15, y - s*0.15); c.lineTo(x - s*0.08, y + s*0.15);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(x + s*0.08, y + s*0.15); c.lineTo(x + s*0.15, y - s*0.15); c.lineTo(x + s*0.2, y + s*0.15);
    c.closePath(); c.fill();
    // eyes
    c.fillStyle = '#f00';
    c.beginPath(); c.arc(x - s*0.13, y - s*0.08, s*0.06, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x + s*0.13, y - s*0.08, s*0.06, 0, Math.PI*2); c.fill();
};

Icons.fns.guard = function(c, x, y, s, col) {
    c.fillStyle = col;
    // helmet dome
    c.beginPath(); c.arc(x, y - s*0.1, s*0.35, Math.PI, 0); c.fill();
    c.fillRect(x - s*0.35, y - s*0.1, s*0.7, s*0.15);
    // visor slit
    c.fillStyle = '#000';
    c.fillRect(x - s*0.25, y - s*0.05, s*0.5, s*0.06);
    // chin guard
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - s*0.3, y + s*0.05); c.lineTo(x - s*0.2, y + s*0.4);
    c.lineTo(x + s*0.2, y + s*0.4); c.lineTo(x + s*0.3, y + s*0.05);
    c.closePath(); c.fill();
};

Icons.fns.monk = function(c, x, y, s, col) {
    c.fillStyle = col;
    // pointed hood
    c.beginPath();
    c.moveTo(x, y - s*0.65); c.lineTo(x + s*0.35, y + s*0.1); c.lineTo(x - s*0.35, y + s*0.1);
    c.closePath(); c.fill();
    // face shadow
    c.fillStyle = '#000';
    c.beginPath(); c.arc(x, y + s*0.0, s*0.15, 0, Math.PI*2); c.fill();
    // body
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - s*0.3, y + s*0.1); c.lineTo(x - s*0.35, y + s*0.55);
    c.lineTo(x + s*0.35, y + s*0.55); c.lineTo(x + s*0.3, y + s*0.1);
    c.closePath(); c.fill();
};

Icons.fns.mage = function(c, x, y, s, col) {
    c.fillStyle = col;
    // hat
    c.beginPath();
    c.moveTo(x, y - s*0.7); c.lineTo(x + s*0.45, y - s*0.05); c.lineTo(x - s*0.45, y - s*0.05);
    c.closePath(); c.fill();
    // hat brim
    c.fillRect(x - s*0.5, y - s*0.1, s*1.0, s*0.1);
    // face circle
    c.fillStyle = darkenColor(col, 0.2);
    c.beginPath(); c.arc(x, y + s*0.15, s*0.2, 0, Math.PI*2); c.fill();
    // star on hat
    c.fillStyle = '#ffd700';
    drawStar(c, x, y - s*0.35, s*0.08, 5);
};

Icons.fns.dragon = function(c, x, y, s, col) {
    Icons.fns.draconumLair(c, x, y, s, col);
};

// --- Hero Icons ---
Icons.fns.shield = function(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y - s*0.55);
    c.lineTo(x + s*0.45, y - s*0.35);
    c.lineTo(x + s*0.4, y + s*0.15);
    c.quadraticCurveTo(x, y + s*0.65, x, y + s*0.65);
    c.quadraticCurveTo(x, y + s*0.65, x - s*0.4, y + s*0.15);
    c.lineTo(x - s*0.45, y - s*0.35);
    c.closePath(); c.fill();
    // inner highlight
    c.fillStyle = lightenColor(col, 0.3);
    c.beginPath();
    c.moveTo(x, y - s*0.35);
    c.lineTo(x + s*0.25, y - s*0.2);
    c.lineTo(x + s*0.2, y + s*0.1);
    c.quadraticCurveTo(x, y + s*0.4, x, y + s*0.4);
    c.quadraticCurveTo(x, y + s*0.4, x - s*0.2, y + s*0.1);
    c.lineTo(x - s*0.25, y - s*0.2);
    c.closePath(); c.fill();
};

Icons.fns.staff = function(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s*0.1; c.lineCap = 'round';
    // staff shaft
    c.beginPath(); c.moveTo(x, y - s*0.55); c.lineTo(x, y + s*0.6); c.stroke();
    // orb on top
    c.fillStyle = '#88ccff';
    c.beginPath(); c.arc(x, y - s*0.55, s*0.18, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(x - s*0.05, y - s*0.6, s*0.06, 0, Math.PI*2); c.fill();
};

Icons.fns.flame = function(c, x, y, s, col) {
    const gradient = c.createRadialGradient(x, y, 0, x, y, s*0.5);
    gradient.addColorStop(0, '#ff0');
    gradient.addColorStop(0.5, col);
    gradient.addColorStop(1, darkenColor(col, 0.3));
    c.fillStyle = gradient;
    c.beginPath();
    c.moveTo(x, y - s*0.65);
    c.quadraticCurveTo(x + s*0.45, y - s*0.15, x + s*0.2, y + s*0.5);
    c.quadraticCurveTo(x + s*0.05, y + s*0.2, x, y + s*0.5);
    c.quadraticCurveTo(x - s*0.05, y + s*0.2, x - s*0.2, y + s*0.5);
    c.quadraticCurveTo(x - s*0.45, y - s*0.15, x, y - s*0.65);
    c.fill();
};

Icons.fns.dragonHead = function(c, x, y, s, col) {
    Icons.fns.draconumLair(c, x, y, s, col);
};

// --- UI Icons ---
Icons.fns.sword = function(c, x, y, s, col) {
    c.fillStyle = col;
    // blade
    c.beginPath();
    c.moveTo(x, y - s*0.7);
    c.lineTo(x + s*0.08, y + s*0.15); c.lineTo(x - s*0.08, y + s*0.15);
    c.closePath(); c.fill();
    // crossguard
    c.fillRect(x - s*0.3, y + s*0.1, s*0.6, s*0.1);
    // handle
    c.fillStyle = darkenColor(col, 0.3);
    c.fillRect(x - s*0.05, y + s*0.2, s*0.1, s*0.35);
    // pommel
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y + s*0.6, s*0.08, 0, Math.PI*2); c.fill();
};

Icons.fns.shieldSmall = function(c, x, y, s, col) {
    Icons.fns.shield(c, x, y, s, col);
};

Icons.fns.boot = function(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - s*0.15, y - s*0.55);
    c.lineTo(x + s*0.15, y - s*0.55);
    c.lineTo(x + s*0.15, y + s*0.2);
    c.lineTo(x + s*0.5, y + s*0.2);
    c.lineTo(x + s*0.55, y + s*0.45);
    c.lineTo(x - s*0.2, y + s*0.45);
    c.lineTo(x - s*0.2, y + s*0.2);
    c.lineTo(x - s*0.15, y + s*0.2);
    c.closePath(); c.fill();
};

Icons.fns.coin = function(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, s*0.4, 0, Math.PI*2); c.fill();
    c.strokeStyle = darkenColor(col, 0.3);
    c.lineWidth = s*0.06;
    c.beginPath(); c.arc(x, y, s*0.25, 0, Math.PI*2); c.stroke();
};

Icons.fns.heart = function(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y + s*0.45);
    c.bezierCurveTo(x - s*0.6, y + s*0.05, x - s*0.5, y - s*0.45, x, y - s*0.15);
    c.bezierCurveTo(x + s*0.5, y - s*0.45, x + s*0.6, y + s*0.05, x, y + s*0.45);
    c.fill();
};

Icons.fns.bow = function(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s*0.08; c.lineCap = 'round';
    // bow curve
    c.beginPath();
    c.arc(x - s*0.1, y, s*0.45, -Math.PI*0.4, Math.PI*0.4);
    c.stroke();
    // string
    c.lineWidth = s*0.04;
    c.beginPath();
    c.moveTo(x - s*0.1 + s*0.45*Math.cos(-Math.PI*0.4), y + s*0.45*Math.sin(-Math.PI*0.4));
    c.lineTo(x - s*0.1 + s*0.45*Math.cos(Math.PI*0.4), y + s*0.45*Math.sin(Math.PI*0.4));
    c.stroke();
    // arrow
    c.lineWidth = s*0.06;
    c.beginPath(); c.moveTo(x - s*0.2, y); c.lineTo(x + s*0.55, y); c.stroke();
    // arrowhead
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + s*0.6, y); c.lineTo(x + s*0.4, y - s*0.1); c.lineTo(x + s*0.4, y + s*0.1);
    c.closePath(); c.fill();
};

Icons.fns.star = function(c, x, y, s, col) {
    c.fillStyle = col;
    drawStar(c, x, y, s*0.45, 6);
};

Icons.fns.crossedSwords = function(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s*0.08; c.lineCap = 'round';
    // sword 1 (left-to-right)
    c.beginPath(); c.moveTo(x - s*0.5, y - s*0.5); c.lineTo(x + s*0.5, y + s*0.5); c.stroke();
    // sword 2 (right-to-left)
    c.beginPath(); c.moveTo(x + s*0.5, y - s*0.5); c.lineTo(x - s*0.5, y + s*0.5); c.stroke();
    // crossguards
    c.lineWidth = s*0.1;
    c.beginPath(); c.moveTo(x - s*0.15, y - s*0.05); c.lineTo(x + s*0.15, y - s*0.35); c.stroke();
    c.beginPath(); c.moveTo(x + s*0.15, y - s*0.05); c.lineTo(x - s*0.15, y - s*0.35); c.stroke();
    // pommel dots
    c.fillStyle = col;
    c.beginPath(); c.arc(x - s*0.5, y + s*0.5, s*0.07, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x + s*0.5, y + s*0.5, s*0.07, 0, Math.PI*2); c.fill();
};

// --- Helpers ---
function drawStar(c, cx, cy, r, points) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI / points) - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.4;
        const px = cx + rad * Math.cos(angle);
        const py = cy + rad * Math.sin(angle);
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
}

function lightenColor(col, pct) {
    if (!col || col[0] !== '#') return col;
    let hex = col.slice(1);
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    let r = parseInt(hex.slice(0,2), 16), g = parseInt(hex.slice(2,4), 16), b = parseInt(hex.slice(4,6), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * pct));
    g = Math.min(255, Math.floor(g + (255 - g) * pct));
    b = Math.min(255, Math.floor(b + (255 - b) * pct));
    return `rgb(${r},${g},${b})`;
}

function darkenColor(col, pct) {
    if (!col || col[0] !== '#') return col;
    let hex = col.slice(1);
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    let r = parseInt(hex.slice(0,2), 16), g = parseInt(hex.slice(2,4), 16), b = parseInt(hex.slice(4,6), 16);
    r = Math.max(0, Math.floor(r * (1 - pct)));
    g = Math.max(0, Math.floor(g * (1 - pct)));
    b = Math.max(0, Math.floor(b * (1 - pct)));
    return `rgb(${r},${g},${b})`;
}

Renderer.seededRandom = function(q, r, i) {
    let h = (q * 374761393 + r * 668265263 + i * 1274126177) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    return (h & 0x7fffffff) / 0x7fffffff;
};

// ==============================================================
// INITIALIZATION
// ==============================================================
UI.init = function() {
    canvas = document.getElementById('map-canvas');
    ctx = canvas.getContext('2d');

    UI.resizeCanvas();
    window.addEventListener('resize', UI.resizeCanvas);

    canvas.addEventListener('mousedown', UI.onMouseDown);
    canvas.addEventListener('mousemove', UI.onMouseMove);
    canvas.addEventListener('mouseup', UI.onMouseUp);
    canvas.addEventListener('click', UI.onMapClick);
    canvas.addEventListener('wheel', UI.onWheel);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', UI.onKeyDown);
};

UI.onKeyDown = function(e) {
    const state = MK.State;
    if (state.phase !== 'playing' && state.phase !== 'combat') return;
    switch (e.key.toLowerCase()) {
        case 'c': UI.centerCamera(true); break;
        case 'e': MK.Engine.endTurn(); break;
        case 'escape': state.selectedCard = null; state.selectedHex = null; break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
            const idx = parseInt(e.key) - 1;
            if (idx < state.hand.length) UI.selectCard(idx);
            break;
    }
};

UI.resizeCanvas = function() {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w; canvas.height = h;
};

UI.centerCamera = function(smooth) {
    const state = MK.State;
    const pixel = MK.Hex.hexToPixel(state.position, state.hexSize);
    const targetX = canvas.width / 2 - pixel.x;
    const targetY = canvas.height / 2 - pixel.y;
    if (smooth) {
        const startX = state.cameraOffset.x, startY = state.cameraOffset.y;
        const duration = 300, startTime = performance.now();
        function animateCamera(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
            state.cameraOffset.x = startX + (targetX - startX) * ease;
            state.cameraOffset.y = startY + (targetY - startY) * ease;
            if (t < 1) requestAnimationFrame(animateCamera);
        }
        requestAnimationFrame(animateCamera);
    } else {
        state.cameraOffset.x = targetX;
        state.cameraOffset.y = targetY;
    }
};

// ==============================================================
// MAP RENDERING
// ==============================================================
Renderer.drawMap = function() {
    const state = MK.State;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Renderer.drawBackgroundPattern();

    const origin = state.cameraOffset;
    const size = state.hexSize;

    // Draw all hexes
    for (const [key, hex] of state.map) {
        if (!hex.visible) continue;
        const pixel = MK.Hex.hexToPixel(hex, size, origin);
        if (pixel.x < -size*2 || pixel.x > canvas.width + size*2 ||
            pixel.y < -size*2 || pixel.y > canvas.height + size*2) continue;
        Renderer.drawHex(hex, pixel, size);
    }

    // Draw tile boundaries
    Renderer.drawTileBoundaries(size, origin);

    // Night overlay
    if (!state.isDay) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 15, 50, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Reachable hexes overlay
    if (state.movePoints > 0 && state.phase === 'playing') {
        const reachable = MK.Engine.getReachableHexes(state.movePoints);
        for (const [key] of reachable) {
            const hex = MK.Hex.fromKey(key);
            const pixel = MK.Hex.hexToPixel(hex, size, origin);
            Renderer.drawHexOverlay(pixel, size, 'rgba(200, 200, 100, 0.25)', 'rgba(200, 200, 100, 0.6)');
        }
    }

    // Selected hex
    if (state.selectedHex) {
        const pixel = MK.Hex.hexToPixel(state.selectedHex, size, origin);
        Renderer.drawHexOverlay(pixel, size, 'rgba(201, 162, 39, 0.3)', 'rgba(201, 162, 39, 0.9)');
    }

    // Hovered hex
    if (state.hoveredHex) {
        const pixel = MK.Hex.hexToPixel(state.hoveredHex, size, origin);
        Renderer.drawHexOverlay(pixel, size, 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.4)');
    }

    // Interactive site glow
    const heroHex = state.map.get(MK.Hex.key(state.position.q, state.position.r));
    if (heroHex && heroHex.site && heroHex.enemies.length === 0 && state.phase === 'playing') {
        const pixel = MK.Hex.hexToPixel(state.position, size, origin);
        Renderer.drawSiteGlow(pixel, size, gameTime);
    }

    // Hero
    Renderer.drawHero(state.position, size, origin);

    // Unexplored tile slots
    Renderer.drawUnexploredSlots(size, origin);
};

Renderer.drawBackgroundPattern = function() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    const spacing = 30;
    for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();
};

Renderer.drawHex = function(hex, pixel, size) {
    const terrain = MK.Terrain[hex.terrain];
    if (!terrain) return;

    const state = MK.State;
    const corners = MK.Hex.hexCorners(pixel, size - 1);
    const baseColor = state.isDay ? terrain.color : terrain.darkColor;

    // Clipping path for hex shape
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();

    // Radial gradient fill (lighter center, darker edges)
    const grad = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, size);
    grad.addColorStop(0, lightenColor(baseColor, 0.15));
    grad.addColorStop(0.7, baseColor);
    grad.addColorStop(1, darkenColor(baseColor, 0.15));
    ctx.fillStyle = grad;
    ctx.fill();

    // Terrain texture
    ctx.save();
    ctx.clip();
    Renderer.drawTerrainTexture(hex.terrain, pixel, size, hex.q, hex.r);
    ctx.restore();

    // Inner shadow for 3D bevel
    ctx.save();
    ctx.clip();
    const shadowGrad = ctx.createRadialGradient(pixel.x, pixel.y - size*0.3, size*0.2, pixel.x, pixel.y, size);
    shadowGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
    shadowGrad.addColorStop(0.5, 'transparent');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Site icon
    if (hex.site) Renderer.drawSiteIcon(hex, pixel, size);

    // Enemies
    if (hex.enemies && hex.enemies.length > 0 && !hex.conquered) {
        Renderer.drawEnemyIndicator(hex, pixel, size);
    }

    // Conquered marker
    if (hex.conquered) Renderer.drawConqueredMarker(pixel, size);
};

Renderer.drawTerrainTexture = function(terrain, pixel, size, q, r) {
    const s = size * 0.3;
    const sr = Renderer.seededRandom;

    switch (terrain) {
        case 'forest': {
            // Layered trees at seeded positions
            for (let i = 0; i < 5; i++) {
                const ox = (sr(q, r, i*3) - 0.5) * size * 0.7;
                const oy = (sr(q, r, i*3+1) - 0.5) * size * 0.5;
                const treeSize = s * (0.5 + sr(q, r, i*3+2) * 0.5);
                const shade = Math.floor(sr(q, r, i*10) * 30);
                ctx.fillStyle = `rgba(0, ${40 + shade}, 0, 0.35)`;
                // tree crown
                ctx.beginPath();
                ctx.moveTo(pixel.x + ox, pixel.y + oy - treeSize);
                ctx.lineTo(pixel.x + ox - treeSize*0.5, pixel.y + oy + treeSize*0.3);
                ctx.lineTo(pixel.x + ox + treeSize*0.5, pixel.y + oy + treeSize*0.3);
                ctx.closePath(); ctx.fill();
                // second layer
                ctx.beginPath();
                ctx.moveTo(pixel.x + ox, pixel.y + oy - treeSize*0.6);
                ctx.lineTo(pixel.x + ox - treeSize*0.6, pixel.y + oy + treeSize*0.5);
                ctx.lineTo(pixel.x + ox + treeSize*0.6, pixel.y + oy + treeSize*0.5);
                ctx.closePath(); ctx.fill();
                // trunk
                ctx.fillStyle = 'rgba(60, 30, 10, 0.25)';
                ctx.fillRect(pixel.x + ox - treeSize*0.08, pixel.y + oy + treeSize*0.3, treeSize*0.16, treeSize*0.3);
            }
            break;
        }
        case 'hills': {
            // Contour lines with gradient shading
            ctx.strokeStyle = 'rgba(100, 70, 30, 0.15)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const ox = (sr(q, r, i*2) - 0.5) * size * 0.6;
                const oy = (sr(q, r, i*2+1) - 0.3) * size * 0.4;
                const w = s * (0.6 + sr(q, r, i*5) * 0.8);
                const h = s * (0.3 + sr(q, r, i*5+1) * 0.3);
                // hill with gradient
                const hg = ctx.createRadialGradient(pixel.x + ox, pixel.y + oy - h*0.3, 0, pixel.x + ox, pixel.y + oy, w);
                hg.addColorStop(0, 'rgba(140, 110, 60, 0.15)');
                hg.addColorStop(1, 'transparent');
                ctx.fillStyle = hg;
                ctx.beginPath();
                ctx.arc(pixel.x + ox, pixel.y + oy, w, Math.PI, 0);
                ctx.fill();
                // contour
                ctx.beginPath();
                ctx.arc(pixel.x + ox, pixel.y + oy + h*0.2, w*0.8, Math.PI, 0);
                ctx.stroke();
            }
            break;
        }
        case 'mountain': {
            // Mountain silhouette with rocky texture
            ctx.fillStyle = 'rgba(80, 80, 90, 0.3)';
            // main peak
            ctx.beginPath();
            ctx.moveTo(pixel.x, pixel.y - s*0.8);
            ctx.lineTo(pixel.x - s*0.15, pixel.y - s*0.45);
            ctx.lineTo(pixel.x - s*0.7, pixel.y + s*0.5);
            ctx.lineTo(pixel.x + s*0.7, pixel.y + s*0.5);
            ctx.lineTo(pixel.x + s*0.2, pixel.y - s*0.35);
            ctx.closePath(); ctx.fill();
            // secondary peak
            ctx.fillStyle = 'rgba(70, 70, 80, 0.25)';
            ctx.beginPath();
            ctx.moveTo(pixel.x + s*0.3, pixel.y - s*0.4);
            ctx.lineTo(pixel.x - s*0.1, pixel.y + s*0.5);
            ctx.lineTo(pixel.x + s*0.8, pixel.y + s*0.5);
            ctx.closePath(); ctx.fill();
            // snow cap
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.moveTo(pixel.x, pixel.y - s*0.8);
            ctx.lineTo(pixel.x - s*0.12, pixel.y - s*0.45);
            ctx.lineTo(pixel.x + s*0.15, pixel.y - s*0.5);
            ctx.closePath(); ctx.fill();
            // rocky texture lines
            ctx.strokeStyle = 'rgba(50, 50, 60, 0.2)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 6; i++) {
                const rx = pixel.x + (sr(q, r, i*4) - 0.5) * s;
                const ry = pixel.y + sr(q, r, i*4+1) * s * 0.5;
                ctx.beginPath();
                ctx.moveTo(rx, ry); ctx.lineTo(rx + (sr(q,r,i*4+2)-0.5)*s*0.3, ry + s*0.15);
                ctx.stroke();
            }
            break;
        }
        case 'lake':
        case 'sea': {
            // Animated ripples
            const t = gameTime * 0.002;
            ctx.strokeStyle = terrain === 'lake' ? 'rgba(100, 180, 255, 0.2)' : 'rgba(60, 120, 200, 0.2)';
            ctx.lineWidth = 1;
            for (let i = -2; i <= 2; i++) {
                const yOff = i * s * 0.4 + Math.sin(t + i) * s * 0.1;
                ctx.beginPath();
                ctx.moveTo(pixel.x - s, pixel.y + yOff);
                for (let x = -s; x <= s; x += s * 0.2) {
                    ctx.lineTo(pixel.x + x, pixel.y + yOff + Math.sin(t*2 + x*0.1 + i) * s * 0.08);
                }
                ctx.stroke();
            }
            break;
        }
        case 'swamp': {
            // Dead stumps + murky water (seeded, no flicker)
            // murky pools
            for (let i = 0; i < 4; i++) {
                const ox = (sr(q, r, i*4) - 0.5) * size * 0.6;
                const oy = (sr(q, r, i*4+1) - 0.5) * size * 0.5;
                const poolR = s * (0.15 + sr(q, r, i*4+2) * 0.2);
                ctx.fillStyle = 'rgba(30, 60, 30, 0.25)';
                ctx.beginPath(); ctx.ellipse(pixel.x + ox, pixel.y + oy, poolR*1.5, poolR, 0, 0, Math.PI*2); ctx.fill();
            }
            // dead stumps
            for (let i = 0; i < 3; i++) {
                const ox = (sr(q, r, i*5+20) - 0.5) * size * 0.5;
                const oy = (sr(q, r, i*5+21) - 0.5) * size * 0.4;
                ctx.fillStyle = 'rgba(50, 35, 15, 0.35)';
                ctx.fillRect(pixel.x + ox - 2, pixel.y + oy, 4, s*0.3);
                // broken top
                ctx.beginPath();
                ctx.moveTo(pixel.x + ox - 4, pixel.y + oy);
                ctx.lineTo(pixel.x + ox, pixel.y + oy - s*0.15);
                ctx.lineTo(pixel.x + ox + 4, pixel.y + oy);
                ctx.closePath(); ctx.fill();
            }
            break;
        }
        case 'desert': {
            // Sand dune contours
            ctx.strokeStyle = 'rgba(180, 140, 80, 0.15)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const oy = (sr(q, r, i*3) - 0.5) * size * 0.5;
                const amp = s * (0.15 + sr(q, r, i*3+1) * 0.15);
                ctx.beginPath();
                ctx.moveTo(pixel.x - s*0.8, pixel.y + oy);
                ctx.quadraticCurveTo(pixel.x - s*0.3, pixel.y + oy - amp, pixel.x, pixel.y + oy);
                ctx.quadraticCurveTo(pixel.x + s*0.3, pixel.y + oy + amp*0.5, pixel.x + s*0.8, pixel.y + oy);
                ctx.stroke();
            }
            // subtle sand dots
            ctx.fillStyle = 'rgba(200, 170, 100, 0.1)';
            for (let i = 0; i < 8; i++) {
                const dx = (sr(q, r, i*2+30) - 0.5) * size * 0.7;
                const dy = (sr(q, r, i*2+31) - 0.5) * size * 0.6;
                ctx.beginPath(); ctx.arc(pixel.x + dx, pixel.y + dy, 1, 0, Math.PI*2); ctx.fill();
            }
            break;
        }
        case 'wasteland': {
            // Cracked earth pattern
            ctx.strokeStyle = 'rgba(50, 30, 10, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const sx = pixel.x + (sr(q, r, i*6) - 0.5) * size * 0.7;
                const sy = pixel.y + (sr(q, r, i*6+1) - 0.5) * size * 0.6;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                for (let j = 0; j < 3; j++) {
                    const ex = sx + (sr(q, r, i*6+j*2+2) - 0.5) * s;
                    const ey = sy + (sr(q, r, i*6+j*2+3) - 0.3) * s;
                    ctx.lineTo(ex, ey);
                }
                ctx.stroke();
            }
            break;
        }
        case 'plains': {
            // Subtle grass strokes
            ctx.strokeStyle = 'rgba(80, 140, 50, 0.12)';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 10; i++) {
                const gx = pixel.x + (sr(q, r, i*3+50) - 0.5) * size * 0.7;
                const gy = pixel.y + (sr(q, r, i*3+51) - 0.5) * size * 0.6;
                const h = s * (0.1 + sr(q, r, i*3+52) * 0.15);
                const lean = (sr(q, r, i*3+53) - 0.5) * s * 0.1;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.quadraticCurveTo(gx + lean, gy - h*0.6, gx + lean*1.5, gy - h);
                ctx.stroke();
            }
            break;
        }
        case 'city': {
            // Subtle stone pattern
            ctx.strokeStyle = 'rgba(100, 100, 110, 0.15)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 6; i++) {
                const bx = pixel.x + (sr(q, r, i*4+80) - 0.5) * size * 0.6;
                const by = pixel.y + (sr(q, r, i*4+81) - 0.5) * size * 0.5;
                const bw = s * (0.2 + sr(q, r, i*4+82) * 0.2);
                const bh = s * (0.1 + sr(q, r, i*4+83) * 0.1);
                ctx.strokeRect(bx, by, bw, bh);
            }
            break;
        }
    }
};

Renderer.drawTileBoundaries = function(size, origin) {
    const state = MK.State;

    for (const [key, hex] of state.map) {
        if (!hex.visible) continue;
        const neighbors = MK.Hex.neighbors(hex);

        for (let dir = 0; dir < 6; dir++) {
            const n = neighbors[dir];
            const nKey = MK.Hex.key(n.q, n.r);
            const nHex = state.map.get(nKey);

            // Draw boundary if neighbor is a different tile or doesn't exist
            if (nHex && nHex.tileId !== hex.tileId) {
                const pixel = MK.Hex.hexToPixel(hex, size, origin);
                if (pixel.x < -size*2 || pixel.x > canvas.width + size*2 ||
                    pixel.y < -size*2 || pixel.y > canvas.height + size*2) continue;

                const corners = MK.Hex.hexCorners(pixel, size - 1);
                const i1 = dir;
                const i2 = (dir + 1) % 6;

                ctx.save();
                ctx.strokeStyle = 'rgba(139, 115, 65, 0.5)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(corners[i1].x, corners[i1].y);
                ctx.lineTo(corners[i2].x, corners[i2].y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }
};

Renderer.drawSiteIcon = function(hex, pixel, size) {
    const iconName = MK.SiteIcons[hex.site];
    if (!iconName) return;
    const siteType = MK.SiteType[hex.site.toUpperCase()] || MK.SiteType[hex.site];

    const s = size * 0.5;

    // Site background circle
    ctx.save();
    ctx.fillStyle = hex.conquered ? 'rgba(0,100,0,0.6)' : 'rgba(40,30,15,0.75)';
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y - s * 0.2, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hex.conquered ? 'rgba(100,200,100,0.8)' : 'rgba(200,170,100,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Canvas icon
    const iconColor = hex.conquered ? '#8f8' : '#e6d5b8';
    Icons.draw(ctx, iconName, pixel.x, pixel.y - s * 0.2, s * 0.45, iconColor);

    // Site name below
    ctx.font = `bold ${Math.max(8, Math.floor(size * 0.18))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(230,213,184,0.9)';
    if (siteType) ctx.fillText(siteType.name, pixel.x, pixel.y + s * 0.6);
    ctx.restore();
};

Renderer.drawEnemyIndicator = function(hex, pixel, size) {
    const count = hex.enemies.length;
    const s = size * 0.3;

    ctx.save();
    const typeColor = { green: '#4a8', red: '#c44', purple: '#84a', brown: '#a84' };

    for (let i = 0; i < Math.min(count, 3); i++) {
        const enemy = hex.enemies[i];
        const color = typeColor[enemy.type] || '#888';
        const ox = (i - (count - 1) / 2) * s * 1.3;
        const iconName = MK.EnemyIcons[enemy.id] || 'orc';

        // Background circle
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pixel.x + ox, pixel.y + size * 0.35, s * 0.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Canvas icon
        Icons.draw(ctx, iconName, pixel.x + ox, pixel.y + size * 0.35, s * 0.35, '#fff');
    }
    ctx.restore();
};

Renderer.drawConqueredMarker = function(pixel, size) {
    ctx.save();
    ctx.strokeStyle = 'rgba(100,200,100,0.6)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const s = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(pixel.x + size*0.2, pixel.y - size*0.35);
    ctx.lineTo(pixel.x + size*0.28, pixel.y - size*0.27);
    ctx.lineTo(pixel.x + size*0.4, pixel.y - size*0.42);
    ctx.stroke();
    ctx.restore();
};

Renderer.drawHexOverlay = function(pixel, size, fillColor, strokeColor) {
    const corners = MK.Hex.hexCorners(pixel, size - 1);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.stroke();
};

Renderer.drawSiteGlow = function(pixel, size, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004);
    ctx.save();
    ctx.strokeStyle = `rgba(201, 162, 39, ${0.2 + 0.35 * pulse})`;
    ctx.lineWidth = 1.5 + pulse * 1.5;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, size * 0.65 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

Renderer.drawHero = function(pos, size, origin) {
    const pixel = MK.Hex.hexToPixel(pos, size, origin);
    const state = MK.State;
    const hero = state.hero;
    if (!hero) return;

    const s = size * 0.4;
    const iconName = MK.HeroIcons[state.heroId] || 'shield';

    // Hero glow
    const gradient = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, s * 2);
    gradient.addColorStop(0, hero.color + '60');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(pixel.x, pixel.y, s * 2, 0, Math.PI * 2); ctx.fill();

    // Hero body
    ctx.save();
    ctx.fillStyle = hero.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pixel.x, pixel.y, s, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Hero inner
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(pixel.x, pixel.y, s * 0.65, 0, Math.PI * 2); ctx.fill();

    // Canvas-drawn hero icon
    Icons.draw(ctx, iconName, pixel.x, pixel.y, s * 0.5, hero.color);

    ctx.restore();
};

Renderer.drawUnexploredSlots = function(size, origin) {
    const state = MK.State;
    if (state.tileDeck.length === 0 && state.coreTileDeck.length === 0) return;

    for (const tile of state.placedTiles) {
        const adjCenters = MK.Hex.getAdjacentTileCenters(tile.center);
        for (const [dir, center] of Object.entries(adjCenters)) {
            const key = MK.Hex.key(center.q, center.r);
            if (state.revealedTileSlots.has(key)) continue;

            const hexPositions = MK.Hex.getTileHexes(center);
            for (const pos of hexPositions) {
                const pixel = MK.Hex.hexToPixel(pos, size, origin);
                if (pixel.x < -size*2 || pixel.x > canvas.width + size*2 ||
                    pixel.y < -size*2 || pixel.y > canvas.height + size*2) continue;
                const corners = MK.Hex.hexCorners(pixel, size - 1);
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
                ctx.closePath();
                ctx.fillStyle = 'rgba(20,20,30,0.6)'; ctx.fill();
                ctx.strokeStyle = 'rgba(60,60,80,0.3)'; ctx.lineWidth = 0.5; ctx.stroke();
            }

            const centerPixel = MK.Hex.hexToPixel(center, size, origin);
            ctx.font = `bold ${Math.floor(size * 0.5)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(150,150,180,0.4)';
            ctx.fillText('?', centerPixel.x, centerPixel.y);
        }
    }
};

// ==============================================================
// EVENT HANDLERS
// ==============================================================
UI.onMouseDown = function(e) {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    cameraStart = { ...MK.State.cameraOffset };
};

UI.onMouseMove = function(e) {
    const state = MK.State;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (isDragging) {
        state.cameraOffset.x = cameraStart.x + (e.clientX - dragStart.x);
        state.cameraOffset.y = cameraStart.y + (e.clientY - dragStart.y);
    }
    const hex = MK.Hex.pixelToHex(mx, my, state.hexSize, state.cameraOffset);
    const hexData = state.map.get(MK.Hex.key(hex.q, hex.r));
    state.hoveredHex = hexData ? hex : null;
    UI.updateTooltip(hexData, e.clientX, e.clientY);
};

UI.onMouseUp = function(e) {
    const dx = Math.abs(e.clientX - dragStart.x);
    const dy = Math.abs(e.clientY - dragStart.y);
    wasDragging = (dx > 5 || dy > 5);
    isDragging = false;
};

UI.onMapClick = function(e) {
    if (wasDragging) { wasDragging = false; return; }
    const state = MK.State;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hex = MK.Hex.pixelToHex(mx, my, state.hexSize, state.cameraOffset);
    const hexData = state.map.get(MK.Hex.key(hex.q, hex.r));
    if (!hexData) return;
    if (state.phase === 'playing' && state.movePoints > 0) {
        if (!MK.Hex.equals(hex, state.position)) {
            const moved = MK.Engine.moveHero(hex);
            if (moved) {
                UI.centerCamera(true);
                needsFullRedraw = true;
            }
        }
    }
    state.selectedHex = hex;
};

UI.onWheel = function(e) {
    e.preventDefault();
    const state = MK.State;
    const delta = e.deltaY > 0 ? -4 : 4;
    state.hexSize = Math.max(24, Math.min(80, state.hexSize + delta));
};

UI.updateTooltip = function(hexData, mx, my) {
    const tooltip = document.getElementById('hex-tooltip');
    if (!hexData) { tooltip.style.display = 'none'; return; }
    const terrain = MK.Terrain[hexData.terrain];
    const state = MK.State;
    const cost = terrain ? (state.isDay ? terrain.moveCost.day : terrain.moveCost.night) : '?';

    let html = `<strong>${terrain ? terrain.name : hexData.terrain}</strong>`;
    html += `<br>Move cost: ${cost >= 999 ? 'Impassable' : cost}`;
    if (hexData.site) {
        const siteType = MK.SiteType[hexData.site.toUpperCase()] || MK.SiteType[hexData.site];
        if (siteType) {
            html += `<br><span class="tooltip-site">${siteType.name}</span>`;
            html += `<br><em>${siteType.description}</em>`;
        }
    }
    if (hexData.enemies && hexData.enemies.length > 0 && !hexData.conquered) {
        html += '<br><span class="tooltip-enemies">Enemies:</span>';
        for (const e of hexData.enemies) {
            html += `<br>  ${e.name} (Atk:${e.attack} Arm:${e.armor})`;
            if (e.abilities.length > 0) {
                const descs = e.abilities.map(a => MK.AbilityDescriptions[a] || a).join(', ');
                html += `<br>  <em style="font-size:10px">${descs}</em>`;
            }
        }
    }
    if (hexData.conquered) html += '<br><span class="tooltip-conquered">Conquered</span>';
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (mx + 15) + 'px';
    tooltip.style.top = (my + 15) + 'px';
};

// ==============================================================
// UI PANEL UPDATES
// ==============================================================
let lastOverlayPhase = null;
let needsFullRedraw = true;
let lastStateHash = '';

UI.markDirty = function() { needsFullRedraw = true; };

UI.updateAll = function() {
    const state = MK.State;
    gameTime = performance.now();

    // Menu phases
    if (state.phase === 'title' || state.phase === 'hero_select' || state.phase === 'scenario_select' || state.phase === 'game_over') {
        document.getElementById('game-area').style.display = 'none';
        if (lastOverlayPhase !== state.phase) {
            lastOverlayPhase = state.phase;
            if (state.phase === 'title') UI.showTitleScreen();
            else if (state.phase === 'hero_select') UI.showHeroSelect();
            else if (state.phase === 'scenario_select') UI.showScenarioSelect();
            else if (state.phase === 'game_over') UI.showGameOver();
        }
        return;
    }

    // Game phases
    const overlay = document.getElementById('overlay');
    const gameArea = document.getElementById('game-area');
    if (overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        lastOverlayPhase = null;
    }
    if (gameArea.style.display !== 'flex') {
        gameArea.style.display = 'flex';
        void gameArea.offsetHeight;
        needsFullRedraw = true;
    }

    // Ensure canvas is properly sized
    const container = canvas.parentElement;
    if (container) {
        const cw = container.clientWidth, ch = container.clientHeight;
        if (cw > 0 && ch > 0 && (canvas.width !== cw || canvas.height !== ch)) {
            canvas.width = cw; canvas.height = ch;
        }
    }
    if (canvas.width > 0 && state.cameraOffset.x === 0 && state.cameraOffset.y === 0) {
        UI.centerCamera();
    }

    // Always redraw map (canvas)
    if (canvas.width > 0 && canvas.height > 0) {
        Renderer.drawMap();
    }

    // State hash for DOM updates
    const hash = `${state.phase}|${state.hand.length}|${state.selectedCard}|${state.movePoints}|${state.attackPoints}|${state.blockPoints}|${state.influencePoints}|${state.rangedAttackPoints}|${state.fame}|${state.wounds}|${state.manaTokens.length}|${state.manaSource.length}|${state.round}|${state.isDay}|${state.combat ? state.combat.phase : ''}|${state.units.length}|${state.log.length}|${JSON.stringify(state.crystals)}|${state.interacting ? state.interacting.type : ''}|${state.notifications.length}`;

    if (hash !== lastStateHash || needsFullRedraw) {
        lastStateHash = hash;
        needsFullRedraw = false;
        UI.updateHeroPanel();
        UI.updateHand();
        UI.updateRightPanel();
        UI.updateActionBar();
        UI.updateCombatPanel();
        UI.updateLog();
    }

    // Handle notifications
    UI.updateNotifications();
};

// ==============================================================
// TITLE / SELECT SCREENS
// ==============================================================
UI.showTitleScreen = function() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    const emblemUrl = Icons.toDataURL('crossedSwords', 120, '#c9a227');
    overlay.innerHTML = `
        <div class="title-screen">
            <div class="title-logo">
                <img src="${emblemUrl}" class="title-emblem" alt="" />
                <h1>MAGE KNIGHT</h1>
                <div class="title-subtitle">The Digital Board Game</div>
            </div>
            <div class="title-divider"></div>
            <button class="btn btn-primary btn-large" onclick="MK.UI.startHeroSelect()">
                Begin Quest
            </button>
            <div class="title-footer">
                <p>A digital adaptation of Vlaada Chv&aacute;til's board game</p>
                <p class="title-controls">Controls: Click hexes to move | Scroll to zoom | Drag to pan | C to center | E to end turn | 1-9 to select cards</p>
            </div>
        </div>
    `;
};

UI.startHeroSelect = function() {
    MK.State.phase = 'hero_select';
};

UI.showHeroSelect = function() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    let heroCards = '';
    for (const [id, hero] of Object.entries(MK.Heroes)) {
        const iconName = MK.HeroIcons[id] || 'shield';
        const portraitUrl = Icons.toDataURL(iconName, 80, hero.color);
        const uniqueCards = hero.startingDeck.filter(c => {
            const card = MK.BasicActions[c];
            return card && !['march','swiftness','stamina','rage','determination','promise','threaten','tranquility','mana_draw','concentration','crystallize'].includes(c);
        }).map(c => MK.BasicActions[c] ? MK.BasicActions[c].name : c);

        heroCards += `
            <div class="hero-card" onclick="MK.UI.selectHero('${id}')" style="--hero-color: ${hero.color}">
                <div class="hero-portrait-canvas"><img src="${portraitUrl}" alt="${hero.name}" /></div>
                <h3>${hero.name}</h3>
                <div class="hero-title">${hero.title}</div>
                <p class="hero-desc">${hero.description}</p>
                ${uniqueCards.length > 0 ? `<div class="hero-unique-cards">Unique: ${uniqueCards.join(', ')}</div>` : ''}
                <div class="hero-stats">
                    <span>Armor: ${hero.startingArmor}</span>
                    <span>Hand: ${hero.startingHandLimit}</span>
                </div>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="select-screen">
            <h2>Choose Your Hero</h2>
            <div class="hero-grid">${heroCards}</div>
            <button class="btn btn-secondary" onclick="MK.State.phase='title'">Back</button>
        </div>
    `;
};

UI.selectHero = function(heroId) {
    MK.State.heroId = heroId;
    MK.State.phase = 'scenario_select';
};

UI.showScenarioSelect = function() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    const difficultyMap = { first_recon: { label: 'Easy', stars: 1 }, solo_conquest: { label: 'Medium', stars: 2 }, full_conquest: { label: 'Hard', stars: 3 } };

    let scenarioCards = '';
    for (const [id, scenario] of Object.entries(MK.Scenarios)) {
        const diff = difficultyMap[id] || { label: '?', stars: 1 };
        const starsHtml = '<span class="difficulty-stars">' + Array(diff.stars).fill('<span class="diff-star-filled"></span>').join('') + Array(3 - diff.stars).fill('<span class="diff-star-empty"></span>').join('') + '</span>';

        scenarioCards += `
            <div class="scenario-card" onclick="MK.UI.selectScenario('${id}')">
                <h3>${scenario.name}</h3>
                <div class="scenario-difficulty">${diff.label} ${starsHtml}</div>
                <p>${scenario.description}</p>
                <div class="scenario-details">
                    <span>Rounds: ${scenario.rounds}</span>
                    <span>Tiles: ${scenario.countrysideTiles + scenario.coreTiles}</span>
                </div>
                <div class="scenario-win">Goal: ${scenario.winDescription}</div>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="select-screen">
            <h2>Choose Scenario</h2>
            <div class="scenario-grid">${scenarioCards}</div>
            <button class="btn btn-secondary" onclick="MK.State.phase='hero_select'">Back</button>
        </div>
    `;
};

UI.selectScenario = function(scenarioId) {
    MK.Engine.initGame(MK.State.heroId, scenarioId);
    needsFullRedraw = true;
};

// ==============================================================
// HERO PANEL
// ==============================================================
UI.updateHeroPanel = function() {
    const state = MK.State;
    const hero = state.hero;
    if (!hero) return;

    const panel = document.getElementById('hero-panel');
    const nextLevel = MK.FameLevels[state.level] || null;

    let unitsHtml = '';
    for (const unit of state.units) {
        const unitIconUrl = Icons.toDataURL(MK.EnemyIcons[unit.id] || 'guard', 24, '#e6d5b8');
        unitsHtml += `
            <div class="unit-badge ${unit.wounded ? 'unit-wounded' : ''}">
                <img src="${unitIconUrl}" class="unit-icon-img" alt="" />
                <span class="unit-name">${unit.name}</span>
                ${unit.wounded ? '<span class="unit-status">Wounded</span>' : ''}
            </div>
        `;
    }

    let crystalsHtml = '';
    for (const [color, count] of Object.entries(state.crystals)) {
        if (count > 0) crystalsHtml += `<span class="crystal crystal-${color}">${count}</span>`;
    }

    let skillsHtml = '';
    for (const skill of state.skills) {
        skillsHtml += `<div class="skill-badge" title="${skill.description}">${skill.name}</div>`;
    }

    const heroIconUrl = Icons.toDataURL(MK.HeroIcons[state.heroId] || 'shield', 36, hero.color);

    panel.innerHTML = `
        <div class="hero-header" style="border-color: ${hero.color}">
            <img src="${heroIconUrl}" class="hero-portrait-icon" alt="" />
            <div>
                <div class="hero-name">${hero.name}</div>
                <div class="hero-level">Level ${state.level}</div>
            </div>
        </div>
        ${nextLevel ? `<div class="fame-bar"><div class="fame-fill" style="width: ${Math.min(100, (state.fame / nextLevel.fame) * 100)}%"></div><span class="fame-text">Fame: ${state.fame} / ${nextLevel.fame}</span></div>` : `<div class="fame-bar"><div class="fame-fill" style="width: 100%"></div><span class="fame-text">Fame: ${state.fame} (MAX)</span></div>`}
        <div class="stat-grid">
            <div class="stat"><span class="stat-label">Fame</span><span class="stat-value">${state.fame}${nextLevel ? ` / ${nextLevel.fame}` : ''}</span></div>
            <div class="stat"><span class="stat-label">Armor</span><span class="stat-value">${state.armor}</span></div>
            <div class="stat"><span class="stat-label">Reputation</span><span class="stat-value">${state.reputation}</span></div>
            <div class="stat"><span class="stat-label">Wounds</span><span class="stat-value ${state.wounds > 0 ? 'stat-danger' : ''}">${state.wounds}</span></div>
            <div class="stat"><span class="stat-label">Hand</span><span class="stat-value">${state.hand.length} / ${state.handLimit}</span></div>
            <div class="stat"><span class="stat-label">Deck</span><span class="stat-value">${state.deck.length}</span></div>
        </div>
        <div class="section-label">Crystals</div>
        <div class="crystals-row">${crystalsHtml || '<span class="text-dim">None</span>'}</div>
        <div class="section-label">Units (${state.units.length}/3)</div>
        <div class="units-list">${unitsHtml || '<span class="text-dim">None recruited</span>'}</div>
        ${skillsHtml ? `<div class="section-label">Skills</div><div class="skills-list">${skillsHtml}</div>` : ''}
    `;
};

// ==============================================================
// HAND (Card Rendering)
// ==============================================================
UI.updateHand = function() {
    const state = MK.State;
    const handEl = document.getElementById('hand-cards');

    let html = '';
    for (let i = 0; i < state.hand.length; i++) {
        const card = state.hand[i];
        const isWound = card.type === 'wound';
        const colorClass = isWound ? 'wound' : card.color;
        const isSelected = state.selectedCard === i;
        const effectIcon = !isWound ? MK.EffectIcons[card.basicEffect ? card.basicEffect.type : 'special'] || 'star' : null;
        const effectIconUrl = effectIcon ? Icons.toDataURL(effectIcon, 16, isWound ? '#666' : '#e6d5b8') : '';

        html += `
            <div class="card ${isSelected ? 'card-selected' : ''} card-${colorClass}"
                 onclick="MK.UI.selectCard(${i})"
                 oncontextmenu="MK.UI.showCardDetail(${i}); return false;">
                <div class="card-name-bar">
                    <span class="card-name">${card.name}</span>
                    ${!isWound ? `<span class="card-mana-dot mana-${card.color}"></span>` : ''}
                </div>
                <div class="card-effect card-effect-basic">
                    ${effectIconUrl ? `<img src="${effectIconUrl}" class="card-effect-icon" alt="" />` : ''}
                    <span>${card.basicDesc || ''}</span>
                </div>
                ${card.poweredDesc ? `
                <div class="card-effect card-effect-powered">
                    ${effectIconUrl ? `<img src="${effectIconUrl}" class="card-effect-icon" alt="" />` : ''}
                    <span>${card.poweredDesc}</span>
                </div>` : ''}
                <div class="card-type-badge">${card.type}</div>
            </div>
        `;
    }
    handEl.innerHTML = html;

    // Card play options
    const optionsEl = document.getElementById('card-options');
    if (state.selectedCard !== null && state.selectedCard < state.hand.length) {
        const card = state.hand[state.selectedCard];
        if (card.type === 'wound') {
            optionsEl.innerHTML = '<div class="card-option-msg">Wounds cannot be played.</div>';
            optionsEl.style.display = 'flex';
        } else {
            const canPower = MK.Engine.canUseMana(card.color);
            const isSpell = card.type === 'spell';
            const canCastBasic = isSpell ? MK.Engine.canUseMana(card.manaCost || card.color) : true;
            const spellNote = isSpell ? ` (costs ${card.manaCost} mana)` : '';
            const poweredNote = !canPower ? ` (need ${card.color} mana)` : '';
            optionsEl.innerHTML = `
                <button class="btn btn-small btn-action ${canCastBasic ? '' : 'btn-disabled'}"
                        onclick="MK.UI.playCard('basic')" ${canCastBasic ? '' : 'disabled'}>
                    Basic: ${card.basicDesc}${spellNote}
                </button>
                <button class="btn btn-small btn-powered ${(canPower && canCastBasic) ? '' : 'btn-disabled'}"
                        onclick="MK.UI.playCard('powered')" ${(canPower && canCastBasic) ? '' : 'disabled'}>
                    Powered: ${card.poweredDesc || 'N/A'}${poweredNote}
                </button>
                <div class="sideways-options">
                    <button class="btn btn-tiny" onclick="MK.UI.playCard('sideways_move')">Move 1</button>
                    <button class="btn btn-tiny" onclick="MK.UI.playCard('sideways_attack')">Atk 1</button>
                    <button class="btn btn-tiny" onclick="MK.UI.playCard('sideways_block')">Blk 1</button>
                    <button class="btn btn-tiny" onclick="MK.UI.playCard('sideways_influence')">Inf 1</button>
                </div>
            `;
            optionsEl.style.display = 'flex';
        }
    } else {
        optionsEl.style.display = 'none';
    }
};

UI.selectCard = function(index) {
    const state = MK.State;
    state.selectedCard = (state.selectedCard === index) ? null : index;
};

UI.playCard = function(mode) {
    const state = MK.State;
    if (state.selectedCard === null) return;
    if (MK.Engine.playCard(state.selectedCard, mode)) state.selectedCard = null;
};

UI.showCardDetail = function(index) {};

// ==============================================================
// RIGHT PANEL
// ==============================================================
UI.updateRightPanel = function() {
    const state = MK.State;

    // Round info
    const roundEl = document.getElementById('round-info');
    const timeText = state.isDay ? 'Day' : 'Night';
    const timeIconUrl = Icons.toDataURL(state.isDay ? 'star' : 'magicalGlade', 20, state.isDay ? '#ffd700' : '#6688cc');
    roundEl.innerHTML = `
        <div class="round-display">
            <span class="round-time"><img src="${timeIconUrl}" class="round-icon" alt="" /> ${timeText}</span>
            <span class="round-number">Round ${state.round} / ${state.scenario ? state.scenario.rounds : '?'}</span>
        </div>
    `;

    // Mana source
    const manaEl = document.getElementById('mana-source');
    let manaHtml = '<div class="section-label">Mana Source</div><div class="mana-dice">';
    for (let i = 0; i < state.manaSource.length; i++) {
        const color = state.manaSource[i];
        manaHtml += `<div class="mana-die mana-${color}" onclick="MK.Engine.takeManaFromSource(${i})" title="Take ${color} mana">${color[0].toUpperCase()}</div>`;
    }
    manaHtml += '</div>';
    if (state.manaTokens.length > 0) {
        manaHtml += '<div class="section-label">Mana Tokens</div><div class="mana-tokens">';
        for (const token of state.manaTokens) {
            manaHtml += `<span class="mana-token mana-${token}">${token[0].toUpperCase()}</span>`;
        }
        manaHtml += '</div>';
    }
    manaEl.innerHTML = manaHtml;

    // Points display
    const pointsEl = document.getElementById('points-display');
    pointsEl.innerHTML = `
        <div class="section-label">Current Points</div>
        <div class="points-grid">
            ${state.movePoints > 0 ? `<span class="point-badge point-move">Move: ${state.movePoints}</span>` : ''}
            ${state.attackPoints > 0 ? `<span class="point-badge point-attack">Attack: ${state.attackPoints}</span>` : ''}
            ${state.rangedAttackPoints > 0 ? `<span class="point-badge point-ranged">Ranged: ${state.rangedAttackPoints}</span>` : ''}
            ${state.blockPoints > 0 ? `<span class="point-badge point-block">Block: ${state.blockPoints}</span>` : ''}
            ${state.influencePoints > 0 ? `<span class="point-badge point-influence">Influence: ${state.influencePoints}</span>` : ''}
        </div>
    `;

    // Tiles remaining
    const tilesEl = document.getElementById('tiles-info');
    tilesEl.innerHTML = `
        <div class="section-label">Tiles</div>
        <div class="tiles-remaining">
            <span>Countryside: ${state.tileDeck.length}</span>
            <span>Core: ${state.coreTileDeck.length}</span>
        </div>
    `;
};

// ==============================================================
// ACTION BAR (Phase Strip + Guidance)
// ==============================================================
UI.updateActionBar = function() {
    const state = MK.State;
    const bar = document.getElementById('action-bar');
    const guidance = MK.Engine.getTurnGuidance();

    if (state.phase === 'combat') {
        const phases = ['ranged', 'block', 'damage', 'attack', 'resolve'];
        const currentIdx = phases.indexOf(state.combat ? state.combat.phase : '');
        let phaseBarHtml = '<div class="phase-strip">';
        const phaseLabels = ['RANGED', 'BLOCK', 'DAMAGE', 'ATTACK', 'RESOLVE'];
        for (let i = 0; i < phases.length; i++) {
            const cls = i < currentIdx ? 'phase-done' : i === currentIdx ? 'phase-active' : 'phase-pending';
            phaseBarHtml += `<div class="phase-step ${cls}">${phaseLabels[i]}</div>`;
            if (i < phases.length - 1) phaseBarHtml += '<div class="phase-step-arrow">\u25B8</div>';
        }
        phaseBarHtml += '</div>';

        const nextLabel = state.combat && state.combat.phase === 'attack' ? 'Resolve Combat' : 'Next Phase \u2192';
        bar.innerHTML = `
            ${phaseBarHtml}
            <div class="guidance-row">
                <span class="guidance-hint">${guidance.hint}</span>
                <div class="guidance-actions">
                    <button class="btn btn-small btn-action" onclick="MK.UI.advanceCombatPhase()">${nextLabel}</button>
                    <button class="btn btn-small btn-danger" onclick="MK.Engine.fleeCombat()">Flee</button>
                </div>
            </div>
        `;
    } else if (state.phase === 'playing') {
        const stepMap = { cards: 0, move: 1, interact: 2, end: 3 };
        const currentStep = stepMap[guidance.step] !== undefined ? stepMap[guidance.step] : 0;
        const stepLabels = ['PLAY CARDS', 'MOVE', 'INTERACT', 'END TURN'];

        let phaseBarHtml = '<div class="phase-strip">';
        for (let i = 0; i < stepLabels.length; i++) {
            const cls = i < currentStep ? 'phase-done' : i === currentStep ? 'phase-active' : 'phase-pending';
            phaseBarHtml += `<div class="phase-step ${cls}">${stepLabels[i]}</div>`;
            if (i < stepLabels.length - 1) phaseBarHtml += '<div class="phase-step-arrow">\u25B8</div>';
        }
        phaseBarHtml += '</div>';

        const hasInteraction = state.interacting !== null;
        bar.innerHTML = `
            ${phaseBarHtml}
            <div class="guidance-row">
                <span class="guidance-hint">${guidance.hint}</span>
                <div class="guidance-actions">
                    <button class="btn btn-small btn-action" onclick="MK.Engine.endTurn()">End Turn</button>
                    <button class="btn btn-tiny" onclick="MK.UI.centerCamera(true)" title="Center camera (C)">Center</button>
                    ${hasInteraction ? UI.getInteractionButtons() : ''}
                </div>
            </div>
        `;
    } else {
        bar.innerHTML = '';
    }
};

UI.getInteractionButtons = function() {
    const state = MK.State;
    if (!state.interacting) return '';
    switch (state.interacting.type) {
        case 'village': {
            let unitBtns = '';
            for (const unit of state.unitOffer) {
                unitBtns += `<button class="btn btn-tiny" onclick="MK.Engine.recruitUnit('${unit.id}')"
                    title="Cost: ${unit.cost} influence">${unit.name} (${unit.cost})</button>`;
            }
            return `
                <div class="interaction-panel">
                    <span class="interaction-label">Village</span>
                    <button class="btn btn-tiny" onclick="MK.Engine.healAtVillage()">Heal (3 inf)</button>
                    ${unitBtns}
                </div>
            `;
        }
        case 'monastery':
            return `
                <div class="interaction-panel">
                    <span class="interaction-label">Monastery</span>
                    <button class="btn btn-tiny" onclick="MK.UI.monasteryBurn()">Burn mana for effect</button>
                </div>
            `;
        default: return '';
    }
};

UI.monasteryBurn = function() {
    if (MK.State.manaTokens.length > 0) {
        MK.State.manaTokens.shift();
        MK.State.influencePoints += 2;
        MK.Engine.log('Burned mana at monastery: +2 influence.', 'action');
    } else {
        MK.Engine.log('No mana to burn!', 'warning');
    }
};

UI.advanceCombatPhase = function() {
    const state = MK.State;
    if (!state.combat) return;
    if (state.combat.phase === 'ranged') {
        if (state.rangedAttackPoints > 0) {
            for (let i = 0; i < state.combat.enemies.length; i++) {
                const enemy = state.combat.enemies[i];
                if (!enemy.defeated && !enemy.abilities.includes('fortified')) {
                    MK.Engine.applyRangedAttack(i); break;
                }
            }
        }
        MK.Engine.advanceCombatPhase();
    } else if (state.combat.phase === 'block') {
        MK.Engine.advanceCombatPhase();
    } else if (state.combat.phase === 'attack') {
        if (state.attackPoints > 0) {
            for (let i = 0; i < state.combat.enemies.length; i++) {
                const enemy = state.combat.enemies[i];
                if (!enemy.defeated) { MK.Engine.applyMeleeAttack(i); break; }
            }
        }
        MK.Engine.advanceCombatPhase();
    }
};

// ==============================================================
// COMBAT PANEL
// ==============================================================
UI.updateCombatPanel = function() {
    const state = MK.State;
    const panel = document.getElementById('combat-panel');
    if (state.phase !== 'combat' || !state.combat) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';

    const phases = ['ranged', 'block', 'damage', 'attack', 'resolve'];
    const currentIdx = phases.indexOf(state.combat.phase);
    const phaseLabels = ['RANGED', 'BLOCK', 'DAMAGE', 'ATTACK', 'RESOLVE'];

    let phaseBarHtml = '<div class="combat-phase-bar">';
    for (let i = 0; i < phases.length; i++) {
        const cls = i < currentIdx ? 'phase-done' : i === currentIdx ? 'phase-active' : 'phase-pending';
        phaseBarHtml += `<div class="phase-step ${cls}">${phaseLabels[i]}</div>`;
        if (i < phases.length - 1) phaseBarHtml += '<div class="phase-step-arrow">\u2192</div>';
    }
    phaseBarHtml += '</div>';

    const typeColor = { green: '#4a8', red: '#c44', purple: '#84a', brown: '#a84' };
    let enemiesHtml = '';
    for (let i = 0; i < state.combat.enemies.length; i++) {
        const enemy = state.combat.enemies[i];
        const eColor = typeColor[enemy.type] || '#888';
        const iconName = MK.EnemyIcons[enemy.id] || 'orc';
        const iconUrl = Icons.toDataURL(iconName, 48, enemy.defeated ? '#666' : '#fff');
        const abilitiesHtml = enemy.abilities.map(a => {
            const desc = MK.AbilityDescriptions[a] || a;
            return `<span class="ability-badge" title="${desc}">${a.replace(/_/g, ' ')}</span>`;
        }).join(' ');

        // Armor bar
        let armorBarHtml = '<div class="armor-bar">';
        for (let a = 0; a < enemy.currentArmor; a++) {
            armorBarHtml += '<span class="armor-pip"></span>';
        }
        armorBarHtml += '</div>';

        // Phase-specific warnings
        let warningHtml = '';
        if (state.combat.phase === 'ranged' && enemy.abilities.includes('fortified') && !enemy.defeated) {
            warningHtml = '<div class="enemy-warning">FORTIFIED - immune to ranged!</div>';
        }
        if (state.combat.phase === 'block' && enemy.abilities.includes('swift') && !enemy.defeated) {
            warningHtml = '<div class="enemy-warning">SWIFT - attacks first!</div>';
        }

        enemiesHtml += `
            <div class="combat-enemy ${enemy.defeated ? 'enemy-defeated' : ''}"
                 style="border-color: ${eColor}"
                 onclick="MK.UI.targetEnemy(${i})">
                <img src="${iconUrl}" class="enemy-icon-img" alt="" />
                <div class="enemy-name">${enemy.name}</div>
                <div class="enemy-stats">
                    <span class="enemy-attack-val">${enemy.attack}</span>
                    <span class="enemy-armor-val">${enemy.currentArmor}</span>
                </div>
                ${armorBarHtml}
                <div class="enemy-abilities">${abilitiesHtml || '<span class="no-abilities">none</span>'}</div>
                ${warningHtml}
                ${enemy.defeated ? '<div class="enemy-status">DEFEATED</div>' : ''}
            </div>
        `;
    }

    // Damage visualization in block phase
    let damageVizHtml = '';
    if (state.combat.phase === 'block' || state.combat.phase === 'damage') {
        const incoming = state.combat.playerDamage || 0;
        const blocked = state.blockPoints;
        const unblocked = Math.max(0, incoming - blocked);
        if (incoming > 0) {
            damageVizHtml = `
                <div class="damage-viz">
                    <span class="dmg-incoming">Incoming: ${incoming}</span>
                    <span class="dmg-sep">|</span>
                    <span class="dmg-blocked">Block: ${blocked}</span>
                    <span class="dmg-sep">|</span>
                    <span class="dmg-unblocked ${unblocked > 0 ? 'dmg-danger' : 'dmg-safe'}">${unblocked > 0 ? `Unblocked: ${unblocked} \u2192 Wounds` : 'All blocked!'}</span>
                </div>
            `;
        }
    }

    const guidance = MK.Engine.getTurnGuidance();
    panel.innerHTML = `
        <div class="combat-header">
            <h3>COMBAT</h3>
        </div>
        ${phaseBarHtml}
        <div class="combat-help">${guidance.hint}</div>
        ${damageVizHtml}
        <div class="combat-enemies">${enemiesHtml}</div>
        <div class="combat-totals">
            ${state.rangedAttackPoints > 0 ? `<span class="point-badge point-ranged">Ranged: ${state.rangedAttackPoints}</span>` : ''}
            ${state.blockPoints > 0 ? `<span class="point-badge point-block">Block: ${state.blockPoints}</span>` : ''}
            ${state.attackPoints > 0 ? `<span class="point-badge point-attack">Attack: ${state.attackPoints}</span>` : ''}
        </div>
    `;
};

UI.targetEnemy = function(index) {
    const state = MK.State;
    if (!state.combat) return;
    if (state.combat.phase === 'ranged' && state.rangedAttackPoints > 0) MK.Engine.applyRangedAttack(index);
    else if (state.combat.phase === 'attack' && state.attackPoints > 0) MK.Engine.applyMeleeAttack(index);
};

// ==============================================================
// LOG
// ==============================================================
UI.updateLog = function() {
    const logEl = document.getElementById('game-log');
    const state = MK.State;
    let html = '';
    const maxEntries = 15;
    for (let i = 0; i < Math.min(state.log.length, maxEntries); i++) {
        const entry = state.log[i];
        html += `<div class="log-entry log-${entry.type}">${entry.msg}</div>`;
    }
    logEl.innerHTML = html;
};

// ==============================================================
// GAME OVER
// ==============================================================
UI.showGameOver = function() {
    const state = MK.State;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    const won = MK.Engine.checkWinCondition();
    const heroName = state.hero ? `${state.hero.name} ${state.hero.title}` : 'Unknown';
    const maxRounds = state.scenario ? state.scenario.rounds : '?';
    const resultIcon = won ? Icons.toDataURL('star', 80, '#ffd700') : Icons.toDataURL('dungeon', 80, '#c62828');

    overlay.innerHTML = `
        <div class="game-over-screen">
            <img src="${resultIcon}" class="game-over-icon" alt="" />
            <h2>${won ? 'VICTORY!' : 'DEFEAT'}</h2>
            <p>${won ? 'You have completed the quest!' : 'You ran out of time...'}</p>
            <div class="game-over-stats">
                <div>Hero: ${heroName}</div>
                <div>Level: ${state.level}</div>
                <div>Fame: ${state.fame}</div>
                <div>Rounds: ${state.round} / ${maxRounds}</div>
                <div>Sites Conquered: ${state.conqueredSites.size}</div>
                <div>Wounds: ${state.wounds}</div>
            </div>
            <button class="btn btn-primary btn-large" onclick="MK.State.phase='title'">Play Again</button>
        </div>
    `;
};

// ==============================================================
// NOTIFICATIONS
// ==============================================================
UI.updateNotifications = function() {
    const state = MK.State;
    const container = document.getElementById('notifications');
    if (!container) return;

    const now = Date.now();
    state.notifications = state.notifications.filter(n => now - n.time < n.duration);

    for (const n of state.notifications) {
        if (!n.rendered) {
            n.rendered = true;
            const div = document.createElement('div');
            div.className = 'notification';
            div.style.animationDuration = n.duration + 'ms';
            div.innerHTML = `
                <div class="notification-title">${n.title}</div>
                ${n.subtitle ? `<div class="notification-subtitle">${n.subtitle}</div>` : ''}
            `;
            div.addEventListener('animationend', () => div.remove(), { once: true });
            container.appendChild(div);
        }
    }
};

// ==============================================================
// GAME LOOP
// ==============================================================
UI.gameLoop = function() {
    UI.updateAll();
    requestAnimationFrame(UI.gameLoop);
};

MK.UI = UI;
MK.Renderer = Renderer;
MK.Icons = Icons;

})();
