// ============================================================
// MAGE KNIGHT - GAME DATA
// All constants, card definitions, enemy data, hero data,
// tile definitions, terrain types, and game parameters.
// ============================================================

const MK = window.MK || {};

// ----------------------------------------------------------
// MANA COLORS
// ----------------------------------------------------------
MK.ManaColor = {
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    WHITE: 'white',
    GOLD: 'gold',
    BLACK: 'black'
};

// ----------------------------------------------------------
// TERRAIN TYPES
// ----------------------------------------------------------
MK.Terrain = {
    plains:    { id: 'plains',    name: 'Plains',    moveCost: { day: 2, night: 2 }, color: '#7db356', darkColor: '#4a6d34' },
    hills:     { id: 'hills',     name: 'Hills',     moveCost: { day: 3, night: 3 }, color: '#a68b5b', darkColor: '#6d5b3a' },
    forest:    { id: 'forest',    name: 'Forest',    moveCost: { day: 3, night: 5 }, color: '#2d6e1e', darkColor: '#1a4011' },
    wasteland: { id: 'wasteland', name: 'Wasteland', moveCost: { day: 4, night: 4 }, color: '#8b6b42', darkColor: '#5a4529' },
    desert:    { id: 'desert',    name: 'Desert',    moveCost: { day: 5, night: 3 }, color: '#d4a76a', darkColor: '#8a6d45' },
    swamp:     { id: 'swamp',     name: 'Swamp',     moveCost: { day: 5, night: 5 }, color: '#4a6741', darkColor: '#2d3f28' },
    lake:      { id: 'lake',      name: 'Lake',      moveCost: { day: 999, night: 999 }, color: '#3a7abd', darkColor: '#254d7a' },
    mountain:  { id: 'mountain',  name: 'Mountain',  moveCost: { day: 999, night: 999 }, color: '#6a6a7a', darkColor: '#3d3d47' },
    sea:       { id: 'sea',       name: 'Sea',       moveCost: { day: 999, night: 999 }, color: '#2a5a8a', darkColor: '#1a3a5a' },
    city:      { id: 'city',      name: 'City',      moveCost: { day: 2, night: 2 }, color: '#888888', darkColor: '#555555' }
};

// ----------------------------------------------------------
// SITE TYPES (features on hexes)
// ----------------------------------------------------------
MK.SiteType = {
    VILLAGE:          { id: 'village',          name: 'Village',          icon: '🏘️', description: 'Recruit units, heal, buy from offer.' },
    MONASTERY:        { id: 'monastery',        name: 'Monastery',        icon: '⛪', description: 'Burn mana for powerful effects.' },
    KEEP:             { id: 'keep',             name: 'Keep',             icon: '🏰', description: 'Defeat garrison to conquer.' },
    MAGE_TOWER:       { id: 'mage_tower',       name: 'Mage Tower',       icon: '🗼', description: 'Learn spells, interact with mages.' },
    DUNGEON:          { id: 'dungeon',          name: 'Dungeon',          icon: '💀', description: 'Fight enemies for treasure.' },
    TOMB:             { id: 'tomb',             name: 'Tomb',             icon: '⚰️', description: 'Fight undead for artifacts.' },
    MINE_RED:         { id: 'mine_red',         name: 'Red Mine',         icon: '⛏️', description: 'Gain red crystal.' },
    MINE_BLUE:        { id: 'mine_blue',        name: 'Blue Mine',        icon: '⛏️', description: 'Gain blue crystal.' },
    MINE_GREEN:       { id: 'mine_green',       name: 'Green Mine',       icon: '⛏️', description: 'Gain green crystal.' },
    MINE_WHITE:       { id: 'mine_white',       name: 'White Mine',       icon: '⛏️', description: 'Gain white crystal.' },
    ANCIENT_RUINS:    { id: 'ancient_ruins',    name: 'Ancient Ruins',    icon: '🏛️', description: 'Fight for artifact reward.' },
    SPAWNING_GROUNDS: { id: 'spawning_grounds', name: 'Spawning Grounds', icon: '🔥', description: 'Fight orcs for fame.' },
    DRACONUM_LAIR:    { id: 'draconum_lair',    name: 'Draconum Lair',    icon: '🐉', description: 'Fight a dragon!' },
    MAGICAL_GLADE:    { id: 'magical_glade',    name: 'Magical Glade',    icon: '✨', description: 'Refresh mana source.' },
    CITY_GREEN:       { id: 'city_green',       name: 'Green City',       icon: '🏙️', description: 'Conquer the city to win!' },
    CITY_BLUE:        { id: 'city_blue',        name: 'Blue City',        icon: '🏙️', description: 'Conquer the city to win!' },
    CITY_RED:         { id: 'city_red',         name: 'Red City',         icon: '🏙️', description: 'Conquer the city to win!' },
    CITY_WHITE:       { id: 'city_white',       name: 'White City',       icon: '🏙️', description: 'Conquer the city to win!' }
};

// ----------------------------------------------------------
// ENEMY ABILITIES
// ----------------------------------------------------------
MK.EnemyAbility = {
    FORTIFIED:    'fortified',    // Cannot be attacked with ranged
    SWIFT:        'swift',        // Must block before ranged phase
    BRUTAL:       'brutal',       // Unblocked damage is doubled
    POISON:       'poison',       // Unblocked damage = wounds (not reduced by armor)
    PARALYZE:     'paralyze',     // If takes damage, hero can't attack
    FIRE_ATTACK:  'fire_attack',  // Fire element attack
    ICE_ATTACK:   'ice_attack',   // Ice element attack
    COLD_FIRE:    'cold_fire',    // Cold fire attack (both fire + ice)
    FIRE_RESIST:  'fire_resist',  // Halves fire damage
    ICE_RESIST:   'ice_resist',   // Halves ice damage
    PHYSICAL_RESIST: 'physical_resist', // Halves physical damage
    ELUSIVE:      'elusive',      // Inefficient to block
    CUMBERSOME:   'cumbersome',   // Attack -1 each time blocked
    ARCANE:       'arcane',       // Takes double damage from ColdFire
    SUMMONER:     'summoner'      // Summons another enemy
};

// ----------------------------------------------------------
// ENEMY DEFINITIONS
// ----------------------------------------------------------
MK.Enemies = {
    // --- GREEN (Orcs) - Easy ---
    orc_prowlers: {
        id: 'orc_prowlers', name: 'Orc Prowlers', type: 'green',
        attack: 4, armor: 3, abilities: [],
        fame: 2, icon: '👹'
    },
    orc_marauders: {
        id: 'orc_marauders', name: 'Orc Marauders', type: 'green',
        attack: 3, armor: 4, abilities: [MK.EnemyAbility.FORTIFIED],
        fame: 2, icon: '👹'
    },
    orc_summoner: {
        id: 'orc_summoner', name: 'Orc Summoner', type: 'green',
        attack: 3, armor: 4, abilities: [MK.EnemyAbility.SUMMONER],
        fame: 3, icon: '🧙'
    },
    orc_swordsmen: {
        id: 'orc_swordsmen', name: 'Orc Swordsmen', type: 'green',
        attack: 5, armor: 3, abilities: [MK.EnemyAbility.BRUTAL],
        fame: 3, icon: '⚔️'
    },
    // --- PURPLE (Mage enemies) - Medium ---
    guardsmen: {
        id: 'guardsmen', name: 'Guardsmen', type: 'purple',
        attack: 3, armor: 3, abilities: [MK.EnemyAbility.SWIFT],
        fame: 3, icon: '💂'
    },
    monks: {
        id: 'monks', name: 'Monks', type: 'purple',
        attack: 4, armor: 4, abilities: [MK.EnemyAbility.POISON],
        fame: 4, icon: '🧘'
    },
    illusionists: {
        id: 'illusionists', name: 'Illusionists', type: 'purple',
        attack: 3, armor: 3, abilities: [MK.EnemyAbility.PARALYZE],
        fame: 3, icon: '🎭'
    },
    ice_mages: {
        id: 'ice_mages', name: 'Ice Mages', type: 'purple',
        attack: 5, armor: 5, abilities: [MK.EnemyAbility.ICE_ATTACK, MK.EnemyAbility.FIRE_RESIST],
        fame: 5, icon: '❄️'
    },
    fire_mages: {
        id: 'fire_mages', name: 'Fire Mages', type: 'purple',
        attack: 6, armor: 5, abilities: [MK.EnemyAbility.FIRE_ATTACK, MK.EnemyAbility.ICE_RESIST],
        fame: 5, icon: '🔥'
    },
    // --- RED (Draconum) - Hard ---
    fire_dragon: {
        id: 'fire_dragon', name: 'Fire Dragon', type: 'red',
        attack: 9, armor: 7, abilities: [MK.EnemyAbility.FIRE_ATTACK, MK.EnemyAbility.ICE_RESIST, MK.EnemyAbility.PHYSICAL_RESIST],
        fame: 8, icon: '🐲'
    },
    ice_dragon: {
        id: 'ice_dragon', name: 'Ice Dragon', type: 'red',
        attack: 8, armor: 7, abilities: [MK.EnemyAbility.ICE_ATTACK, MK.EnemyAbility.FIRE_RESIST, MK.EnemyAbility.PHYSICAL_RESIST],
        fame: 8, icon: '🐲'
    },
    swamp_dragon: {
        id: 'swamp_dragon', name: 'Swamp Dragon', type: 'red',
        attack: 7, armor: 6, abilities: [MK.EnemyAbility.POISON, MK.EnemyAbility.PHYSICAL_RESIST],
        fame: 7, icon: '🐲'
    },
    // --- BROWN (Citizens / city defenders) ---
    altem_mages: {
        id: 'altem_mages', name: 'Altem Mages', type: 'brown',
        attack: 6, armor: 6, abilities: [MK.EnemyAbility.COLD_FIRE, MK.EnemyAbility.FIRE_RESIST, MK.EnemyAbility.ICE_RESIST],
        fame: 6, icon: '🧙‍♂️'
    },
    altem_guardians: {
        id: 'altem_guardians', name: 'Altem Guardians', type: 'brown',
        attack: 7, armor: 7, abilities: [MK.EnemyAbility.FORTIFIED, MK.EnemyAbility.BRUTAL],
        fame: 7, icon: '🛡️'
    },
    freezers: {
        id: 'freezers', name: 'Freezers', type: 'brown',
        attack: 5, armor: 5, abilities: [MK.EnemyAbility.ICE_ATTACK, MK.EnemyAbility.PARALYZE],
        fame: 5, icon: '🥶'
    }
};

// Enemy pools by location type
MK.EnemyPools = {
    spawning_grounds: ['orc_prowlers', 'orc_marauders', 'orc_summoner', 'orc_swordsmen'],
    keep: ['orc_prowlers', 'orc_marauders', 'guardsmen'],
    mage_tower: ['monks', 'illusionists', 'guardsmen'],
    dungeon: ['orc_swordsmen', 'guardsmen', 'monks', 'illusionists'],
    tomb: ['monks', 'ice_mages', 'fire_mages'],
    ancient_ruins: ['guardsmen', 'monks', 'illusionists', 'ice_mages'],
    draconum_lair: ['fire_dragon', 'ice_dragon', 'swamp_dragon'],
    city: ['altem_mages', 'altem_guardians', 'freezers', 'fire_mages', 'ice_mages']
};

// ----------------------------------------------------------
// UNIT TYPES (recruitable at villages/keeps)
// ----------------------------------------------------------
MK.Units = {
    peasants: {
        id: 'peasants', name: 'Peasants', cost: 4, level: 1,
        attack: 2, armor: 1, abilities: [],
        icon: '🧑‍🌾'
    },
    foresters: {
        id: 'foresters', name: 'Foresters', cost: 5, level: 2,
        attack: 3, armor: 2, abilities: ['scout'],
        icon: '🏹'
    },
    herbalists: {
        id: 'herbalists', name: 'Herbalists', cost: 5, level: 2,
        attack: 1, armor: 1, abilities: ['heal_2'],
        icon: '🌿'
    },
    northern_monks: {
        id: 'northern_monks', name: 'Northern Monks', cost: 7, level: 3,
        attack: 3, armor: 4, abilities: ['block_3'],
        icon: '⚔️'
    },
    utem_crossbowmen: {
        id: 'utem_crossbowmen', name: 'Utem Crossbowmen', cost: 6, level: 3,
        attack: 3, armor: 3, abilities: ['ranged_3'],
        icon: '🏹'
    },
    utem_guardsmen: {
        id: 'utem_guardsmen', name: 'Utem Guardsmen', cost: 7, level: 3,
        attack: 4, armor: 4, abilities: ['block_4'],
        icon: '🛡️'
    },
    utem_swordsmen: {
        id: 'utem_swordsmen', name: 'Utem Swordsmen', cost: 7, level: 4,
        attack: 6, armor: 4, abilities: [],
        icon: '⚔️'
    },
    red_cape_monks: {
        id: 'red_cape_monks', name: 'Red Cape Monks', cost: 8, level: 4,
        attack: 4, armor: 5, abilities: ['fire_attack_4'],
        icon: '🔥'
    }
};

// ----------------------------------------------------------
// CARD DEFINITIONS - BASIC ACTIONS
// ----------------------------------------------------------
MK.BasicActions = {
    // === MOVEMENT CARDS ===
    march: {
        id: 'march', name: 'March', color: 'green', type: 'basic',
        basicEffect: { type: 'move', value: 2 },
        poweredEffect: { type: 'move', value: 4 },
        basicDesc: 'Move 2', poweredDesc: 'Move 4'
    },
    swiftness: {
        id: 'swiftness', name: 'Swiftness', color: 'white', type: 'basic',
        basicEffect: { type: 'move', value: 2 },
        poweredEffect: { type: 'move', value: 4, special: 'safe_move' },
        basicDesc: 'Move 2', poweredDesc: 'Move 4 (ignore enemy zones)'
    },
    stamina: {
        id: 'stamina', name: 'Stamina', color: 'blue', type: 'basic',
        basicEffect: { type: 'move', value: 2 },
        poweredEffect: { type: 'move', value: 4, special: 'reduced_cost' },
        basicDesc: 'Move 2', poweredDesc: 'Move 4 (one terrain at half cost)'
    },
    // === ATTACK CARDS ===
    rage: {
        id: 'rage', name: 'Rage', color: 'red', type: 'basic',
        basicEffect: { type: 'attack', value: 2 },
        poweredEffect: { type: 'attack', value: 4 },
        basicDesc: 'Attack 2', poweredDesc: 'Attack 4'
    },
    // === BLOCK CARDS ===
    determination: {
        id: 'determination', name: 'Determination', color: 'blue', type: 'basic',
        basicEffect: { type: 'block', value: 3 },
        poweredEffect: { type: 'block', value: 5 },
        basicDesc: 'Block 3', poweredDesc: 'Block 5'
    },
    // === INFLUENCE CARDS ===
    promise: {
        id: 'promise', name: 'Promise', color: 'green', type: 'basic',
        basicEffect: { type: 'influence', value: 2 },
        poweredEffect: { type: 'influence', value: 4 },
        basicDesc: 'Influence 2', poweredDesc: 'Influence 4'
    },
    threaten: {
        id: 'threaten', name: 'Threaten', color: 'red', type: 'basic',
        basicEffect: { type: 'influence', value: 2 },
        poweredEffect: { type: 'influence', value: 5, special: 'lose_reputation' },
        basicDesc: 'Influence 2', poweredDesc: 'Influence 5 (lose 1 reputation)'
    },
    // === HEAL ===
    tranquility: {
        id: 'tranquility', name: 'Tranquility', color: 'green', type: 'basic',
        basicEffect: { type: 'heal', value: 1 },
        poweredEffect: { type: 'heal', value: 3 },
        basicDesc: 'Heal 1', poweredDesc: 'Heal 3'
    },
    // === MANA ===
    mana_draw: {
        id: 'mana_draw', name: 'Mana Draw', color: 'gold', type: 'basic',
        basicEffect: { type: 'special', subtype: 'mana_draw' },
        poweredEffect: { type: 'special', subtype: 'mana_draw_crystal' },
        basicDesc: 'Take a mana die from Source', poweredDesc: 'Take a mana and crystallize it'
    },
    concentration: {
        id: 'concentration', name: 'Concentration', color: 'gold', type: 'basic',
        basicEffect: { type: 'special', subtype: 'concentration' },
        poweredEffect: { type: 'special', subtype: 'concentration_plus' },
        basicDesc: 'Use as any color mana', poweredDesc: 'Use as 2 mana of any one color'
    },
    crystallize: {
        id: 'crystallize', name: 'Crystallize', color: 'gold', type: 'basic',
        basicEffect: { type: 'special', subtype: 'crystallize' },
        poweredEffect: { type: 'special', subtype: 'crystallize_gold' },
        basicDesc: 'Crystallize a mana token', poweredDesc: 'Gain a gold crystal'
    },
    // === HERO-UNIQUE CARDS ===
    // Tovak
    cold_toughness: {
        id: 'cold_toughness', name: 'Cold Toughness', color: 'blue', type: 'basic',
        basicEffect: { type: 'block', value: 3 },
        poweredEffect: { type: 'block', value: 5, element: 'ice' },
        basicDesc: 'Block 3', poweredDesc: 'Ice Block 5'
    },
    battle_versatility: {
        id: 'battle_versatility', name: 'Battle Versatility', color: 'gold', type: 'basic',
        basicEffect: { type: 'choice', options: ['move', 'attack', 'block', 'influence'], value: 2 },
        poweredEffect: { type: 'choice', options: ['move', 'attack', 'block', 'influence'], value: 3 },
        basicDesc: 'Move/Attack/Block/Influence 2', poweredDesc: 'Move/Attack/Block/Influence 3'
    },
    // Norowas
    noble_manners: {
        id: 'noble_manners', name: 'Noble Manners', color: 'white', type: 'basic',
        basicEffect: { type: 'influence', value: 2 },
        poweredEffect: { type: 'influence', value: 4, special: 'gain_reputation' },
        basicDesc: 'Influence 2', poweredDesc: 'Influence 4 (gain 1 reputation)'
    },
    shield_mastery: {
        id: 'shield_mastery', name: 'Shield Mastery', color: 'blue', type: 'basic',
        basicEffect: { type: 'block', value: 3 },
        poweredEffect: { type: 'block', value: 5, special: 'then_attack_2' },
        basicDesc: 'Block 3', poweredDesc: 'Block 5, then Attack 2'
    },
    // Arythea
    dark_fire: {
        id: 'dark_fire', name: 'Dark Fire', color: 'red', type: 'basic',
        basicEffect: { type: 'attack', value: 2, element: 'fire' },
        poweredEffect: { type: 'attack', value: 5, element: 'fire' },
        basicDesc: 'Fire Attack 2', poweredDesc: 'Fire Attack 5'
    },
    battle_frenzy: {
        id: 'battle_frenzy', name: 'Battle Frenzy', color: 'red', type: 'basic',
        basicEffect: { type: 'attack', value: 2 },
        poweredEffect: { type: 'attack', value: 4, special: 'take_1_wound' },
        basicDesc: 'Attack 2', poweredDesc: 'Attack 4 (take 1 wound for +2 more)'
    },
    // Goldyx
    will_of_gold: {
        id: 'will_of_gold', name: 'Will of Gold', color: 'gold', type: 'basic',
        basicEffect: { type: 'special', subtype: 'will_gold' },
        poweredEffect: { type: 'special', subtype: 'will_gold_plus' },
        basicDesc: 'Gain 1 gold mana', poweredDesc: 'Gain 2 gold mana'
    },
    golden_greed: {
        id: 'golden_greed', name: 'Golden Greed', color: 'gold', type: 'basic',
        basicEffect: { type: 'influence', value: 2, special: 'gold_bonus' },
        poweredEffect: { type: 'influence', value: 5 },
        basicDesc: 'Influence 2 (+1 per crystal)', poweredDesc: 'Influence 5'
    }
};

// ----------------------------------------------------------
// CARD DEFINITIONS - ADVANCED ACTIONS
// ----------------------------------------------------------
MK.AdvancedActions = {
    path_finding: {
        id: 'path_finding', name: 'Path Finding', color: 'green', type: 'advanced',
        basicEffect: { type: 'move', value: 4 },
        poweredEffect: { type: 'move', value: 7 },
        basicDesc: 'Move 4', poweredDesc: 'Move 7'
    },
    crushing_bolt: {
        id: 'crushing_bolt', name: 'Crushing Bolt', color: 'red', type: 'advanced',
        basicEffect: { type: 'ranged_attack', value: 3 },
        poweredEffect: { type: 'ranged_attack', value: 5, element: 'siege' },
        basicDesc: 'Ranged Attack 3', poweredDesc: 'Siege Ranged Attack 5'
    },
    shield_bash: {
        id: 'shield_bash', name: 'Shield Bash', color: 'blue', type: 'advanced',
        basicEffect: { type: 'block', value: 3, special: 'then_attack_2' },
        poweredEffect: { type: 'block', value: 5, special: 'then_attack_3' },
        basicDesc: 'Block 3, then Attack 2', poweredDesc: 'Block 5, then Attack 3'
    },
    agility: {
        id: 'agility', name: 'Agility', color: 'white', type: 'advanced',
        basicEffect: { type: 'move', value: 2, special: 'safe_move' },
        poweredEffect: { type: 'move', value: 4, special: 'safe_move' },
        basicDesc: 'Move 2 (ignore enemies)', poweredDesc: 'Move 4 (ignore enemies)'
    },
    blood_ritual: {
        id: 'blood_ritual', name: 'Blood Ritual', color: 'red', type: 'advanced',
        basicEffect: { type: 'special', subtype: 'wound_to_mana' },
        poweredEffect: { type: 'special', subtype: 'wound_to_mana_2' },
        basicDesc: 'Take wound, gain 2 mana of one color', poweredDesc: 'Take wound, gain 3 mana of one color'
    },
    diplomacy: {
        id: 'diplomacy', name: 'Diplomacy', color: 'white', type: 'advanced',
        basicEffect: { type: 'influence', value: 4 },
        poweredEffect: { type: 'influence', value: 7 },
        basicDesc: 'Influence 4', poweredDesc: 'Influence 7'
    },
    intimidate: {
        id: 'intimidate', name: 'Intimidate', color: 'red', type: 'advanced',
        basicEffect: { type: 'influence', value: 3 },
        poweredEffect: { type: 'influence', value: 7, special: 'lose_reputation' },
        basicDesc: 'Influence 3', poweredDesc: 'Influence 7 (lose 1 reputation)'
    },
    song_of_wind: {
        id: 'song_of_wind', name: 'Song of Wind', color: 'green', type: 'advanced',
        basicEffect: { type: 'move', value: 3 },
        poweredEffect: { type: 'move', value: 5, special: 'fly' },
        basicDesc: 'Move 3', poweredDesc: 'Fly 5'
    },
    in_need: {
        id: 'in_need', name: 'In Need', color: 'gold', type: 'advanced',
        basicEffect: { type: 'special', subtype: 'draw_2' },
        poweredEffect: { type: 'special', subtype: 'draw_3' },
        basicDesc: 'Draw 2 cards', poweredDesc: 'Draw 3 cards'
    },
    regeneration: {
        id: 'regeneration', name: 'Regeneration', color: 'green', type: 'advanced',
        basicEffect: { type: 'heal', value: 2 },
        poweredEffect: { type: 'heal', value: 5 },
        basicDesc: 'Heal 2', poweredDesc: 'Heal 5'
    },
    fire_bolt: {
        id: 'fire_bolt', name: 'Fire Bolt', color: 'red', type: 'advanced',
        basicEffect: { type: 'ranged_attack', value: 3, element: 'fire' },
        poweredEffect: { type: 'ranged_attack', value: 5, element: 'fire' },
        basicDesc: 'Ranged Fire Attack 3', poweredDesc: 'Ranged Fire Attack 5'
    },
    ice_bolt: {
        id: 'ice_bolt', name: 'Ice Bolt', color: 'blue', type: 'advanced',
        basicEffect: { type: 'ranged_attack', value: 3, element: 'ice' },
        poweredEffect: { type: 'ranged_attack', value: 5, element: 'ice' },
        basicDesc: 'Ranged Ice Attack 3', poweredDesc: 'Ranged Ice Attack 5'
    },
    battle_focus: {
        id: 'battle_focus', name: 'Battle Focus', color: 'red', type: 'advanced',
        basicEffect: { type: 'attack', value: 4 },
        poweredEffect: { type: 'attack', value: 7 },
        basicDesc: 'Attack 4', poweredDesc: 'Attack 7'
    },
    decompose: {
        id: 'decompose', name: 'Decompose', color: 'green', type: 'advanced',
        basicEffect: { type: 'special', subtype: 'discard_wound_draw' },
        poweredEffect: { type: 'special', subtype: 'discard_wound_draw_2' },
        basicDesc: 'Discard a wound, draw 1', poweredDesc: 'Discard a wound, draw 2'
    },
    ambush: {
        id: 'ambush', name: 'Ambush', color: 'red', type: 'advanced',
        basicEffect: { type: 'attack', value: 3 },
        poweredEffect: { type: 'attack', value: 6, special: 'forest_swamp_bonus' },
        basicDesc: 'Attack 3', poweredDesc: 'Attack 6 (+2 in forest/swamp)'
    },
    crystal_mastery: {
        id: 'crystal_mastery', name: 'Crystal Mastery', color: 'gold', type: 'advanced',
        basicEffect: { type: 'special', subtype: 'crystal_convert' },
        poweredEffect: { type: 'special', subtype: 'crystal_double' },
        basicDesc: 'Convert any crystal to 3 mana', poweredDesc: 'Double a crystal effect'
    }
};

// ----------------------------------------------------------
// CARD DEFINITIONS - SPELLS
// ----------------------------------------------------------
MK.Spells = {
    fireball: {
        id: 'fireball', name: 'Fireball', color: 'red', type: 'spell',
        manaCost: 'red',
        basicEffect: { type: 'ranged_attack', value: 5, element: 'fire' },
        poweredEffect: { type: 'ranged_attack', value: 8, element: 'fire' },
        basicDesc: 'Ranged Fire Attack 5', poweredDesc: 'Ranged Fire Attack 8'
    },
    blizzard: {
        id: 'blizzard', name: 'Blizzard', color: 'blue', type: 'spell',
        manaCost: 'blue',
        basicEffect: { type: 'ranged_attack', value: 5, element: 'ice', special: 'all_enemies' },
        poweredEffect: { type: 'ranged_attack', value: 8, element: 'ice', special: 'all_enemies' },
        basicDesc: 'Ice Attack 5 vs ALL', poweredDesc: 'Ice Attack 8 vs ALL'
    },
    mana_bolt: {
        id: 'mana_bolt', name: 'Mana Bolt', color: 'blue', type: 'spell',
        manaCost: 'blue',
        basicEffect: { type: 'ranged_attack', value: 7 },
        poweredEffect: { type: 'ranged_attack', value: 11 },
        basicDesc: 'Ranged Attack 7', poweredDesc: 'Ranged Attack 11'
    },
    whirlwind: {
        id: 'whirlwind', name: 'Whirlwind', color: 'green', type: 'spell',
        manaCost: 'green',
        basicEffect: { type: 'attack', value: 5, special: 'all_enemies' },
        poweredEffect: { type: 'attack', value: 8, special: 'all_enemies' },
        basicDesc: 'Attack 5 vs ALL', poweredDesc: 'Attack 8 vs ALL'
    },
    tremor: {
        id: 'tremor', name: 'Tremor', color: 'green', type: 'spell',
        manaCost: 'green',
        basicEffect: { type: 'attack', value: 5, element: 'siege' },
        poweredEffect: { type: 'attack', value: 8, element: 'siege' },
        basicDesc: 'Siege Attack 5', poweredDesc: 'Siege Attack 8'
    },
    space_bending: {
        id: 'space_bending', name: 'Space Bending', color: 'white', type: 'spell',
        manaCost: 'white',
        basicEffect: { type: 'move', value: 99, special: 'teleport' },
        poweredEffect: { type: 'move', value: 99, special: 'teleport_group' },
        basicDesc: 'Teleport to any explored hex', poweredDesc: 'Teleport with all units'
    },
    cure: {
        id: 'cure', name: 'Cure', color: 'white', type: 'spell',
        manaCost: 'white',
        basicEffect: { type: 'heal', value: 3 },
        poweredEffect: { type: 'heal', value: 5, special: 'heal_units' },
        basicDesc: 'Heal 3', poweredDesc: 'Heal 5 and heal all units'
    },
    demolish: {
        id: 'demolish', name: 'Demolish', color: 'red', type: 'spell',
        manaCost: 'red',
        basicEffect: { type: 'attack', value: 5, element: 'siege' },
        poweredEffect: { type: 'attack', value: 8, element: 'siege' },
        basicDesc: 'Siege Attack 5', poweredDesc: 'Siege Attack 8'
    },
    energy_flow: {
        id: 'energy_flow', name: 'Energy Flow', color: 'gold', type: 'spell',
        manaCost: 'gold',
        basicEffect: { type: 'special', subtype: 'gain_mana_2' },
        poweredEffect: { type: 'special', subtype: 'gain_mana_3' },
        basicDesc: 'Gain 2 mana of any colors', poweredDesc: 'Gain 3 mana of any colors'
    },
    wings_of_wind: {
        id: 'wings_of_wind', name: 'Wings of Wind', color: 'green', type: 'spell',
        manaCost: 'green',
        basicEffect: { type: 'move', value: 5, special: 'fly' },
        poweredEffect: { type: 'move', value: 8, special: 'fly' },
        basicDesc: 'Fly 5', poweredDesc: 'Fly 8'
    },
    underground_travel: {
        id: 'underground_travel', name: 'Underground Travel', color: 'blue', type: 'spell',
        manaCost: 'blue',
        basicEffect: { type: 'move', value: 4, special: 'underground' },
        poweredEffect: { type: 'move', value: 6, special: 'underground' },
        basicDesc: 'Move 4 (all terrain costs 1)', poweredDesc: 'Move 6 (all terrain costs 1)'
    },
    expose: {
        id: 'expose', name: 'Expose', color: 'gold', type: 'spell',
        manaCost: 'gold',
        basicEffect: { type: 'special', subtype: 'reveal_enemies' },
        poweredEffect: { type: 'special', subtype: 'reveal_weaken' },
        basicDesc: 'Reveal all enemies at location', poweredDesc: 'Reveal and weaken enemies (-2 armor)'
    }
};

// ----------------------------------------------------------
// HERO DEFINITIONS
// ----------------------------------------------------------
MK.Heroes = {
    tovak: {
        id: 'tovak',
        name: 'Tovak',
        title: 'The Stubborn',
        color: '#5b8fbf',
        portrait: '🛡️',
        description: 'A tough warrior who endures where others fall. Strong at blocking and has versatile combat abilities.',
        startingDeck: [
            'march', 'march', 'swiftness', 'swiftness',
            'stamina', 'rage', 'rage',
            'determination', 'promise', 'threaten',
            'tranquility', 'mana_draw', 'concentration', 'crystallize',
            'cold_toughness', 'battle_versatility'
        ],
        skills: [
            { level: 1, name: 'Cold Resistance', description: 'Ice attacks against you deal -2 damage.' },
            { level: 2, name: 'Shield Wall', description: 'At start of combat, gain Block 2.' },
            { level: 3, name: 'Endurance', description: 'Hand limit +1.' },
            { level: 4, name: 'Iron Will', description: 'May discard a wound to gain Block 3.' },
            { level: 5, name: 'Battle Hardened', description: 'Armor +1.' },
            { level: 6, name: 'Unstoppable', description: 'Physical resistance on all attacks against you.' }
        ],
        startingArmor: 2,
        startingHandLimit: 5
    },
    norowas: {
        id: 'norowas',
        name: 'Norowas',
        title: 'The Mystic',
        color: '#6db36d',
        portrait: '🧙',
        description: 'A scholarly mage focused on influence and healing. Excels at interacting with locals and using white magic.',
        startingDeck: [
            'march', 'march', 'swiftness', 'swiftness',
            'stamina', 'rage', 'rage',
            'determination', 'promise', 'threaten',
            'tranquility', 'mana_draw', 'concentration', 'crystallize',
            'noble_manners', 'shield_mastery'
        ],
        skills: [
            { level: 1, name: 'Peaceful Aura', description: 'Reputation starts at +1.' },
            { level: 2, name: 'Healing Touch', description: 'Once per turn, heal 1 for free.' },
            { level: 3, name: 'Wisdom', description: 'Hand limit +1.' },
            { level: 4, name: 'Mana Focus', description: 'Once per turn, convert any mana to white.' },
            { level: 5, name: 'Blessing', description: 'Units you command have +1 armor.' },
            { level: 6, name: 'Divine Shield', description: 'Start each combat with Block 3 white.' }
        ],
        startingArmor: 2,
        startingHandLimit: 5
    },
    arythea: {
        id: 'arythea',
        name: 'Arythea',
        title: 'The Raging',
        color: '#bf5b5b',
        portrait: '🔥',
        description: 'An aggressive warrior who excels at dealing damage, often at a cost to herself.',
        startingDeck: [
            'march', 'march', 'swiftness', 'swiftness',
            'stamina', 'rage', 'rage',
            'determination', 'promise', 'threaten',
            'tranquility', 'mana_draw', 'concentration', 'crystallize',
            'dark_fire', 'battle_frenzy'
        ],
        skills: [
            { level: 1, name: 'Fire Affinity', description: 'Fire attacks deal +1 damage.' },
            { level: 2, name: 'Blood Rage', description: 'When wounded, gain Attack +1 this combat.' },
            { level: 3, name: 'Brutal Strikes', description: 'Hand limit +1.' },
            { level: 4, name: 'Pain is Gain', description: 'Once per turn, take 1 wound to draw 2 cards.' },
            { level: 5, name: 'Flame Shield', description: 'Armor +1, fire attacks against you deal -2.' },
            { level: 6, name: 'Inferno', description: 'At combat start, deal 2 fire damage to all enemies.' }
        ],
        startingArmor: 2,
        startingHandLimit: 5
    },
    goldyx: {
        id: 'goldyx',
        name: 'Goldyx',
        title: 'The Dragon',
        color: '#c9a227',
        portrait: '🐉',
        description: 'A mysterious dragon in humanoid form. Masters gold mana and has powerful crystal abilities.',
        startingDeck: [
            'march', 'march', 'swiftness', 'swiftness',
            'stamina', 'rage', 'rage',
            'determination', 'promise', 'threaten',
            'tranquility', 'mana_draw', 'concentration', 'crystallize',
            'will_of_gold', 'golden_greed'
        ],
        skills: [
            { level: 1, name: 'Dragon Scale', description: 'Physical resistance to first attack each combat.' },
            { level: 2, name: 'Hoard', description: 'Start with 1 extra gold crystal.' },
            { level: 3, name: 'Ancient Wisdom', description: 'Hand limit +1.' },
            { level: 4, name: 'Gold Transmutation', description: 'Once per turn, use gold crystal as any 2 mana.' },
            { level: 5, name: 'Dragon Wings', description: 'Can fly over 1 hex per turn for free.' },
            { level: 6, name: 'Dragon Form', description: 'Attack +3 and Block +3 at all times.' }
        ],
        startingArmor: 2,
        startingHandLimit: 5
    }
};

// ----------------------------------------------------------
// FAME / LEVEL TABLE
// ----------------------------------------------------------
MK.FameLevels = [
    { level: 1, fame: 0,  handLimit: 5, armor: 2, reward: 'none' },
    { level: 2, fame: 3,  handLimit: 5, armor: 2, reward: 'advanced_action_or_spell' },
    { level: 3, fame: 8,  handLimit: 5, armor: 3, reward: 'skill' },
    { level: 4, fame: 15, handLimit: 6, armor: 3, reward: 'advanced_action_or_spell' },
    { level: 5, fame: 24, handLimit: 6, armor: 3, reward: 'skill' },
    { level: 6, fame: 35, handLimit: 6, armor: 4, reward: 'advanced_action_or_spell' },
    { level: 7, fame: 48, handLimit: 7, armor: 4, reward: 'skill' },
    { level: 8, fame: 63, handLimit: 7, armor: 4, reward: 'advanced_action_or_spell' },
    { level: 9, fame: 80, handLimit: 7, armor: 5, reward: 'skill' },
    { level: 10, fame: 99, handLimit: 8, armor: 5, reward: 'advanced_action_or_spell' }
];

// Reputation track: index is position (-7 to +7), value is influence modifier
MK.ReputationTrack = {
    '-7': -Infinity, '-6': -5, '-5': -3, '-4': -2, '-3': -1,
    '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0,
    '3': 1, '4': 2, '5': 3, '6': 5, '7': Infinity
};

// ----------------------------------------------------------
// MAP TILE DEFINITIONS
// Each tile has 7 hexes: center (0) + 6 ring positions (1-6)
// Ring positions go clockwise from E: E, NE, NW, W, SW, SE
// In axial coords relative to center: (1,0), (1,-1), (0,-1), (-1,0), (-1,1), (0,1)
// ----------------------------------------------------------
MK.TileHexOffsets = [
    { q: 0, r: 0 },   // 0: center
    { q: 1, r: 0 },   // 1: E
    { q: 1, r: -1 },  // 2: NE
    { q: 0, r: -1 },  // 3: NW
    { q: -1, r: 0 },  // 4: W
    { q: -1, r: 1 },  // 5: SW
    { q: 0, r: 1 }    // 6: SE
];

// Tile neighbor offsets (from center to center of adjacent tile)
MK.TileNeighborOffsets = {
    E:  { q: 3, r: -1 },
    NE: { q: 2, r: -3 },
    NW: { q: -1, r: -2 },
    W:  { q: -3, r: 1 },
    SW: { q: -2, r: 3 },
    SE: { q: 1, r: 2 }
};

// --- COUNTRYSIDE TILES (A-side) ---
MK.CountrysideTiles = [
    {
        id: 'A1', name: 'Countryside A1',
        hexes: [
            { terrain: 'plains' },                                          // 0: center
            { terrain: 'hills', site: 'village' },                         // 1: E
            { terrain: 'forest' },                                         // 2: NE
            { terrain: 'plains' },                                         // 3: NW
            { terrain: 'forest' },                                         // 4: W
            { terrain: 'plains', site: 'mine_green' },                     // 5: SW
            { terrain: 'hills' }                                           // 6: SE
        ]
    },
    {
        id: 'A2', name: 'Countryside A2',
        hexes: [
            { terrain: 'forest' },                                         // 0: center
            { terrain: 'plains' },                                         // 1: E
            { terrain: 'wasteland', site: 'keep' },                        // 2: NE
            { terrain: 'hills' },                                          // 3: NW
            { terrain: 'plains', site: 'village' },                        // 4: W
            { terrain: 'forest' },                                         // 5: SW
            { terrain: 'plains' }                                          // 6: SE
        ]
    },
    {
        id: 'A3', name: 'Countryside A3',
        hexes: [
            { terrain: 'hills' },                                          // 0: center
            { terrain: 'forest', site: 'monastery' },                      // 1: E
            { terrain: 'plains' },                                         // 2: NE
            { terrain: 'lake' },                                           // 3: NW
            { terrain: 'plains' },                                         // 4: W
            { terrain: 'hills', site: 'mine_red' },                        // 5: SW
            { terrain: 'forest' }                                          // 6: SE
        ]
    },
    {
        id: 'A4', name: 'Countryside A4',
        hexes: [
            { terrain: 'plains' },                                         // 0: center
            { terrain: 'swamp' },                                          // 1: E
            { terrain: 'forest' },                                         // 2: NE
            { terrain: 'hills', site: 'mage_tower' },                      // 3: NW
            { terrain: 'wasteland', site: 'dungeon' },                     // 4: W
            { terrain: 'plains' },                                         // 5: SW
            { terrain: 'forest', site: 'spawning_grounds' }                // 6: SE
        ]
    },
    {
        id: 'A5', name: 'Countryside A5',
        hexes: [
            { terrain: 'forest' },                                         // 0: center
            { terrain: 'plains', site: 'village' },                        // 1: E
            { terrain: 'hills' },                                          // 2: NE
            { terrain: 'plains' },                                         // 3: NW
            { terrain: 'mountain' },                                       // 4: W
            { terrain: 'wasteland', site: 'ancient_ruins' },               // 5: SW
            { terrain: 'plains', site: 'mine_blue' }                       // 6: SE
        ]
    },
    {
        id: 'A6', name: 'Countryside A6',
        hexes: [
            { terrain: 'wasteland' },                                      // 0: center
            { terrain: 'hills' },                                          // 1: E
            { terrain: 'plains', site: 'village' },                        // 2: NE
            { terrain: 'forest' },                                         // 3: NW
            { terrain: 'hills', site: 'tomb' },                            // 4: W
            { terrain: 'plains' },                                         // 5: SW
            { terrain: 'forest', site: 'mine_white' }                      // 6: SE
        ]
    },
    {
        id: 'A7', name: 'Countryside A7',
        hexes: [
            { terrain: 'plains' },                                         // 0: center
            { terrain: 'forest' },                                         // 1: E
            { terrain: 'lake' },                                           // 2: NE
            { terrain: 'hills', site: 'keep' },                            // 3: NW
            { terrain: 'plains' },                                         // 4: W
            { terrain: 'hills', site: 'magical_glade' },                   // 5: SW
            { terrain: 'forest', site: 'spawning_grounds' }                // 6: SE
        ]
    },
    {
        id: 'A8', name: 'Countryside A8',
        hexes: [
            { terrain: 'hills' },                                          // 0: center
            { terrain: 'wasteland', site: 'draconum_lair' },               // 1: E
            { terrain: 'forest' },                                         // 2: NE
            { terrain: 'plains', site: 'monastery' },                      // 3: NW
            { terrain: 'swamp' },                                          // 4: W
            { terrain: 'plains' },                                         // 5: SW
            { terrain: 'hills', site: 'mine_red' }                         // 6: SE
        ]
    }
];

// --- CORE TILES (with cities) ---
MK.CoreTiles = [
    {
        id: 'C1', name: 'Core Tile 1',
        hexes: [
            { terrain: 'city', site: 'city_green' },                       // 0: center
            { terrain: 'hills' },                                          // 1: E
            { terrain: 'wasteland' },                                      // 2: NE
            { terrain: 'plains' },                                         // 3: NW
            { terrain: 'forest' },                                         // 4: W
            { terrain: 'hills', site: 'keep' },                            // 5: SW
            { terrain: 'plains', site: 'village' }                         // 6: SE
        ]
    },
    {
        id: 'C2', name: 'Core Tile 2',
        hexes: [
            { terrain: 'city', site: 'city_blue' },                        // 0: center
            { terrain: 'wasteland' },                                      // 1: E
            { terrain: 'hills', site: 'mage_tower' },                      // 2: NE
            { terrain: 'mountain' },                                       // 3: NW
            { terrain: 'plains' },                                         // 4: W
            { terrain: 'forest' },                                         // 5: SW
            { terrain: 'hills' }                                           // 6: SE
        ]
    },
    {
        id: 'C3', name: 'Core Tile 3',
        hexes: [
            { terrain: 'city', site: 'city_red' },                         // 0: center
            { terrain: 'mountain' },                                       // 1: E
            { terrain: 'forest' },                                         // 2: NE
            { terrain: 'wasteland', site: 'dungeon' },                     // 3: NW
            { terrain: 'hills' },                                          // 4: W
            { terrain: 'plains' },                                         // 5: SW
            { terrain: 'swamp', site: 'monastery' }                        // 6: SE
        ]
    }
];

// --- START TILE ---
MK.StartTile = {
    id: 'START', name: 'Starting Tile',
    hexes: [
        { terrain: 'plains', site: 'magical_glade' },                  // 0: center (portal)
        { terrain: 'plains' },                                         // 1: E
        { terrain: 'forest' },                                         // 2: NE
        { terrain: 'hills' },                                          // 3: NW
        { terrain: 'plains', site: 'village' },                        // 4: W
        { terrain: 'plains' },                                         // 5: SW
        { terrain: 'hills' }                                           // 6: SE
    ]
};

// ----------------------------------------------------------
// SCENARIO DEFINITIONS
// ----------------------------------------------------------
MK.Scenarios = {
    first_recon: {
        id: 'first_recon',
        name: 'First Reconnaissance',
        description: 'Explore the land and defeat a keep. A short introductory scenario.',
        rounds: 3,
        mapShape: 'wedge_small',
        countrysideTiles: 3,
        coreTiles: 0,
        winCondition: 'conquer_keep',
        winDescription: 'Conquer at least one Keep before end of Round 3.',
        setupNotes: 'Place the starting tile. Shuffle 3 countryside tiles face down.'
    },
    solo_conquest: {
        id: 'solo_conquest',
        name: 'Solo Conquest',
        description: 'Explore the land, build your power, and conquer a city!',
        rounds: 6,
        mapShape: 'wedge',
        countrysideTiles: 5,
        coreTiles: 2,
        winCondition: 'conquer_city',
        winDescription: 'Conquer a city before end of Round 6.',
        setupNotes: 'Place the starting tile. Shuffle 5 countryside tiles and 2 core tiles.'
    },
    full_conquest: {
        id: 'full_conquest',
        name: 'Full Conquest',
        description: 'The full Mage Knight experience. Conquer ALL cities!',
        rounds: 6,
        mapShape: 'wedge_large',
        countrysideTiles: 7,
        coreTiles: 3,
        winCondition: 'conquer_all_cities',
        winDescription: 'Conquer all cities on the map.',
        setupNotes: 'Largest map. Full exploration.'
    }
};

// ----------------------------------------------------------
// SKILL DATA (by hero)
// ----------------------------------------------------------
MK.SkillPool = [
    { id: 'extra_move', name: 'Swift Feet', description: '+1 movement point per turn.', effect: { type: 'passive', bonus: 'move', value: 1 } },
    { id: 'extra_attack', name: 'Mighty Blow', description: '+1 attack in combat.', effect: { type: 'passive', bonus: 'attack', value: 1 } },
    { id: 'extra_block', name: 'Tough Skin', description: '+1 block in combat.', effect: { type: 'passive', bonus: 'block', value: 1 } },
    { id: 'extra_influence', name: 'Silver Tongue', description: '+1 influence at sites.', effect: { type: 'passive', bonus: 'influence', value: 1 } },
    { id: 'draw_card', name: 'Quick Learner', description: 'Draw +1 card at start of turn.', effect: { type: 'passive', bonus: 'draw', value: 1 } },
    { id: 'extra_crystal', name: 'Crystal Attunement', description: 'Start each round with 1 extra crystal (random color).', effect: { type: 'round_start', bonus: 'crystal' } }
];

// ----------------------------------------------------------
// GAME COLORS / THEMING
// ----------------------------------------------------------
MK.Colors = {
    // Mana colors
    mana: {
        red: '#c62828',
        blue: '#1565c0',
        green: '#2e7d32',
        white: '#e0e0e0',
        gold: '#ffd700',
        black: '#424242'
    },
    // UI colors
    background: '#0d1117',
    panelBg: '#161b22',
    panelBorder: '#30363d',
    text: '#e6d5b8',
    textDim: '#8b949e',
    accent: '#c9a227',
    accentLight: '#e6c84d',
    danger: '#c62828',
    success: '#2e7d32',
    // Card colors
    card: {
        red: '#8b1a1a',
        blue: '#1a3a6b',
        green: '#1a4a1a',
        white: '#6b6b6b',
        gold: '#6b5a1a',
        wound: '#3a1a1a'
    }
};

window.MK = MK;
