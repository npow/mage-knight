// ============================================================
// MAGE KNIGHT - HEX MATH UTILITIES
// Axial coordinate system for flat-top hexagons.
// q-axis points right, r-axis points down-right.
// ============================================================

(function() {
    const Hex = {};

    // --- Constants ---
    Hex.DIRECTIONS = [
        { q: 1, r: 0 },   // E
        { q: 1, r: -1 },  // NE
        { q: 0, r: -1 },  // NW (for flat-top, this is up-left)
        { q: -1, r: 0 },  // W
        { q: -1, r: 1 },  // SW
        { q: 0, r: 1 }    // SE
    ];

    // --- Coordinate Functions ---
    Hex.key = function(q, r) {
        return `${q},${r}`;
    };

    Hex.fromKey = function(key) {
        const [q, r] = key.split(',').map(Number);
        return { q, r };
    };

    Hex.equals = function(a, b) {
        return a.q === b.q && a.r === b.r;
    };

    Hex.add = function(a, b) {
        return { q: a.q + b.q, r: a.r + b.r };
    };

    Hex.subtract = function(a, b) {
        return { q: a.q - b.q, r: a.r - b.r };
    };

    Hex.scale = function(h, k) {
        return { q: h.q * k, r: h.r * k };
    };

    // Cube distance (used for hex distance)
    Hex.distance = function(a, b) {
        const dq = Math.abs(a.q - b.q);
        const dr = Math.abs(a.r - b.r);
        const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
        return Math.max(dq, dr, ds);
    };

    Hex.neighbors = function(h) {
        return Hex.DIRECTIONS.map(d => Hex.add(h, d));
    };

    Hex.neighbor = function(h, direction) {
        return Hex.add(h, Hex.DIRECTIONS[direction]);
    };

    // --- Pixel Conversion (Flat-Top Hexagons) ---
    // size = distance from center to corner
    Hex.hexToPixel = function(h, size, origin) {
        const x = size * (3/2 * h.q);
        const y = size * (Math.sqrt(3)/2 * h.q + Math.sqrt(3) * h.r);
        return {
            x: x + (origin ? origin.x : 0),
            y: y + (origin ? origin.y : 0)
        };
    };

    Hex.pixelToHex = function(px, py, size, origin) {
        const x = px - (origin ? origin.x : 0);
        const y = py - (origin ? origin.y : 0);
        const q = (2/3 * x) / size;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
        return Hex.hexRound(q, r);
    };

    Hex.hexRound = function(q, r) {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const dq = Math.abs(rq - q);
        const dr = Math.abs(rr - r);
        const ds = Math.abs(rs - s);

        if (dq > dr && dq > ds) {
            rq = -rr - rs;
        } else if (dr > ds) {
            rr = -rq - rs;
        }
        // else rs would be adjusted, but we don't need s

        return { q: rq, r: rr };
    };

    // --- Hex Corner Points (for drawing) ---
    // Returns the 6 corner points of a flat-top hex
    Hex.hexCorners = function(center, size) {
        const corners = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i);
            corners.push({
                x: center.x + size * Math.cos(angle),
                y: center.y + size * Math.sin(angle)
            });
        }
        return corners;
    };

    // --- Range / Area Functions ---
    Hex.ring = function(center, radius) {
        if (radius === 0) return [center];
        const results = [];
        let h = Hex.add(center, Hex.scale(Hex.DIRECTIONS[4], radius)); // start at SW * radius
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < radius; j++) {
                results.push(h);
                h = Hex.neighbor(h, i);
            }
        }
        return results;
    };

    Hex.spiral = function(center, radius) {
        const results = [center];
        for (let r = 1; r <= radius; r++) {
            results.push(...Hex.ring(center, r));
        }
        return results;
    };

    // Line between two hexes
    Hex.line = function(a, b) {
        const dist = Hex.distance(a, b);
        if (dist === 0) return [a];
        const results = [];
        for (let i = 0; i <= dist; i++) {
            const t = i / dist;
            const q = a.q + (b.q - a.q) * t;
            const r = a.r + (b.r - a.r) * t;
            results.push(Hex.hexRound(q, r));
        }
        return results;
    };

    // Check if two hexes are neighbors
    Hex.areNeighbors = function(a, b) {
        return Hex.distance(a, b) === 1;
    };

    // Get tile hex positions from tile center
    Hex.getTileHexes = function(tileCenter) {
        return MK.TileHexOffsets.map(offset => Hex.add(tileCenter, offset));
    };

    // Get adjacent tile center positions from a tile center
    Hex.getAdjacentTileCenters = function(tileCenter) {
        const result = {};
        for (const [dir, offset] of Object.entries(MK.TileNeighborOffsets)) {
            result[dir] = Hex.add(tileCenter, offset);
        }
        return result;
    };

    // Find which tile edge a hex is on (returns direction or null if center)
    Hex.getTileEdge = function(hexPos, tileCenter) {
        const rel = Hex.subtract(hexPos, tileCenter);
        // Center hex
        if (rel.q === 0 && rel.r === 0) return null;
        // Map relative position to edge direction
        if (rel.q === 1 && rel.r === 0) return 'E_SE';    // E hex, on E and SE edges
        if (rel.q === 1 && rel.r === -1) return 'E_NE';   // NE hex, on E and NE edges
        if (rel.q === 0 && rel.r === -1) return 'NE_NW';  // NW hex (top), on NE and NW edges
        if (rel.q === -1 && rel.r === 0) return 'NW_W';   // W hex, on NW and W edges
        if (rel.q === -1 && rel.r === 1) return 'W_SW';   // SW hex, on W and SW edges
        if (rel.q === 0 && rel.r === 1) return 'SW_SE';   // SE hex, on SW and SE edges
        return null;
    };

    // Get the directions where exploring could reveal new tiles from a hex position
    Hex.getExploreDirections = function(hexPos, tileCenter) {
        const edge = Hex.getTileEdge(hexPos, tileCenter);
        if (!edge) return []; // center hex, no exploration

        const dirMap = {
            'E_SE': ['E', 'SE'],
            'E_NE': ['E', 'NE'],
            'NE_NW': ['NE', 'NW'],
            'NW_W': ['NW', 'W'],
            'W_SW': ['W', 'SW'],
            'SW_SE': ['SW', 'SE']
        };
        return dirMap[edge] || [];
    };

    MK.Hex = Hex;
})();
