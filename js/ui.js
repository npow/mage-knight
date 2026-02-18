// ============================================================
// MAGE KNIGHT - UI & RENDERER
// Canvas rendering for hex map + DOM-based UI panels
// ============================================================

(function() {

const UI = {};
const Renderer = {};

let canvas, ctx;
let wasDragging = false;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cameraStart = { x: 0, y: 0 };

// ----------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------
UI.init = function() {
    canvas = document.getElementById('map-canvas');
    ctx = canvas.getContext('2d');

    UI.resizeCanvas();
    window.addEventListener('resize', UI.resizeCanvas);

    // Mouse events for map
    canvas.addEventListener('mousedown', UI.onMouseDown);
    canvas.addEventListener('mousemove', UI.onMouseMove);
    canvas.addEventListener('mouseup', UI.onMouseUp);
    canvas.addEventListener('click', UI.onMapClick);
    canvas.addEventListener('wheel', UI.onWheel);

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Keyboard events
    document.addEventListener('keydown', UI.onKeyDown);
};

UI.onKeyDown = function(e) {
    const state = MK.State;
    if (state.phase !== 'playing' && state.phase !== 'combat') return;

    switch (e.key.toLowerCase()) {
        case 'c':
            UI.centerCamera(true);
            break;
        case 'e':
            MK.Engine.endTurn();
            break;
        case 'escape':
            state.selectedCard = null;
            state.selectedHex = null;
            break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
            const idx = parseInt(e.key) - 1;
            if (idx < state.hand.length) {
                UI.selectCard(idx);
            }
            break;
    }
};

UI.resizeCanvas = function() {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
};

UI.centerCamera = function(smooth) {
    const state = MK.State;
    const pixel = MK.Hex.hexToPixel(state.position, state.hexSize);
    const targetX = canvas.width / 2 - pixel.x;
    const targetY = canvas.height / 2 - pixel.y;

    if (smooth) {
        // Animate camera movement
        const startX = state.cameraOffset.x;
        const startY = state.cameraOffset.y;
        const duration = 300;
        const startTime = performance.now();

        function animateCamera(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
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

// ----------------------------------------------------------
// MAP RENDERING
// ----------------------------------------------------------
Renderer.drawMap = function() {
    const state = MK.State;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid pattern
    Renderer.drawBackgroundPattern();

    const origin = state.cameraOffset;
    const size = state.hexSize;

    // Draw all hexes
    for (const [key, hex] of state.map) {
        if (!hex.visible) continue;
        const pixel = MK.Hex.hexToPixel(hex, size, origin);

        // Check if on screen
        if (pixel.x < -size * 2 || pixel.x > canvas.width + size * 2 ||
            pixel.y < -size * 2 || pixel.y > canvas.height + size * 2) continue;

        Renderer.drawHex(hex, pixel, size);
    }

    // Draw reachable hexes overlay
    if (state.movePoints > 0 && state.phase === 'playing') {
        const reachable = MK.Engine.getReachableHexes(state.movePoints);
        for (const [key, remaining] of reachable) {
            const hex = MK.Hex.fromKey(key);
            const pixel = MK.Hex.hexToPixel(hex, size, origin);
            Renderer.drawHexOverlay(pixel, size, 'rgba(200, 200, 100, 0.25)', 'rgba(200, 200, 100, 0.6)');
        }
    }

    // Draw selected hex
    if (state.selectedHex) {
        const pixel = MK.Hex.hexToPixel(state.selectedHex, size, origin);
        Renderer.drawHexOverlay(pixel, size, 'rgba(201, 162, 39, 0.3)', 'rgba(201, 162, 39, 0.9)');
    }

    // Draw hovered hex
    if (state.hoveredHex) {
        const pixel = MK.Hex.hexToPixel(state.hoveredHex, size, origin);
        Renderer.drawHexOverlay(pixel, size, 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.4)');
    }

    // Draw hero
    Renderer.drawHero(state.position, size, origin);

    // Draw unexplored tile slots
    Renderer.drawUnexploredSlots(size, origin);
};

Renderer.drawBackgroundPattern = function() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    const spacing = 30;
    for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();
};

Renderer.drawHex = function(hex, pixel, size) {
    const terrain = MK.Terrain[hex.terrain];
    if (!terrain) return;

    const state = MK.State;
    const corners = MK.Hex.hexCorners(pixel, size - 1);

    // Fill terrain color
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();

    const color = state.isDay ? terrain.color : terrain.darkColor;
    ctx.fillStyle = color;
    ctx.fill();

    // Terrain texture
    Renderer.drawTerrainTexture(hex.terrain, pixel, size);

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw site icon
    if (hex.site) {
        Renderer.drawSiteIcon(hex, pixel, size);
    }

    // Draw enemies
    if (hex.enemies && hex.enemies.length > 0 && !hex.conquered) {
        Renderer.drawEnemyIndicator(hex, pixel, size);
    }

    // Draw conquered marker
    if (hex.conquered) {
        Renderer.drawConqueredMarker(pixel, size);
    }
};

Renderer.drawTerrainTexture = function(terrain, pixel, size) {
    ctx.save();
    const s = size * 0.3;

    switch (terrain) {
        case 'forest':
            // Draw tree shapes
            ctx.fillStyle = 'rgba(0,40,0,0.3)';
            for (let i = 0; i < 3; i++) {
                const ox = (i - 1) * s * 0.7;
                const oy = s * 0.2;
                ctx.beginPath();
                ctx.moveTo(pixel.x + ox, pixel.y + oy - s * 0.5);
                ctx.lineTo(pixel.x + ox - s * 0.3, pixel.y + oy + s * 0.3);
                ctx.lineTo(pixel.x + ox + s * 0.3, pixel.y + oy + s * 0.3);
                ctx.closePath();
                ctx.fill();
            }
            break;
        case 'hills':
            ctx.fillStyle = 'rgba(100,70,30,0.2)';
            ctx.beginPath();
            ctx.arc(pixel.x - s * 0.3, pixel.y + s * 0.1, s * 0.5, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pixel.x + s * 0.3, pixel.y + s * 0.2, s * 0.4, Math.PI, 0);
            ctx.fill();
            break;
        case 'mountain':
            ctx.fillStyle = 'rgba(80,80,90,0.3)';
            ctx.beginPath();
            ctx.moveTo(pixel.x, pixel.y - s * 0.6);
            ctx.lineTo(pixel.x - s * 0.5, pixel.y + s * 0.4);
            ctx.lineTo(pixel.x + s * 0.5, pixel.y + s * 0.4);
            ctx.closePath();
            ctx.fill();
            // Snow cap
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(pixel.x, pixel.y - s * 0.6);
            ctx.lineTo(pixel.x - s * 0.15, pixel.y - s * 0.25);
            ctx.lineTo(pixel.x + s * 0.15, pixel.y - s * 0.25);
            ctx.closePath();
            ctx.fill();
            break;
        case 'lake':
        case 'sea':
            // Water ripples
            ctx.strokeStyle = 'rgba(100,180,255,0.2)';
            ctx.lineWidth = 1;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.arc(pixel.x + i * s * 0.3, pixel.y + i * s * 0.15, s * 0.3, 0, Math.PI);
                ctx.stroke();
            }
            break;
        case 'swamp':
            // Murky dots
            ctx.fillStyle = 'rgba(50,80,40,0.3)';
            for (let i = 0; i < 5; i++) {
                const ox = (Math.random() - 0.5) * s;
                const oy = (Math.random() - 0.5) * s;
                ctx.beginPath();
                ctx.arc(pixel.x + ox, pixel.y + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case 'desert':
            // Sand dunes
            ctx.strokeStyle = 'rgba(180,140,80,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pixel.x - s * 0.5, pixel.y);
            ctx.quadraticCurveTo(pixel.x, pixel.y - s * 0.2, pixel.x + s * 0.5, pixel.y);
            ctx.stroke();
            break;
        case 'wasteland':
            // Cracked ground
            ctx.strokeStyle = 'rgba(60,40,20,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pixel.x - s * 0.3, pixel.y - s * 0.2);
            ctx.lineTo(pixel.x + s * 0.1, pixel.y + s * 0.1);
            ctx.lineTo(pixel.x + s * 0.3, pixel.y - s * 0.1);
            ctx.stroke();
            break;
    }

    ctx.restore();
};

Renderer.drawSiteIcon = function(hex, pixel, size) {
    const siteType = MK.SiteType[hex.site.toUpperCase()] || MK.SiteType[hex.site];
    if (!siteType) return;

    const s = size * 0.5;

    // Draw site background circle
    ctx.save();
    ctx.fillStyle = hex.conquered ? 'rgba(0,100,0,0.6)' : 'rgba(60,40,20,0.7)';
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y - s * 0.3, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hex.conquered ? 'rgba(100,200,100,0.8)' : 'rgba(200,170,100,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw text icon
    ctx.font = `${Math.floor(s * 0.8)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(siteType.icon, pixel.x, pixel.y - s * 0.3);

    // Site name below
    ctx.font = `bold ${Math.max(8, Math.floor(size * 0.18))}px sans-serif`;
    ctx.fillStyle = 'rgba(230,213,184,0.9)';
    ctx.fillText(siteType.name, pixel.x, pixel.y + s * 0.5);

    ctx.restore();
};

Renderer.drawEnemyIndicator = function(hex, pixel, size) {
    const count = hex.enemies.length;
    const s = size * 0.3;

    ctx.save();

    // Enemy type color
    const typeColor = {
        green: '#4a8', red: '#c44', purple: '#84a', brown: '#a84'
    };

    for (let i = 0; i < Math.min(count, 3); i++) {
        const enemy = hex.enemies[i];
        const color = typeColor[enemy.type] || '#888';
        const ox = (i - (count - 1) / 2) * s * 1.2;

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pixel.x + ox, pixel.y + size * 0.35, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Enemy icon
        ctx.font = `${Math.floor(s * 0.6)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(enemy.icon, pixel.x + ox, pixel.y + size * 0.35);
    }

    ctx.restore();
};

Renderer.drawConqueredMarker = function(pixel, size) {
    ctx.save();
    ctx.fillStyle = 'rgba(100,200,100,0.3)';
    ctx.font = `${Math.floor(size * 0.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', pixel.x + size * 0.3, pixel.y - size * 0.3);
    ctx.restore();
};

Renderer.drawHexOverlay = function(pixel, size, fillColor, strokeColor) {
    const corners = MK.Hex.hexCorners(pixel, size - 1);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
};

Renderer.drawHero = function(pos, size, origin) {
    const pixel = MK.Hex.hexToPixel(pos, size, origin);
    const state = MK.State;
    const hero = state.hero;
    if (!hero) return;

    const s = size * 0.4;

    // Hero glow
    const gradient = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, s * 2);
    gradient.addColorStop(0, hero.color + '60');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, s * 2, 0, Math.PI * 2);
    ctx.fill();

    // Hero body
    ctx.save();
    ctx.fillStyle = hero.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hero inner
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hero icon
    ctx.font = `${Math.floor(s * 1.2)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hero.color;
    ctx.fillText(hero.portrait, pixel.x, pixel.y);

    ctx.restore();
};

Renderer.drawUnexploredSlots = function(size, origin) {
    const state = MK.State;
    if (state.tileDeck.length === 0 && state.coreTileDeck.length === 0) return;

    // For each placed tile, check all 6 directions for unexplored neighbors
    for (const tile of state.placedTiles) {
        const adjCenters = MK.Hex.getAdjacentTileCenters(tile.center);
        for (const [dir, center] of Object.entries(adjCenters)) {
            const key = MK.Hex.key(center.q, center.r);
            if (state.revealedTileSlots.has(key)) continue;

            // Draw fog-of-war hexes for this unexplored slot
            const hexPositions = MK.Hex.getTileHexes(center);
            for (const pos of hexPositions) {
                const pixel = MK.Hex.hexToPixel(pos, size, origin);
                if (pixel.x < -size * 2 || pixel.x > canvas.width + size * 2 ||
                    pixel.y < -size * 2 || pixel.y > canvas.height + size * 2) continue;

                const corners = MK.Hex.hexCorners(pixel, size - 1);
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < 6; i++) {
                    ctx.lineTo(corners[i].x, corners[i].y);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(20,20,30,0.6)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(60,60,80,0.3)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Draw "?" in center of unexplored slot
            const centerPixel = MK.Hex.hexToPixel(center, size, origin);
            ctx.font = `bold ${Math.floor(size * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(150,150,180,0.4)';
            ctx.fillText('?', centerPixel.x, centerPixel.y);
        }
    }
};

// ----------------------------------------------------------
// EVENT HANDLERS
// ----------------------------------------------------------
UI.onMouseDown = function(e) {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    cameraStart = { ...MK.State.cameraOffset };
};

UI.onMouseMove = function(e) {
    const state = MK.State;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        state.cameraOffset.x = cameraStart.x + dx;
        state.cameraOffset.y = cameraStart.y + dy;
    }

    // Update hovered hex
    const hex = MK.Hex.pixelToHex(mx, my, state.hexSize, state.cameraOffset);
    const hexData = state.map.get(MK.Hex.key(hex.q, hex.r));
    state.hoveredHex = hexData ? hex : null;

    // Update tooltip
    UI.updateTooltip(hexData, e.clientX, e.clientY);
};

UI.onMouseUp = function(e) {
    const dx = Math.abs(e.clientX - dragStart.x);
    const dy = Math.abs(e.clientY - dragStart.y);
    wasDragging = (dx > 5 || dy > 5);
    isDragging = false;
};

UI.onMapClick = function(e) {
    if (wasDragging) {
        wasDragging = false;
        return;
    }

    const state = MK.State;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hex = MK.Hex.pixelToHex(mx, my, state.hexSize, state.cameraOffset);
    const hexData = state.map.get(MK.Hex.key(hex.q, hex.r));

    if (!hexData) return;

    if (state.phase === 'playing' && state.movePoints > 0) {
        // Try to move there
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
    if (!hexData) {
        tooltip.style.display = 'none';
        return;
    }

    const terrain = MK.Terrain[hexData.terrain];
    const state = MK.State;
    const cost = terrain ? (state.isDay ? terrain.moveCost.day : terrain.moveCost.night) : '?';

    let html = `<strong>${terrain ? terrain.name : hexData.terrain}</strong>`;
    html += `<br>Move cost: ${cost >= 999 ? 'Impassable' : cost}`;

    if (hexData.site) {
        const siteType = MK.SiteType[hexData.site.toUpperCase()] || MK.SiteType[hexData.site];
        if (siteType) {
            html += `<br><span class="tooltip-site">${siteType.icon} ${siteType.name}</span>`;
            html += `<br><em>${siteType.description}</em>`;
        }
    }

    if (hexData.enemies && hexData.enemies.length > 0 && !hexData.conquered) {
        html += '<br><span class="tooltip-enemies">Enemies:</span>';
        for (const e of hexData.enemies) {
            html += `<br>  ${e.icon} ${e.name} (Atk:${e.attack} Arm:${e.armor})`;
        }
    }

    if (hexData.conquered) {
        html += '<br><span class="tooltip-conquered">✓ Conquered</span>';
    }

    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (mx + 15) + 'px';
    tooltip.style.top = (my + 15) + 'px';
};

// ----------------------------------------------------------
// UI PANEL UPDATES
// ----------------------------------------------------------
// Track last phase to avoid redundant overlay redraws
let lastOverlayPhase = null;
let needsFullRedraw = true;
let lastStateHash = '';

UI.markDirty = function() {
    needsFullRedraw = true;
};

UI.updateAll = function() {
    const state = MK.State;

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
        // Force reflow so clientWidth/Height are available immediately
        void gameArea.offsetHeight;
        needsFullRedraw = true;
    }

    // Ensure canvas is properly sized
    const container = canvas.parentElement;
    if (container) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw > 0 && ch > 0 && (canvas.width !== cw || canvas.height !== ch)) {
            canvas.width = cw;
            canvas.height = ch;
        }
    }
    // Center camera if it hasn't been initialized
    if (canvas.width > 0 && state.cameraOffset.x === 0 && state.cameraOffset.y === 0) {
        UI.centerCamera();
    }

    // Always redraw the map (canvas)
    if (canvas.width > 0 && canvas.height > 0) {
        Renderer.drawMap();
    }

    // Compute a simple state hash to determine if DOM needs updating
    const hash = `${state.phase}|${state.hand.length}|${state.selectedCard}|${state.movePoints}|${state.attackPoints}|${state.blockPoints}|${state.influencePoints}|${state.rangedAttackPoints}|${state.fame}|${state.wounds}|${state.manaTokens.length}|${state.manaSource.length}|${state.round}|${state.isDay}|${state.combat ? state.combat.phase : ''}|${state.units.length}|${state.log.length}|${JSON.stringify(state.crystals)}|${state.interacting ? state.interacting.type : ''}`;

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
};

UI.showTitleScreen = function() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="title-screen">
            <div class="title-logo">
                <div class="title-icon">⚔️</div>
                <h1>MAGE KNIGHT</h1>
                <div class="title-subtitle">The Digital Board Game</div>
            </div>
            <div class="title-divider"></div>
            <button class="btn btn-primary btn-large" onclick="MK.UI.startHeroSelect()">
                Begin Quest
            </button>
            <div class="title-footer">
                <p>A digital adaptation of Vlaada Chvátil's board game</p>
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
        heroCards += `
            <div class="hero-card" onclick="MK.UI.selectHero('${id}')" style="--hero-color: ${hero.color}">
                <div class="hero-portrait">${hero.portrait}</div>
                <h3>${hero.name}</h3>
                <div class="hero-title">${hero.title}</div>
                <p class="hero-desc">${hero.description}</p>
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

    let scenarioCards = '';
    for (const [id, scenario] of Object.entries(MK.Scenarios)) {
        scenarioCards += `
            <div class="scenario-card" onclick="MK.UI.selectScenario('${id}')">
                <h3>${scenario.name}</h3>
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
    // Camera centering happens in updateAll when game-area becomes visible
};

UI.updateHeroPanel = function() {
    const state = MK.State;
    const hero = state.hero;
    if (!hero) return;

    const panel = document.getElementById('hero-panel');
    const levelInfo = MK.FameLevels[state.level - 1] || MK.FameLevels[0];
    const nextLevel = MK.FameLevels[state.level] || null;
    const fameToNext = nextLevel ? nextLevel.fame - state.fame : 0;

    let unitsHtml = '';
    for (const unit of state.units) {
        unitsHtml += `
            <div class="unit-badge ${unit.wounded ? 'unit-wounded' : ''}">
                <span class="unit-icon">${unit.icon}</span>
                <span class="unit-name">${unit.name}</span>
                ${unit.wounded ? '<span class="unit-status">⚠ Wounded</span>' : ''}
            </div>
        `;
    }

    let crystalsHtml = '';
    for (const [color, count] of Object.entries(state.crystals)) {
        if (count > 0) {
            crystalsHtml += `<span class="crystal crystal-${color}">${count}</span>`;
        }
    }

    let skillsHtml = '';
    for (const skill of state.skills) {
        skillsHtml += `<div class="skill-badge" title="${skill.description}">${skill.name}</div>`;
    }

    panel.innerHTML = `
        <div class="hero-header" style="border-color: ${hero.color}">
            <span class="hero-portrait-small">${hero.portrait}</span>
            <div>
                <div class="hero-name">${hero.name}</div>
                <div class="hero-level">Level ${state.level}</div>
            </div>
        </div>

        ${nextLevel ? `<div class="fame-bar"><div class="fame-fill" style="width: ${Math.min(100, (state.fame / nextLevel.fame) * 100)}%"></div><span class="fame-text">Fame: ${state.fame} / ${nextLevel.fame}</span></div>` : `<div class="fame-bar"><div class="fame-fill" style="width: 100%"></div><span class="fame-text">Fame: ${state.fame} (MAX)</span></div>`}

        <div class="stat-grid">
            <div class="stat">
                <span class="stat-label">Fame</span>
                <span class="stat-value">${state.fame}${nextLevel ? ` / ${nextLevel.fame}` : ''}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Armor</span>
                <span class="stat-value">${state.armor}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Reputation</span>
                <span class="stat-value">${state.reputation}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Wounds</span>
                <span class="stat-value ${state.wounds > 0 ? 'stat-danger' : ''}">${state.wounds}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Hand</span>
                <span class="stat-value">${state.hand.length} / ${state.handLimit}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Deck</span>
                <span class="stat-value">${state.deck.length}</span>
            </div>
        </div>

        <div class="section-label">Crystals</div>
        <div class="crystals-row">${crystalsHtml || '<span class="text-dim">None</span>'}</div>

        <div class="section-label">Units (${state.units.length}/3)</div>
        <div class="units-list">${unitsHtml || '<span class="text-dim">None recruited</span>'}</div>

        ${skillsHtml ? `<div class="section-label">Skills</div><div class="skills-list">${skillsHtml}</div>` : ''}
    `;
};

UI.updateHand = function() {
    const state = MK.State;
    const handEl = document.getElementById('hand-cards');

    let html = '';
    for (let i = 0; i < state.hand.length; i++) {
        const card = state.hand[i];
        const isWound = card.type === 'wound';
        const colorClass = isWound ? 'wound' : card.color;
        const isSelected = state.selectedCard === i;

        html += `
            <div class="card ${isSelected ? 'card-selected' : ''} card-${colorClass}"
                 onclick="MK.UI.selectCard(${i})"
                 oncontextmenu="MK.UI.showCardDetail(${i}); return false;">
                <div class="card-header">
                    <span class="card-name">${card.name}</span>
                    ${!isWound ? `<span class="card-mana-dot mana-${card.color}"></span>` : ''}
                </div>
                <div class="card-body">
                    <div class="card-basic">${card.basicDesc || ''}</div>
                    ${card.poweredDesc ? `<div class="card-divider"></div><div class="card-powered">${card.poweredDesc}</div>` : ''}
                </div>
                <div class="card-footer">${card.type}</div>
            </div>
        `;
    }

    handEl.innerHTML = html;

    // Show play options if card is selected
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
    if (state.selectedCard === index) {
        state.selectedCard = null;
    } else {
        state.selectedCard = index;
    }
};

UI.playCard = function(mode) {
    const state = MK.State;
    if (state.selectedCard === null) return;

    const success = MK.Engine.playCard(state.selectedCard, mode);
    if (success) {
        state.selectedCard = null;
    }
};

UI.showCardDetail = function(index) {
    // Future: show full card detail popup
};

UI.updateRightPanel = function() {
    const state = MK.State;

    // Round info
    const roundEl = document.getElementById('round-info');
    const timeIcon = state.isDay ? '☀️' : '🌙';
    const timeText = state.isDay ? 'Day' : 'Night';
    roundEl.innerHTML = `
        <div class="round-display">
            <span class="round-time">${timeIcon} ${timeText}</span>
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

    // Mana tokens
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

UI.updateActionBar = function() {
    const state = MK.State;
    const bar = document.getElementById('action-bar');

    if (state.phase === 'combat') {
        bar.innerHTML = `
            <div class="action-bar-combat">
                <span class="combat-phase-label">Combat: ${state.combat.phase.toUpperCase()}</span>
                <button class="btn btn-small btn-action" onclick="MK.UI.advanceCombatPhase()">
                    ${state.combat.phase === 'attack' ? 'Resolve Combat' : 'Next Phase →'}
                </button>
                <button class="btn btn-small btn-danger" onclick="MK.Engine.fleeCombat()">Flee</button>
            </div>
        `;
    } else if (state.phase === 'playing') {
        const hasInteraction = state.interacting !== null;
        bar.innerHTML = `
            <div class="action-bar-playing">
                <button class="btn btn-small btn-action" onclick="MK.Engine.endTurn()">End Turn</button>
                <button class="btn btn-tiny" onclick="MK.UI.centerCamera(true)" title="Center camera on hero (C)">📍 Center</button>
                ${hasInteraction ? UI.getInteractionButtons() : ''}
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
        case 'village':
            let unitBtns = '';
            for (const unit of state.unitOffer) {
                unitBtns += `<button class="btn btn-tiny" onclick="MK.Engine.recruitUnit('${unit.id}')"
                    title="Cost: ${unit.cost} influence">${unit.icon} ${unit.name} (${unit.cost})</button>`;
            }
            return `
                <div class="interaction-panel">
                    <span class="interaction-label">🏘️ Village</span>
                    <button class="btn btn-tiny" onclick="MK.Engine.healAtVillage()">Heal (3 inf)</button>
                    ${unitBtns}
                </div>
            `;
        case 'monastery':
            return `
                <div class="interaction-panel">
                    <span class="interaction-label">⛪ Monastery</span>
                    <button class="btn btn-tiny" onclick="MK.UI.monasteryBurn()">Burn mana for effect</button>
                </div>
            `;
        default:
            return '';
    }
};

UI.monasteryBurn = function() {
    // Simplified monastery: spend any mana to gain 2 influence
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
        // Apply ranged attacks to enemies
        if (state.rangedAttackPoints > 0) {
            // Auto-apply to first non-defeated, non-fortified enemy
            for (let i = 0; i < state.combat.enemies.length; i++) {
                const enemy = state.combat.enemies[i];
                if (!enemy.defeated && !enemy.abilities.includes('fortified')) {
                    MK.Engine.applyRangedAttack(i);
                    break;
                }
            }
        }
        MK.Engine.advanceCombatPhase();
    } else if (state.combat.phase === 'block') {
        MK.Engine.advanceCombatPhase();
    } else if (state.combat.phase === 'attack') {
        // Apply melee attacks
        if (state.attackPoints > 0) {
            for (let i = 0; i < state.combat.enemies.length; i++) {
                const enemy = state.combat.enemies[i];
                if (!enemy.defeated) {
                    MK.Engine.applyMeleeAttack(i);
                    break;
                }
            }
        }
        MK.Engine.advanceCombatPhase();
    }
};

UI.updateCombatPanel = function() {
    const state = MK.State;
    const panel = document.getElementById('combat-panel');

    if (state.phase !== 'combat' || !state.combat) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    let enemiesHtml = '';
    for (let i = 0; i < state.combat.enemies.length; i++) {
        const enemy = state.combat.enemies[i];
        const typeColor = { green: '#4a8', red: '#c44', purple: '#84a', brown: '#a84' };
        enemiesHtml += `
            <div class="combat-enemy ${enemy.defeated ? 'enemy-defeated' : ''}"
                 style="border-color: ${typeColor[enemy.type] || '#888'}"
                 onclick="MK.UI.targetEnemy(${i})">
                <div class="enemy-icon">${enemy.icon}</div>
                <div class="enemy-name">${enemy.name}</div>
                <div class="enemy-stats">
                    <span class="enemy-attack">⚔️ ${enemy.attack}</span>
                    <span class="enemy-armor">🛡️ ${enemy.currentArmor}</span>
                </div>
                <div class="enemy-abilities">${enemy.abilities.join(', ') || 'none'}</div>
                ${enemy.defeated ? '<div class="enemy-status">DEFEATED</div>' : ''}
            </div>
        `;
    }

    const phase = state.combat.phase;
    let phaseHelp = '';
    switch (phase) {
        case 'ranged': phaseHelp = 'Play cards for ranged attacks, then advance.'; break;
        case 'block': phaseHelp = 'Play cards to block enemy attacks, then advance.'; break;
        case 'damage': phaseHelp = 'Damage is being assigned...'; break;
        case 'attack': phaseHelp = 'Play cards for melee attacks, then resolve.'; break;
    }

    panel.innerHTML = `
        <div class="combat-header">
            <h3>⚔️ COMBAT</h3>
            <span class="combat-phase">Phase: ${phase.toUpperCase()}</span>
        </div>
        <div class="combat-help">${phaseHelp}</div>
        <div class="combat-enemies">${enemiesHtml}</div>
        <div class="combat-totals">
            ${state.rangedAttackPoints > 0 ? `<span>Ranged: ${state.rangedAttackPoints}</span>` : ''}
            ${state.blockPoints > 0 ? `<span>Block: ${state.blockPoints}</span>` : ''}
            ${state.attackPoints > 0 ? `<span>Attack: ${state.attackPoints}</span>` : ''}
        </div>
    `;
};

UI.targetEnemy = function(index) {
    const state = MK.State;
    if (!state.combat) return;

    if (state.combat.phase === 'ranged' && state.rangedAttackPoints > 0) {
        MK.Engine.applyRangedAttack(index);
    } else if (state.combat.phase === 'attack' && state.attackPoints > 0) {
        MK.Engine.applyMeleeAttack(index);
    }
};

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

UI.showGameOver = function() {
    const state = MK.State;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    const won = MK.Engine.checkWinCondition();
    const heroName = state.hero ? `${state.hero.name} ${state.hero.title}` : 'Unknown';
    const maxRounds = state.scenario ? state.scenario.rounds : '?';

    overlay.innerHTML = `
        <div class="game-over-screen">
            <h2>${won ? '🏆 VICTORY!' : '💀 DEFEAT'}</h2>
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

// ----------------------------------------------------------
// GAME LOOP
// ----------------------------------------------------------
UI.gameLoop = function() {
    UI.updateAll();
    requestAnimationFrame(UI.gameLoop);
};

MK.UI = UI;
MK.Renderer = Renderer;

})();
