// ============================================================
// MAGE KNIGHT - GAME ENGINE
// Core game logic: state management, map, cards, combat, mana
// ============================================================

(function() {

// ----------------------------------------------------------
// GAME STATE
// ----------------------------------------------------------
const State = {
    phase: 'title', // title, hero_select, scenario_select, playing, combat, level_up, end_round, game_over
    scenario: null,
    round: 1,
    isDay: true,

    // Map
    map: new Map(),           // key -> { q, r, terrain, site, tileId, enemies[], conquered, explored }
    placedTiles: [],          // { id, center: {q,r}, tileData }
    tileDeck: [],             // remaining face-down tiles
    coreTileDeck: [],
    revealedTileSlots: new Set(), // tile center keys that have been explored

    // Hero
    hero: null,
    heroId: null,
    position: { q: 0, r: 0 },
    fame: 0,
    level: 1,
    reputation: 0,
    armor: 2,
    handLimit: 5,
    hand: [],
    deck: [],
    discard: [],
    playArea: [],         // cards played this turn (not yet discarded)
    skills: [],
    units: [],
    crystals: { red: 0, blue: 0, green: 0, white: 0, gold: 0 },
    wounds: 0,

    // Mana source
    manaSource: [],       // dice in the source (available to take)
    manaDieCount: 0,      // total dice in the game
    manaTokens: [],       // mana tokens hero currently has

    // Turn state
    movePoints: 0,
    attackPoints: 0,
    blockPoints: 0,
    influencePoints: 0,
    healPoints: 0,
    rangedAttackPoints: 0,
    turnActions: [],
    selectedCard: null,
    selectedHex: null,
    cardsPlayedThisTurn: 0,

    // Combat state
    combat: null,

    // Interaction state
    interacting: null,    // site being interacted with

    // UI state
    showCardDetail: null,
    hoveredHex: null,
    cameraOffset: { x: 0, y: 0 },
    hexSize: 48,
    log: [],
    animating: false,

    // Offers (for recruitment and advanced actions)
    unitOffer: [],
    advancedActionOffer: [],
    spellOffer: [],

    // Conquered sites
    conqueredSites: new Set()
};

// ----------------------------------------------------------
// STATE MANAGEMENT
// ----------------------------------------------------------
const Engine = {};

Engine.getState = function() {
    return State;
};

Engine.log = function(msg, type = 'info') {
    State.log.unshift({ msg, type, time: Date.now() });
    if (State.log.length > 100) State.log.pop();
};

// ----------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------
Engine.initGame = function(heroId, scenarioId) {
    const hero = MK.Heroes[heroId];
    const scenario = MK.Scenarios[scenarioId];
    if (!hero || !scenario) return;

    // Reset state
    Object.assign(State, {
        phase: 'playing',
        scenario: scenario,
        round: 1,
        isDay: true,
        map: new Map(),
        placedTiles: [],
        tileDeck: [],
        coreTileDeck: [],
        revealedTileSlots: new Set(),
        hero: hero,
        heroId: heroId,
        position: { q: 0, r: 0 },
        fame: 0,
        level: 1,
        reputation: heroId === 'norowas' ? 1 : 0,
        armor: hero.startingArmor,
        handLimit: hero.startingHandLimit,
        hand: [],
        deck: [],
        discard: [],
        playArea: [],
        skills: [],
        units: [],
        crystals: { red: 0, blue: 0, green: 0, white: 0, gold: 0 },
        wounds: 0,
        manaSource: [],
        manaDieCount: 0,
        manaTokens: [],
        movePoints: 0,
        attackPoints: 0,
        blockPoints: 0,
        influencePoints: 0,
        healPoints: 0,
        rangedAttackPoints: 0,
        turnActions: [],
        selectedCard: null,
        selectedHex: null,
        cardsPlayedThisTurn: 0,
        combat: null,
        interacting: null,
        showCardDetail: null,
        hoveredHex: null,
        log: [],
        animating: false,
        unitOffer: [],
        advancedActionOffer: [],
        spellOffer: [],
        conqueredSites: new Set()
    });

    // Goldyx bonus
    if (heroId === 'goldyx') {
        State.crystals.gold += 1;
    }

    // Build deck from hero's starting cards
    Engine.buildDeck(hero.startingDeck);

    // Setup map tiles
    Engine.setupTileDeck(scenario);

    // Place starting tile
    Engine.placeTile(MK.StartTile, { q: 0, r: 0 });

    // Setup mana source
    Engine.setupManaSource();

    // Draw opening hand
    Engine.drawHand();

    // Setup offers
    Engine.refreshOffers();

    Engine.log(`${hero.name} ${hero.title} begins the quest!`, 'system');
    Engine.log(`Scenario: ${scenario.name}`, 'system');
    Engine.log(`Round 1 - Day`, 'system');
};

Engine.buildDeck = function(cardIds) {
    State.deck = [];
    for (const id of cardIds) {
        const card = MK.BasicActions[id];
        if (card) {
            State.deck.push({ ...card, instanceId: Engine.generateId() });
        }
    }
    Engine.shuffleArray(State.deck);
};

Engine.setupTileDeck = function(scenario) {
    // Shuffle countryside tiles
    const countryside = [...MK.CountrysideTiles];
    Engine.shuffleArray(countryside);
    State.tileDeck = countryside.slice(0, scenario.countrysideTiles);

    // Shuffle core tiles
    const core = [...MK.CoreTiles];
    Engine.shuffleArray(core);
    State.coreTileDeck = core.slice(0, scenario.coreTiles);
};

Engine.setupManaSource = function() {
    // Create mana dice: 2 of each basic color + 1 gold
    const colors = ['red', 'blue', 'green', 'white', 'red', 'blue', 'green', 'white', 'gold'];
    State.manaSource = [];
    for (const color of colors) {
        State.manaSource.push(color);
    }
    Engine.shuffleArray(State.manaSource);
    State.manaDieCount = State.manaSource.length;
    // Roll initial dice - take first N as "available"
    Engine.rollManaSource();
};

Engine.rollManaSource = function() {
    // In MK, mana source has dice equal to 2x players + 2. For solo, that's 4 dice visible.
    // Re-roll all dice
    const allDice = ['red', 'blue', 'green', 'white', 'red', 'blue', 'green', 'white', 'gold'];
    Engine.shuffleArray(allDice);
    State.manaSource = allDice.slice(0, 4); // 4 visible dice for solo

    // Gold die shows gold during day, black during night
    State.manaSource = State.manaSource.map(c => {
        if (c === 'gold') return State.isDay ? 'gold' : 'black';
        return c;
    });
};

// ----------------------------------------------------------
// MAP MANAGEMENT
// ----------------------------------------------------------
Engine.placeTile = function(tileData, center) {
    const hexPositions = MK.Hex.getTileHexes(center);
    const tileRecord = {
        id: tileData.id,
        center: { ...center },
        tileData: tileData
    };

    for (let i = 0; i < 7; i++) {
        const pos = hexPositions[i];
        const hexInfo = tileData.hexes[i];
        const key = MK.Hex.key(pos.q, pos.r);

        const hexData = {
            q: pos.q,
            r: pos.r,
            terrain: hexInfo.terrain,
            site: hexInfo.site || null,
            tileId: tileData.id,
            tileCenter: { ...center },
            enemies: [],
            conquered: false,
            explored: true,
            visible: true
        };

        // Spawn enemies at certain sites
        if (hexInfo.site) {
            hexData.enemies = Engine.spawnEnemies(hexInfo.site);
        }

        State.map.set(key, hexData);
    }

    State.placedTiles.push(tileRecord);
    State.revealedTileSlots.add(MK.Hex.key(center.q, center.r));

    Engine.log(`Tile ${tileData.id} placed.`, 'map');
};

Engine.spawnEnemies = function(siteType) {
    const pools = {
        keep: () => Engine.pickRandomEnemies(MK.EnemyPools.keep, 1),
        dungeon: () => Engine.pickRandomEnemies(MK.EnemyPools.dungeon, 1),
        tomb: () => Engine.pickRandomEnemies(MK.EnemyPools.tomb, 1),
        mage_tower: () => Engine.pickRandomEnemies(MK.EnemyPools.mage_tower, 1),
        spawning_grounds: () => Engine.pickRandomEnemies(MK.EnemyPools.spawning_grounds, 2),
        ancient_ruins: () => Engine.pickRandomEnemies(MK.EnemyPools.ancient_ruins, 1),
        draconum_lair: () => Engine.pickRandomEnemies(MK.EnemyPools.draconum_lair, 1),
        city_green: () => Engine.pickRandomEnemies(MK.EnemyPools.city, 3),
        city_blue: () => Engine.pickRandomEnemies(MK.EnemyPools.city, 3),
        city_red: () => Engine.pickRandomEnemies(MK.EnemyPools.city, 3),
        city_white: () => Engine.pickRandomEnemies(MK.EnemyPools.city, 3),
        monastery: () => [],
        village: () => [],
        mine_red: () => [],
        mine_blue: () => [],
        mine_green: () => [],
        mine_white: () => [],
        magical_glade: () => []
    };

    const spawner = pools[siteType];
    return spawner ? spawner() : [];
};

Engine.pickRandomEnemies = function(pool, count) {
    const enemies = [];
    for (let i = 0; i < count; i++) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        const enemy = MK.Enemies[id];
        if (enemy) {
            enemies.push({ ...enemy, instanceId: Engine.generateId(), currentArmor: enemy.armor });
        }
    }
    return enemies;
};

Engine.canExplore = function(fromHex) {
    const hexData = State.map.get(MK.Hex.key(fromHex.q, fromHex.r));
    if (!hexData) return [];

    const tileCenter = hexData.tileCenter;
    const exploreDirections = MK.Hex.getExploreDirections(fromHex, tileCenter);
    const possibleExplorations = [];

    for (const dir of exploreDirections) {
        const offset = MK.TileNeighborOffsets[dir];
        const newCenter = MK.Hex.add(tileCenter, offset);
        const key = MK.Hex.key(newCenter.q, newCenter.r);

        if (!State.revealedTileSlots.has(key)) {
            possibleExplorations.push({ direction: dir, center: newCenter });
        }
    }

    return possibleExplorations;
};

Engine.exploreTile = function(center) {
    let tileData;

    // Check if we need a core tile (placed after countryside)
    if (State.tileDeck.length > 0) {
        tileData = State.tileDeck.shift();
    } else if (State.coreTileDeck.length > 0) {
        tileData = State.coreTileDeck.shift();
    }

    if (tileData) {
        Engine.placeTile(tileData, center);
        Engine.log(`Explored new territory: ${tileData.name}`, 'map');
        return true;
    }

    Engine.log('No more tiles to explore.', 'warning');
    return false;
};

Engine.getHex = function(q, r) {
    return State.map.get(MK.Hex.key(q, r));
};

Engine.getMoveCost = function(fromHex, toHex) {
    const to = Engine.getHex(toHex.q, toHex.r);
    if (!to) return 999;
    if (!to.visible) return 999;

    const terrain = MK.Terrain[to.terrain];
    if (!terrain) return 999;

    const cost = State.isDay ? terrain.moveCost.day : terrain.moveCost.night;

    return cost;
};

Engine.getReachableHexes = function(movePoints) {
    if (movePoints <= 0) return new Map();

    const reachable = new Map(); // hex key -> remaining move points
    const visited = new Set();
    const queue = [{ hex: State.position, remaining: movePoints }];

    visited.add(MK.Hex.key(State.position.q, State.position.r));

    while (queue.length > 0) {
        const { hex, remaining } = queue.shift();

        const neighbors = MK.Hex.neighbors(hex);
        for (const n of neighbors) {
            const key = MK.Hex.key(n.q, n.r);
            const hexData = State.map.get(key);

            // Can't move to unexplored or impassable hexes
            if (!hexData || !hexData.visible) continue;

            const cost = Engine.getMoveCost(hex, n);
            if (cost > remaining) continue;

            // Can't move through enemy-occupied hexes (unless safe move)
            if (hexData.enemies.length > 0 && !MK.Hex.equals(n, State.position)) {
                // Can move INTO enemy hex (to fight) but not THROUGH
                const newRemaining = remaining - cost;
                const existingRemaining = reachable.get(key);
                if (existingRemaining === undefined || newRemaining > existingRemaining) {
                    reachable.set(key, newRemaining);
                }
                continue; // Don't continue pathfinding through enemies
            }

            const newRemaining = remaining - cost;
            const existingRemaining = reachable.get(key);
            if (existingRemaining === undefined || newRemaining > existingRemaining) {
                reachable.set(key, newRemaining);
                if (!visited.has(key) || newRemaining > (existingRemaining || 0)) {
                    visited.add(key);
                    queue.push({ hex: n, remaining: newRemaining });
                }
            }
        }
    }

    // Remove current position
    reachable.delete(MK.Hex.key(State.position.q, State.position.r));
    return reachable;
};

// ----------------------------------------------------------
// CARD MANAGEMENT
// ----------------------------------------------------------
Engine.drawCard = function() {
    if (State.deck.length === 0) {
        if (State.discard.length === 0) return null;
        // Reshuffle discard into deck
        State.deck = [...State.discard];
        State.discard = [];
        Engine.shuffleArray(State.deck);
        Engine.log('Deck reshuffled from discard pile.', 'system');
    }

    const card = State.deck.pop();
    if (card) {
        State.hand.push(card);
    }
    return card;
};

Engine.drawHand = function() {
    const toDraw = State.handLimit - State.hand.length;
    for (let i = 0; i < toDraw; i++) {
        if (!Engine.drawCard()) break;
    }
};

Engine.playCard = function(cardIndex, mode) {
    if (cardIndex < 0 || cardIndex >= State.hand.length) return false;

    const card = State.hand[cardIndex];
    if (!card) return false;

    // Wound cards can't be played normally
    if (card.type === 'wound') {
        Engine.log("Wounds can't be played!", 'warning');
        return false;
    }

    // mode: 'basic', 'powered', 'sideways_move', 'sideways_attack', 'sideways_block', 'sideways_influence'
    let effect;
    let manaUsed = null;

    if (mode === 'basic') {
        // Spells require mana even for basic effect
        if (card.type === 'spell' && card.manaCost) {
            if (!Engine.canUseMana(card.manaCost)) {
                Engine.log(`Need ${card.manaCost} mana to cast ${card.name}!`, 'warning');
                return false;
            }
            Engine.useMana(card.manaCost);
            manaUsed = card.manaCost;
        }
        effect = card.basicEffect;
    } else if (mode === 'powered') {
        // Check for mana - spells need mana for basic + extra for powered
        const manaColor = card.color;
        if (card.type === 'spell' && card.manaCost) {
            // Spell powered: needs base mana cost + card color mana
            if (!Engine.canUseMana(card.manaCost)) {
                Engine.log(`Need ${card.manaCost} mana to cast ${card.name}!`, 'warning');
                return false;
            }
            Engine.useMana(card.manaCost);
        }
        if (!Engine.canUseMana(manaColor)) {
            Engine.log(`Need ${manaColor} mana to power this card!`, 'warning');
            return false;
        }
        Engine.useMana(manaColor);
        manaUsed = manaColor;
        effect = card.poweredEffect;
    } else if (mode.startsWith('sideways_')) {
        const type = mode.replace('sideways_', '');
        effect = { type: type, value: 1 };
    } else {
        return false;
    }

    // Apply the effect
    Engine.applyCardEffect(effect, card);

    // Move card from hand to play area
    State.hand.splice(cardIndex, 1);
    State.playArea.push(card);
    State.cardsPlayedThisTurn++;

    const desc = mode === 'basic' ? card.basicDesc :
                 mode === 'powered' ? card.poweredDesc :
                 `${mode.replace('sideways_', '')} 1`;
    Engine.log(`Played ${card.name}: ${desc}`, 'action');

    return true;
};

Engine.applyCardEffect = function(effect, card) {
    if (!effect) return;

    switch (effect.type) {
        case 'move':
            State.movePoints += effect.value;
            break;
        case 'attack':
            State.attackPoints += effect.value;
            break;
        case 'ranged_attack':
            State.rangedAttackPoints += effect.value;
            break;
        case 'block':
            State.blockPoints += effect.value;
            break;
        case 'influence':
            State.influencePoints += effect.value;
            break;
        case 'heal':
            Engine.heal(effect.value);
            break;
        case 'choice':
            // For choice cards, add to all applicable pools
            // The player already chose by selecting the card mode (basic/powered)
            // We add the value to movePoints by default; UI can let player redistribute
            State.movePoints += effect.value;
            Engine.log(`Choose how to use ${effect.value} points (added as Move; click other point types to convert).`, 'action');
            break;
        case 'special':
            Engine.handleSpecialEffect(effect, card);
            break;
    }
};

Engine.handleSpecialEffect = function(effect, card) {
    switch (effect.subtype) {
        case 'mana_draw':
            if (State.manaSource.length > 0) {
                const mana = State.manaSource.shift();
                State.manaTokens.push(mana);
                Engine.log(`Drew ${mana} mana from source.`, 'mana');
            }
            break;
        case 'mana_draw_crystal':
            if (State.manaSource.length > 0) {
                const mana = State.manaSource.shift();
                if (mana !== 'black' && mana !== 'gold') {
                    State.crystals[mana]++;
                    Engine.log(`Drew and crystallized ${mana} mana.`, 'mana');
                } else {
                    State.manaTokens.push(mana);
                    Engine.log(`Drew ${mana} mana (cannot crystallize).`, 'mana');
                }
            }
            break;
        case 'concentration':
            // Acts as any color mana - add a gold token
            State.manaTokens.push('gold');
            Engine.log('Concentration: gained 1 gold mana token.', 'mana');
            break;
        case 'concentration_plus':
            State.manaTokens.push('gold');
            State.manaTokens.push('gold');
            Engine.log('Concentration: gained 2 gold mana tokens.', 'mana');
            break;
        case 'crystallize':
            // Convert a mana token to crystal
            if (State.manaTokens.length > 0) {
                const token = State.manaTokens.shift();
                if (token !== 'black') {
                    const crystalColor = token === 'gold' ? 'gold' : token;
                    State.crystals[crystalColor]++;
                    Engine.log(`Crystallized ${token} mana into a crystal.`, 'mana');
                }
            }
            break;
        case 'crystallize_gold':
            State.crystals.gold++;
            Engine.log('Gained a gold crystal!', 'mana');
            break;
        case 'draw_2':
            Engine.drawCard();
            Engine.drawCard();
            Engine.log('Drew 2 cards.', 'action');
            break;
        case 'draw_3':
            Engine.drawCard();
            Engine.drawCard();
            Engine.drawCard();
            Engine.log('Drew 3 cards.', 'action');
            break;
        case 'wound_to_mana':
            State.wounds++;
            State.manaTokens.push('red');
            State.manaTokens.push('red');
            Engine.log('Blood Ritual: took 1 wound, gained 2 mana.', 'action');
            break;
        case 'discard_wound_draw':
            // Remove a wound from hand if present
            const woundIdx = State.hand.findIndex(c => c.type === 'wound');
            if (woundIdx >= 0) {
                State.hand.splice(woundIdx, 1);
                State.wounds--;
                Engine.drawCard();
                Engine.log('Decomposed a wound and drew 1 card.', 'action');
            }
            break;
        case 'gain_mana_2':
            State.manaTokens.push('gold');
            State.manaTokens.push('gold');
            Engine.log('Energy Flow: gained 2 mana.', 'mana');
            break;
        case 'gain_mana_3':
            State.manaTokens.push('gold');
            State.manaTokens.push('gold');
            State.manaTokens.push('gold');
            Engine.log('Energy Flow: gained 3 mana.', 'mana');
            break;
        case 'reveal_enemies':
            Engine.log('Enemies revealed!', 'action');
            break;
        case 'will_gold':
            State.manaTokens.push('gold');
            Engine.log('Will of Gold: gained 1 gold mana.', 'mana');
            break;
        case 'will_gold_plus':
            State.manaTokens.push('gold');
            State.manaTokens.push('gold');
            Engine.log('Will of Gold: gained 2 gold mana.', 'mana');
            break;
    }
};

Engine.discardHand = function() {
    State.discard.push(...State.playArea);
    State.discard.push(...State.hand);
    State.playArea = [];
    State.hand = [];
};

// ----------------------------------------------------------
// MANA MANAGEMENT
// ----------------------------------------------------------
Engine.canUseMana = function(color) {
    // Gold mana/crystals can substitute for any color
    if (color === 'gold') {
        // Check for any mana token or crystal
        return State.manaTokens.length > 0 ||
               Object.values(State.crystals).some(v => v > 0);
    }

    // Check mana tokens (gold token works as any)
    if (State.manaTokens.includes(color) || State.manaTokens.includes('gold')) return true;

    // Check crystals
    if (State.crystals[color] > 0 || State.crystals.gold > 0) return true;

    return false;
};

Engine.useMana = function(color) {
    // Try mana tokens first (matching color)
    let idx = State.manaTokens.indexOf(color);
    if (idx >= 0) {
        State.manaTokens.splice(idx, 1);
        return true;
    }

    // Try gold mana token
    idx = State.manaTokens.indexOf('gold');
    if (idx >= 0) {
        State.manaTokens.splice(idx, 1);
        return true;
    }

    // Try matching crystal
    if (State.crystals[color] > 0) {
        State.crystals[color]--;
        return true;
    }

    // Try gold crystal
    if (State.crystals.gold > 0) {
        State.crystals.gold--;
        return true;
    }

    return false;
};

Engine.takeManaFromSource = function(index) {
    if (index < 0 || index >= State.manaSource.length) return false;
    const mana = State.manaSource.splice(index, 1)[0];
    State.manaTokens.push(mana);
    Engine.log(`Took ${mana} mana from source.`, 'mana');
    return true;
};

// ----------------------------------------------------------
// MOVEMENT
// ----------------------------------------------------------
Engine.moveHero = function(targetHex) {
    const hexData = Engine.getHex(targetHex.q, targetHex.r);
    if (!hexData) return false;

    const reachable = Engine.getReachableHexes(State.movePoints);
    const key = MK.Hex.key(targetHex.q, targetHex.r);

    if (!reachable.has(key)) {
        Engine.log("Can't reach that hex!", 'warning');
        return false;
    }

    const remaining = reachable.get(key);
    const cost = State.movePoints - remaining;

    State.position = { q: targetHex.q, r: targetHex.r };
    State.movePoints = remaining;

    Engine.log(`Moved to (${targetHex.q}, ${targetHex.r}) - cost ${cost}, ${remaining} move points left.`, 'move');

    // Check for enemies
    if (hexData.enemies.length > 0 && !hexData.conquered) {
        Engine.startCombat(hexData);
    }

    // Check for exploration opportunities
    const explorations = Engine.canExplore(targetHex);
    if (explorations.length > 0 && (State.tileDeck.length > 0 || State.coreTileDeck.length > 0)) {
        // Auto-explore first available direction
        Engine.exploreTile(explorations[0].center);
    }

    // Check for site interaction (non-combat sites)
    if (hexData.site && hexData.enemies.length === 0) {
        Engine.handleSiteArrival(hexData);
    }

    return true;
};

Engine.handleSiteArrival = function(hexData) {
    const site = hexData.site;
    if (!site) return;

    switch (site) {
        case 'village':
            Engine.log('Arrived at a Village. Use Influence to recruit units or heal.', 'site');
            State.interacting = { type: 'village', hex: hexData };
            break;
        case 'monastery':
            Engine.log('Arrived at a Monastery. Burn mana for powerful effects.', 'site');
            State.interacting = { type: 'monastery', hex: hexData };
            break;
        case 'magical_glade':
            Engine.log('Arrived at a Magical Glade. The mana source has been refreshed.', 'site');
            Engine.rollManaSource();
            break;
        case 'mine_red':
        case 'mine_blue':
        case 'mine_green':
        case 'mine_white':
            const mineColor = site.replace('mine_', '');
            State.crystals[mineColor]++;
            Engine.log(`Mined a ${mineColor} crystal!`, 'mana');
            break;
    }
};

// ----------------------------------------------------------
// COMBAT SYSTEM
// ----------------------------------------------------------
Engine.startCombat = function(hexData) {
    if (!hexData.enemies || hexData.enemies.length === 0) return;

    State.phase = 'combat';
    State.combat = {
        hex: hexData,
        enemies: hexData.enemies.map(e => ({
            ...e,
            currentArmor: e.armor,
            damage: 0,
            defeated: false
        })),
        phase: 'ranged', // ranged -> block -> damage -> attack -> resolve
        rangedDamageDealt: {},   // enemyId -> damage
        blockedDamage: {},       // enemyId -> blocked amount
        unitsUsed: new Set(),
        playerDamage: 0,         // damage to assign to hero
        totalAttackUsed: 0,
        totalBlockUsed: 0,
        totalRangedUsed: 0
    };

    Engine.log(`Combat begins! Facing ${hexData.enemies.map(e => e.name).join(', ')}`, 'combat');
    Engine.log('Ranged Attack phase - play cards for ranged attacks.', 'combat');
};

Engine.advanceCombatPhase = function() {
    if (!State.combat) return;

    const phases = ['ranged', 'block', 'damage', 'attack', 'resolve'];
    const currentIdx = phases.indexOf(State.combat.phase);

    if (currentIdx < phases.length - 1) {
        State.combat.phase = phases[currentIdx + 1];

        switch (State.combat.phase) {
            case 'block':
                Engine.log('Block phase - play cards to block enemy attacks.', 'combat');
                // Calculate incoming damage
                Engine.calculateIncomingDamage();
                break;
            case 'damage':
                Engine.log('Assign damage phase.', 'combat');
                Engine.assignDamage();
                // Auto-advance to attack
                State.combat.phase = 'attack';
                Engine.log('Attack phase - play cards for melee attacks.', 'combat');
                break;
            case 'attack':
                Engine.log('Attack phase - play cards for melee attacks.', 'combat');
                break;
            case 'resolve':
                Engine.resolveCombat();
                break;
        }
    }
};

Engine.calculateIncomingDamage = function() {
    if (!State.combat) return;

    let totalDamage = 0;
    for (const enemy of State.combat.enemies) {
        if (enemy.defeated) continue;

        let attack = enemy.attack;
        // Brutal: unblocked damage is doubled (handled in assignDamage)
        totalDamage += attack;
    }

    State.combat.playerDamage = totalDamage;
    Engine.log(`Enemies attack for ${totalDamage} total damage.`, 'combat');
};

Engine.assignDamage = function() {
    if (!State.combat) return;

    let remainingDamage = State.combat.playerDamage - State.blockPoints;
    State.combat.totalBlockUsed = State.blockPoints;
    State.blockPoints = 0;

    if (remainingDamage <= 0) {
        Engine.log('All damage blocked!', 'combat');
        return;
    }

    // Check for brutal enemies - unblocked damage from brutal enemies is doubled
    for (const enemy of State.combat.enemies) {
        if (enemy.defeated) continue;
        if (enemy.abilities.includes('brutal') && remainingDamage > 0) {
            // Simplified: just add extra damage
            remainingDamage += Math.floor(remainingDamage * 0.5);
        }
    }

    // Apply damage to hero
    // Each point of damage over armor = 1 wound
    const armorReduction = Math.min(remainingDamage, State.armor);
    remainingDamage -= armorReduction;

    if (remainingDamage > 0) {
        // Assign units to absorb damage first
        let unitDamageAbsorbed = 0;
        for (const unit of State.units) {
            if (remainingDamage <= 0) break;
            if (!unit.wounded) {
                unit.wounded = true;
                unitDamageAbsorbed += unit.armor + 1;
                remainingDamage -= (unit.armor + 1);
                Engine.log(`${unit.name} absorbs damage!`, 'combat');
            }
        }

        // Remaining becomes wounds
        const wounds = Math.max(0, Math.ceil(remainingDamage));
        if (wounds > 0) {
            State.wounds += wounds;
            // Add wound cards to hand
            for (let i = 0; i < wounds; i++) {
                State.hand.push({
                    id: 'wound', name: 'Wound', type: 'wound', color: 'none',
                    basicDesc: 'A painful wound. Dead weight in your hand.',
                    instanceId: Engine.generateId()
                });
            }
            Engine.log(`Took ${wounds} wound(s)!`, 'damage');
        }
    }
};

Engine.applyCombatAttack = function() {
    if (!State.combat) return;

    const totalDamage = State.attackPoints + State.rangedAttackPoints;

    for (const enemy of State.combat.enemies) {
        if (enemy.defeated) continue;

        if (totalDamage >= enemy.currentArmor) {
            enemy.defeated = true;
            State.fame += enemy.fame;
            Engine.log(`${enemy.name} defeated! Gained ${enemy.fame} fame.`, 'combat');
        } else {
            Engine.log(`Attack ${totalDamage} vs ${enemy.name} armor ${enemy.currentArmor} - not enough!`, 'combat');
        }
    }

    State.attackPoints = 0;
    State.rangedAttackPoints = 0;
};

Engine.applyRangedAttack = function(enemyIndex) {
    if (!State.combat || State.combat.phase !== 'ranged') return;
    if (State.rangedAttackPoints <= 0) return;

    const enemy = State.combat.enemies[enemyIndex];
    if (!enemy || enemy.defeated) return;

    // Check for fortified
    if (enemy.abilities.includes('fortified')) {
        Engine.log(`${enemy.name} is fortified - immune to ranged attacks!`, 'combat');
        return;
    }

    if (State.rangedAttackPoints >= enemy.currentArmor) {
        enemy.defeated = true;
        State.fame += enemy.fame;
        State.rangedAttackPoints -= enemy.currentArmor;
        Engine.log(`${enemy.name} defeated by ranged attack! Gained ${enemy.fame} fame.`, 'combat');
    } else {
        Engine.log(`Ranged ${State.rangedAttackPoints} vs armor ${enemy.currentArmor} - need more damage!`, 'combat');
    }
};

Engine.applyMeleeAttack = function(enemyIndex) {
    if (!State.combat || State.combat.phase !== 'attack') return;
    if (State.attackPoints <= 0) return;

    const enemy = State.combat.enemies[enemyIndex];
    if (!enemy || enemy.defeated) return;

    if (State.attackPoints >= enemy.currentArmor) {
        enemy.defeated = true;
        State.fame += enemy.fame;
        State.attackPoints -= enemy.currentArmor;
        Engine.log(`${enemy.name} defeated! Gained ${enemy.fame} fame.`, 'combat');
    } else {
        Engine.log(`Attack ${State.attackPoints} vs armor ${enemy.currentArmor} - need more damage!`, 'combat');
    }
};

Engine.resolveCombat = function() {
    if (!State.combat) return;

    const allDefeated = State.combat.enemies.every(e => e.defeated);

    if (allDefeated) {
        Engine.log('Victory! All enemies defeated.', 'combat');

        // Mark site as conquered
        const hexKey = MK.Hex.key(State.combat.hex.q, State.combat.hex.r);
        const hexData = State.map.get(hexKey);
        if (hexData) {
            hexData.conquered = true;
            hexData.enemies = [];
            State.conqueredSites.add(hexKey);
        }

        // Check level up
        Engine.checkLevelUp();

        // Check win condition
        if (Engine.checkWinCondition()) {
            State.phase = 'game_over';
            Engine.log('VICTORY! You have completed the scenario!', 'system');
            return;
        }
    } else {
        Engine.log('Retreat! Some enemies survived.', 'combat');
        // Hero retreats to previous position (simplified: stays in place)
    }

    State.combat = null;
    State.phase = 'playing';
    State.attackPoints = 0;
    State.rangedAttackPoints = 0;
    State.blockPoints = 0;
};

Engine.fleeCombat = function() {
    if (!State.combat) return;

    // Take damage from each non-defeated enemy
    for (const enemy of State.combat.enemies) {
        if (!enemy.defeated) {
            State.wounds += 1;
            State.hand.push({
                id: 'wound', name: 'Wound', type: 'wound', color: 'none',
                basicDesc: 'A painful wound.',
                instanceId: Engine.generateId()
            });
        }
    }

    Engine.log('Fled combat! Took wounds from each enemy.', 'combat');
    State.combat = null;
    State.phase = 'playing';
    State.attackPoints = 0;
    State.rangedAttackPoints = 0;
    State.blockPoints = 0;
};

// ----------------------------------------------------------
// LEVELING
// ----------------------------------------------------------
Engine.checkLevelUp = function() {
    const currentLevel = State.level;
    for (const entry of MK.FameLevels) {
        if (State.fame >= entry.fame && entry.level > State.level) {
            State.level = entry.level;
            State.handLimit = entry.handLimit;
            State.armor = entry.armor;

            Engine.log(`LEVEL UP! Now level ${entry.level}!`, 'level');

            if (entry.reward === 'advanced_action_or_spell') {
                // Add a random advanced action or spell to deck
                Engine.gainAdvancedActionOrSpell();
            } else if (entry.reward === 'skill') {
                // Gain hero skill
                Engine.gainSkill();
            }
        }
    }
};

Engine.gainAdvancedActionOrSpell = function() {
    // Pick from offer
    const allAdvanced = Object.values(MK.AdvancedActions);
    const allSpells = Object.values(MK.Spells);
    const combined = [...allAdvanced, ...allSpells];
    const pick = combined[Math.floor(Math.random() * combined.length)];

    if (pick) {
        State.deck.push({ ...pick, instanceId: Engine.generateId() });
        Engine.log(`Gained new card: ${pick.name}!`, 'level');
    }
};

Engine.gainSkill = function() {
    const hero = State.hero;
    if (!hero) return;

    const skill = hero.skills.find(s => s.level === State.level);
    if (skill) {
        State.skills.push(skill);
        Engine.log(`Learned skill: ${skill.name} - ${skill.description}`, 'level');
    }
};

// ----------------------------------------------------------
// TURN MANAGEMENT
// ----------------------------------------------------------
Engine.endTurn = function() {
    Engine.log('Turn ended.', 'system');

    // Move played cards to discard
    State.discard.push(...State.playArea);
    State.playArea = [];

    // Reset turn state
    State.movePoints = 0;
    State.attackPoints = 0;
    State.blockPoints = 0;
    State.influencePoints = 0;
    State.healPoints = 0;
    State.rangedAttackPoints = 0;
    State.cardsPlayedThisTurn = 0;
    State.manaTokens = [];
    State.interacting = null;

    // Draw up to hand limit
    Engine.drawHand();

    // Check if deck is empty (round ends)
    if (State.deck.length === 0 && State.hand.length <= State.handLimit) {
        Engine.endRound();
    }
};

Engine.endRound = function() {
    State.round++;

    // Toggle day/night
    State.isDay = !State.isDay;

    // Check game over
    if (State.round > State.scenario.rounds) {
        State.phase = 'game_over';
        if (!Engine.checkWinCondition()) {
            Engine.log('Game Over! You ran out of time.', 'system');
        }
        return;
    }

    // Reshuffle all cards
    State.discard.push(...State.playArea, ...State.hand);
    State.deck = [...State.discard];
    State.discard = [];
    State.hand = [];
    State.playArea = [];
    Engine.shuffleArray(State.deck);

    // Re-roll mana source
    Engine.rollManaSource();

    // Draw new hand
    Engine.drawHand();

    // Refresh offers
    Engine.refreshOffers();

    const timeOfDay = State.isDay ? 'Day' : 'Night';
    Engine.log(`Round ${State.round} - ${timeOfDay} begins!`, 'system');
};

// ----------------------------------------------------------
// INTERACTION (Villages, Monasteries, etc.)
// ----------------------------------------------------------
Engine.recruitUnit = function(unitId) {
    const unit = MK.Units[unitId];
    if (!unit) return false;

    if (State.influencePoints < unit.cost) {
        Engine.log(`Need ${unit.cost} influence to recruit ${unit.name} (have ${State.influencePoints}).`, 'warning');
        return false;
    }

    // Max 3 units for solo
    if (State.units.length >= 3) {
        Engine.log('Cannot command more than 3 units!', 'warning');
        return false;
    }

    State.influencePoints -= unit.cost;
    State.units.push({ ...unit, instanceId: Engine.generateId(), wounded: false, used: false });
    Engine.log(`Recruited ${unit.name}!`, 'action');
    return true;
};

Engine.healAtVillage = function() {
    if (State.influencePoints < 3) {
        Engine.log('Need 3 influence to heal at village.', 'warning');
        return false;
    }

    if (State.wounds <= 0) {
        Engine.log('No wounds to heal!', 'warning');
        return false;
    }

    State.influencePoints -= 3;
    State.wounds--;
    // Remove wound card from hand/deck/discard
    Engine.removeWoundCard();
    Engine.log('Healed 1 wound at the village.', 'action');
    return true;
};

Engine.removeWoundCard = function() {
    let idx = State.hand.findIndex(c => c.type === 'wound');
    if (idx >= 0) { State.hand.splice(idx, 1); return; }
    idx = State.discard.findIndex(c => c.type === 'wound');
    if (idx >= 0) { State.discard.splice(idx, 1); return; }
    idx = State.deck.findIndex(c => c.type === 'wound');
    if (idx >= 0) { State.deck.splice(idx, 1); return; }
};

Engine.heal = function(amount) {
    const toHeal = Math.min(amount, State.wounds);
    for (let i = 0; i < toHeal; i++) {
        State.wounds--;
        Engine.removeWoundCard();
    }
    if (toHeal > 0) {
        Engine.log(`Healed ${toHeal} wound(s).`, 'action');
    }

    // Remaining heal can heal units
    let remaining = amount - toHeal;
    for (const unit of State.units) {
        if (remaining <= 0) break;
        if (unit.wounded) {
            unit.wounded = false;
            remaining--;
            Engine.log(`${unit.name} healed.`, 'action');
        }
    }
};

// ----------------------------------------------------------
// OFFERS (Advanced Actions, Spells, Units)
// ----------------------------------------------------------
Engine.refreshOffers = function() {
    // Advanced action offer (3 cards)
    const advActions = Object.values(MK.AdvancedActions);
    Engine.shuffleArray(advActions);
    State.advancedActionOffer = advActions.slice(0, 3);

    // Spell offer (3 cards)
    const spells = Object.values(MK.Spells);
    Engine.shuffleArray(spells);
    State.spellOffer = spells.slice(0, 3);

    // Unit offer (3 units)
    const units = Object.values(MK.Units);
    Engine.shuffleArray(units);
    State.unitOffer = units.slice(0, 3);
};

// ----------------------------------------------------------
// WIN CONDITION
// ----------------------------------------------------------
Engine.checkWinCondition = function() {
    if (!State.scenario) return false;

    switch (State.scenario.winCondition) {
        case 'conquer_keep':
            for (const [key, hex] of State.map) {
                if (hex.site === 'keep' && hex.conquered) return true;
            }
            return false;

        case 'conquer_city':
            for (const [key, hex] of State.map) {
                if (hex.site && hex.site.startsWith('city_') && hex.conquered) return true;
            }
            return false;

        case 'conquer_all_cities':
            let totalCities = 0;
            let conqueredCities = 0;
            for (const [key, hex] of State.map) {
                if (hex.site && hex.site.startsWith('city_')) {
                    totalCities++;
                    if (hex.conquered) conqueredCities++;
                }
            }
            return totalCities > 0 && conqueredCities === totalCities;

        default:
            return false;
    }
};

// ----------------------------------------------------------
// UTILITY
// ----------------------------------------------------------
Engine.shuffleArray = function(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

let _idCounter = 0;
Engine.generateId = function() {
    return `id_${Date.now()}_${_idCounter++}`;
};

// Expose state as text for testing
window.render_game_to_text = function() {
    return JSON.stringify({
        phase: State.phase,
        round: State.round,
        isDay: State.isDay,
        position: State.position,
        fame: State.fame,
        level: State.level,
        hand: State.hand.map(c => c.name),
        deckSize: State.deck.length,
        movePoints: State.movePoints,
        attackPoints: State.attackPoints,
        blockPoints: State.blockPoints,
        wounds: State.wounds,
        manaSource: State.manaSource,
        crystals: State.crystals,
        combat: State.combat ? {
            phase: State.combat.phase,
            enemies: State.combat.enemies.map(e => ({ name: e.name, armor: e.currentArmor, defeated: e.defeated }))
        } : null
    }, null, 2);
};

MK.Engine = Engine;
MK.State = State;

})();
