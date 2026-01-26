// ==================== CONSTANTS ====================

    const MUSIC_BASE_URL = '../assets/audio/spell-siege/music/';
    const MUSIC_TRACKS = {
      menu: 'Main Menu Theme.wav',
      early: 'Gameplay - Early Waves 1-3.wav',
      mid: 'Gameplay - Mid Waves 4-7.wav',
      final: 'Gameplay - Final Waves.wav',
      boss: 'Boss Encounter.wav',
      victory: 'Victory Fanfare.wav',
      gameover: 'Game Over.wav'
    };
    
    const DEFAULT_WORDS = [
      "dragon", "knight", "castle", "magic", "sword", "shield", "quest", "wizard",
      "potion", "spell", "forest", "mountain", "river", "village", "kingdom", "treasure",
      "battle", "arrow", "armor", "brave", "crown", "prince", "princess", "tower",
      "scroll", "ancient", "crystal", "dungeon", "legend", "portal", "frost", "thunder"
    ];
    
    const LIAM_DEFAULT_WORDS = [
      "they're", "i'd", "wouldn't", "should've", "would've", "couldn't"
    ];
    
    const DIFFICULTY_SETTINGS = {
      liam: {
        name: "Liam Mode",
        emoji: "🦁",
        description: "Contractions words, slower pace",
        baseSpeed: 0.25,
        spawnInterval: 4500,
        maxEnemies: 3,
        typingGrace: true,
        startingHealth: 6
      },
      emma: {
        name: "Emma Mode",
        emoji: "🦋",
        description: "Faster pace, more challenge",
        baseSpeed: 0.4,
        spawnInterval: 3000,
        maxEnemies: 5,
        typingGrace: false,
        startingHealth: 5
      }
    };
    
    const ENEMY_TYPES = {
      basic: { color: '#ef4444', hits: 1, coins: 10, emoji: '👹', name: 'Goblin' },
      armored: { color: '#6366f1', hits: 2, coins: 25, emoji: '🛡️', name: 'Knight' },
      boss: { color: '#9333ea', hits: 3, coins: 50, emoji: '👾', name: 'Demon' }
    };
    
    const UPGRADES = {
      spellPower: { name: '⚔️ Spell Power', cost: 50, maxLevel: 3, description: '+1 damage per hit' },
      slowField: { name: '❄️ Slow Field', cost: 75, maxLevel: 2, description: 'Enemies move slower' },
      shield: { name: '🛡️ Shield', cost: 100, maxLevel: 1, description: 'Block one hit' },
      castleRepair: { name: '💖 Repair', cost: 60, maxLevel: 99, description: 'Restore 1 heart' }
    };
    
