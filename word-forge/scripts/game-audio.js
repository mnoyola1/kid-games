// ==================== AUDIO MANAGER ====================

let audioContext;
let audioLoaded = false;
let currentMusic = null;
let musicVolume = 0.4;
let sfxVolume = 0.7;

const AUDIO_PATHS = {
  music: {
    menu: '../assets/audio/word-forge/music/menu.wav',
    combat: '../assets/audio/word-forge/music/combat.wav',
    boss: '../assets/audio/word-forge/music/boss.wav',
    victory: '../assets/audio/word-forge/music/victory.wav',
    death: '../assets/audio/word-forge/music/death.wav'
  },
  sfx: {
    attack: '../assets/audio/word-forge/sfx/attack.mp3',
    damage: '../assets/audio/word-forge/sfx/damage.mp3',
    enemy_death: '../assets/audio/word-forge/sfx/enemy_death.mp3',
    craft: '../assets/audio/word-forge/sfx/craft.mp3',
    equip: '../assets/audio/word-forge/sfx/equip.mp3',
    door: '../assets/audio/word-forge/sfx/door.mp3',
    chest: '../assets/audio/word-forge/sfx/chest.mp3',
    correct: '../assets/audio/word-forge/sfx/correct.mp3',
    wrong: '../assets/audio/word-forge/sfx/wrong.mp3',
    step: '../assets/audio/word-forge/sfx/step.mp3'
  }
};

/**
 * Initialize audio context
 */
function initAudio() {
  if (audioLoaded) return;
  
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioLoaded = true;
    console.log('🔊 Audio initialized');
  } catch (e) {
    console.warn('⚠️ Audio not supported', e);
  }
}

/**
 * Play music track
 */
function playMusic(trackName, loop = true) {
  if (!audioLoaded || !AUDIO_PATHS.music[trackName]) return;
  
  // Stop current music
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  
  try {
    currentMusic = new Audio(AUDIO_PATHS.music[trackName]);
    currentMusic.loop = loop;
    currentMusic.volume = musicVolume;
    currentMusic.play().catch(e => console.warn('Music play failed:', e));
  } catch (e) {
    console.warn('Failed to play music:', e);
  }
}

/**
 * Stop music
 */
function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

/**
 * Play sound effect
 */
function playSound(sfxName, options = {}) {
  if (!audioLoaded || !AUDIO_PATHS.sfx[sfxName]) return;
  
  try {
    const sound = new Audio(AUDIO_PATHS.sfx[sfxName]);
    sound.volume = options.volume !== undefined ? options.volume : sfxVolume;
    
    if (options.pitch) {
      sound.playbackRate = options.pitch;
    }
    
    sound.play().catch(e => console.warn('SFX play failed:', e));
  } catch (e) {
    console.warn('Failed to play sound:', e);
  }
}

/**
 * Set music volume
 */
function setMusicVolume(volume) {
  musicVolume = Math.max(0, Math.min(1, volume));
  if (currentMusic) {
    currentMusic.volume = musicVolume;
  }
}

/**
 * Set SFX volume
 */
function setSfxVolume(volume) {
  sfxVolume = Math.max(0, Math.min(1, volume));
}

/**
 * Mute all audio
 */
function muteAll() {
  setMusicVolume(0);
  setSfxVolume(0);
}

/**
 * Unmute all audio
 */
function unmuteAll() {
  setMusicVolume(0.4);
  setSfxVolume(0.7);
}
