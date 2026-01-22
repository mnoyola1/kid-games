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
      'castle', 'dragon', 'knight', 'wizard', 'magic', 'shield', 'sword', 'tower',
      'spell', 'brave', 'quest', 'kingdom', 'crown', 'throne', 'battle', 'victory',
      'armor', 'potion', 'scroll', 'ancient', 'crystal', 'shadow', 'flame', 'frost',
      'hero', 'prince', 'queen', 'guard', 'bridge', 'moat', 'wall', 'gate'
    ];
    
    // Liam's default spelling words (contractions) - lowercase for matching
    const LIAM_DEFAULT_WORDS = [
      "won't", "aren't", "haven't", "he'd", "hasn't", "doesn't",
      "we'd", "hadn't", "weren't", "they'd", "i'm", "shouldn't",
      "they're", "i'd", "wouldn't", "should've", "would've", "couldn't"
    ];
    
    const DIFFICULTY_SETTINGS = {
      liam: {
        name: "Liam Mode",
        emoji: "ðŸ¦",
        description: "Contractions words, slower pace",
        baseSpeed: 0.25,
        spawnInterval: 4500,
        maxEnemies: 3,
        typingGrace: true,
        startingHealth: 6
      },
      emma: {
        name: "Emma Mode",
        emoji: "ðŸ¦‹",
        description: "Faster pace, more challenge",
        baseSpeed: 0.4,
        spawnInterval: 3000,
        maxEnemies: 5,
        typingGrace: false,
        startingHealth: 5
      }
    };
    
    const ENEMY_TYPES = {
      basic: { color: '#ef4444', hits: 1, coins: 10, emoji: 'ðŸ‘¹', name: 'Goblin' },
      armored: { color: '#6366f1', hits: 2, coins: 25, emoji: 'ðŸ›¡ï¸', name: 'Knight' },
      boss: { color: '#9333ea', hits: 3, coins: 50, emoji: 'ðŸ‘¾', name: 'Demon' }
    };
    
    const UPGRADES = {
      spellPower: { name: 'âš”ï¸ Spell Power', cost: 50, maxLevel: 3, description: '+1 damage per hit' },
      slowField: { name: 'â„ï¸ Slow Field', cost: 75, maxLevel: 2, description: 'Enemies move slower' },
      shield: { name: 'ðŸ›¡ï¸ Shield', cost: 100, maxLevel: 1, description: 'Block one hit' },
      castleRepair: { name: 'ðŸ’– Repair', cost: 60, maxLevel: 99, description: 'Restore 1 heart' }
    };
    
